# Cylend Frontend

Privacy-preserving credit infrastructure built on Mantle and Sapphire networks.

## 🏗️ Architecture

This project consists of three main components:

1. **Frontend (Next.js)** - User interface for interacting with the protocol
2. **Ponder Indexer** - Indexes blockchain events and provides GraphQL API
3. **Backend Service** - Automates `processAction` calls on Sapphire

### Network Architecture

- **Mantle Sepolia**: Hosts `PrivateLendingIngress` contract for deposits and action submission
- **Sapphire Testnet**: Hosts `LendingCore` contract for private lending logic and computation

## 📋 Prerequisites

- Node.js >= 18.14
- npm, yarn, pnpm, or bun
- Wallet with Mantle Sepolia and Sapphire Testnet testnet tokens

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Ponder indexer dependencies
cd cylend-indexer
npm install
cd ..

# Install backend service dependencies
cd cylend-service
npm install
cd ..
```

### 2. Environment Variables

Create `.env` file in the root directory:

```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=false

NEXT_PUBLIC_INGRESS_ADDRESS=0xe1E911145f2bF1018d1Fb04DE2DAc8A414D82235        # PrivateLendingIngress (Mantle)
NEXT_PUBLIC_CORE_ADDRESS=0xeE848eA7DDbf1e08E8f67caEfeDe9539aF08524A            # LendingCore (Sapphire)
NEXT_PUBLIC_ROUTER_ADDRESS=0xe1E911145f2bF1018d1Fb04DE2DAc8A414D82235 # Interchain Security Module
NEXT_PUBLIC_ISM_ADDRESS=0x3072CF40DE1b4b0Efa9b3A86101B0e1313f58A1E
# Hyperlane Router
NEXT_PUBLIC_LENDING_PUBLIC_KEY=0xfd40fa7104c182f9b08087c21d3232b8e79ccc44b11da592ea635799135af348 # Sapphire public key for encryption

# Token Addresses
NEXT_PUBLIC_WMNT_ADDRESS=0x67A1f4A939b477A6b7c5BF94D97E45dE87E608eF
NEXT_PUBLIC_USDC_ADDRESS=0xAcab8129E2cE587fD203FD770ec9ECAFA2C88080
NEXT_PUBLIC_USDT_ADDRESS=0xcC4Ac915857532ADa58D69493554C6d869932Fe6

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=db227bf7ae17306f26ddfae4c1006945

# Ponder API
NEXT_PUBLIC_PONDER_API_URL=http://localhost:42069/graphql

# Sapphire RPC (optional, defaults to public RPC)
NEXT_PUBLIC_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.io
```

Create `.env` file in `cylend-indexer/` directory:

```env
# Ponder Indexer Configuration
PONDER_RPC_URL_MANTLE_SEPOLIA=https://rpc.sepolia.mantle.xyz
PONDER_RPC_URL_SAPPHIRE_TESTNET=https://testnet.sapphire.oasis.io

# Contract Addresses (optional, can use defaults from ponder.config.ts)
INGRESS_ADDRESS=0xe1E911145f2bF1018d1Fb04DE2DAc8A414D82235
CORE_ADDRESS=0xeE848eA7DDbf1e08E8f67caEfeDe9539aF08524A
```

Create `.env` file in `cylend-service/` directory:

```env
# Backend Service Configuration
PONDER_API_URL=http://localhost:42069/graphql
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.io
CORE_ADDRESS=0xeE848eA7DDbf1e08E8f67caEfeDe9539aF08524A # LendingCore contract address
OWNER_PRIVATE_KEY=0x... # Private key for processAction calls (should be deployer address)

# Optional
POLL_INTERVAL=10000 # Polling interval in ms (default: 10000)
MAX_RETRIES=3 # Max retries for failed transactions (default: 3)
RETRY_DELAY=5000 # Delay between retries in ms (default: 5000)
LOG_LEVEL=info # Log level: debug, info, warn, error (default: info)
```

### 3. Run the Project

#### Terminal 1: Start Ponder Indexer

```bash
cd cylend-indexer
npm run dev
```

The indexer will:
- Start indexing blockchain events
- Provide GraphQL API at `http://localhost:42069/graphql`
- Auto-sync with latest blocks

#### Terminal 2: Start Backend Service (Optional)

The backend service automatically processes pending actions on Sapphire:

```bash
cd cylend-service
npm run dev
```

**Note**: The service requires `OWNER_PRIVATE_KEY` with permissions to call `processAction` on the LendingCore contract.

#### Terminal 3: Start Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
cylend_fe/
├── src/                    # Frontend source code
│   ├── app/               # Next.js app router pages
│   │   └── app/           # Main application pages
│   │       ├── deposit/   # Deposit page
│   │       ├── allocate/  # Allocate capital page
│   │       ├── borrow/    # Borrow page
│   │       ├── repay/     # Repay page
│   │       ├── withdraw/  # Withdraw page
│   │       ├── pools/     # Pools overview
│   │       ├── records/   # Settlement records
│   │       └── page.tsx   # Dashboard
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and helpers
│   └── abis/              # Contract ABIs
├── contracts/              # Smart contracts
│   ├── PrivateLendingIngress.sol  # Mantle contract
│   └── LendingCore.sol            # Sapphire contract
├── cylend-indexer/         # Ponder indexer
│   ├── src/               # Indexer source code
│   ├── ponder.config.ts   # Ponder configuration
│   └── ponder.schema.ts   # Database schema
├── cylend-service/         # Backend service
│   └── src/               # Service source code
└── README.md              # This file
```

## 🔧 Available Scripts

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Ponder Indexer

```bash
cd cylend-indexer
npm run dev          # Start indexer in development mode
npm run start        # Start indexer in production mode
npm run db           # Database management commands
npm run codegen      # Generate TypeScript types
```

### Backend Service

```bash
cd cylend-service
npm run dev          # Start service in development mode (with watch)
npm run build        # Build TypeScript
npm run start        # Start service in production mode
```

## 🌐 Features

### User Actions

- **Deposit**: Create deposit buckets on Mantle
- **Allocate (Supply)**: Supply capital as collateral
- **Borrow**: Borrow against collateral
- **Repay**: Repay borrowed amounts
- **Withdraw**: Withdraw collateral or unused deposits

### Data Display

- **Dashboard**: Overview of total allocated, outstanding credit, and portfolio health
- **Pools**: View liquidity, utilization, and rates for each token pool
- **Settlement Records**: Track all encrypted actions and their status

### Privacy Features

- All action details (amount, token, counterparty) are encrypted
- Mantle only sees ciphertext hashes
- Actual lending logic and state live on Sapphire (private)
- Settlement remains observable on Mantle

## 🔐 Security Notes

- **Private Keys**: Never commit private keys to version control
- **Environment Variables**: Use `.env.local` (gitignored) for sensitive data
- **Backend Service**: The service requires owner private key - run in secure environment
- **Encryption**: All actions are encrypted using Sapphire's privacy features

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Service Reference](./ReferensiService.md)
- [Testing Checklist](./TESTING_CHECKLIST.md)

## 🛠️ Development

### Adding New Features

1. **Frontend**: Add pages/components in `src/app/app/`
2. **Indexer**: Add event handlers in `cylend-indexer/src/index.ts`
3. **Service**: Add processing logic in `cylend-service/src/`

### Contract Interaction

- Frontend uses `wagmi` and `viem` for contract interactions
- Read-only calls use `useReadContract` hook
- Write calls use `useWriteContract` hook
- Sapphire calls use `createPublicClient` with Sapphire RPC

### Data Fetching

- Real-time data from Ponder: Use hooks in `src/hooks/usePonder*.ts`
- Direct contract reads: Use hooks in `src/hooks/useLendingPosition.ts`
- All queries use `@tanstack/react-query` for caching and refetching

## 🐛 Troubleshooting

### Ponder Indexer Not Starting

- Check RPC URLs are accessible
- Verify contract addresses are correct
- Check database is initialized: `cd cylend-indexer && npm run db migrate`

### Frontend Can't Connect to Ponder

- Verify Ponder is running on port 42069
- Check `NEXT_PUBLIC_PONDER_API_URL` in `.env.local`
- Check browser console for CORS errors

### Backend Service Errors

- Verify `OWNER_PRIVATE_KEY` has permissions
- Check `CORE_ADDRESS` is correct
- Ensure Sapphire RPC is accessible
- Check service logs for detailed error messages

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]
