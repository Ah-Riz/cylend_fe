import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingSolution from "@/components/landing/LandingSolution";
import LandingArchitecture from "@/components/landing/LandingArchitecture";
import LandingPersonas from "@/components/landing/LandingPersonas";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingFooter from "@/components/landing/LandingFooter";
import { Web3Background } from "@/components/animations/Web3Background";
import { DataRain } from "@/components/animations/DataRain";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Web3 Background Animations */}
      <Web3Background />
      <DataRain />
      
      {/* Main Content */}
      <div className="relative z-10">
        <LandingNav />
        <LandingHero />
        <LandingProblem />
        <LandingSolution />
        <LandingArchitecture />
        <LandingPersonas />
        <LandingFAQ />
        <LandingFooter />
      </div>
    </div>
  );
}
