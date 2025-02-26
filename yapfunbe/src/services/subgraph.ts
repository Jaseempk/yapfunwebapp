import { Market, Position, PricePoint } from "../types/market";

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

interface SubgraphKolMarket {
  marketAddress: string;
}

interface SubgraphMarketVolume {
  totalVolume: string;
}

interface SubgraphNewMarket {
  id: string;
  kolId: string;
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
      query GetMarkets {
        markets {
          id
          name
          description
          totalVolume
          totalPositions
          currentPrice
          priceHistory {
            price
            timestamp
          }
          createdAt
          updatedAt
        }
      }
    `;

    const data = await this.query<{ markets: SubgraphMarket[] }>(
      this.orderBookEndpoint,
      query
    );
    return (data.markets || []).map((market) => this.transformMarket(market));
  }

  async getMarket(id: string): Promise<Market | null> {
    const query = `
      query GetMarket($id: ID!) {
        market(id: $id) {
          id
          name
          description
          totalVolume
          totalPositions
          currentPrice
          priceHistory {
            price
            timestamp
          }
          createdAt
          updatedAt
        }
      }
    `;

    const data = await this.query<{ market: SubgraphMarket | null }>(
      this.orderBookEndpoint,
      query,
      { id }
    );
    return data.market ? this.transformMarket(data.market) : null;
  }

  async getPositions(trader: string): Promise<Position[]> {
    const query = `
      query GetPositions($trader: String!) {
        positions(where: { trader: $trader }) {
          id
          market {
            id
          }
          trader
          amount
          entryPrice
          type
          status
          pnl
          createdAt
          closedAt
        }
      }
    `;

    const data = await this.query<{ positions: SubgraphPosition[] }>(
      this.orderBookEndpoint,
      query,
      { trader }
    );
    return (data.positions || []).map((position) =>
      this.transformPosition(position)
    );
  }

  async getMarketPositions(marketId: string): Promise<Position[]> {
    const query = `
      query GetMarketPositions($marketId: ID!) {
        positions(where: { market: $marketId }) {
          id
          market {
            id
          }
          trader
          amount
          entryPrice
          type
          status
          pnl
          createdAt
          closedAt
        }
      }
    `;

    const data = await this.query<{ positions: SubgraphPosition[] }>(
      this.orderBookEndpoint,
      query,
      { marketId }
    );
    return (data.positions || []).map((position) =>
      this.transformPosition(position)
    );
  }

  async checkMarketExists(kolId: string): Promise<string | null> {
    const query = `
      query CheckMarket($kolId: String!) {
        kolMarkets(where: { kolId: $kolId }) {
          marketAddress
        }
      }
    `;

    const data = await this.query<{ kolMarkets: SubgraphKolMarket[] }>(
      this.oracleEndpoint,
      query,
      { kolId }
    );
    return data.kolMarkets?.[0]?.marketAddress || null;
  }

  async getMarketVolume(marketAddress: string): Promise<number> {
    const query = `
      query GetVolume($marketAddress: String!) {
        market(id: $marketAddress) {
          totalVolume
        }
      }
    `;

    const data = await this.query<{ market: SubgraphMarketVolume | null }>(
      this.orderBookEndpoint,
      query,
      { marketAddress }
    );
    return data.market ? parseFloat(data.market.totalVolume) : 0;
  }

  async getNewMarketDeployments(
    fromTimestamp: number
  ): Promise<Array<{ marketAddress: string; kolId: string }>> {
    const query = `
      query GetNewMarkets($timestamp: Int!) {
        markets(where: { createdAt_gt: $timestamp }) {
          id
          kolId
        }
      }
    `;

    const data = await this.query<{ markets: SubgraphNewMarket[] }>(
      this.factoryEndpoint,
      query,
      { timestamp: fromTimestamp }
    );
    return (data.markets || []).map((market) => ({
      marketAddress: market.id,
      kolId: market.kolId,
    }));
  }

  private transformMarket(market: SubgraphMarket): Market {
    return {
      id: market.id,
      name: market.name,
      description: market.description,
      totalVolume: parseFloat(market.totalVolume),
      totalPositions: parseInt(market.totalPositions),
      currentPrice: parseFloat(market.currentPrice),
      priceHistory: market.priceHistory.map(
        (point): PricePoint => ({
          price: parseFloat(point.price),
          timestamp: point.timestamp,
        })
      ),
      createdAt: market.createdAt,
      updatedAt: market.updatedAt,
    };
  }

  private transformPosition(position: SubgraphPosition): Position {
    return {
      id: position.id,
      marketId: position.market.id,
      trader: position.trader,
      amount: parseFloat(position.amount),
      entryPrice: parseFloat(position.entryPrice),
      type: position.type as Position["type"],
      status: position.status as Position["status"],
      pnl: position.pnl ? parseFloat(position.pnl) : undefined,
      createdAt: position.createdAt,
      closedAt: position.closedAt || undefined,
    };
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
