import React, { useEffect, useState } from "react";
import { FileUpload } from "../ui/file-upload";
import { Button } from "../ui/button";
import { useAuthStore, type AccountData } from "@/lib/auth-store";
import { usePixelRemover } from "@/hooks/use-pixel-remover";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { creatorRegistry,packageId,module,creatorAddContentFunction } from "@/lib/sample-data";

import {
  useAccounts,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { SuiClient, type SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { EnokiClient } from '@mysten/enoki';
import { SealClient, SessionKey, } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import axios, { all } from "axios";

export function mintNFT() { }

function toUint8array(val: string) {
  const encoder = new TextEncoder();
  const encodedbytes = encoder.encode(val);
  return encodedbytes;
}

const MintNFTForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [allowlistaddress, setAllowlistAddress] = useState("");
  const [newallowlistid, setNewAllowlistid] = useState("");
  const [newallowlistobject, setNewAllowlistObject] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState("");
  const currentAccount = useCurrentAccount();
  const accounts = useAccounts();
  const suiClient = new SuiClient({url: "https://fullnode.testnet.sui.io:443",});
  const packagid = '0x576ce6f9227b55f93844988881ecb53c74c8ffcbd5e7ecf6be8624d2ebd47f25';
  const allowlist_pckg_id = '0x87e99606517763f4ba82d618e89de5bd88063e49d0c75358bf2af392782f99fd';
  const id = '0x97fad43945130f277532b7891d47a81823d7990af6795b0ec4f9364c474eefda'
  const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
  const serverObjectIds = ["0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"];

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
  const tx2 = new Transaction();

  async function encryption(data: Uint8Array, creator_address: string): Promise<any> {
    const nonce = Uint8Array.from([1, 2, 3, 4, 5]);
    // can select a random nonce
    const allowlistidbytes = fromHex(creator_address);
    const encryptionid = toHex(new Uint8Array([...allowlistidbytes, ...nonce]))
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

  async function uploadtoblob(allowlistObjectId?: string, allowlistid?: string): Promise<any> {
    setMintingStep("Preparing metadata and encrypting data...");

    // Add name, description, and merkle root to the DecodedPayload
    // Encrypt the coordinates
    const coordsString = JSON.stringify(DecodedPayload.coords);
    const encryptedCoords = await encryption(coordsString, allowlistObjectId ?? "");  // Use allowlist object ID, not cap ID

    const payloadWithMetadata = {
      blocks: DecodedPayload.blocks,
      obfuscatedImage: obfuscatedImage,
      name: name,
      description: description,
      merkleRoot: merkleRoot,
      enccoords: encryptedCoords,
      url: uploadedImageUrl,
      addres: currentAccount?.address ?? "",
      price: price,
      allowlistObjectId: allowlistObjectId || null,
      allowlistid: allowlistid // Include the allowlist object ID
    };
    console.log("Payload with Metadata:", payloadWithMetadata.enccoords);
    console.log("Payload with Metadata:", payloadWithMetadata.obfuscatedImage);
    console.log("Allowlist Object ID:", allowlistObjectId);
    console.log("Allowlist ID:", allowlistid);

    setMintingStep("Uploading to Walrus storage...");
    const url = `${PUBLISHER}/v1/blobs?epochs=5`;
    const fileBuffer = new Blob([JSON.stringify(payloadWithMetadata)], { type: "application/json" });
    const response = await axios({
      method: 'put',
      url: url,
      data: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
    // this should be our blob id 
    const blobId = response.data.newlyCreated.blobObject.blobId;
    console.log("blobId", response.data.newlyCreated.blobObject.blobId);
    return blobId.toString();
  }

  // THis uploads the obfuscated image to the marketplace::store contract
  async function uploadtomarketplace(blob: string) {
    setMintingStep("Creating NFT on blockchain...");

    // Create a fresh transaction for NFT minting


    // const address = currentAccount?.address ?? "";
    tx.moveCall({
      arguments: [tx.pure.vector('u8', toUint8array(`${name}`)), tx.pure.vector('u8', toUint8array(`${description}`)), tx.pure.vector('u8', toUint8array(`${uploadedImageUrl}`)), tx.pure.vector('u8', toUint8array(`${merkleRoot}`))],
      target: `${packagid}::nft::mint_to_sender`,
    })
    tx.moveCall({
      target: `${packagid}::store::add_blob`,
      arguments: [tx.object(id), tx.pure.vector('u8', toUint8array(blob))],
    })

    setMintingStep("Executing transaction...");

    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: 'sui:testnet',
    });
    console.log("Transaction executed with digest:", result.digest);

    setMintingStep("NFT minted successfully!");

    toast.success("NFT Minted!", {
      description: `Transaction Completed Successfully`,
      action: {
        label: "SuiScan",
        onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, '_blank')
      },
      duration: 4000,
      position: "top-right",
    });
  }

  async function trialfetch() {

    // tx.moveCall({
    //   target: `${allowlist_pckg_id}::allowlist::create_allowlist_entry`,
    //   arguments: [tx.pure.string("trial_name")],
    // })
    // tx.setGasBudget(1000000000);
    // const result = await signAndExecuteTransaction({
    //   transaction: tx,
    //   chain: 'sui:testnet'
    // });

    //console.log("Create allowlist transaction executed with digest:", result.digest);
    const ownedobjects = await client.getOwnedObjects({
      owner: currentAccount?.address ?? "",
      options: {
        showContent: true,
        showType: true,
      },
    });

    const filteredOwnedObjects = ownedobjects.data.filter((obj) => {
      // Check if the object is an NFT
      // @ts-ignore
      // These are the Allowlists of the user
      if (obj.data?.type == "0x576ce6f9227b55f93844988881ecb53c74c8ffcbd5e7ecf6be8624d2ebd47f25::allowlist::Cap") {
        return true;
      }
      return false;
    });



    return filteredOwnedObjects;


  }
  // Function to create an allowlist for the NFT
  async function createAllowlist(nftName: string) {
    if (!nftName.trim()) {
      throw new Error("NFT name is required for allowlist creation");
    }

    try {

      tx2.moveCall({
        target: `${packagid}::allowlist::create_allowlist_entry`,
        arguments: [tx2.pure.string(nftName)],
      });
      tx2.setGasBudget(1000000000);

      const result = await signAndExecuteTransaction({
        transaction: tx2,
        chain: 'sui:testnet'
      });

      console.log("Allowlist created with digest:", result.digest);

      // Wait for blockchain indexing
      setMintingStep("Waiting for blockchain confirmation...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch the newly created allowlist
      const objects = await trialfetch();
      const objects2 = objects
      // @ts-ignore
      const objects_allowlist_ids = objects.map(obj => obj.data?.content?.fields?.allowlist_id);
      console.log("Objects Allowlist IDs:", objects);
      const final_allowlist_ids = await Promise.all(objects_allowlist_ids.map(async (id) => {
        // Fetch the full object details for each allowlist ID
        const allowlistObject = await client.getObject({
          id: id,
          options: {
            showContent: true,
            showType: true,
          }
        });
        return allowlistObject;
      }));
      // Filter objects to find the one with matching name
      console.log("Allowlist IDs:", final_allowlist_ids);
      const filteredObjects = final_allowlist_ids.filter((obj) => {
        // @ts-ignore
        return obj.data?.content?.fields?.name == nftName;
      });

      if (filteredObjects.length === 0) {
        throw new Error("Failed to find created allowlist. Please try again.");
      }

      // @ts-ignore
      const allowlistObjectId = filteredObjects[0].data?.objectId;
      // @ts-ignore
      const allowlistid = objects2.filter((obj) => obj.data?.content?.fields?.allowlist_id === allowlistObjectId)[0]?.data?.objectId || "";
      console.log("Allowlist Object ID:", allowlistObjectId);
      console.log("Allowlist cap:", allowlistid);
      if (!allowlistObjectId) {
        throw new Error("Failed to get allowlist object ID");
      }

      setNewAllowlistid(allowlistObjectId);

      toast.success("Allowlist Created!", {
        description: `Allowlist for "${nftName}" has been created automatically`,
        duration: 3000,
        position: "top-right",
      });

      return { allowlistObjectId, allowlistid };
    } catch (error) {
      console.error("Error creating allowlist:", error);
      throw new Error("Failed to create allowlist");
    }
  }

  // can set the return type here to make it easier
  async function fetchBlobs() {
    const blobs = await client.getObject({
      id: id,
      options: {
        showContent: true,
        showType: true,
      }
    })
    //@ts-ignore
    console.log('fetching blobs', blobs.data?.content?.fields.blobs);
  }

  async function finalpublish() {
    if (isMinting) return; // Prevent multiple simultaneous minting attempts

    setIsMinting(true);
    setMintingStep("Starting minting process...");

    try {
      setMintingStep("Preparing metadata and encrypting data...");
      const buffer = await image?.arrayBuffer();
      let arrayBuffer =  new Uint8Array(buffer ?? []);
      const encryptedImage = await encryption(arrayBuffer, currentAccount?.address ?? "");

      setMintingStep("Uploading to Walrus storage...");
      const url = `${PUBLISHER}/v1/blobs?epochs=1`;
      const fileBuffer = new Blob([encryptedImage]);
      const response = await axios({
       method: 'put',
       url: url,
       data: fileBuffer,
       headers: {
        'Content-Type': 'application/octet-stream'
       }
      });
    // this should be our blob id 
    const blobId = response.data.newlyCreated.blobObject.blobId;
    console.log("blobId", blobId);

    setMintingStep("Linking content to creator...");
    tx.moveCall({
      target: `${packageId}::${module}::${creatorAddContentFunction}`,
      arguments: [tx.object(creatorRegistry), tx.pure.string(blobId.toString())],
    })
    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: 'sui:testnet',
    });
    console.log("Transaction executed with digest:", result.digest);

    setMintingStep("Content created successfully!");

    toast.success("Content Created!", {
      description: `Transaction Completed Successfully`,
      action: {
        label: "SuiScan",
        onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, '_blank')
      },
      duration: 4000,
      position: "top-right",
    });
      
      //let object = await client.getDynamicFieldObject({parentId: creatorRegistry, name: { type: "address", value: currentAccount?.address }});
      //console.log("Checking if NFT with the same name exists:", object);
      // Upload to blob with allowlist object ID
      //const bob = await uploadtoblob("", "");

      // Mint NFT and upload to marketplace
      //await uploadtomarketplace(bob ?? "");

      // Reset form after successful mint
      //setDescription("");

      //setImage(null);
      //setImagePreview(null);
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

  const walletAddress = currentAccount?.address;

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    canvasRef,
    outputSrc,
    handleImageUpload,
    merkleRoot,
    DecodedPayload,
    obfuscatedImage,
    uploadedImageUrl,
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
            <h3 className="text-lg font-semibold mb-2 text-foreground">Saving Your Content</h3>
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
