"use client";

import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load components
const TrendingCarousel = lazy(() => import("./components/TrendingCarousel"));
const RankingsContent = lazy(() => import("./components/RankingsContent"));
const NewKOLDeployments = lazy(() => import("./components/NewKOLDeployments"));
const CycleStatusDisplay = lazy(
  () => import("./components/CycleStatusDisplay")
);

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
  return (
    <main className="container mx-auto px-4 py-6 space-y-8">
      <div className="max-w-md mx-auto mb-6">
        <Suspense
          fallback={
            <div className="h-24 bg-background/50 backdrop-blur-sm rounded-xl animate-pulse" />
          }
        >
          <CycleStatusDisplay />
        </Suspense>
      </div>

      <Suspense fallback={<CarouselSkeleton />}>
        <TrendingCarousel />
      </Suspense>
      <Suspense fallback={<RankingsSkeleton />}>
        <RankingsContent />
      </Suspense>
    </main>
  );
}
