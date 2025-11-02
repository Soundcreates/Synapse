# Synapse Ledger

[![wakatime](https://wakatime.com/badge/github/Soundcreates/Synapse.svg)](https://wakatime.com/badge/github/Soundcreates/Synapse)

**Decentralized Data Marketplace for Ethical AI Training**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)](https://postgresql.org/)

---

## 🌟 Overview

Synapse Ledger revolutionizes the data economy by enabling individuals to **monetize anonymized data** while providing AI developers access to **ethically-sourced, verified datasets**. Our platform uses blockchain-based smart contracts for transparent royalty distribution, IPFS for decentralized storage, and advanced privacy-preserving mechanisms.

### 🎯 Mission

To create a transparent, fair, and decentralized data marketplace that empowers data contributors while accelerating ethical AI development.

---

## ✨ Features

### 👥 For Data Contributors

- 📤 **Data Upload & Anonymization** - Securely upload photos, text, code repositories
- 💰 **Real-time Royalty Tracking** - Monitor earnings and payment distribution
- 🔒 **Privacy Controls** - Maintain anonymity with advanced privacy mechanisms
- 🎯 **Stake Management** - Participate in targeted data pools for higher rewards

### 🤖 For AI Developers

- 🛒 **Dataset Marketplace** - Browse, filter, and purchase verified datasets
- 📊 **Quality Metrics** - Access metadata, quality scores, and provenance verification
- 🔌 **API Integration** - Seamless data access with comprehensive APIs
- 📈 **Usage Analytics** - Track data usage and compliance metrics
- ✅ **Regulatory Compliance** - Built-in compliance checks and documentation

### 🏛️ Platform Features

- ⚡ **Smart Contract Automation** - Automated royalty distribution
- 🏆 **Community Quality Scoring** - Decentralized data quality assessment
- 🗳️ **DAO Governance** - Community-driven platform decisions
- 🔄 **Federated Learning Compatible** - On-device preprocessing support

---

## 🛠️ Tech Stack

| Layer               | Technologies                                   |
| ------------------- | ---------------------------------------------- |
| **Frontend**        | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Backend**         | Node.js, Express, TypeScript, Drizzle ORM      |
| **Smart Contracts** | Solidity, Hardhat, OpenZeppelin, Ethereum      |
| **Storage**         | Pinata, IPFS                                   |
| **Web3**            | Ethers.js v6                                   |
| **Database**        | PostgreSQL with Drizzle ORM                    |
| **UI Components**   | Radix UI, shadcn/ui, Lucide Icons              |
| **Deployment**      | Docker, Vercel                                 |

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │ Smart Contracts │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Solidity)    │
│                 │    │                 │    │                 │
│ • Wallet UI     │    │ • REST API      │    │ • DataRegistry  │
│ • Marketplace   │    │ • Express       │    │ • RoyaltyDist   │
│ • Data Upload   │    │ • Drizzle ORM   │    │ • SynTK Token   │
│ • Dashboard     │    │ • IPFS Service  │    │ • Marketplace   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Storage       │
                    │   (IPFS/Pinata) │
                    │                 │
                    │ • File Storage  │
                    │ • PostgreSQL    │
                    │ • Access Control│
                    └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- MetaMask or compatible Web3 wallet
- Docker (optional, for database)

### 📦 Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Soundcreates/Synapse.git
cd Synapse
```

#### 2. Backend Setup (Node.js/TypeScript)

```bash
cd backend2
npm install
cp .env.example .env
# Configure your environment variables

# Option 1: Use Docker for PostgreSQL
docker-compose up -d

# Option 2: Use local PostgreSQL
# Make sure PostgreSQL is running locally

# Generate and run migrations
npm run db:generate
npm run migrate

# Start development server
npm run dev
```

#### 3. Frontend Setup (Next.js)

```bash
cd client3
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

#### 4. Smart Contracts (Hardhat)

```bash
cd hardhat
npm install
cp .env.example .env
# Configure your environment variables
npx hardhat test
npx hardhat run scripts/deploy.js --network mumbai
```

### 🔧 Environment Configuration

Create `.env` files in each directory:

#### Backend (.env)

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:synapse@localhost:5432/SynapseDB

# Pinata IPFS Configuration
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_API_KEY=your-pinata-secret-key

# Port Configuration
PORT=5000

# Blockchain Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your-key
```

#### Frontend (.env)

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Smart Contract Addresses
NEXT_PUBLIC_DATA_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_SYNTK_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_ROYALTY_DISTRIBUTION_ADDRESS=0x...

# Pinata Configuration
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
```

#### Smart Contracts (.env)

```env
PRIVATE_KEY=your-private-key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
ETHERSCAN_API_KEY=your-etherscan-key
```

### 🐳 Docker Support

For easy development setup, you can use Docker for the PostgreSQL database:

```bash
cd backend2
docker-compose up -d
```

This will start a PostgreSQL container with the default configuration.

### 🚀 Development Workflow

1. **Start the database**: `cd backend2 && docker-compose up -d`
2. **Run migrations**: `npm run migrate`
3. **Start backend**: `npm run dev` (runs on port 5000)
4. **Start frontend**: `cd ../client3 && npm run dev` (runs on port 3000)
5. **Deploy contracts**: `cd ../hardhat && npx hardhat run scripts/deploy.ts --network sepolia`

### 🔗 Local Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database Studio**: `npm run db:studio` (Drizzle Studio)
- **PostgreSQL**: localhost:5432

---

## 📋 Core Components

### Smart Contracts

- **DataRegistry.sol** - Core marketplace functionality for dataset registration
- **RoyaltyDistribution.sol** - Automated royalty payment management
- **SynTK.sol** - ERC-20 token for platform transactions and governance
- **TokenMarketplace.sol** - Marketplace for trading data access tokens

### Backend Services

- **Express API** - RESTful endpoints for all platform operations
- **Drizzle ORM** - Type-safe database operations with PostgreSQL
- **Pinata Service** - IPFS file upload and retrieval management
- **Data Controllers** - Dataset management and validation
- **Multer Middleware** - File upload handling and processing

### Frontend Features

- **Next.js 15** - Modern React framework with App Router
- **Wallet Integration** - Seamless Web3 wallet connection with MetaMask
- **Data Upload** - Intuitive file upload with progress tracking
- **Marketplace** - Advanced search and filtering capabilities
- **Dashboard** - Real-time analytics and earnings tracking
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Component Library** - Radix UI components with shadcn/ui styling

---

## 🧪 Testing & Quality Assurance

### Smart Contracts

```bash
cd hardhat
npx hardhat test
npx hardhat coverage
```

### Backend

```bash
cd backend2
npm test
npm run build
```

### Frontend

```bash
cd client3
npm run lint
npm run build
```

### Test Coverage Goals

- Smart Contracts: >95% coverage
- Backend: >85% coverage
- Frontend: >80% coverage

---

## 🚢 Deployment

### Production Deployment

#### Backend (Railway/Docker)

```bash
# Build the application
cd backend2
npm run build

# Deploy using Docker
docker build -t synapse-backend .
docker run -p 5000:5000 synapse-backend
```

#### Frontend (Vercel)

```bash
# Deploy to Vercel
cd client3
npm run build
vercel --prod
```

#### Smart Contracts (Sepolia/Ethereum)

```bash
cd hardhat
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat verify --network sepolia <contract-address>
```

### Infrastructure

- **Backend**: Docker containers (Railway, AWS, or self-hosted)
- **Frontend**: Vercel (Static site generation)
- **Database**: PostgreSQL (Docker, Railway, or AWS RDS)
- **Storage**: Pinata IPFS for decentralized file storage
- **Blockchain**: Ethereum Sepolia Testnet / Ethereum Mainnet

---

## 📊 Monitoring & Analytics

### Health Monitoring

- **Backend**: Health endpoints at `/health`
- **Database**: PostgreSQL connection monitoring
- **Smart Contracts**: Event monitoring and gas tracking
- **IPFS**: File availability checks via Pinata

### Performance Metrics

- API response times and throughput
- Database query performance
- IPFS upload/download speeds
- Smart contract gas optimization

### Analytics Dashboards

- User engagement metrics
- Transaction volume and fees
- Data quality scores
- Revenue distribution

---

## 📂 Project Structure

```
Synapse/
├── backend2/                 # Node.js/Express backend
│   ├── config/              # Database configuration
│   ├── controller/          # API controllers
│   ├── middleware/          # Express middleware
│   ├── migrations/          # Database migrations
│   ├── models/              # Drizzle ORM models
│   ├── routes/              # API routes
│   ├── service/             # Business logic services
│   ├── docker-compose.yml   # PostgreSQL container
│   └── main.ts              # Application entry point
│
├── client3/                 # Next.js frontend
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── contractData/        # Smart contract ABIs
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── public/              # Static assets
│   └── utils/               # Helper utilities
│
├── hardhat/                 # Smart contracts
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── typechain-types/     # Generated TypeScript types
│
└── docs/                    # Documentation files
```

---

## 🗺️ Roadmap

### Phase 1 - Core Platform ✅

- [x] Smart contract development (DataRegistry, TokenMarketplace, SynTK, RoyaltyDistribution)
- [x] Backend API with Express and TypeScript
- [x] PostgreSQL database with Drizzle ORM
- [x] IPFS integration with Pinata
- [x] Next.js frontend with Web3 integration

### Phase 2 - Enhanced Features �

- [ ] Advanced search and filtering in marketplace
- [ ] User authentication and profiles
- [ ] Dataset quality scoring system
- [ ] Royalty distribution automation
- [ ] Mobile-responsive design improvements

### Phase 3 - Community & Governance 📋

- [ ] DAO governance implementation
- [ ] Community-driven quality assessment
- [ ] Staking and reward mechanisms
- [ ] Advanced privacy features

### Phase 4 - Scale & Enterprise 🏢

- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] Enterprise API packages
- [ ] Advanced analytics dashboard
- [ ] Regulatory compliance tools

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart the database container
cd backend2
docker-compose down
docker-compose up -d

# Check database logs
docker-compose logs postgres
```

#### Migration Issues

```bash
# Reset migrations (development only)
npm run clear-db
npm run db:generate
npm run migrate
```

#### Frontend Build Issues

```bash
# Clear Next.js cache
cd client3
rm -rf .next
npm run build
```

#### Smart Contract Deployment Issues

```bash
# Check network configuration
cd hardhat
npx hardhat verify --list-networks

# Check gas prices and account balance
npx hardhat balance --account <your-address>
```

### Environment Variables Checklist

Make sure you have configured:

- ✅ Database connection string
- ✅ Pinata API keys
- ✅ Smart contract addresses
- ✅ RPC endpoints
- ✅ Private keys (for deployment)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Repository**: [GitHub - Synapse](https://github.com/Soundcreates/Synapse)
- **Issues**: [Report bugs and feature requests](https://github.com/Soundcreates/Synapse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Soundcreates/Synapse/discussions)
- **Releases**: [Latest releases](https://github.com/Soundcreates/Synapse/releases)

---

## 📞 Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/Soundcreates/Synapse/issues)
- **GitHub Discussions**: [Technical discussions and questions](https://github.com/Soundcreates/Synapse/discussions)
- **Email**: Contact the development team through GitHub

---

<div align="center">

**Built with ❤️ by the Synapse Ledger Team**

_Empowering ethical AI through decentralized data markets_

</div>"
