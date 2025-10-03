import { HeroSection } from '@/components/sections/hero'
import { FeaturesSection } from '@/components/sections/features'
import { HowItWorksSection } from '@/components/sections/how-it-works'
import { StatsSection } from '@/components/sections/stats'

export default function Home() {
  return (
    <div className="space-y-24">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
    </div>
  )
}
