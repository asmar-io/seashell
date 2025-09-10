"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Lock } from "lucide-react"
import { useSignAndExecuteTransaction, } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { toast } from "sonner"
import { packageId, module, creatorRegistry } from "@/lib/sample-data"

// adding the buying address to the allowlist and this person can then decrypt the data and reconstruct the image .
export function NFTDialog({ nft, open, onOpenChange, isMarketplace = true }: any) {

  const tx2 = new Transaction();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  if (!nft) return null

  const completepayment = async  () => {
    // payment being completed 
    console.log("Initiating payment to escrow...",nft);
    const coin = tx2.splitCoins(tx2.gas, [nft.metadata.price])

    tx2.moveCall({
      target: `${packageId}::${module}::subscribe_to_creator`,
      arguments: [
        tx2.object(creatorRegistry),
        tx2.pure.id(nft.creator),
        coin,
        tx2.object.clock()
      ],
    })
    const val = await signAndExecuteTransaction({
      transaction: tx2,
      chain: 'sui:testnet'
    });
    console.log("payment transaction:", val.digest);
    toast.success("Payment to escrow successful!", {
      description: `Transaction digest: ${val.digest}`,
      duration: 4000,
      position: "top-right",
      action: {
        label: "SuiScan",
        onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${val.digest}`, '_blank')
      },
    });
    return val.digest;

  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{nft.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border">
               <img src={nft.image} alt={nft.name} className="object-cover" />
                  {nft.isObfuscated && (
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center gap-2 bg-background/90 rounded-full px-3 py-1">
                        <Lock className="h-3 w-3 text-primary" />
                        <span className="text-xs text-primary font-medium">Encrypted</span>
                      </div>
                    </div>
                  )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Price</span>
                {/* <Badge variant="secondary">{nft.rarity}</Badge> */}
              </div>
              <div className="text-3xl font-bold text-primary">{nft.metadata.price} SUI</div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{nft.metadata.description}</p>
            </div>
  

            {isMarketplace && (
              <div className="space-y-4">
             

                <div className="space-y-2">

                  <Button className='w-full' onClick={async () => await completepayment()}>Subscribe</Button>
                </div>

              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
