import Hero from '../components/home/Hero'
import MarqueeBand from '../components/layout/MarqueeBand'
import MissionSection from '../components/home/MissionSection'
import FeaturedShow from '../components/home/FeaturedShow'
import Testimonials from '../components/home/Testimonials'
import JoinCTA from '../components/home/JoinCTA'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Home() {
  useDocumentTitle(
    'Glory Theatre Productions — Movement. Story. Stage.',
    'Glory Theatre Productions — A Christian youth creative collective proclaiming CHRIST through drama, choreography, and spoken word.'
  )
  useScrollReveal()

  return (
    <>
      <Hero />
      <MarqueeBand />
      <MissionSection />
      <FeaturedShow />
      <Testimonials />
      <JoinCTA />
    </>
  )
}
