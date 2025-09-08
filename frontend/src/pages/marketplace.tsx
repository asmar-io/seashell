import { MarketplaceTab } from "@/components/dashboard";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import BaseLayout from "@/components/BaseLayout";

const Marketplace = () => {
  const [isLoading, setIsLoading] = useState(true);

 
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 md:px-6">
        <BaseLayout>
          <div className="flex min-h-screen flex-col">
            <MarketplaceTab nfts={[]} isLoading={isLoading} />
          </div>
        </BaseLayout>
      </main>
    </div>
  );
};

export { Marketplace };
