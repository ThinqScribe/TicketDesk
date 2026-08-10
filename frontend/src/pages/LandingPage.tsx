import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection /> 
      </main>
      <Footer />
    </div>
  )
}
