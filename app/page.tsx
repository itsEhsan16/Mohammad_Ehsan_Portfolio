import { HomeStage } from "@/components/home/HomeStage";
import { StageFallback } from "@/components/home/StageFallback";
import { StageIndex } from "@/components/home/StageIndex";
import { heroFigure } from "@/lib/media";

export default function Home() {
  const figure = heroFigure();
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <HomeStage figure={figure} fallback={<StageFallback still={figure.still} />} index={<StageIndex />} />
    </main>
  );
}
