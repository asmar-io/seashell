import {
  Header,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  UseCasesSection,
  Footer,
  TechnologiesSection
} from "@/components/landing-page";

const HomePage = () => {
 

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <TechnologiesSection />
      </main>
      <Footer />
    </div>
  );
};

export { HomePage };
