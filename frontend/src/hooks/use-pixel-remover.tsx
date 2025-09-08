import { useRef, useState } from "react";
import axios from "axios";
import { MerkleTree } from "merkletreejs";
import SHA256 from "crypto-js/sha256";
import { fromHex, toHex } from '@mysten/sui/utils';
import { SealClient, SessionKey, type SessionKeyType } from '@mysten/seal';





/**
 * Given an array of hex‐encoded hash strings, build the next “level” of the tree
 * by pairing adjacent items and hashing (if odd number, duplicate the last).
 * @param {string[]} hashes  — Array of hex strings (e.g. ['a1b2c3...', 'f4e5d6...', …])
 * @returns {string[]}       — Next level’s array of hex strings
 */
function buildNextLevel(hashes: string[]) {
  const nextLevel = [];

  for (let i = 0; i < hashes.length; i += 2) {
    // If there’s a “pair” (i and i+1), hash them together.
    // If the last element is alone (odd count), duplicate it.
    const left = hashes[i];
    const right = i + 1 < hashes.length ? hashes[i + 1] : hashes[i];

    // Concatenate the two hex strings and SHA256() them:
    // (Note: concatenating hex strings directly is fine as long as
    //  you consistently do it this way on both ends.)
    const concatenatedHex = left + right;
    const parentHash = SHA256(concatenatedHex).toString();

    nextLevel.push(parentHash);
  }

  return nextLevel;
}

/**
 * Compute Merkle root from an array of leaf‐hashes.
 * @param {string[]} leafHashes — Array of hex hashes at the leaf level
 * @returns {string}            — Single hex string = Merkle root
 */
function computeMerkleRoot(leafHashes: string[]) {
  if (leafHashes.length === 0) {
    throw new Error('Need at least one leaf to compute a Merkle root');
  }

  let currentLevel = leafHashes.slice(); // copy the array

  // Keep building up until we end up with just one hash
  while (currentLevel.length > 1) {
    currentLevel = buildNextLevel(currentLevel);
  }

  return currentLevel[0];
}



const usePixelRemover = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [outputSrc, setOutputSrc] = useState<string | null>(null);
  const [slicedBlocks, setSlicedBlocks] = useState<string[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [DecodedPayload, setDecodedPayload] = useState<any>(null);
  const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
  const [obfuscatedImage, setObfuscatedImage] = useState<string | null>(null);
  const [bob, setBOB] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const handleImageUpload = (file?: File) => {
    if (!file) return;

    const img = new Image();
    img.onload = () => processImage(img);
    img.src = URL.createObjectURL(file);
  };

  const processImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Maintain original aspect ratio
    const width = img.width;
    const height = img.height;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    console.log(width);
    console.log(height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Remove 4 blocks, one from each quadrant, each of size 1/10th of the area
    const blockArea = Math.floor((width * height) / 10);
    const blockSize = Math.floor(Math.sqrt(blockArea)); // block is square
    const sliced: string[] = [];
    const coords: { x: number, y: number }[] = [];
    const quadrants = [
      { xMin: 0, xMax: Math.floor(width / 2) - blockSize, yMin: 0, yMax: Math.floor(height / 2) - blockSize }, // Top-left
      { xMin: Math.ceil(width / 2), xMax: width - blockSize, yMin: 0, yMax: Math.floor(height / 2) - blockSize }, // Top-right
      { xMin: 0, xMax: Math.floor(width / 2) - blockSize, yMin: Math.ceil(height / 2), yMax: height - blockSize }, // Bottom-left
      { xMin: Math.ceil(width / 2), xMax: width - blockSize, yMin: Math.ceil(height / 2), yMax: height - blockSize }, // Bottom-right
    ];
    for (const q of quadrants) {
      const x0 = q.xMin + Math.floor(Math.random() * Math.max(1, q.xMax - q.xMin + 1));
      const y0 = q.yMin + Math.floor(Math.random() * Math.max(1, q.yMax - q.yMin + 1));
      coords.push({ x: x0, y: y0 });
      // Extract the block before making it transparent
      const blockCanvas = document.createElement("canvas");
      blockCanvas.width = blockSize;
      blockCanvas.height = blockSize;
      const blockCtx = blockCanvas.getContext("2d");
      if (blockCtx) {
        blockCtx.drawImage(
          img,
          x0,
          y0,
          blockSize,
          blockSize,
          0,
          0,
          blockSize,
          blockSize
        );
        sliced.push(blockCanvas.toDataURL("image/png"));
      }
      for (let y = y0; y < y0 + blockSize; y++) {
        for (let x = x0; x < x0 + blockSize; x++) {
          const index = (y * width + x) * 4;
          data[index + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const newImageUrl = canvas.toDataURL("image/*");
    setOutputSrc(newImageUrl);
    setSlicedBlocks(sliced);
    sendToApi({ blocks: sliced, coords, obfuscated: newImageUrl });
    setDecodedPayload({ blocks: sliced, coords, obfuscated: newImageUrl });
    setObfuscatedImage(newImageUrl);
  };

  const uploadObfuscatedImage = async (imageDataUrl: string) => {
    if (!imageDataUrl) return null;

    try {
      setUploadingImage(true);

      // Convert base64 data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Create form data for the upload
      const formData = new FormData();
      formData.append('image', blob, 'obfuscated-image.png');

      // Send to the express server
      const uploadResponse = await axios.post('https://encode-zkml.onrender.com/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }

      });
      console.log("success")
      console.log('Upload response:', uploadResponse.data);
      setUploadedImageUrl(uploadResponse.data.url);
      return uploadResponse.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const sendToApi = async (payload: { blocks: string[], coords: { x: number, y: number }[], obfuscated: string }) => {
    // This is the Merkle tree root of the coordinates
    console.log("Payload:", payload.coords);

    // const testcoords = [
    //   [10, 20],
    //   [10, 10],
    //   [50, 60],
    //   [70, 80]
    // ]
    // const leaves = payload.coords.map(coord => {
    //   if (coord.x === undefined || coord.y === undefined) {
    //     throw new Error('Invalid coordinate: both x and y are required');
    //   }

    //   const coordString = `${coord.x},${coord.y}`;
    //   console.log('Hashing coordinate:', coordString);
    //   return SHA256(coordString).toString();
    // });

    // const tree = new MerkleTree(leaves, sha256);

    // console.log(tree.toString());

    // const root = tree.getRoot().toString('hex');
    // console.log('Merkle Root:', root);

    // Upload the obfuscated image to the server


    const leaves = [];
    for (let i = 0; i < payload.coords.length; i++) {
      const { x, y } = payload.coords[i];
      if (x === undefined || y === undefined) {
        throw new Error('Invalid coordinate: both x and y are required');
      }
      const coordString = `${x},${y}`;              // e.g. "1,2"
      const leafHash = SHA256(coordString).toString(); // hex of SHA256
      console.log(`Leaf ${i}: SHA256("${coordString}") = ${leafHash}`);
      leaves.push(leafHash);
    }

    // 2️⃣ Step: Manually compute the Merkle root
    const merkleRoot = computeMerkleRoot(leaves);
    setMerkleRoot(merkleRoot);
    console.log(`Merkle Root: ${merkleRoot}`);
    if (payload.obfuscated) {
      const uploadedUrl = await uploadObfuscatedImage(payload.obfuscated);
      console.log("Uploaded image URL:", uploadedUrl);
    }
    else {
      console.log("No obfuscated image to upload");
    }

    // Initialization vector

    // the encrypted image being sent;
    // this should be done , when the user clicks on the final Publish button
    // const url = `${PUBLISHER}/v1/blobs`;
    // const fileBuffer = new Blob([JSON.stringify(payload)], { type: "application/json" });
    // const response = await axios({
    //   method: 'put',
    //   url: url,
    //   data: fileBuffer,
    //   headers: {
    //     'Content-Type': 'application/octet-stream'
    //   }
    // });
    // // this should be our blob id 
    // const blobId = response.data.newlyCreated.blobObject.blobId;
    // console.log("blobId", response.data.newlyCreated.blobObject.blobId);
    // setBOB(blobId)

    // const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
    // const retrieveurl = `${AGGREGATOR}/v1/blobs/${blobId}`;
    // const response2 = await axios({
    //   method: 'get',
    //   url: retrieveurl,
    //   responseType: 'arraybuffer'
    // });

    // console.log("Retrieved data:", response2.data);
    // // Step 1: Convert ArrayBuffer to string
    // const decoder = new TextDecoder("utf-8");
    // const jsonString = decoder.decode(new Uint8Array(response2.data));

    // // Step 2: Parse JSON
    // const decodedPayload = JSON.parse(jsonString);

    // Step 3: Use the fields
    // no need to upload and retrieve here , do it for the final Publish button instead





  };



  const handleDownload = () => {
    if (!outputSrc) return;
    const link = document.createElement("a");
    link.href = outputSrc;
    link.download = "modified-image.png";
    link.click();
  };

  const uploadCurrentObfuscatedImage = async () => {
    if (!obfuscatedImage) {
      console.error('No obfuscated image available to upload');
      return null;
    }
    return await uploadObfuscatedImage(obfuscatedImage);
  };

  return {
    canvasRef,
    outputSrc,
    slicedBlocks,
    handleImageUpload,
    handleDownload,
    merkleRoot,
    DecodedPayload,
    obfuscatedImage,
    bob,
    uploadObfuscatedImage,
    uploadCurrentObfuscatedImage,
    uploadedImageUrl,
    uploadingImage
  };
};

// Sample implementation

// import React from 'react';
// import { usePixelRemover } from './path/to/pixel';

// const MyCustomComponent = () => {
//   const {
//     canvasRef,
//     outputSrc,
//     slicedBlocks,
//     handleImageUpload,
//     handleDownload,
//   } = usePixelRemover();

//   return (
//     <div>
//       <h1>My Custom Pixel Processor</h1>

//       {/* You need the canvas element with the ref */}
//       <canvas ref={canvasRef} style={{ display: "none" }} />

//       {/* Use the upload handler */}
//       <input type="file" accept="image/*" onChange={handleImageUpload} />

//       {/* Display results however you want */}
//       {outputSrc && (
//         <div>
//           <img src={outputSrc} alt="Processed" />
//           <button onClick={handleDownload}>Download</button>

//           {/* Show sliced blocks in your own layout */}
//           {slicedBlocks.map((block, i) => (
//             <img key={i} src={block} alt={`Block ${i}`} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// const PixelRemover: React.FC = () => {
//   const {
//     canvasRef,
//     outputSrc,
//     slicedBlocks,
//     handleImageUpload,
//     handleDownload,
//   } = usePixelRemover();

//   return (
//     <div style={{ padding: "1rem" }}>
//       <h2>Random Pixel Remover</h2>
//       <input type="file" accept="image/*" onChange={handleImageUpload} />
//       <canvas ref={canvasRef} style={{ display: "none" }} />
//       {outputSrc && (
//         <div style={{ marginTop: "1rem" }}>
//           <img src={outputSrc} alt="Modified" />
//           <br />
//           <button onClick={handleDownload} style={{ marginTop: "0.5rem" }}>
//             Download Image
//           </button>
//           {slicedBlocks.length > 0 && (
//             <div style={{ marginTop: "1rem" }}>
//               <h4>Sliced Blocks</h4>
//               <div style={{ display: "flex", gap: "1rem" }}>
//                 {slicedBlocks.map((src, i) => (
//                   <img key={i} src={src} alt={`Block ${i + 1}`} style={{ border: "1px solid #ccc", width: 64, height: 64, objectFit: "contain" }} />
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

export { usePixelRemover };
