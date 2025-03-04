import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface CreatorRevenueProps {
  revenue: string;
  isLoading: boolean;
}

export default function CreatorRevenue({
  revenue,
  isLoading,
}: CreatorRevenueProps) {
  return (
    <Card className="overflow-hidden rounded-xl relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 animate-gradient-slow"></div>

      {/* Sparkle effects */}
      <div className="absolute top-3 right-8 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-glow"></div>
      <div
        className="absolute top-12 right-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse-glow"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute bottom-6 right-10 w-1 h-1 bg-pink-400 rounded-full animate-pulse-glow"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-10 left-8 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      ></div>

      {/* Hover effect border */}
      <div className="absolute inset-0 border border-transparent group-hover:border-purple-500/50 rounded-xl transition-colors duration-300"></div>

      <div className="relative p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1.5 rounded-lg shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
              <DollarSign className="w-4 h-4 text-white animate-float" />
            </div>
            <h3 className="font-bold text-sm sm:text-base bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-transparent bg-clip-text">
              KOL Feeshare
            </h3>
          </div>
          <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse-glow" />
            <span className="text-xs text-amber-200">Accruing</span>
          </div>
        </div>

        <div className="mt-2 sm:mt-3">
          {isLoading ? (
            <div className="flex items-center gap-2 h-10">
              <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <span className="text-muted-foreground text-sm">
                Loading revenue data...
              </span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-end gap-1">
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-transparent bg-clip-text group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-orange-400 transition-all duration-300">
                  ${revenue}
                </span>
                <div className="flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-md mb-1.5">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] text-green-500 font-medium">
                    Earning
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Revenue accrued from market activity
              </p>
            </motion.div>
          )}
        </div>

        <div className="mt-3 sm:mt-4">
          <div className="h-2 bg-background/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 relative"
              initial={{ width: "0%" }}
              animate={{
                width: `${Math.min(Number(revenue) / 10, 100)}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <div
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-gradient-slow"
                style={{ backgroundSize: "200% 100%" }}
              ></div>
            </motion.div>
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>0</span>
            <span className="flex items-center gap-1">
              <span>Growing with market activity</span>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  repeatDelay: 1,
                }}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
              </motion.div>
            </span>
          </div>
        </div>

        {/* New tooltip section */}
        <div className="mt-3 pt-3 border-t border-border/50 text-[10px] sm:text-xs text-muted-foreground flex items-center justify-between">
          <span>50% of all trading fees</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] sm:text-xs px-2 hover:bg-purple-500/10 hover:text-purple-400"
          >
            Learn more
          </Button>
        </div>
      </div>
    </Card>
  );
}
