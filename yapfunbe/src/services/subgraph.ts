import {
  Market,
  Position,
  PricePoint,
  MarketDeployment,
  PositionType,
  PositionStatus,
} from "../types/market";
import { ethers } from "ethers";
import { orderBookAbi } from "../abi/orderBook";

const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL || "http://localhost:8545"
);

async function getContract(address: string) {
  return new ethers.Contract(address, orderBookAbi, provider);
}

// Subgraph entity types
interface SubgraphMarketInitialized {
  id: string;
  kolId: string;
  maker: string;
  marketAddy: string;
}

interface SubgraphPositionClosed {
  id: string;
  user: string;
  market: string;
  pnl: string;
  positionId: string;
  blockNumber: string;
  blockTimestamp: string;
}

interface SubgraphOrderFilled {
  id: string;
  orderId: string;
  filledQuantity: string;
  counterpartyTrader: string;
  blockNumber: string;
  blockTimestamp: string;
}

interface SubgraphMarketVolume {
  totalVolume: string;
}

interface SubgraphKolMarket {
  marketAddress: string;
}

interface SubgraphNewMarket {
  id: string;
  kolId: string;
}

interface SubgraphMarket {
  id: string;
  name: string;
  description: string;
  totalVolume: string;
  totalPositions: string;
  currentPrice: string;
  priceHistory: Array<{
    price: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface SubgraphPosition {
  id: string;
  market: {
    id: string;
  };
  trader: string;
  amount: string;
  entryPrice: string;
  type: string;
  status: string;
  pnl: string;
  createdAt: string;
  closedAt: string | null;
}

export class SubgraphService {
  private readonly orderBookEndpoint: string;
  private readonly oracleEndpoint: string;
  private readonly factoryEndpoint: string;

  constructor(
    orderBookEndpoint: string,
    oracleEndpoint: string,
    factoryEndpoint: string
  ) {
    this.orderBookEndpoint = orderBookEndpoint;
    this.oracleEndpoint = oracleEndpoint;
    this.factoryEndpoint = factoryEndpoint;
  }

  private async query<T>(
    endpoint: string,
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { data?: T; errors?: any[] };
      if (data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
      }

      return data.data as T;
    } catch (error) {
      console.error("Subgraph query error:", error);
      throw error;
    }
  }

  async getMarkets(): Promise<Market[]> {
    const query = `
      query GetNewMarkets {
        newMarketInitialisedAndWhitelisteds {
          id
          kolId
          maker
          marketAddy
        }
      }
    `;

    const data = await this.query<{
      newMarketInitialisedAndWhitelisteds: SubgraphMarketInitialized[];
    }>(this.factoryEndpoint, query);

    const markets = await Promise.all(
      (data.newMarketInitialisedAndWhitelisteds || []).map(async (market) => {
        try {
          const contract = await getContract(market.marketAddy);

          // Get volume from contract
          const volume = await contract.marketVolume();

          // Get current price from contract
          const price = await contract._getOraclePrice();

          // Create empty price history array
          const priceHistory: PricePoint[] = [];

          return {
            id: market.marketAddy,
            name: `KOL Market ${market.kolId}`,
            description: `Market for KOL ${market.kolId}`,
            totalVolume: Number(volume) / 1e6,
            totalPositions: 0,
            currentPrice: Number(price) / 1e18,
            priceHistory,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error(
            `Error fetching market data for ${market.marketAddy}:`,
            error
          );
          return {
            id: market.marketAddy,
            name: `KOL Market ${market.kolId}`,
            description: `Market for KOL ${market.kolId}`,
            totalVolume: 0,
            totalPositions: 0,
            currentPrice: 0,
            priceHistory: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      })
    );

    return markets;
  }

  async getMarket(id: string): Promise<Market | null> {
    const query = `
      query GetMarket($id: ID!) {
        newMarketInitialisedAndWhitelisted(id: $id) {
          id
          kolId
          maker
          marketAddy
        }
      }
    `;

    try {
      const data = await this.query<{
        newMarketInitialisedAndWhitelisted: SubgraphMarketInitialized | null;
      }>(this.factoryEndpoint, query, { id });

      if (!data.newMarketInitialisedAndWhitelisted) {
        return null;
      }

      const market = data.newMarketInitialisedAndWhitelisted;
      const contract = await getContract(market.marketAddy);

      // Get volume from contract
      const volume = await contract.marketVolume();

      // Get current price from contract
      const price = await contract._getOraclePrice();

      // Create empty price history array
      const priceHistory: PricePoint[] = [];

      return {
        id: market.marketAddy,
        name: `KOL Market ${market.kolId}`,
        description: `Market for KOL ${market.kolId}`,
        totalVolume: Number(volume) / 1e6,
        totalPositions: 0,
        currentPrice: Number(price) / 1e18,
        priceHistory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching market data:`, error);
      return null;
    }
  }

  async getPositions(trader: string): Promise<Position[]> {
    const query = `
      query GetPositions($trader: String!) {
        positionCloseds(where: { user: $trader }) {
          id
          user
          market
          pnl
          positionId
          blockNumber
          blockTimestamp
        }
      }
    `;

    const data = await this.query<{
      positionCloseds: SubgraphPositionClosed[];
    }>(this.orderBookEndpoint, query, { trader });

    return (data.positionCloseds || []).map((position) => ({
      id: position.id,
      marketId: position.market,
      trader: position.user,
      amount: 0, // Not available in event
      entryPrice: 0, // Not available in event
      type: PositionType.LONG, // Not available in event
      status: PositionStatus.CLOSED,
      pnl: Number(position.pnl) / 1e6,
      createdAt: new Date(Number(position.blockTimestamp) * 1000).toISOString(),
      closedAt: new Date(Number(position.blockTimestamp) * 1000).toISOString(),
    }));
  }

  async getMarketPositions(marketId: string): Promise<Position[]> {
    const query = `
      query GetMarketPositions($marketId: ID!) {
        positionCloseds(where: { market: $marketId }) {
          id
          user
          market
          pnl
          positionId
          blockNumber
          blockTimestamp
        }
      }
    `;

    const data = await this.query<{
      positionCloseds: SubgraphPositionClosed[];
    }>(this.orderBookEndpoint, query, { marketId });

    return (data.positionCloseds || []).map((position) => ({
      id: position.id,
      marketId: position.market,
      trader: position.user,
      amount: 0, // Not available in event
      entryPrice: 0, // Not available in event
      type: PositionType.LONG, // Not available in event
      status: PositionStatus.CLOSED,
      pnl: Number(position.pnl) / 1e6,
      createdAt: new Date(Number(position.blockTimestamp) * 1000).toISOString(),
      closedAt: new Date(Number(position.blockTimestamp) * 1000).toISOString(),
    }));
  }

  async checkMarketExists(kolId: string): Promise<string | null> {
    const query = `
      query CheckMarket($kolId: String!) {
        newMarketInitialisedAndWhitelisteds(where: { kolId: $kolId }) {
          marketAddy
        }
      }
    `;

    const data = await this.query<{
      newMarketInitialisedAndWhitelisteds: SubgraphMarketInitialized[];
    }>(this.factoryEndpoint, query, { kolId });
    return data.newMarketInitialisedAndWhitelisteds?.[0]?.marketAddy || null;
  }

  async getMarketVolume(marketAddress: string): Promise<number> {
    try {
      const contract = await getContract(marketAddress);
      const volume = await contract.marketVolume();
      return Number(volume) / 1e6;
    } catch (error) {
      console.error(`Error fetching market volume:`, error);
      return 0;
    }
  }

  async getNewMarketDeployments(
    fromTimestamp: number
  ): Promise<Array<{ marketAddress: string; kolId: string }>> {
    const query = `
      query GetNewMarkets($timestamp: Int!) {
        newMarketInitialisedAndWhitelisteds(where: { blockTimestamp_gt: $timestamp }) {
          marketAddy
          kolId
        }
      }
    `;

    const data = await this.query<{
      newMarketInitialisedAndWhitelisteds: SubgraphMarketInitialized[];
    }>(this.factoryEndpoint, query, { timestamp: fromTimestamp });
    return (data.newMarketInitialisedAndWhitelisteds || []).map((market) => ({
      marketAddress: market.marketAddy,
      kolId: market.kolId,
    }));
  }
}

// Initialize with the subgraph endpoints from environment variables
export const subgraphService = new SubgraphService(
  process.env.ORDERBOOK_SUBGRAPH_URL ||
    "https://api.thegraph.com/subgraphs/name/your-orderbook-subgraph",
  process.env.ORACLE_SUBGRAPH_URL ||
    "https://api.thegraph.com/subgraphs/name/your-oracle-subgraph",
  process.env.FACTORY_SUBGRAPH_URL ||
    "https://api.thegraph.com/subgraphs/name/your-factory-subgraph"
);
