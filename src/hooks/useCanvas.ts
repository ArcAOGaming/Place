import { useState, useEffect } from 'react';
import { connect, createSigner } from "@permaweb/aoconnect";
import axios from 'axios';

const { message: configuredMessage } = connect({
  MU_URL: "https://ur-mu.randao.net",
  CU_URL: "https://ur-cu.randao.net",
  GATEWAY_URL: "https://arweave.net",
  MODE: "legacy"
});

const PROCESS_ID = 'CHPbivFn3bxhCi4XXjYddhuJlRZNHfh0txB6_WVGlEo';
const HB_NODE = "https://hb.randao.net";
const CANVAS_WIDTH = 10;
const CANVAS_HEIGHT = 10;

export const useCanvas = () => {
  const [canvas, setCanvas] = useState<number[][][]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchCanvas = async () => {
    if (isFetching) return;
    
    setIsFetching(true);
    try {
      const hyperbeamBaseUrl = `${HB_NODE}/${PROCESS_ID}~process@1.0`;
      const endpoint = `${hyperbeamBaseUrl}/now/state/serialize~json@1.0`;
      const response = await axios.get(endpoint);
      
      if (response.data?.pixels && Array.isArray(response.data.pixels)) {
        const convertedCanvas: number[][][] = [];
        
        for (let y = 0; y <= CANVAS_HEIGHT-1; y++) {
          if (response.data.pixels[y]) {
            const row: number[][] = [];
            for (let x = 0; x <= CANVAS_WIDTH-1; x++) {
              if (response.data.pixels[y][x]) {
                row.push(response.data.pixels[y][x]);
              } else {
                row.push([255, 255, 255]); // Default white
              }
            }
            convertedCanvas.push(row);
          }
        }
        
        setCanvas(convertedCanvas);
      } else {
        console.error('Invalid canvas data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching canvas:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const placePixel = async (x: number, y: number, color: number[]) => {
    if (x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT || x < 0 || y < 0) {
      throw new Error('Position out of bounds');
    }

    const wallet = window.arweaveWallet;
    const signer = createSigner(wallet);

    await configuredMessage({
      process: PROCESS_ID,
      signer,
      tags: [{ name: 'Action', value: 'changePixel' }],
      data: JSON.stringify({ x, y, color })
    });
  };

  const placeSticker = async (x: number, y: number, stickerPattern: Array<{x: number, y: number, color: number[]}>) => {
    const STICKER_SIZE = 3;
    const centerOffsetX = Math.floor(STICKER_SIZE / 2);
    const centerOffsetY = Math.floor(STICKER_SIZE / 2);
    
    const pixels = stickerPattern.map(pixel => ({
      x: x + pixel.x - centerOffsetX,
      y: y + pixel.y - centerOffsetY,
      color: pixel.color
    })).filter(pixel => 
      pixel.x >= 0 && pixel.x < CANVAS_WIDTH && 
      pixel.y >= 0 && pixel.y < CANVAS_HEIGHT
    );

    if (pixels.length === 0) {
      throw new Error('Sticker would be completely out of bounds');
    }

    const wallet = window.arweaveWallet;
    const signer = createSigner(wallet);

    await configuredMessage({
      process: PROCESS_ID,
      signer,
      tags: [{ name: 'Action', value: 'changePixels' }],
      data: JSON.stringify({ pixels })
    });

    return pixels.length;
  };

  useEffect(() => {
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;
      await fetchCanvas();
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (isActive) poll();
    };

    poll();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    canvas,
    isFetching,
    fetchCanvas,
    placePixel,
    placeSticker
  };
};
