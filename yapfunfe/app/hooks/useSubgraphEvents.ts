import { useEffect, useState } from "react";
import { Address } from "viem";
import { gql } from "@apollo/client";
import { apolloClient } from "../lib/apollo-client";

interface OrderCreatedEvent {
  id: string;
  orderId: string;
  trader: string;
  kolId: string;
  isLong: boolean;
  mindshareValue: string;
  quantity: string;
  _totalVolume: string;
  activeOrderCount: string;
  blockNumber: string;
  blockTimestamp: string;
}

interface PositionClosedEvent {
  id: string;
  user: string;
  market: string;
  pnl: string;
  positionId: string;
  blockNumber: string;
  blockTimestamp: string;
}

interface MarketResetEvent {
  id: string;
  timestamp: string;
  blockNumber: string;
  blockTimestamp: string;
}

type EventType = OrderCreatedEvent | PositionClosedEvent | MarketResetEvent;

interface ContractEvent<T extends EventType = EventType> {
  eventName: string;
  data: T;
  timestamp: number;
  blockNumber: number;
}

const MARKET_EVENTS_QUERY = gql`
  query GetMarketEvents($market: String!, $user: String!) {
    orderCreateds(
      where: { trader: $user }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      orderId
      trader
      kolId
      isLong
      mindshareValue
      quantity
      _totalVolume
      activeOrderCount
      blockNumber
      blockTimestamp
    }
    positionCloseds(
      where: { user: $user, market: $market }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      user
      market
      pnl
      positionId
      blockNumber
      blockTimestamp
    }
    marketResets(
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      timestamp
      blockNumber
      blockTimestamp
    }
  }
`;

export function useSubgraphEvents(
  marketAddress?: Address,
  userAddress?: Address
) {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!marketAddress || !userAddress) return;

    let intervalId: NodeJS.Timeout;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data } = await apolloClient.query({
          query: MARKET_EVENTS_QUERY,
          variables: {
            market: marketAddress.toLowerCase(),
            user: userAddress.toLowerCase(),
          },
        });



        // Transform subgraph events into the expected format
        // Using empty arrays as fallbacks for undefined/null values
        const orderCreatedEvents = (data.orderCreateds || []).map((event: OrderCreatedEvent): ContractEvent<OrderCreatedEvent> => ({
          eventName: "OrderCreated",
          data: event,
          timestamp: parseInt(event.blockTimestamp),
          blockNumber: parseInt(event.blockNumber),
        }));

        const positionClosedEvents = (data.positionCloseds || []).map((event: PositionClosedEvent): ContractEvent<PositionClosedEvent> => ({
          eventName: "PositionClosed",
          data: event,
          timestamp: parseInt(event.blockTimestamp),
          blockNumber: parseInt(event.blockNumber),
        }));

        const marketResetEvents = (data.marketResets || []).map((event: MarketResetEvent): ContractEvent<MarketResetEvent> => ({
          eventName: "MarketReset",
          data: event,
          timestamp: parseInt(event.blockTimestamp),
          blockNumber: parseInt(event.blockNumber),
        }));

        const allEvents = [...orderCreatedEvents, ...positionClosedEvents, ...marketResetEvents]
          .sort((a, b) => b.blockNumber - a.blockNumber);



        setEvents(allEvents);
        setError(null);
      } catch (err) {
        console.error("Error fetching subgraph events:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch events"));
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchEvents();

    // Set up polling every 30 seconds
    intervalId = setInterval(fetchEvents, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [marketAddress, userAddress]);

  return {
    events,
    isLoading,
    error,
    refetch: async () => {
      setIsLoading(true);
      try {
        await apolloClient.refetchQueries({
          include: [MARKET_EVENTS_QUERY],
        });
      } catch (err) {
        console.error("Error refetching events:", err);
      } finally {
        setIsLoading(false);
      }
    },
  };
} 