import {
  useCurrentAccount,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { NFTCard } from "@/components/dashboard/nft-card";
import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "../ui/skeleton";
import { useNavigate } from "react-router"; // changed code
import { packageId } from "@/lib/sample-data";

const SubscriptionsGrid = () => {
  const { client, } = useSuiClientContext();
  const navigate = useNavigate(); // changed code
  const currentaddress = useCurrentAccount();
  const currentAccount = useCurrentAccount();
  const [marketplaceNfts, setMarketplaceNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);


  async function fetchBlobs(nft: any): Promise<string[]> {
    let objects_ids: string[] = [];
    const blobs = await client.getDynamicFields({
      parentId: nft.creator,
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

  async function fetchSubscriptions() {
    const ownedobjects = await client.getOwnedObjects({
      owner: currentAccount?.address ?? "",
      options: {
        showContent: true,
        showType: true,
      },
      filter: { StructType: `${packageId}::subscription::Subscription` },
    });

    return ownedobjects?.data;
  }

  async function decode(blobId: string): Promise<any> {
    const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
    const retrieveurl = `${AGGREGATOR}/v1/blobs/${blobId}`;
    const response = await axios({
      method: 'get',
      url: retrieveurl,
      responseType: 'arraybuffer'
    });
    const decodedPayload = new Blob([response.data], { type: 'image/png' });
    
    return URL.createObjectURL(decodedPayload);
  }
  
  async function handleNFTClick(nft: any) {
    console.log("NFT clicked:", nft);
    /*try {
        const blobIds = await fetchBlobs(nft);
        blobIds.map(async (ofield: any) => {
          let blobId = ofield.data.content.fields.name;
          //let imgUrl = await decode(blobId);
        });
    } catch (e) {
        console.error("Error loading NFTs:", e);
    }*/
    const targetId = encodeURIComponent(nft.creator);
    if (!targetId) return;
    navigate(`/shell/${targetId}`);
  }

  useEffect(() => {
    async function loadNfts() {
      setLoading(true);
      try {
        const blobIds = await fetchSubscriptions();
        const decodedNfts: any[] = [];
        blobIds.map((ofield: any, i) => {
          decodedNfts.push({
            id: String(i),
            objectId: ofield.data.objectId,
            name: ofield.data.content.fields.creator_name,
            creator: ofield.data.content.fields.creator_id,
            metadata: {
              description: ofield.data.content.fields.creator_description,
              price: ofield.data.content.fields.subscription_fee,
              created_at: ofield.data.content.fields.created_at,
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

   if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {marketplaceNfts.map((nft, index) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onClick={() => handleNFTClick(nft)}
              delay={index * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </>
  );
};

export { SubscriptionsGrid };
