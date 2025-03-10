import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const HowItWorksModal = () => {
  const sections = [
    {
      title: "Network Information",
      content: [
        "Currently live on Base Sepolia Testnet",
        "Ensure your wallet is connected to Base Sepolia",
        "Get test USDC from our faucet to start trading",
        "Experience gasless trading with Base's low fees",
      ],
      icon: "⛓️",
    },
    {
      title: "Getting Started",
      content: [
        "Connect your wallet using MetaMask or other supported wallets",
        "Deposit USDC to start trading (minimum 1 USDC)",
        "Your deposited funds will appear in your in-house balance",
        "You can withdraw your funds back to your wallet anytime",
      ],
      icon: "🚀",
    },
    {
      title: "Understanding Markets",
      content: [
        "Browse the top 100 KOL (Key Opinion Leader) markets",
        "Each KOL has a 72-hour market cycle",
        "Markets track KOL mindshare - their social influence and engagement",
        "Real-time data updates every hour via Kaito API",
      ],
      icon: "📊",
    },
    {
      title: "Creating Orders",
      content: [
        "Select a KOL market from the Rankings page",
        "Choose Long (bullish) or Short (bearish) position",
        "Enter your position size in USDC (min 1 USDC)",
        "Confirm transaction to open your position",
        "Track your positions in real-time on the Positions page",
      ],
      icon: "📈",
    },
    {
      title: "Managing Your Portfolio",
      content: [
        "Monitor your open positions and PnL in real-time",
        "Close positions anytime before market reset",
        "View your trading history in your Profile",
        "Track your total portfolio value and performance",
      ],
      icon: "💼",
    },
    {
      title: "Platform Mechanics",
      content: [
        "All trades are in USDC stablecoin",
        "0.3% trading fee on position size",
        "50% of fees go to the KOL, 50% to platform",
        "Positions auto-close at market reset (every 72 hours)",
        "Profits/losses are settled in USDC to your in-house balance",
      ],
      icon: "⚙️",
    },
    {
      title: "Tips for Success",
      content: [
        "Research KOLs before trading their markets",
        "Start with smaller positions to learn the platform",
        "Monitor market cycles to time your entries/exits",
        "Diversify across multiple KOL markets",
        "Use the Analytics page to spot trends",
      ],
      icon: "💡",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.2,
      rotate: [0, -10, 10, -10, 0],
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 200,
      },
    },
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="font-medium">
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              Welcome to YAP - Your Guide to Trading KOL Markets
            </motion.div>
          </DialogTitle>
        </DialogHeader>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 py-4"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-secondary/10 rounded-lg p-6 border border-secondary/20 backdrop-blur-sm hover:bg-secondary/20 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <motion.span
                  variants={iconVariants}
                  whileHover="hover"
                  className="text-3xl cursor-pointer"
                >
                  {section.icon}
                </motion.span>
                <h3 className="text-xl font-semibold text-primary">
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-3 ml-4">
                {section.content.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + i * 0.05 }}
                    className="flex items-start gap-3 group"
                  >
                    <motion.span
                      className="w-2 h-2 bg-primary rounded-full mt-2 group-hover:scale-150"
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
