"use client";

import RankingsContent from "./components/RankingsContent";
import ParticleBackground from "./components/ParticleBackground";
import TrendingCarousel from "./components/TrendingCarousel";
import NewKOLDeployments from "./components/NewKOLDeployments";

export default function Home() {
  return (
    <>
      <ParticleBackground />
      <div className="relative z-10 py-2 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4">
          <div className="flex-1 bg-background/50 backdrop-blur-sm rounded-xl p-2 sm:p-4">
            <TrendingCarousel />
          </div>
          <div className="lg:w-[400px] bg-background/50 backdrop-blur-sm rounded-xl p-2 sm:p-4">
            <NewKOLDeployments />
          </div>
        </div>
        <div className="mt-2 sm:mt-4 bg-background/50 backdrop-blur-sm rounded-xl p-2 sm:p-4">
          <RankingsContent />
        </div>
      </div>
    </>
  );
}
