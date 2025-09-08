import React from "react";
import { useParams } from "react-router";
import {
  Header,
  HowItWorksSection,
  Footer,
} from "@/components/landing-page";
import { useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
   useSignPersonalMessage,
  useSuiClientContext,
} from "@mysten/dapp-kit";

import { creatorRegistry,packageId } from "@/lib/sample-data";
import { SealClient, SessionKey } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client"
import BaseLayout from "@/components/BaseLayout";
import UserProfile from "@/components/UserProfile";
import Posts from "@/components/Posts";


export default function CreatorPage() {
  const { client, } = useSuiClientContext();
  const { id } = useParams() as { id?: string };
  const shellId = id ?? "";
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const currentaccount = useCurrentAccount();
  const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

  async function fetchCreator(creator_address: any): Promise<string[]> {
    //let objects_ids: string[] = [];
    let creator_object = await client.getDynamicFieldObject({parentId: creatorRegistry, name: { type: "address", value: creator_address }});

    const blobs = await client.getDynamicFields({
      parentId: creator_object?.data?.objectId as string,
    });
    console.log('Blob Id', blobs.data[0].name.value);


    const allowbytes = fromHex(creator_address); 
    const nonce = Uint8Array.from([1, 2, 3, 4, 5]);
    const encryptionid = toHex(new Uint8Array([...allowbytes, ...nonce]))
    console.log("Encryption ID:", encryptionid);

    // Create a new session key
    console.log("Creating new session key...");
    const session_key = await SessionKey.create({
          address: currentaccount?.address || '',
          packageId: packageId,
          ttlMin: 1,
          suiClient: new SuiClient({ url: getFullnodeUrl("testnet")}),
    });
    const message = session_key.getPersonalMessage();
    const signResult = await new Promise((resolve, reject) => {
          signPersonalMessage(
            { message: message },
            {
              onSuccess: (result) => resolve(result),
              onError: (error) => reject(error)
            }
          );
    });
    //@ts-ignore
    console.log("Sign result:", signResult.signature);

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

  return <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
         <BaseLayout>
			     <UserProfile />
			     <Posts admin={""} isSubscribed={false} />
		     </BaseLayout>
      </main>
      <Footer />
    </div>;
  
}