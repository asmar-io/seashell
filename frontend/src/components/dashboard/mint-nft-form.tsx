import React, { useEffect, useState } from "react";
import { FileUpload } from "../ui/file-upload";
import { Button } from "../ui/button";
import { usePixelRemover } from "@/hooks/use-pixel-remover";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import {
  creatorRegistry,
  packageId,
  module,
  creatorAddContentFunction,
} from "@/lib/sample-data";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SealClient,  } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import axios from "axios";

export function mintNFT() {}


const MintNFTForm = () => {
  const [description, setDescription] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState("");
  const currentAccount = useCurrentAccount();
  const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
  const serverObjectIds = [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
  ];

  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  // @ts-ignore
  const { client, network } = useSuiClientContext();

  const sealnewclient = new SealClient({
    //@ts-ignore
    suiClient: client,
    serverConfigs: serverObjectIds.map((id) => ({ objectId: id, weight: 1 })),
    verifyKeyServers: false,
  });

  const tx = new Transaction();

  async function encryption(
    data: Uint8Array,
    creator_address: string
  ): Promise<any> {
    const nonce = Uint8Array.from([1, 2, 3, 4, 5]);
    // can select a random nonce
    const allowlistidbytes = fromHex(creator_address);
    const encryptionid = toHex(new Uint8Array([...allowlistidbytes, ...nonce]));
    //const fileData = toUint8array(data)

    const { encryptedObject: encryptedBytes } = await sealnewclient.encrypt({
      threshold: 2,
      packageId: packageId,
      id: encryptionid,
      data: data,
    });
    console.log("Encryption ID:", encryptionid);
    console.log("Encrypted Bytes:", encryptedBytes);
    return encryptedBytes;
  }

  async function finalpublish() {
    if (isMinting) return; // Prevent multiple simultaneous minting attempts

    setIsMinting(true);
    setMintingStep("Starting minting process...");

    try {
      setMintingStep("Preparing metadata and encrypting data...");
      const buffer = await image?.arrayBuffer();
      let arrayBuffer = new Uint8Array(buffer ?? []);
      const encryptedImage = await encryption(
        arrayBuffer,
        currentAccount?.address ?? ""
      );

      setMintingStep("Uploading to Walrus storage...");
      const url = `${PUBLISHER}/v1/blobs?epochs=1`;
      const fileBuffer = new Blob([encryptedImage]);
      const response = await axios({
        method: "put",
        url: url,
        data: fileBuffer,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
      // this should be our blob id
      const blobId = response.data.newlyCreated.blobObject.blobId;
      console.log("blobId", blobId);

      setMintingStep("Linking content to creator...");
      tx.moveCall({
        target: `${packageId}::${module}::${creatorAddContentFunction}`,
        arguments: [
          tx.object(creatorRegistry),
          tx.pure.string(blobId.toString()),
        ],
      });
      const result = await signAndExecuteTransaction({
        transaction: tx,
        chain: "sui:testnet",
      });
      console.log("Transaction executed with digest:", result.digest);

      setMintingStep("Content created successfully!");

      toast.success("Content Created!", {
        description: `Transaction Completed Successfully`,
        action: {
          label: "SuiScan",
          onClick: () =>
            window.open(
              `https://suiscan.xyz/testnet/tx/${result.digest}`,
              "_blank"
            ),
        },
        duration: 4000,
        position: "top-right",
      });

    } catch (error) {
      console.error("Minting failed:", error);
      toast.error("Failed to mint NFT", {
        description: "Please try again",
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setIsMinting(false);
      setMintingStep("");
    }
  }

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    canvasRef,
    outputSrc,
  } = usePixelRemover();

  useEffect(() => {
    setImagePreview(outputSrc);
  }, [outputSrc]);

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setImage(files[0]);
      setImagePreview(URL.createObjectURL(files[0]));
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    finalpublish();
  };

  return (
    <div className="relative">
      {/* Overlay during minting */}
      {isMinting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
          <div className="bg-card border border-border p-6 rounded-lg shadow-lg text-center max-w-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Saving Your Content
            </h3>
            <p className="text-sm text-muted-foreground">{mintingStep}</p>
          </div>
        </div>
      )}

      <form
        className="max-w-3xl mx-auto space-y-6 p-6 bg-muted/50 mb-10 border rounded-xl"
        onSubmit={handlePublish}
      >
        <div>
          <Label className="block font-medium mb-1">Description</Label>
          <Textarea
            className="w-full border rounded px-3 py-2 bg-muted"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isMinting}
          />
        </div>
        <div>
          <Label className="block font-medium mb-1">Upload Image</Label>
          <FileUpload accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <Label className="block font-medium mb-1">Image Preview</Label>
          <div className="w-full h-48 border rounded flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} className="hidden" />
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="object-contain w-full h-full"
              />
            ) : (
              <span className="text-muted-foreground">No image selected</span>
            )}
          </div>
        </div>
        {isMinting && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <div>
                <p className="font-medium text-foreground">Minting NFT...</p>
                <p className="text-sm text-muted-foreground">{mintingStep}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-4"
          disabled={!image || isMinting}
        >
          {isMinting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Minting...</span>
            </div>
          ) : (
            "Final Publish"
          )}
        </Button>
      </form>
    </div>
  );
};

export { MintNFTForm };
