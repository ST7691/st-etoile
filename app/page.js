import ChefStory from "@/components/home/ChefStory";
import DiningExperience from "@/components/home/DiningExperience";
import Hero from "@/components/Hero";
import SignatureDishes from "@/components/home/SignatureDishes";
import FeaturedMenu from "@/components/home/FeaturedMenu";
import Testimonials from "@/components/home/Testimonials";
import ReservationCTA from "@/components/home/ReservationCTA";
export default function Home() {
  return (
    <main>
      <Hero />

      <SignatureDishes />
      <ChefStory />
      <DiningExperience />
      <FeaturedMenu />
      <Testimonials />
      <ReservationCTA />
    </main>
  );
}
