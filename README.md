# YapFun - Crypto KOL Mindshare Derivatives Market

YapFun is a decentralized derivatives market focused on mindshares of Key Opinion Leaders (KOLs) in Twitter. The platform allows users to take long or short positions on the future influence and performance of crypto KOLs, creating a unique market-driven approach to valuing online influence.

## Features

- **KOL Markets**: Create and participate in prediction markets for social media influencers
- **Long/Short Positions**: Take positions based on your predictions of a KOL's future performance
- **Real-time Data**: Live updates of market prices and positions
- **In-house Wallet**: Secure escrow system for managing funds within the platform
- **Analytics Dashboard**: Track market trends and your portfolio performance
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Web3 Integration**: Connect with popular wallets like MetaMask, WalletConnect, and more

## Architecture

YapFun is built with a modern, scalable architecture:

### Frontend (`yapfunfe/`)

- **Next.js**: React framework with server-side rendering
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: High-quality UI components
- **Framer Motion**: Smooth animations and transitions
- **Recharts**: Responsive charting library
- **wagmi & viem**: Web3 integration libraries

### Backend (`yapfunbe/`)

- **Node.js**: JavaScript runtime
- **GraphQL API**: Efficient data querying with Apollo Server
- **WebSocket Subscriptions**: Real-time updates
- **Redis**: Caching layer for performance
- **TypeScript**: Type-safe code

### Smart Contracts

- **Escrow System** (`yap_escrow/`): Manages user funds securely
- **Order Book Factory** (`yap_orderbook_factory/`): Creates and manages market order books
- **Oracle System** (`yap_oracle/`): Provides reliable data feeds for market resolution

## Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn or npm
- Docker (for local development)
- MetaMask or another Web3 wallet

### Frontend Setup

```bash
cd yapfunfe
npm install
npm run dev
```

### Backend Setup

```bash
cd yapfunbe
npm install
npm run dev
```

### Smart Contract Development

```bash
cd yap_escrow  # or other contract directory
yarn install
yarn compile
yarn test
```

## Market Mechanics

YapFun's prediction markets operate on the following principles:

1. **Market Creation**: Markets are created for KOLs based on their kaito CT ranking
2. **Position Taking**: Users can take long positions (betting on increased influence) or short positions (betting on decreased influence)
3. **Price Discovery**: Market prices are determined by the kaito KOL mindshare
4. **Settlement**: Markets are settled based on oracle data from kaito
5. **Profit/Loss**: Users profit when their predictions are correct

## Security

- **Un-Audited Contracts**: Smart contracts are un-audited
- **Secure Escrow**: User funds are held in a secure escrow system
- **Transparent Operations**: All market operations are visible on-chain
- **Risk Management**: Position limits and circuit breakers prevent market manipulation

## Roadmap

- **Q1 2024**: Launch of beta platform with limited KOL markets
- **Q2 2024**: Mobile app release

## Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## 📄 License

YapFun is licensed under the [MIT License](LICENSE).

## 📞 Contact

- Website: [yapfun.com](https://yapfun.com)
- Twitter: [@YapFunOfficial](https://twitter.com/YapFunOfficial)
- Discord: [YapFun Community](https://discord.gg/yapfun)
- Email: team@yapfun.com
