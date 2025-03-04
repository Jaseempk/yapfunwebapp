"use client";

import { Suspense, lazy, useState } from "react";
import { Loader2 } from "lucide-react";
import SearchBar from "./components/SearchBar";

// Lazy load components
const TrendingCarousel = lazy(() => import("./components/TrendingCarousel"));
const RankingsContent = lazy(() => import("./components/RankingsContent"));
const NewKOLDeployments = lazy(() => import("./components/NewKOLDeployments"));

// Loading fallbacks
const CarouselSkeleton = () => (
  <div className="w-full h-[200px] bg-background/50 backdrop-blur-sm rounded-xl animate-pulse" />
);

const RankingsSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="w-full h-24 bg-background/50 backdrop-blur-sm rounded-xl animate-pulse"
      />
    ))}
  </div>
);

const DeploymentsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="h-48 bg-background/50 backdrop-blur-sm rounded-xl animate-pulse"
      />
    ))}
  </div>
);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className="container mx-auto px-4 py-6 space-y-8">
      <Suspense fallback={<CarouselSkeleton />}>
        <TrendingCarousel />
      </Suspense>

      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full"
          />
        </div>
        <Suspense fallback={<RankingsSkeleton />}>
          <RankingsContent searchQuery={searchQuery} />
        </Suspense>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
          New KOL Deployments
        </h2>
        <Suspense fallback={<DeploymentsSkeleton />}>
          <NewKOLDeployments />
        </Suspense>
      </div>
    </main>
  );
}
