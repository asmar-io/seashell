import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {MarketplaceTab,MintTab,SubscriptionsTab,} from "@/components/dashboard";
import { useAccounts } from "@mysten/dapp-kit";
import { Navigate } from "react-router";
import { Header } from "@/components/header";
import BaseLayout from "@/components/BaseLayout";

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
      <Header />
      <main className="px-4 md:px-6">
        <BaseLayout>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="marketplace" className="mt-0">
              <MarketplaceTab nfts={[]} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="creators" className="mt-0">
              <SubscriptionsTab />
            </TabsContent>

            <TabsContent value="postcontent" className="mt-0">
              <MintTab />
            </TabsContent>
          </Tabs>
        </BaseLayout>
      </main>
    </div>
  );
}
