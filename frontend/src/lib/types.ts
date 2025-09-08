export interface NFT {
  id: string;
  objectId: string;
  name: string;
  creator: string;
  metadata: {
    description: string;
    price: number;
    created_at: number;
  };
  merkleroot: string;
  image: string;
  isObfuscated?: string;
  proof?: string;
}
