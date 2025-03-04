import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const HowItWorksModal = () => {
  const sections = [
    {
      title: "Market Creation & Lifecycle",
      content: [
        "Markets are created for top 100 KOLs",
        "Each market runs for 72 hours (3 days)",
        "After cycle end, positions are closed and markets reset",
      ],
      icon: "🔄",
    },
    {
      title: "Trading Mechanism",
      content: [
        "Take long/short positions on KOL mindshare",
        "Mindshare updates hourly from Kaito API",
        "Profit from correct predictions of mindshare movement",
      ],
      icon: "📈",
    },
    {
      title: "Fee Structure",
      content: [
        "Trading fees are split between platform and KOLs",
        "KOLs earn 50% of fees from their market",
        "Fees are collected and distributed automatically",
      ],
      icon: "💰",
    },
    {
      title: "Position Management",
      content: [
        "Open positions with specified quantity",
        "Monitor PnL in real-time",
        "Close positions before market reset",
      ],
      icon: "⚖️",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="font-medium">
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-6">
            How YAP Works
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8 py-4">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-card rounded-lg p-6 shadow-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl">{section.icon}</span>
                <h3 className="text-xl font-semibold">{section.title}</h3>
              </div>
              <ul className="space-y-2 ml-4">
                {section.content.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
