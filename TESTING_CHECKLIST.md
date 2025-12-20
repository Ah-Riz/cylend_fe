# 🧪 Quick Testing Checklist - Phase 1

## ✅ Pre-Testing Setup
- [x] Environment variables configured
- [x] Dev server running (`npm run dev`)
- [x] Wallet connected (MetaMask/RainbowKit)

## 🔌 Wallet & Chain Testing

### Wallet Connection
- [x] Connect wallet via RainbowKit button
- [x] Wallet address displayed correctly
- [x] Chain name displayed (Mantle/Sapphire)
- [x] Disconnect wallet works

### Chain Switching
- [x] Switch to Mantle Sepolia works
- [x] Switch to Sapphire Testnet works
- [x] UI updates after chain switch
- [x] Network badge shows correct chain

## 📄 Page Navigation

### All Pages Load
- [x] `/app` (Dashboard) loads
- [x] `/app/deposit` loads
- [x] `/app/allocate` loads
- [x] `/app/borrow` loads
- [x] `/app/withdraw` loads
- [x] `/app/repay` loads
- [x] `/app/pools` loads
- [x] `/app/records` loads
- [x] `/app/settings` loads

### Sidebar Navigation
- [x] All menu items clickable
- [x] Active route highlighted
- [x] Sidebar collapse/expand works

## 💰 Deposit Page (`/app/deposit`)

### Form Validation
- [x] Asset selection works (MNT, WMNT, USDC, USDT)
- [x] Amount input accepts numbers
- [x] "Max" button works
- [x] Balance display shows correct value
- [x] Error shown if amount > balance
- [x] Error shown if wallet not connected

### ERC20 Approval Flow
- [x] Approval needed message shown for ERC20
- [x] Approve button works
- [x] Approval transaction succeeds
- [x] Deposit button enabled after approval (FIXED: Auto-refetch allowance setelah approve)

### Deposit Creation
- [ ] Native deposit (MNT) works
- [ ] ERC20 deposit (USDC) works
- [ ] Success toast shown
- [ ] Form resets after success
- [ ] Transaction hash displayed

### Deposit List
- [ ] Mock deposits displayed
- [ ] Deposit ID truncated correctly
- [ ] Remaining amount shown
- [ ] Status badge correct

## 🔄 DepositSelector Component

### Basic Functionality
- [ ] Dropdown shows available deposits
- [ ] Deposit selection works
- [ ] Selected deposit info displayed
- [ ] "Create Deposit" button shown when no deposits
- [ ] Navigation to `/app/deposit` works

### Filtering
- [ ] Filter by token type works
- [ ] Only matching deposits shown
- [ ] Empty state shown when no matches

## 📊 Allocate Page (`/app/allocate`)

### Form
- [ ] Asset selection works
- [ ] DepositSelector integrated
- [ ] Amount input works
- [ ] "Max" button uses deposit remaining
- [ ] Reference input works
- [ ] Submit button disabled when invalid

### Validation
- [ ] Error if no deposit selected
- [ ] Error if amount > deposit remaining
- [ ] Error if wallet not connected

### Action Submission
- [ ] Encryption works (no errors in console)
- [ ] Submit action transaction sent
- [ ] Success toast shown

## 💸 Borrow Page (`/app/borrow`)

### Form
- [ ] Asset selection works
- [ ] Amount input works
- [ ] Collateral deposit selection works
- [ ] Health factor warning shown
- [ ] Submit button works

### Validation
- [ ] Error if no collateral selected
- [ ] Error if wallet not connected

## 💵 Withdraw Page (`/app/withdraw`)

### Form
- [ ] Asset selection works
- [ ] DepositSelector integrated
- [ ] Amount input works
- [ ] "Max" button uses deposit remaining
- [ ] Submit button works

### Validation
- [ ] Error if amount > deposit remaining
- [ ] Error if wallet not connected

## 🔁 Repay Page (`/app/repay`)

### Form
- [ ] Asset selection works
- [ ] DepositSelector integrated
- [ ] Amount input works
- [ ] Submit button works

### Validation
- [ ] Error if amount > deposit remaining
- [ ] Error if wallet not connected

## 🎨 UI/UX

### Responsive Design
- [ ] Mobile view works (< 768px)
- [ ] Tablet view works (768px - 1024px)
- [ ] Desktop view works (> 1024px)
- [ ] Sidebar collapses on mobile

### Loading States
- [ ] BlockchainLoader shown during transactions
- [ ] Buttons disabled during pending
- [ ] Loading text displayed

### Error States
- [ ] Error toasts displayed
- [ ] Error messages clear
- [ ] Form validation errors shown

### Success States
- [ ] Success toasts displayed
- [ ] Forms reset after success
- [ ] Transaction hashes shown

## 🔒 Security & Privacy

### Encryption
- [ ] No encryption errors in console
- [ ] Payload encrypted before submission
- [ ] Public key used correctly

### Wallet Security
- [ ] Private key never logged
- [ ] No sensitive data in console
- [ ] Transactions require user approval

## 🐛 Known Issues / Notes

- [ ] List any issues found during testing
- [ ] Note any console errors
- [ ] Document any unexpected behavior

---

## ⏱️ Estimated Time: 15-30 minutes

## ✅ Pass Criteria
- All critical paths work (wallet, navigation, forms)
- No console errors
- No TypeScript errors
- UI responsive and functional

## 🚀 After Testing
- Fix any critical issues found
- Document any known limitations
- Proceed to Phase 2: Ponder Setup

