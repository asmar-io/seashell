import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import {
  Header,
  MarketplaceTab,
  MyNFTsTab,
  MintTab,
  SubscriptionsTab
} from "@/components/dashboard";
import { useAccounts } from "@mysten/dapp-kit";
import { Navigate } from "react-router";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [isLoading, setIsLoading] = useState(true);


  const accounts = useAccounts();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);



  if (accounts.length === 0) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="marketplace" className="mt-0">
            <MarketplaceTab
              nfts={[]}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-0">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="my-nfts" className="mt-0">
            <MyNFTsTab nfts={[]} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="mint" className="mt-0">
            <MintTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
