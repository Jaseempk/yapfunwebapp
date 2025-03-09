import { useState, useCallback } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { RefreshCcw } from "lucide-react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { config } from "../../providers/Web3Providers";
import { obAbi } from "@/contractAbi/orderBook";
import { simulateContract, writeContract } from "@wagmi/core";

interface TradingInterfaceProps {
  marketAddress?: `0x${string}`;
  balance: string;
  isLoadingBalance: boolean;
  onOrderSuccess: () => void;
  onBalanceRefresh: () => void;
}

interface OrderStatus {
  status: "pending" | "success" | "error" | null;
  message: string;
}

export default function TradingInterface({
  marketAddress,
  balance,
  isLoadingBalance,
  onOrderSuccess,
  onBalanceRefresh,
}: TradingInterfaceProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"long" | "short">("long");
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();

  // Memoized validation function
  const validateOrder = useCallback(
    (orderAmount: string, currentBalance: string) => {
      if (!orderAmount || Number(orderAmount) <= 0) {
        return { isValid: false, error: "Please enter a valid amount" };
      }
      if (Number(orderAmount) > Number(currentBalance)) {
        return { isValid: false, error: "Insufficient balance" };
      }
      // Add maximum order validation
      if (Number(orderAmount) > 1000000) {
        return { isValid: false, error: "Order exceeds maximum limit" };
      }
      return { isValid: true, error: null };
    },
    []
  );

  // Enhanced order placement handler
  const handlePlaceOrder = async () => {
    const validation = validateOrder(amount, balance);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // Show confirmation for large orders
    if (Number(amount) > 10000) {
      if (
        !window.confirm(
          `Are you sure you want to place a ${activeTab} order for $${amount}?`
        )
      ) {
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (!marketAddress) {
        throw new Error("No market address found for this KOL");
      }

      const { request } = await simulateContract(config, {
        abi: obAbi,
        address: marketAddress,
        functionName: "createOrder",
        args: [activeTab === "long", parseUnits(amount, 6)],
      });

      await writeContract(config, request);
      setAmount("");
      onOrderSuccess();
      onBalanceRefresh();
    } catch (err) {
      console.error("Order placement failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to place order";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-3 sm:p-5 rounded-xl">
      <Tabs
        value={activeTab}
        onValueChange={(value: string) =>
          setActiveTab(value as "long" | "short")
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 rounded-xl h-12">
          <TabsTrigger className="rounded-xl text-sm sm:text-base" value="long">
            Long
          </TabsTrigger>
          <TabsTrigger
            className="rounded-xl text-sm sm:text-base"
            value="short"
          >
            Short
          </TabsTrigger>
        </TabsList>
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm mb-1">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-muted-foreground flex items-center gap-1">
                Balance:{" "}
                {isLoadingBalance ? (
                  <RefreshCcw className="w-3 h-3 animate-spin" />
                ) : (
                  <span className="font-medium">${balance}</span>
                )}
              </span>
            </div>
            <div className="flex space-x-2 relative">
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded-xl text-sm sm:text-base h-10 sm:h-12 px-3 sm:px-4 touch-manipulation"
                min="0"
                step="0.01"
                aria-label="Enter amount"
              />
              <Button
                className="rounded-xl h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap"
                variant="outline"
                onClick={() => setAmount(balance)}
                disabled={isLoadingBalance}
              >
                Max
              </Button>
            </div>
          </div>
          {error && (
            <p
              className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-2 sm:mt-4">
            {[25, 50, 75, 100].map((percent) => (
              <Button
                key={percent}
                variant="outline"
                size="sm"
                onClick={() =>
                  setAmount((Number(balance) * (percent / 100)).toFixed(2))
                }
                className="text-xs sm:text-sm rounded-xl h-8 sm:h-10 px-1 sm:px-2"
                disabled={isLoadingBalance}
                aria-label={`Set amount to ${percent}% of balance`}
              >
                {percent}%
              </Button>
            ))}
          </div>
          <Button
            className={`w-full h-12 text-sm sm:text-base font-medium ${
              activeTab === "long"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } rounded-xl mt-2 sm:mt-4`}
            disabled={loading || isLoadingBalance}
            onClick={handlePlaceOrder}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                Processing...
              </div>
            ) : (
              `Place ${activeTab === "long" ? "Long" : "Short"}`
            )}
          </Button>
        </div>
      </Tabs>
    </Card>
  );
}
