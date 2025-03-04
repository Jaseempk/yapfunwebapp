import { useEffect, useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { obAbi } from "@/contractAbi/orderBook";
import { Address, Log, parseAbiItem, decodeEventLog } from "viem";

interface OrderCreatedEvent {
  orderId: bigint;
  trader: Address;
  kolId: bigint;
  isLong: boolean;
  mindshareValue: bigint;
  quantity: bigint;
  totalVolume: bigint;
  activeOrderCount: bigint;
}

interface PositionClosedEvent {
  user: Address;
  market: Address;
  pnl: bigint;
  positionId: bigint;
}

interface MarketResetEvent {
  timestamp: bigint;
}

type EventType = OrderCreatedEvent | PositionClosedEvent | MarketResetEvent;

interface ContractEvent<T extends EventType = EventType> {
  eventName: string;
  data: T;
  timestamp: number;
  blockNumber: number;
}

export function useContractEvents(
  marketAddress?: Address,
  userAddress?: Address
) {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  const fetchEvents = useCallback(async () => {
    if (!marketAddress || !userAddress || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // Define event signatures
      const orderCreatedEvent = parseAbiItem(
        "event OrderCreated(uint256 indexed orderId, address indexed trader, uint256 indexed kolId, bool isLong, uint256 mindshareValue, uint256 quantity, uint256 _totalVolume, uint256 activeOrderCount)"
      );

      const positionClosedEvent = parseAbiItem(
        "event PositionClosed(address user, address market, int256 pnl, uint256 positionId)"
      );

      const marketResetEvent = parseAbiItem(
        "event MarketReset(uint256 timestamp)"
      );

      // Get logs for all relevant events
      const [orderCreatedLogs, positionClosedLogs, marketResetLogs] =
        await Promise.all([
          publicClient.getLogs({
            address: marketAddress,
            event: orderCreatedEvent,
            args: {
              trader: userAddress,
            },
            fromBlock: "earliest",
          }),
          publicClient.getLogs({
            address: marketAddress,
            event: positionClosedEvent,
            args: {
              user: userAddress,
            },
            fromBlock: "earliest",
          }),
          publicClient.getLogs({
            address: marketAddress,
            event: marketResetEvent,
            fromBlock: "earliest",
          }),
        ]);

      // Get block timestamps
      const blockTimestamps = new Map<number, number>();
      const uniqueBlocks = new Set([
        ...orderCreatedLogs.map((log) => Number(log.blockNumber)),
        ...positionClosedLogs.map((log) => Number(log.blockNumber)),
        ...marketResetLogs.map((log) => Number(log.blockNumber)),
      ]);

      await Promise.all(
        Array.from(uniqueBlocks).map(async (blockNumber) => {
          const block = await publicClient.getBlock({
            blockNumber: BigInt(blockNumber),
          });
          blockTimestamps.set(blockNumber, Number(block.timestamp));
        })
      );

      // Transform logs into typed events
      const allEvents = [
        ...orderCreatedLogs.map<ContractEvent<OrderCreatedEvent>>((log) => {
          const decoded = decodeEventLog({
            abi: obAbi,
            data: log.data,
            topics: log.topics,
            eventName: "OrderCreated",
          });
          const blockNumber = Number(log.blockNumber);
          return {
            eventName: "OrderCreated",
            data: decoded.args as unknown as OrderCreatedEvent,
            timestamp: blockTimestamps.get(blockNumber) || 0,
            blockNumber,
          };
        }),
        ...positionClosedLogs.map<ContractEvent<PositionClosedEvent>>((log) => {
          const decoded = decodeEventLog({
            abi: obAbi,
            data: log.data,
            topics: log.topics,
            eventName: "PositionClosed",
          });
          const blockNumber = Number(log.blockNumber);
          return {
            eventName: "PositionClosed",
            data: decoded.args as unknown as PositionClosedEvent,
            timestamp: blockTimestamps.get(blockNumber) || 0,
            blockNumber,
          };
        }),
        ...marketResetLogs.map<ContractEvent<MarketResetEvent>>((log) => {
          const decoded = decodeEventLog({
            abi: obAbi,
            data: log.data,
            topics: log.topics,
            eventName: "MarketReset",
          });
          const blockNumber = Number(log.blockNumber);
          return {
            eventName: "MarketReset",
            data: decoded.args as unknown as MarketResetEvent,
            timestamp: blockTimestamps.get(blockNumber) || 0,
            blockNumber,
          };
        }),
      ].sort((a, b) => b.blockNumber - a.blockNumber);

      setEvents(allEvents);
    } catch (err) {
      console.error("Error fetching contract events:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch events")
      );
    } finally {
      setIsLoading(false);
    }
  }, [marketAddress, userAddress, publicClient]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!marketAddress || !userAddress || !publicClient) return;

    let unwatch: (() => void) | undefined;

    const setupWatcher = async () => {
      try {
        unwatch = await publicClient.watchContractEvent({
          address: marketAddress,
          abi: obAbi,
          onLogs: () => {
            fetchEvents();
          },
        });

        // Initial fetch
        fetchEvents();
      } catch (err) {
        console.error("Error setting up event watcher:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to watch events")
        );
      }
    };

    setupWatcher();

    return () => {
      if (unwatch) {
        unwatch();
      }
    };
  }, [marketAddress, userAddress, publicClient, fetchEvents]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
}
