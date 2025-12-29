# Cylend Action Processor Service

Service backend untuk memproses pending actions dari Mantle ke Sapphire secara otomatis.

## Arsitektur

```
Frontend (Next.js)
    ↓ submitAction()
PrivateLendingIngress (Mantle)
    ↓ EncryptedActionReceived event
Ponder Indexer
    ↓ Index ke database
Action Processor Service ← (Service ini)
    ↓ Monitor pending actions
    ↓ processAction()
LendingCore (Sapphire)
    ↓ ActionProcessed event
Ponder Indexer
    ↓ Update status & remainingAmount
Frontend (Next.js)
    ↓ Query GraphQL → Lihat status updated
```

## Struktur Folder

```
cylend-service/
├── src/
│   ├── index.ts          # Main entry point
│   ├── processor.ts      # Logic untuk process actions
│   ├── monitor.ts        # Monitor pending actions dari Ponder
│   └── config.ts         # Configuration
├── package.json
├── tsconfig.json
└── .env.example
```

## Cara Kerja

1. **Monitor**: Service polling Ponder GraphQL untuk actions dengan `status: "pending"`
2. **Process**: Untuk setiap pending action, call `LendingCore.processAction()` di Sapphire
3. **Retry**: Jika gagal, retry dengan exponential backoff
4. **Logging**: Log semua proses untuk monitoring

## Setup

1. Install dependencies:
```bash
cd cylend-service
npm install
```

2. Copy `.env.example` ke `.env`:
```bash
cp .env.example .env
```

3. Set environment variables:
```env
# Ponder GraphQL API
PONDER_API_URL=http://localhost:42069/graphql

# Sapphire Testnet RPC
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.io

# LendingCore Contract Address
CORE_ADDRESS=0xfB3Be9E7369bB8c4fC5fF8AB67432fbEe4312e6d

# Owner Private Key (untuk call processAction)
OWNER_PRIVATE_KEY=0x...

# Polling interval (ms)
POLL_INTERVAL=10000

# Retry config
MAX_RETRIES=3
RETRY_DELAY=5000
```

4. Run service:
```bash
npm run dev    # Development
npm start      # Production
```

## Cara Menjalankan

### Development
```bash
cd cylend-service
npm install
cp .env.example .env
# Edit .env dengan konfigurasi yang benar
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Deployment

Service ini bisa di-deploy sebagai:
- **Docker container**
- **Systemd service** (Linux)
- **PM2 process** (Node.js)
- **Cloud function** (AWS Lambda, Vercel Cron, dll)

## Monitoring

Service akan:
- Log setiap action yang diproses
- Log errors dengan detail
- Track metrics (actions processed, success rate, dll)

## Catatan Penting

⚠️ **Security**: 
- Jangan commit `.env` file ke git!
- Private key harus disimpan dengan aman (gunakan secret manager di production)
- Pastikan wallet owner memiliki cukup gas di Sapphire untuk transaction fees

## Troubleshooting

### Error: "Action already processed"
- Action sudah diproses sebelumnya, skip saja

### Error: "Transaction reverted"
- Check logs untuk detail error
- Pastikan token sudah dikonfigurasi di LendingCore
- Pastikan deposit memiliki cukup balance

### Error: "GraphQL query failed"
- Pastikan Ponder indexer sedang running
- Check `PONDER_API_URL` di `.env`

