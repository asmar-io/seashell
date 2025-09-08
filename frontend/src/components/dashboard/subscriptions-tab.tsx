import { HeroSection, SubscriptionsGrid } from "@/components/dashboard";

export function SubscriptionsTab() {
  return (
    <>
      <HeroSection
        badge="Subscriptions"
        title="Creator Subscriptions"
        description="Active creator subscriptions."
      />
      <SubscriptionsGrid />
    </>
  );
}
