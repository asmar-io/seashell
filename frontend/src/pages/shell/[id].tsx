import React from "react";
import { useParams } from "react-router";
import { HowItWorksSection, Footer } from "@/components/landing-page";
import { Header } from "@/components/header";
import { useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { toast } from "sonner";
import { creatorRegistry, packageId,module } from "@/lib/sample-data";
import { SealClient, SessionKey } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import BaseLayout from "@/components/BaseLayout";
import UserProfile from "@/components/UserProfile";
import Posts from "@/components/Posts";
import { Transaction } from "@mysten/sui/transactions";
import axios from "axios";

export default function CreatorPage() {
  const { client } = useSuiClientContext();
  const { id } = useParams() as { id?: string };
  const shellId = id ?? "";
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const currentaccount = useCurrentAccount();
  const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
  const tx = new Transaction();
  const serverObjectIds = [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
  ];
  const sealnewclient = new SealClient({
    //@ts-ignore
    suiClient: client,
    serverConfigs: serverObjectIds.map((id) => ({ objectId: id, weight: 1 })),
    verifyKeyServers: false,
  });

   async function decode(blobId: string): Promise<any> {
    const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
    const retrieveurl = `${AGGREGATOR}/v1/blobs/${blobId}`;
    const response = await axios({
      method: 'get',
      url: retrieveurl,
      responseType: 'arraybuffer'
    });
    return response.data;
  }

  async function fetchCreator(creator_address: any): Promise<string[]> {
    //let objects_ids: string[] = [];
    let creator_object = await client.getDynamicFieldObject({
      parentId: creatorRegistry,
      name: { type: "address", value: creator_address },
    });

    const blobs = await client.getDynamicFields({
      parentId: creator_object?.data?.objectId as string,
    });

    let blobId = blobs?.data[0].name.value as string;
    console.log("Blob Id", blobId);

    let encryptedData = await decode(blobId);

    // Generate encryption ID
    const allowbytes = fromHex(creator_address);
    const nonce = Uint8Array.from([1, 2, 3, 4, 5]);
    const encryptionid = toHex(new Uint8Array([...allowbytes, ...nonce]));
    console.log("Encryption ID:", encryptionid);

    // Create a new session key
    console.log("Creating new session key...");
    const session_key = await SessionKey.create({
      address: currentaccount?.address || "",
      packageId: packageId,
      ttlMin: 1,
      suiClient: new SuiClient({ url: getFullnodeUrl("testnet") }),
    });
    const message = session_key.getPersonalMessage();
    const signResult = await new Promise((resolve, reject) => {
      signPersonalMessage(
        { message: message },
        {
          onSuccess: (result) => resolve(result),
          onError: (error) => reject(error),
        }
      );
    });
    //@ts-ignore
    console.log("Sign result:", signResult.signature);

    // @ts-ignore
    await session_key.setPersonalMessageSignature(signResult.signature);
    tx.moveCall({
      target: `${packageId}::${module}::seal_approve`,
      arguments: [
        tx.pure.vector("u8", fromHex(encryptionid)),
        tx.object("0xd30306d28b4db68ab2954bcaafbc036d937b42bbe4f75a9c5b7dff1c35760681"),
        tx.object(creatorRegistry),
        tx.pure.address(creator_address),
        tx.object.clock(),
      ],
    });

    const txbytes = await tx.build({ client, onlyTransactionKind: true });
    const uint8 = new Uint8Array(encryptedData.byteLength);

    for (let i = 0; i < encryptedData.byteLength; i++) {
      uint8[i] = encryptedData[i];
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const decrypteddata = await sealnewclient.decrypt({
        data: uint8,
        sessionKey: session_key,
        txBytes: txbytes,
      });

      toast.success("Decryption successful!", {
        description: "The image has been successfully decrypted.",
        duration: 4000,
        position: "top-right",
      });

      if (decrypteddata) {
        console.log("Decrypted Data:", decrypteddata);
      }
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error("Decryption failed!", {
        description: "No Access error, user does not have one or more keys",
        duration: 4000,
        position: "top-right",
      });
    }

    /*blobs?.data?.forEach((field) => {
      objects_ids.push(field.objectId);
    });*/
    //@ts-ignore
    return blobs || [];
  }

  useEffect(() => {
    async function loadCreator() {
      try {
        const blobIds = await fetchCreator(shellId);
      } catch (e) {
        console.error("Error loading NFTs:", e);
      }
    }
    loadCreator();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <BaseLayout>
          <UserProfile />
          <Posts admin={""} isSubscribed={false} />
        </BaseLayout>
      </main>
      <Footer />
    </div>
  );
}
