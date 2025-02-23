"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUpIcon as Trending,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";
import { useMediaQuery } from "../hooks/use-media-query";

interface TrendingItem {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  change: number;
  volume: string;
  participants: number;
}

const mockTrending: TrendingItem[] = [
  {
    id: 1,
    name: "aixbt",
    handle: "@aixbt_agent",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    change: 12.5,
    volume: "$24.5K",
    participants: 156,
  },
  {
    id: 2,
    name: "vitalik.eth",
    handle: "@VitalikButerin",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    change: 8.2,
    volume: "$18.2K",
    participants: 89,
  },
  {
    id: 3,
    name: "mert",
    handle: "@mert_eth",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    change: -5.3,
    volume: "$12.1K",
    participants: 67,
  },
  {
    id: 4,
    name: "nobi.eth",
    handle: "@nobi",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    change: -5.3,
    volume: "$12.1K",
    participants: 67,
  },
];

export default function TrendingCarousel() {
  const [page, setPage] = React.useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const itemsPerPage = isDesktop ? 3 : 1;
  const controls = useAnimation();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(mockTrending.length / itemsPerPage);
  const pageWidth = containerRef.current?.offsetWidth || 0;

  // Handle horizontal scroll with trackpad
  const handleWheel = (e: WheelEvent) => {
    if (containerRef.current) {
      // Prioritize horizontal scrolling (deltaX) over vertical (deltaY)
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const sensitivity = 1.5; // Increase scroll sensitivity

      const newScrollLeft =
        containerRef.current.scrollLeft + delta * sensitivity;
      containerRef.current.scrollLeft = newScrollLeft;

      // Smooth page snapping
      const currentPage = Math.round(newScrollLeft / pageWidth);
      if (
        currentPage !== page &&
        currentPage >= 0 &&
        currentPage < totalPages
      ) {
        setPage(currentPage);
        controls.start({
          x: -currentPage * pageWidth,
          transition: { type: "spring", stiffness: 300, damping: 30 },
        });
      }

      // Prevent vertical scrolling when horizontal scroll is intended
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaX) {
        e.preventDefault();
      }
    }
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [page, pageWidth, totalPages]);

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = pageWidth / 4;
    const dragDistance = info.offset.x;
    const dragVelocity = info.velocity.x;

    if (Math.abs(dragVelocity) > 500 || Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0 || dragVelocity > 500) {
        await prevPage();
      } else if (dragDistance < 0 || dragVelocity < -500) {
        await nextPage();
      }
    } else {
      controls.start({ x: -page * pageWidth });
    }
  };

  const nextPage = async () => {
    const newPage = (page + 1) % totalPages;
    setPage(newPage);
    await controls.start({ x: -newPage * pageWidth });
  };

  const prevPage = async () => {
    const newPage = (page - 1 + totalPages) % totalPages;
    setPage(newPage);
    await controls.start({ x: -newPage * pageWidth });
  };

  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        controls.set({ x: -page * containerRef.current.offsetWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [controls, page]);

  return (
    <div className="relative px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Trending className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold">Trending Now</h2>
        </div>
        <div className="flex items-center gap-4 sm:ml-auto">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevPage}
              className="h-8 w-8 sm:h-9 sm:w-9 bg-background/80 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextPage}
              className="h-8 w-8 sm:h-9 sm:w-9 bg-background/80 backdrop-blur-sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-1 sm:hidden">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === page ? "bg-green-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <div
        className="overflow-hidden touch-pan-y select-none"
        ref={containerRef}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: -pageWidth * (totalPages - 1), right: 0 }}
          dragElastic={0.1}
          dragMomentum={true}
          onDragEnd={handleDragEnd}
          animate={controls}
          className="flex gap-4 scroll-smooth will-change-transform"
          style={{ touchAction: "pan-y" }}
        >
          {mockTrending.map((item) => (
            <Card
              key={item.id}
              className="p-4 hover:border-green-500/50 transition-all cursor-pointer rounded-xl flex-shrink-0 bg-background/50 backdrop-blur-sm hover:bg-background/70"
              style={{ width: isDesktop ? `${100 / 3}%` : "calc(100% - 2rem)" }}
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <img
                  src={item.avatar || "/placeholder.svg"}
                  alt=""
                  className="w-10 h-10 rounded-full ring-2 ring-green-500/20"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.handle}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium whitespace-nowrap ${
                        item.change >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {item.change >= 0 ? "+" : ""}
                      {item.change}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span className="truncate">Vol: {item.volume}</span>
                    <span className="whitespace-nowrap">
                      {item.participants} traders
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
