import { HeroSection } from "@/components/dashboard/hero-section";
import { NFTGrid } from "@/components/dashboard/nft-grid";
import { usePixelRemover } from "@/hooks/use-pixel-remover";
import { useSuiClientContext } from "@mysten/dapp-kit";
import axios from "axios";
//import { console } from "inspector";
import React, { useEffect, useState } from "react";
import { creatorRegistry } from "@/lib/sample-data";


//@ts-ignore
export function MarketplaceTab({ nfts, isLoading }: MarketplaceTabProps) {
  const { client, network } = useSuiClientContext();

  const [marketplaceNfts, setMarketplaceNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function fetchBlobs(): Promise<string[]> {
    let objects_ids: string[] = [];
    const blobs = await client.getDynamicFields({
      parentId: creatorRegistry,
    })
    blobs?.data?.forEach((field) => {
      objects_ids.push(field.objectId);
    });
    const objects = await client.multiGetObjects({
      ids: objects_ids,
      options: { showContent: true, showType: true },
    });
    //@ts-ignore
    console.log('fetching blobs from marketplace', objects);
    //@ts-ignore
    return objects || [];
  }
  // this will now 
  async function decoding(blobId: string): Promise<any> {
    const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
    const retrieveurl = `${AGGREGATOR}/v1/blobs/${blobId}`;
    const response2 = await axios({
      method: 'get',
      url: retrieveurl,
      responseType: 'arraybuffer'
    });

    console.log("Retrieved data:", response2.data);
    // Step 1: Convert ArrayBuffer to string
    const decoder = new TextDecoder("utf-8");
    const jsonString = decoder.decode(new Uint8Array(response2.data));

    // Step 2: Parse JSON
    const decodedPayload = JSON.parse(jsonString);
    return decodedPayload;
  }

  useEffect(() => {
    async function loadNfts() {
      setLoading(true);
      try {
        const blobIds = await fetchBlobs();
        const decodedNfts: any[] = [];
        blobIds.map((ofield: any,i) => {
           decodedNfts.push({
              id: String(i),
              objectId: ofield.data.objectId,
              name: ofield.data.content.fields.creator_name,
              creator: ofield.data.content.fields.owner,
              metadata: {
                description: ofield.data.content.fields.creator_description,
                price: ofield.data.content.fields.subscription_fee,
              },
              merkleroot: "",
              image: ofield.data.content.fields.creator_image_url,
              isObfuscated: "true",
            });
        });
        console.log("Decoded NFTs:", decodedNfts);
        setMarketplaceNfts(decodedNfts);
      } catch (e) {
        console.error("Error loading NFTs:", e);
        setMarketplaceNfts([]);
      }
      setLoading(false);
    }
    loadNfts();
  }, []);

  return (
    <>
      <HeroSection
        badge="Creators"
        title="Buy a creator pass and enjoy the content"
        description="Explore a curated collection of encrypted digital assets."
      />
      <div className="container mx-auto px-4 md:px-6 pb-12">
        <NFTGrid
          nfts={marketplaceNfts}
          isLoading={loading}
          isMarketplace={true}
        />


      </div>

    </>
  );
}