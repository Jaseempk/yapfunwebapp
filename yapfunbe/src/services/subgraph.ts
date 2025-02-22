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

export class SubgraphService {
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  private async query(query: string, variables: Record<string, any> = {}) {
    try {
      const response = await fetch(this.endpoint, {
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

      const data = (await response.json()) as { data?: any; errors?: any[] };
      if (data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
      }

      return data.data as {
        markets?: SubgraphMarket[];
        market?: SubgraphMarket;
        positions?: SubgraphPosition[];
      };
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

    const data = await this.query(query);
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

    const data = await this.query(query, { id });
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

    const data = await this.query(query, { trader });
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

    const data = await this.query(query, { marketId });
    return (data.positions || []).map((position) =>
      this.transformPosition(position)
    );
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

// Initialize with the subgraph endpoint from environment variable
export const subgraphService = new SubgraphService(
  process.env.GRAPH_API_URL ||
    "https://api.thegraph.com/subgraphs/name/your-subgraph"
);
