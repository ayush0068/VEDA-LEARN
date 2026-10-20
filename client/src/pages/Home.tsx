import CategorySection from '@/components/home/CategorySection';
import DiscoverSection from '@/components/home/DiscoverSection';
import Hero from '@/components/home/Hero';
import PopularCourses from '@/components/home/PopularCourses';
import RootsBanner from '@/components/home/RootsBanner';
import TrustBar from '@/components/home/TrustBar';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <DiscoverSection />
      <CategorySection />
      <PopularCourses />
      <RootsBanner />
    </>
  );
}