import { useEffect, useState } from "react";
// import { useContractEvents } from "./useContractEvents";
import { useSubgraphEvents } from "./useSubgraphEvents";
import { Address } from "viem";

interface MarketEvent {
  type: "order_created" | "position_closed" | "market_reset";
  data: any;
  timestamp: number;
}

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

interface OrderBook {
  buys: OrderBookEntry[];
  sells: OrderBookEntry[];
}

export function useMarketEvents(
  marketAddress?: Address,
  userAddress?: Address
) {
  const [orderBook, setOrderBook] = useState<OrderBook>({
    buys: [],
    sells: [],
  });
  const [recentEvents, setRecentEvents] = useState<MarketEvent[]>([]);
  
  // Try to use subgraph first
  const {
    events: subgraphEvents,
    isLoading: isLoadingSubgraph,
    error: subgraphError,
  } = useSubgraphEvents(marketAddress, userAddress);

  // Fallback to RPC events if subgraph fails
  // const {
  //   events: rpcEvents,
  //   isLoading: isLoadingRpc,
  //   error: rpcError,
  // } = useContractEvents(
  //   subgraphError ? marketAddress : undefined,
  //   subgraphError ? userAddress : undefined
  // );

  // Use either subgraph or RPC events
  const events = subgraphEvents;
  const isLoading = isLoadingSubgraph ;
  const error = subgraphError ;

  // Process events and update order book
  useEffect(() => {
    if (!events.length) return;

    const processedEvents = events
      .map((event) => {
        let type: MarketEvent["type"];
        switch (event.eventName) {
          case "OrderCreated":
            type = "order_created";
            break;
          case "PositionClosed":
            type = "position_closed";
            break;
          case "MarketReset":
            type = "market_reset";
            break;
          default:
            return null;
        }

        return {
          type,
          data: event.data,
          timestamp: event.timestamp,
        };
      })
      .filter((event): event is MarketEvent => event !== null);

    setRecentEvents(processedEvents);

    // Update order book based on events
    const newOrderBook = processedEvents.reduce(
      (acc, event) => {
        if (event.type === "order_created") {
          const { isLong, mindshareValue, quantity } = event.data;
          const side = isLong ? "buys" : "sells";
          const price = Number(mindshareValue) / 1e6;
          const size = Number(quantity) / 1e6;

          // Find existing entry or create new one
          const existingIndex = acc[side].findIndex(
            (entry) => entry.price === price
          );
          if (existingIndex >= 0) {
            acc[side][existingIndex].size += size;
            acc[side][existingIndex].total += size * price;
          } else {
            acc[side].push({
              price,
              size,
              total: size * price,
            });
          }

          // Sort buys descending, sells ascending
          acc.buys.sort((a, b) => b.price - a.price);
          acc.sells.sort((a, b) => a.price - b.price);
        }

        return acc;
      },
      {
        buys: [...orderBook.buys],
        sells: [...orderBook.sells],
      }
    );

    setOrderBook(newOrderBook);
  }, [events]);

  // Clear order book on market reset
  useEffect(() => {
    const hasReset = recentEvents.some(
      (event) => event.type === "market_reset"
    );
    if (hasReset) {
      setOrderBook({ buys: [], sells: [] });
    }
  }, [recentEvents]);

  return {
    orderBook,
    recentEvents,
    isLoading,
    error,
  };
}
