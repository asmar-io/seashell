import { useState } from "react"
import { NFTCard } from "@/components/dashboard/nft-card"
import { NFTDialog } from "@/components/dashboard/nft-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import type { NFT } from "@/lib/types"
import { useNavigate } from "react-router";

interface NFTGridProps {
  nfts: NFT[]
  isLoading?: boolean
  isMarketplace?: boolean
}

export function NFTGrid({ nfts, isLoading = false, isMarketplace = true }: NFTGridProps) {
  //@ts-ignore
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const navigate = useNavigate();


   async function handleNFTClick(nft: any) {
      console.log("NFT clicked:", nft);
      const targetId = encodeURIComponent(nft.creator);
      if (!targetId) return;
      navigate(`/shell/${targetId}`);
    }
  

  if (isLoading) {
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
          {nfts.map((nft, index) => (
            <NFTCard key={nft.id} nft={nft} onClick={() => handleNFTClick(nft)} delay={index * 0.1} />
          ))}
        </motion.div>
      </div>
      <NFTDialog nft={selectedNFT} open={dialogOpen} onOpenChange={setDialogOpen} isMarketplace={isMarketplace} />
    </>
  )
}
