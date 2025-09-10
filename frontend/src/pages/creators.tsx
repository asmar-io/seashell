import { SubscriptionsTab } from "@/components/dashboard";
import { Header } from "@/components/header";
import BaseLayout from "@/components/BaseLayout";

const Creators = () => {

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 md:px-6">
        <BaseLayout>
          <div className="flex min-h-screen flex-col">
            <SubscriptionsTab />
          </div>
        </BaseLayout>
      </main>
    </div>
  );
};

export { Creators };
