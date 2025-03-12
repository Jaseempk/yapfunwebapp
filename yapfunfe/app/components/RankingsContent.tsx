"use client";

import { useState, useEffect } from "react";
import { useTradeVolume } from "../hooks/useTradeVolume";
import TimeFilter from "./TimeFilter";
import KOLCard from "./KOLCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useKOLData, KOLData } from "../hooks/useKOLData";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Loading skeleton component
function KOLCardSkeleton() {
  return (
    <div className="h-full">
      <div className="p-3 sm:p-4 space-y-4 bg-background/50 backdrop-blur-sm rounded-xl">
        <div className="flex items-start space-x-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-right">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      </div>
    </div>
  );
}

interface RankingsContentProps {
  searchQuery?: string;
}

export default function RankingsContent({
  searchQuery = "",
}: RankingsContentProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [currentPage, setCurrentPage] = useState(1);
  const { kols, loading, error } = useKOLData({ timeFilter: timeRange });
  const itemsPerPage = 25; // 25 KOLs per page
  const totalPages = 4; // 4 pages total

  const filteredKols = kols.filter((kol) =>
    kol.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentKols = filteredKols.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of rankings when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading KOL data. Please try again later.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold">Top Influencers</h2>
          <TimeFilter active={timeRange} onChange={setTimeRange} />
        </div>

        <Tabs defaultValue="mindshare" className="w-full">
          <TabsList className="w-full sm:w-auto flex justify-between sm:justify-start overflow-x-auto rounded-xl bg-background/50 backdrop-blur-sm">
            <TabsTrigger
              value="mindshare"
              className="flex-1 sm:flex-none rounded-xl"
            >
              Mindshare
            </TabsTrigger>
            <TabsTrigger
              value="volume"
              className="flex-1 sm:flex-none rounded-xl"
            >
              Volume
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="flex-1 sm:flex-none rounded-xl"
            >
              Engagement
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="mindshare"
            className="mt-3 focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 kol-grid">
              {/* Special styling for the last KOL card on large screens */}
              <style jsx global>{`
                @media (min-width: 1024px) {
                  .kol-grid > :last-child:nth-child(3n-1) {
                    grid-column: 2;
                  }
                }
              `}</style>
              {loading
                ? // Show 6 skeleton cards while loading
                  Array(6)
                    .fill(0)
                    .map((_, i) => <KOLCardSkeleton key={i} />)
                : // Show paginated KOLs
                  currentKols.map((kol: KOLData) => (
                    <KOLCard
                      key={kol.user_id}
                      {...kol}
                      kolId={kol.user_id}
                      isTop={kol.rank <= 3}
                    />
                  ))}
            </div>
            
            {/* Pagination Controls */}
            {!loading && filteredKols.length > 0 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={prevPage} 
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={nextPage} 
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="volume"
            className="mt-3 focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 kol-grid">
              {/* Special styling for the last KOL card on large screens */}
              <style jsx global>{`
                @media (min-width: 1024px) {
                  .kol-grid > :last-child:nth-child(3n-1) {
                    grid-column: 2;
                  }
                }
              `}</style>
              {loading
                ? Array(6)
                    .fill(0)
                    .map((_, i) => <KOLCardSkeleton key={i} />)
                : // Sort KOLs by trade volume and paginate
                  [...filteredKols]
                    .sort((a, b) => {
                      const volumeA = Number(a.volume.replace(/[^0-9.]/g, ""));
                      const volumeB = Number(b.volume.replace(/[^0-9.]/g, ""));
                      return volumeB - volumeA;
                    })
                    .slice(indexOfFirstItem, indexOfLastItem)
                    .map((kol: KOLData) => (
                      <KOLCard
                        key={kol.user_id}
                        {...kol}
                        kolId={kol.user_id}
                        isTop={kol.rank <= 3}
                      />
                    ))}
            </div>
            
            {/* Pagination Controls */}
            {!loading && filteredKols.length > 0 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={prevPage} 
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={nextPage} 
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="engagement"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="text-center py-4 text-muted-foreground">
              Engagement metrics coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
