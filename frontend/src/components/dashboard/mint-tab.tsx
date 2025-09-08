import { HeroSection, MintNFTForm } from "@/components/dashboard";

export function MintTab() {
  return (
    <>
      <HeroSection
        badge="Content"
        title="Create content"
        description="Create new content"
      />
      <MintNFTForm />
    </>
  );
}
