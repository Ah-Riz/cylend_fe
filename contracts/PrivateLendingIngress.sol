// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Router} from "@hyperlane-xyz/core/contracts/client/Router.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PrivateLendingIngress
 * @notice Escrow on Mantle for private lending actions. Mimics the private transfer
 *         pattern: users deposit first, then send encrypted instructions to Sapphire.
 *         Mantle only sees ciphertext hashes; all lending logic/state lives in Sapphire.
 */
contract PrivateLendingIngress is Router {
    using SafeERC20 for IERC20;

    struct Deposit {
        address depositor;
        address token;
        uint256 amount; // remaining balance
        bool isNative;
        bool released;
    }

    struct ActionMetadata {
        address sender;
        uint32 destinationDomain;
        uint256 dispatchedAt;
        bool acknowledged;
    }

    // Liquidity management: token => available balance (after reserves)
    struct TokenLiquidity {
        uint256 totalDeposited; // Total deposited (native or ERC20)
        uint256 totalReserved; // Reserved buffer (e.g., 10% of deposits)
        uint256 totalBorrowed; // Track borrowed amounts (for reconciliation)
    }

    uint256 private _nonce;
    mapping(bytes32 => Deposit) public deposits;
    mapping(bytes32 => ActionMetadata) public actions;
    mapping(bytes32 => bytes32) public actionIdToCiphertextHash;
    mapping(bytes32 => bytes32) public ciphertextHashToActionId;
    mapping(bytes32 => bytes32) public actionToDepositId;
    // Track whether a deposit has ever been used for an action (supply/borrow/repay/withdraw)
    mapping(bytes32 => bool) public depositUsed;
    
    // Liquidity tracking: token address => liquidity data
    mapping(address => TokenLiquidity) public liquidity;
    
    // Reserve ratio (bps, e.g., 1000 = 10%)
    uint256 public reserveRatio = 1000; // 10% default

    event DepositCreated(
        bytes32 indexed depositId,
        address indexed depositor,
        address token,
        uint256 amount,
        bool isNative
    );

    event EncryptedActionReceived(bytes32 indexed encryptedDataHash);
    event EncryptedActionProcessed(bytes32 indexed encryptedDataHash);
    event LiquidityUpdated(address indexed token, uint256 totalDeposited, uint256 totalReserved, uint256 totalBorrowed);
    event ReserveRatioUpdated(uint256 oldRatio, uint256 newRatio);
    event WithdrawUnused(
        bytes32 indexed depositId,
        address indexed depositor,
        address token,
        uint256 amount,
        bool isNative
    );

    constructor(address mailbox) Router(mailbox) {
        _transferOwnership(msg.sender);
        setHook(address(0));
    }

    /**
     * @notice Set reserve ratio (bps, e.g., 1000 = 10%).
     */
    function setReserveRatio(uint256 newRatio) external onlyOwner {
        require(newRatio <= 5000, "reserve ratio too high"); // Max 50%
        uint256 oldRatio = reserveRatio;
        reserveRatio = newRatio;
        emit ReserveRatioUpdated(oldRatio, newRatio);
    }

    /**
     * @notice Deposit native MNT. Amount is hidden from later action calldata.
     */
    function depositNative() external payable returns (bytes32 depositId) {
        require(msg.value > 0, "deposit required");
        depositId = _newDepositId();
        deposits[depositId] = Deposit({
            depositor: msg.sender,
            token: address(0),
            amount: msg.value,
            isNative: true,
            released: false
        });
        
        // Update liquidity tracking
        TokenLiquidity storage liq = liquidity[address(0)];
        liq.totalDeposited += msg.value;
        liq.totalReserved = (liq.totalDeposited * reserveRatio) / 10000;
        
        emit DepositCreated(depositId, msg.sender, address(0), msg.value, true);
        emit LiquidityUpdated(address(0), liq.totalDeposited, liq.totalReserved, liq.totalBorrowed);
    }

    /**
     * @notice Deposit ERC20. Amount is hidden from later action calldata.
     */
    function depositErc20(
        address token,
        uint256 amount
    ) external returns (bytes32 depositId) {
        require(token != address(0), "token required");
        require(amount > 0, "deposit required");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        depositId = _newDepositId();
        deposits[depositId] = Deposit({
            depositor: msg.sender,
            token: token,
            amount: amount,
            isNative: false,
            released: false
        });
        
        // Update liquidity tracking
        TokenLiquidity storage liq = liquidity[token];
        liq.totalDeposited += amount;
        liq.totalReserved = (liq.totalDeposited * reserveRatio) / 10000;
        
        emit DepositCreated(depositId, msg.sender, token, amount, false);
        emit LiquidityUpdated(token, liq.totalDeposited, liq.totalReserved, liq.totalBorrowed);
    }

    /**
     * @notice Submit an encrypted lending action (supply/borrow/repay/withdraw/liquidate).
     * @dev Ciphertext contains {actionType, token, amount, onBehalf, depositId?, nonce...}.
     *      Mantle only sees the ciphertext hash; amount/token hidden.
     */
    function submitAction(
        uint32 destinationDomain,
        bytes32 depositId,
        bytes calldata ciphertext
    ) external returns (bytes32 actionId) {
        Deposit storage depositData = deposits[depositId];
        require(depositData.depositor == msg.sender, "not your deposit");
        require(!depositData.released, "deposit released");
        require(depositData.amount > 0, "empty deposit");

        actionId = _initiate(destinationDomain, depositId, ciphertext);
    }

    function _initiate(
        uint32 destinationDomain,
        bytes32 depositId,
        bytes calldata ciphertext
    ) internal returns (bytes32 actionId) {
        require(ciphertext.length > 0, "ciphertext required");
        require(destinationDomain != 0, "domain required");

        actionId = keccak256(
            abi.encodePacked(msg.sender, block.chainid, block.number, _nonce++)
        );

        actions[actionId] = ActionMetadata({
            sender: msg.sender,
            destinationDomain: destinationDomain,
            dispatchedAt: block.timestamp,
            acknowledged: false
        });

        actionToDepositId[actionId] = depositId;
        // Mark deposit as used so it can no longer be withdrawn as an "unused" bucket
        depositUsed[depositId] = true;

        bytes32 encryptedDataHash = keccak256(ciphertext);
        actionIdToCiphertextHash[actionId] = encryptedDataHash;
        ciphertextHashToActionId[encryptedDataHash] = actionId;

        bytes memory payload = abi.encode(actionId, ciphertext);
        _Router_dispatch(destinationDomain, 0, payload);

        emit EncryptedActionReceived(encryptedDataHash);
    }

    /**
     * @notice Withdraw unused bucket funds directly from Mantle without going through Sapphire.
     * @dev This is only allowed for deposits that have never been referenced by any action
     *      (i.e. purely idle liquidity). Once a deposit is used in submitAction, it can only
     *      be settled via instructions from Sapphire.
     * @param depositId The deposit ID to withdraw from.
     * @param amount The amount to withdraw. If 0 or not provided, withdraws full amount.
     *               Must be <= deposit amount. Partial withdraws are allowed.
     */
    function withdrawUnused(bytes32 depositId, uint256 amount) external {
        Deposit storage depositData = deposits[depositId];
        require(depositData.depositor == msg.sender, "not your deposit");
        require(!depositData.released, "deposit released");
        // For safety: only allow if this deposit has never been used in any action
        require(!depositUsed[depositId], "deposit already used");

        // If amount is 0, withdraw full amount (backward compatibility)
        if (amount == 0) {
            amount = depositData.amount;
        }
        
        require(amount > 0, "amount required");
        require(amount <= depositData.amount, "insufficient deposit");

        // Update deposit (partial or full withdraw)
        depositData.amount -= amount;
        // Only mark as released if deposit is fully withdrawn
        if (depositData.amount == 0) {
            depositData.released = true;
        }

        // Update liquidity tracking
        address tokenAddr = depositData.isNative ? address(0) : depositData.token;
        TokenLiquidity storage liq = liquidity[tokenAddr];
        if (liq.totalDeposited >= amount) {
            liq.totalDeposited -= amount;
            liq.totalReserved = (liq.totalDeposited * reserveRatio) / 10000;
        }

        // Transfer funds back to depositor
        if (depositData.isNative) {
            (bool sent, ) = payable(msg.sender).call{value: amount}("");
            require(sent, "native transfer failed");
        } else {
            IERC20(depositData.token).safeTransfer(msg.sender, amount);
        }

        emit WithdrawUnused(
            depositId,
            msg.sender,
            tokenAddr,
            amount,
            depositData.isNative
        );
        emit LiquidityUpdated(tokenAddr, liq.totalDeposited, liq.totalReserved, liq.totalBorrowed);
    }

    /**
     * @notice Handle release instructions from Sapphire.
     * @dev Message format: (actionId, depositId, receiver, token, amount, isNative, actionType).
     *      actionType: 0=SUPPLY, 1=BORROW, 2=REPAY, 3=WITHDRAW, 4=LIQUIDATE
     */
    function _handle(
        uint32 _origin,
        bytes32,
        bytes calldata _message
    ) internal override {
        (
            bytes32 actionId,
            bytes32 depositId,
            address receiver,
            address token,
            uint256 amount,
            bool isNative,
            uint8 actionTypeRaw
        ) = abi.decode(_message, (bytes32, bytes32, address, address, uint256, bool, uint8));

        ActionMetadata storage meta = actions[actionId];
        require(meta.sender != address(0), "action missing");
        require(meta.destinationDomain == _origin, "unexpected origin");
        require(!meta.acknowledged, "already acknowledged");

        Deposit storage depositData = deposits[depositId];
        require(depositData.depositor == receiver, "receiver must own deposit");
        require(!depositData.released, "deposit released");
        require(depositData.isNative == isNative, "type mismatch");
        require(depositData.isNative || depositData.token == token, "token mismatch");
        
        // Determine if this is a WITHDRAW collateral action vs BORROW action
        // 
        // Arsitektur:
        // - Sapphire: hanya untuk komputasi (health factor, LTV, interest)
        // - Mantle: semua funds ada di sini
        //
        // BORROW:
        // - Sapphire hitung: bisa borrow berapa dari collateral? (komputasi)
        // - Jika bisa, Sapphire kirim release message ke Mantle
        // - Mantle release funds dari depositId user → kurangi depositData.amount
        // - Funds dari depositId spesifik user
        //
        // WITHDRAW collateral:
        // - Sapphire hitung: bisa withdraw berapa? (komputasi)
        // - Jika bisa, Sapphire kirim release message ke Mantle
        // - Mantle release funds dari pool total (liquidity[token].totalDeposited)
        // - Funds dari pool (yang sudah di-supply semua user)
        // - DepositId hanya untuk ownership validation, bukan sumber funds
        //
        // ActionType enum: 0=SUPPLY, 1=BORROW, 2=REPAY, 3=WITHDRAW, 4=LIQUIDATE
        bool isWithdrawCollateral = (actionTypeRaw == 3); // WITHDRAW
        bool isBorrow = (actionTypeRaw == 1); // BORROW
        
        // For BORROW: funds come from depositId, so we need sufficient deposit amount
        // For WITHDRAW: funds come from Sapphire collateral, so we can allow even if depositId is empty
        if (isBorrow) {
            require(depositData.amount >= amount, "insufficient deposit");
        }

        // Check liquidity availability (for borrow/withdraw actions)
        if (amount > 0) {
            address tokenAddr = isNative ? address(0) : token;
            TokenLiquidity storage liq = liquidity[tokenAddr];
            
            // Calculate available liquidity (deposited - reserved - borrowed)
            uint256 available = liq.totalDeposited > (liq.totalReserved + liq.totalBorrowed)
                ? liq.totalDeposited - liq.totalReserved - liq.totalBorrowed
                : 0;
            
            // For borrow/withdraw, ensure we have enough liquidity
            // (This is a simplified check; actual logic is in LendingCore)
            // For WITHDRAW collateral, funds come from Sapphire, so we don't need to check deposit amount
            require(available >= amount || depositData.amount >= amount || isWithdrawCollateral, "insufficient liquidity");
        }

        meta.acknowledged = true;
        
        // Update deposit amount:
        // - For BORROW: decrease deposit amount (funds released from depositId user)
        // - For WITHDRAW: don't change deposit amount (funds from pool total, bukan dari depositId)
        if (!isWithdrawCollateral) {
            uint256 remaining = depositData.amount - amount;
            depositData.amount = remaining;
            if (remaining == 0) {
                depositData.released = true;
            }
        }
        // For WITHDRAW collateral, depositData.amount stays the same
        // karena funds dari pool (liquidity[token].totalDeposited), bukan dari depositId

        if (amount > 0) {
            // Update liquidity tracking
            // For both BORROW and WITHDRAW, funds are released from the pool
            address tokenAddr = isNative ? address(0) : token;
            TokenLiquidity storage liq = liquidity[tokenAddr];
            
            // Decrease total deposited (funds released from pool)
            // For BORROW: funds released from depositId user (tapi tetap kurangi totalDeposited)
            // For WITHDRAW: funds released from pool total (yang sudah di-supply semua user)
            if (liq.totalDeposited >= amount) {
                liq.totalDeposited -= amount;
                liq.totalReserved = (liq.totalDeposited * reserveRatio) / 10000;
            }
            
            // Transfer funds directly to user wallet
            // For BORROW: funds from depositId user (di Mantle)
            // For WITHDRAW: funds from pool total (di Mantle)
            if (isNative) {
                (bool sent, ) = payable(receiver).call{value: amount}("");
                require(sent, "native transfer failed");
            } else {
                IERC20(token).safeTransfer(receiver, amount);
            }
            
            emit LiquidityUpdated(tokenAddr, liq.totalDeposited, liq.totalReserved, liq.totalBorrowed);
        }

        bytes32 encryptedDataHash = actionIdToCiphertextHash[actionId];
        require(encryptedDataHash != bytes32(0), "ciphertext hash missing");
        emit EncryptedActionProcessed(encryptedDataHash);
    }

    function getActionIdByCiphertextHash(
        bytes32 encryptedDataHash
    ) external view returns (bytes32) {
        return ciphertextHashToActionId[encryptedDataHash];
    }

    /**
     * @notice Get available liquidity for a token (deposited - reserved - borrowed).
     */
    function getAvailableLiquidity(address token) external view returns (uint256) {
        TokenLiquidity memory liq = liquidity[token];
        if (liq.totalDeposited <= (liq.totalReserved + liq.totalBorrowed)) {
            return 0;
        }
        return liq.totalDeposited - liq.totalReserved - liq.totalBorrowed;
    }

    /**
     * @notice Get total liquidity info for a token.
     */
    function getLiquidityInfo(address token) external view returns (TokenLiquidity memory) {
        return liquidity[token];
    }

    function _newDepositId() internal returns (bytes32) {
        uint256 current = _nonce++;
        return
            keccak256(
                abi.encodePacked(
                    msg.sender,
                    block.chainid,
                    block.number,
                    current,
                    "deposit-lending"
                )
            );
    }
}


