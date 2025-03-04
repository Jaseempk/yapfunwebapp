import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarketEvents } from "../hooks/useMarketEvents";
import { Address } from "viem";
import { useAccount } from "wagmi";

interface OrderBookSectionProps {
  marketAddress?: Address;
  currentMindshare: number;
}

interface OrderBookEntryProps {
  price: number;
  size: number;
  total: number;
  type: "buy" | "sell";
  isNew?: boolean;
}

const OrderBookEntry = ({
  price,
  size,
  total,
  type,
  isNew,
}: OrderBookEntryProps) => {
  const maxTotal = 10000; // Example maximum total for progress bar

  return (
    <motion.div
      className="relative"
      initial={isNew ? { opacity: 0, x: type === "buy" ? -20 : 20 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`absolute inset-0 ${
          type === "buy" ? "bg-green-500/10" : "bg-red-500/10"
        }`}
        style={{ width: `${(total / maxTotal) * 100}%` }}
      />
      <div className="relative grid grid-cols-3 gap-2 sm:gap-4 py-2 sm:py-1.5 text-xs sm:text-sm touch-none select-none">
        <span
          className={`${
            type === "buy" ? "text-green-500" : "text-red-500"
          } font-medium`}
        >
          ${price.toFixed(2)}
        </span>
        <span className="text-right font-medium">{size.toLocaleString()}</span>
        <span className="text-right text-muted-foreground">
          ${total.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};

export default function OrderBookSection({
  marketAddress,
  currentMindshare,
}: OrderBookSectionProps) {
  const { address } = useAccount();
  const { orderBook, isLoading, error } = useMarketEvents(
    marketAddress,
    address as Address
  );

  return (
    <Card className="p-3 sm:p-5 rounded-xl">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <h3 className="font-semibold text-xs sm:text-sm">Order Book</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm h-8 hover:bg-background/10"
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 animate-spin" />
          ) : (
            <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="text-center py-4 text-red-500 text-sm">
          Error loading order book. Please try again.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground mb-2 px-1.5 sm:px-2">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          <div className="space-y-1 sm:space-y-1.5 max-h-[180px] sm:max-h-[300px] overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
            <AnimatePresence>
              {orderBook.sells.map((entry, i) => (
                <OrderBookEntry
                  key={`sell-${entry.price}`}
                  price={entry.price}
                  size={entry.size}
                  total={entry.total}
                  type="sell"
                />
              ))}
            </AnimatePresence>

            <div className="text-center py-3 font-medium border-y border-border my-2 text-sm sm:text-base bg-background/80 backdrop-blur-sm sticky top-0 z-10">
              {currentMindshare.toFixed(2)}%
            </div>

            <AnimatePresence>
              {orderBook.buys.map((entry, i) => (
                <OrderBookEntry
                  key={`buy-${entry.price}`}
                  price={entry.price}
                  size={entry.size}
                  total={entry.total}
                  type="buy"
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Card>
  );
}
