"use client";

import * as React from "react";
import { Card } from "../components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUpIcon as Trending,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";
import { useMediaQuery } from "../hooks/use-media-query";

import { useKOLData } from "../hooks/useKOLData";
import KOLCard from "./KOLCard";

export default function TrendingCarousel() {
  const [page, setPage] = React.useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const itemsPerPage = isDesktop ? 3 : 1;
  const controls = useAnimation();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { kols: allKols, loading } = useKOLData({
    timeFilter: "24h",
    topN: 10,
  });

  // Sort KOLs by volume and take top 4
  const kols = React.useMemo(() => {
    if (!allKols) return [];
    return [...allKols]
      .sort((a, b) => {
        const volumeA = Number(a.volume.replace(/[^0-9.]/g, ""));
        const volumeB = Number(b.volume.replace(/[^0-9.]/g, ""));
        return volumeB - volumeA;
      })
      .slice(0, 4);
  }, [allKols]);
  
  // Memoize derived values to prevent recalculation on each render
  const totalPages = React.useMemo(() => {
    return Math.ceil((kols?.length || 0) / itemsPerPage);
  }, [kols, itemsPerPage]);

  // Define navigation functions first to avoid circular dependencies
  const getPageWidth = () => containerRef.current?.offsetWidth || 0;
  
  const goToPage = React.useCallback((newPage: number) => {
    setPage(newPage);
    if (containerRef.current) {
      const pageWidth = getPageWidth();
      controls.start({
        x: -newPage * pageWidth,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      });
    }
  }, [controls]);

  // Memoize the wheel handler to prevent recreating on each render
  const handleWheel = React.useCallback((e: WheelEvent) => {
    if (containerRef.current) {
      // Prioritize horizontal scrolling (deltaX) over vertical (deltaY)
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const sensitivity = 1.5; // Increase scroll sensitivity

      const newScrollLeft =
        containerRef.current.scrollLeft + delta * sensitivity;
      containerRef.current.scrollLeft = newScrollLeft;

      // Smooth page snapping
      const pageWidth = getPageWidth();
      const currentPage = Math.round(newScrollLeft / pageWidth);
      if (
        currentPage !== page &&
        currentPage >= 0 &&
        currentPage < totalPages
      ) {
        goToPage(currentPage);
      }

      // Prevent vertical scrolling when horizontal scroll is intended
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaX) {
        e.preventDefault();
      }
    }
  }, [page, totalPages, goToPage]);

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
  }, [handleWheel]);

  // Navigation functions using goToPage
  const nextPage = React.useCallback(() => {
    const newPage = (page + 1) % totalPages;
    goToPage(newPage);
  }, [page, totalPages, goToPage]);

  const prevPage = React.useCallback(() => {
    const newPage = (page - 1 + totalPages) % totalPages;
    goToPage(newPage);
  }, [page, totalPages, goToPage]);

  // Memoize drag handler to prevent recreation on each render
  const handleDragEnd = React.useCallback((event: any, info: any) => {
    if (!containerRef.current) return;
    
    const pageWidth = getPageWidth();
    const threshold = pageWidth / 4;
    const dragDistance = info.offset.x;
    const dragVelocity = info.velocity.x;

    if (Math.abs(dragVelocity) > 500 || Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0 || dragVelocity > 500) {
        prevPage();
      } else if (dragDistance < 0 || dragVelocity < -500) {
        nextPage();
      }
    } else {
      controls.start({ x: -page * pageWidth });
    }
  }, [page, controls, prevPage, nextPage]);



  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const pageWidth = getPageWidth();
        controls.set({ x: -page * pageWidth });
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
          <h2 className="text-lg font-semibold">Most Traded</h2>
        </div>
        <div className="flex items-center gap-4 sm:ml-auto">
          <div className="flex space-x-2"></div>
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
          dragConstraints={{ left: -getPageWidth() * (totalPages - 1), right: 0 }}
          dragElastic={0.1}
          dragMomentum={true}
          onDragEnd={handleDragEnd}
          animate={controls}
          className="flex gap-4 scroll-smooth will-change-transform"
          style={{ touchAction: "pan-y" }}
        >
          {loading ? (
            <div className="flex gap-4">
              {Array(itemsPerPage)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0"
                    style={{
                      width: isDesktop ? `${100 / 3}%` : "calc(100% - 2rem)",
                    }}
                  >
                    <Card className="p-4 animate-pulse bg-background/50 backdrop-blur-sm rounded-xl">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gray-600" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-600 rounded w-3/4" />
                          <div className="h-3 bg-gray-600 rounded w-1/2" />
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
            </div>
          ) : (
            kols?.map((kol) => (
              <div
                key={kol.user_id}
                className="flex-shrink-0"
                style={{
                  width: isDesktop ? `${100 / 3}%` : "calc(100% - 2rem)",
                }}
              >
                <KOLCard {...kol} kolId={kol.user_id} />
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
