# EVM Network Benchmark Tool

A comprehensive tool for testing and benchmarking EVM-compatible networks with features for bulk operations, contract deployment, and network stress testing.

## Tech Stack

- Next.js
- TypeScript
- Shadcn UI
- Tailwind CSS
- Ethers.js
- Prisma with SQLite

## Features

- **Wallet Management**
  - Create and manage multiple wallets
  - Track transaction history
  - View wallet balances

- **Bulk Operations**
  - Send native tokens to multiple addresses
  - Transfer ERC20 tokens in bulk
  - Track all transaction statuses

- **Contract Deployment**
  - Deploy smart contracts with constructor arguments
  - View deployment history
  - Track contract addresses

- **Network Stress Testing**
  - Configure number of transactions
  - Automated random wallet generation
  - Monitor test progress

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd benchmark-evm
```

2. Install dependencies:
```bash
pnpm install
```

3. Initialize the database:
```bash
pnpm prisma db push
```

4. Start the development server:
```bash
pnpm dev
```

## Usage

1. **Network Setup**
   - Select or add a network from the dropdown
   - Configure RPC URL and chain ID

2. **Wallet Operations**
   - Create new wallets as needed
   - View transaction history for each wallet

3. **Bulk Transfers**
   - Enter recipient addresses and amounts
   - Support for both native and ERC20 tokens
   - Monitor transaction progress

4. **Contract Deployment**
   - Paste contract bytecode and ABI
   - Configure constructor arguments
   - Deploy and track status

5. **Network Stress Test**
   - Set number of transactions
   - Monitor progress and success rate

## Project Structure

```
src/
  ├── app/               # Next.js app router
  ├── components/        # React components
  │   ├── ui/           # Shadcn UI components
  │   └── wallets/      # Wallet-specific components
  ├── contexts/         # React contexts
  ├── lib/             # Utility functions
  └── types/           # TypeScript types
```

## Development

- Uses Next.js 15 with TypeScript
- Shadcn UI for component library
- Prisma for database management
- Ethers.js for blockchain interactions

## Database Schema

- `Wallet`: Stores wallet information and transaction history
- `Transaction`: Records all blockchain transactions
- `Network`: Manages supported networks and configuration

## License

MIT
