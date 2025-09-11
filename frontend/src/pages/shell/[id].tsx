import { useParams } from "react-router";
import { Footer } from "@/components/landing-page";
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import {
  useCurrentAccount,
  useSignPersonalMessage,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { toast } from "sonner";
import { creatorRegistry, packageId, module, serverObjectIds } from "@/lib/sample-data";
import {
  SealClient,
  SessionKey,
  EncryptedObject,
  type ExportedSessionKey,
} from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import BaseLayout from "@/components/BaseLayout";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import CoverImage from "@/components/CoverImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavLink as Link } from "react-router";
import PostSkeleton from "@/components/ui/PostSkeleton";
import {
  Heart,
  ImageIcon,
  LockKeyholeIcon,
  Trash,
} from "lucide-react";
import { AdvancedVideo } from "@cloudinary/react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useSignAndExecuteTransaction, } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"

const CreatorPage = () => {
  const { client } = useSuiClientContext();
  const { id } = useParams() as { id?: string };
  const shellId = id ?? "";
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const currentaccount = useCurrentAccount();
  const sealnewclient = new SealClient({
    //@ts-ignore
    suiClient: client,
    serverConfigs: serverObjectIds.map((id) => ({ objectId: id, weight: 1 })),
    verifyKeyServers: false,
  });
 
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
   //@ts-ignore
  const [images, setImages] = useState<any>([]);
   //@ts-ignore
  const [encryptedImages, setEncryptedImages] = useState<any>([]);
  //@ts-ignore
  const [sessionKey, setSessionKey] = useLocalStorage<ExportedSessionKey>("sessionKey",null);

  async function fetchuserSubscriptions() {
    const ownedobjects = await client.getOwnedObjects({
      owner: currentaccount?.address ?? "",
      options: {
        showContent: true,
        showType: true,
      },
      filter: { StructType: `${packageId}::${module}::Subscription` },
    });
    //@ts-ignore
    const subscription = ownedobjects?.data.find((obj) => {return obj?.data?.content?.fields.creator_address === shellId;});
    return subscription?.data;
  }

  async function decode(blobId: string): Promise<any> {
    const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
    const retrieveurl = `${AGGREGATOR}/v1/blobs/${blobId}`;
    try {
      const response = await axios({
      method: "get",
      url: retrieveurl,
      responseType: "arraybuffer",
      });
      return response.data;
    } catch (error) {
         return null;
    }
  }

  async function fetchBlobs(creator_object: any, subscription: any): Promise<string[]> {
    const blobs = await client.getDynamicFields({
      parentId: creator_object?.objectId as string,
    });
    const tx= new Transaction();
    //@ts-ignore
      console.log(sessionKey);
      console.log(
        Date.now() > sessionKey?.creationTimeMs + sessionKey?.ttlMin * 60 * 1000
      );
      //@ts-ignore.
      let session_key: SessionKey = null;
      if (sessionKey == null || Date.now() > sessionKey?.creationTimeMs + sessionKey?.ttlMin * 60 * 1000) {
        // Create a new session key
        console.log("Creating new session key...");
        session_key = await SessionKey.create({
          address: currentaccount?.address || "",
          packageId: packageId,
          ttlMin: 10,
          suiClient: client,
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
        console.log("Sign result::", signResult.signature);
        //@ts-ignore
        await session_key.setPersonalMessageSignature(signResult.signature);

        //@ts-ignore
        let exported = session_key.export();
        const serializableObject = {
          ...exported,
          toJSON: undefined, // Remove functions or complex types
        };
        //@ts-ignore
        console.log(serializableObject);
        setSessionKey(serializableObject);
      } else {
        session_key = SessionKey.import(sessionKey, client);
      }

    let content = [];
    for (let index = 0; index < blobs?.data.length; index++) {
      let blobId = blobs?.data[index].name.value as string;
      console.log("Blob Id", blobId);
      let encryptedData = await decode(blobId);
      if(encryptedData == null)
        continue;
      // Generate encryption ID
      const allowbytes = fromHex(
        creator_object.content?.fields?.creator_address
      );
      const nonce = Uint8Array.from([1, 2, 3, 4, 5]);
      const encryptionid = toHex(new Uint8Array([...allowbytes, ...nonce]));
      console.log("Encryption ID:", encryptionid);

      tx.moveCall({
        target: `${packageId}::${module}::seal_approve`,
        arguments: [
          tx.pure.vector("u8", fromHex(encryptionid)),
          tx.object(
            subscription.objectId
          ),
          tx.object(creatorRegistry),
          tx.pure.address(creator_object.content?.fields?.creator_address),
          tx.object.clock(),
        ],
      });

      const txbytes = await tx.build({ client, onlyTransactionKind: true });

      const encryptedDataObject = EncryptedObject.parse(
        new Uint8Array(encryptedData)
      );
      console.log(encryptedDataObject);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const decrypteddata = await sealnewclient.decrypt({
          data: new Uint8Array(encryptedData),
          sessionKey: session_key,
          txBytes: txbytes,
        });

        if (decrypteddata) {
          toast.success("Decryption successful!", {
            description: "The image has been successfully decrypted.",
            duration: 4000,
            position: "top-right",
          });
          console.log("Decrypted Data:", decrypteddata);

          const decodedPayload = new Blob([new Uint8Array(decrypteddata)], {
            type: "image/png",
          });

          content.push(URL.createObjectURL(decodedPayload))
        }
      } catch (error) {
        console.error("Decryption error:", error);
        toast.error("Decryption failed!", {
          description: "No Access error, user does not have one or more keys",
          duration: 4000,
          position: "top-right",
        });
      }
    }
    setImages(content);

    //@ts-ignore
    return blobs || [];
  }

  async function fetchCreator(creator_address: any): Promise<any> {
    //let objects_ids: string[] = [];
    let creator_object = await client.getDynamicFieldObject({
      parentId: creatorRegistry,
      name: { type: "address", value: creator_address },
    });

    return creator_object?.data;
  }

  async function fetchCreatorContent(creator_object: any): Promise<any> {
    const blobs = await client.getDynamicFields({
      parentId: creator_object?.objectId as string,
    });
    return blobs?.data;
  }

  const handleSubscribe = async  () => {
    // payment being completed 
    console.log("Initiating payment to escrow...",creator);
    const tx= new Transaction();
    const coin = tx.splitCoins(tx.gas, [creator.content.fields.subscription_fee])
    tx.moveCall({
      target: `${packageId}::${module}::subscribe_to_creator`,
      arguments: [
        tx.object(creatorRegistry),
        tx.pure.id(creator.content.fields.creator_address),
        coin,
        tx.object.clock()
      ],
    })
    const val = await signAndExecuteTransaction({
      transaction: tx,
      chain: 'sui:testnet'
    });
    console.log("payment transaction:", val.digest);
    toast.success("Subscribed successful!", {
      description: `Transaction digest: ${val.digest}`,
      duration: 4000,
      position: "top-right",
      action: {
        label: "SuiScan",
        onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${val.digest}`, '_blank')
      },
    });
    setIsSubscribed(true);
    const subscription = await fetchuserSubscriptions();
    await fetchBlobs(creator,subscription);
    return val.digest;
  }

  useEffect(() => {
    async function loadCreator() {
      try {
        setIsSubscribed(false);
        const creatorResponse = await fetchCreator(shellId);
        if (creatorResponse) {
          setCreator(creatorResponse);
          setLoading(false);
          const creatorContentrResponse = await fetchCreatorContent(creatorResponse);
          if(creatorContentrResponse) {
            setImages(Array.from({ length: creatorContentrResponse.length }, (_) => ""));
          }
        }
        if(currentaccount?.address){
          const subscription = await fetchuserSubscriptions();
          if (subscription) {
            setIsSubscribed(true);
            await fetchBlobs(creatorResponse,subscription);
          }
        }
      } catch (e) {
        console.error("Error loading NFTs:", e);
      }
    }
    loadCreator();
  }, [currentaccount]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <BaseLayout>
            <div>
              <div className="space-y-3">
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
            </div>
          </BaseLayout>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <BaseLayout>
          <div className="flex flex-col">
            <CoverImage
              adminName={creator?.content?.fields?.creator_name || creator?.content?.fields?.creator_address?.substring(0,4)}
              coverImage={creator?.content?.fields?.creator_image_url}
              contentCount={images?.length}
              totalLikes={0}
            />
            <div className="flex flex-col p-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <Avatar className="w-20 h-20 border-2 -mt-10">
                  <AvatarImage
                    src={creator?.content?.fields?.creator_image_url}
                    className="object-cover"
                  />
                  <AvatarFallback>{creator?.content?.fields?.creator_address?.substring(0,4)}</AvatarFallback>
                </Avatar>

                <div className="flex">
                  {!isSubscribed && (
                    <Button onClick={()=>handleSubscribe()} asChild className="rounded-full flex gap-10">
                        <span className="uppercase font-semibold tracking-wide">
                          Subscribe
                        </span>
                    </Button>
                  )}

                  {isSubscribed && (
                    <Button
                      className="rounded-full flex gap-10"
                      variant={"outline"}
                    >
                      <span className="uppercase font-semibold tracking-wide">
                        Subscribed
                      </span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col mt-4">
                <p className="text-lg font-semibold">
                  {creator?.content?.fields?.creator_name}
                </p>
                <p className="text-sm mt-2 md:text-md">
                  {creator?.content?.fields?.creator_description}
                </p>
              </div>
            </div>
            <div aria-hidden="true" className="h-2 w-full bg-muted" />
          </div>

          <div>
            {true &&
              images?.map((post: any) => (
                <div className="flex flex-col gap-3 p-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage
                          src={creator?.content?.fields?.creator_image_url}
                          className="object-cover"
                        />
                        <AvatarFallback>0x</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm md:text-md">
                        {creator?.content?.fields?.creator_name}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <p className="text-zinc-400 text-xs md:text-sm tracking-tighter">
                        17.06.2024
                      </p>

                      {true && (
                        <Trash className="w-5 h-5 text-muted-foreground hover:text-red-500 cursor-pointer" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm md:text-md">{"post text"}</p>

                  {(post != "") && (
                    <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden">
                      <img
                        src={post}
                        alt="Post Image"
                        className="rounded-lg object-cover absolute"
                      />
                    </div>
                  )}

                  {false && (
                    <div className="w-full mx-auto">
                      <AdvancedVideo
                        style={{ width: 960, height: 540 }}
                        className="rounded-md"
                        cldVid={""}
                      />
                    </div>
                  )}

                  {(!isSubscribed || post == "") && (
                    <div
                      className="w-full bg-slate-800 relative h-96 rounded-md bg-of flex flex-col justify-center
          items-center px-5 overflow-hidden
        "
                    >
                      <LockKeyholeIcon className="w-16 h-16 text-zinc-400 mb-20 z-0" />

                      <div
                        aria-hidden="true"
                        className="opacity-60 absolute top-0 left-0 w-full h-full bg-stone-800"
                      />

                      <div className="flex flex-col gap-2 z-10 border p-2 border-gray-500 w-full rounded">
                        <div className="flex gap-1 items-center">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-xs">1</span>
                        </div>

                        <Link
                          className={buttonVariants({
                            className:
                              "!rounded-full w-full font-bold text-white",
                          })}
                          to={"/pricing"}
                        >
                          Subscribe to unlock
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="flex gap-1 items-center">
                      <Heart
                        className={cn("w-5 h-5 cursor-pointer", {
                          "text-red-500": false,
                          "fill-red-500": false,
                        })}
                        onClick={() => {
                          if (!isSubscribed) return;
                        }}
                      />
                      <span className="text-xs text-zinc-400 tracking-tighter">
                        {1}
                      </span>
                    </div>
                  </div>
                  
                </div>
            ))}

            {false && (
              <div className="mt-10 px-3 flex flex-col gap-10">
                {[...Array(3)].map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            )}

            {true && images?.length === 0 && (
              <div className="mt-10 px-3">
                <div className="flex flex-col items-center space-y-3 w-full md:w-3/4 mx-auto ">
                  <p className="text-xl font-semibold">
                    No Posts Yet
                  </p>

                  <p className="text-center">
                    Stay tuned for more posts from{" "}
                    <span className="text-primary font-semibold text-xl">
                      SeaShell.
                    </span>{" "}
                    You can subscribe to access exclusive content when it's
                    available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </BaseLayout>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorPage;
