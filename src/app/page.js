import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
