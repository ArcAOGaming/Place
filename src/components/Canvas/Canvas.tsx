import { useEffect, useState } from 'react';
import { message } from "@permaweb/aoconnect";
import { createSigner } from "@permaweb/aoconnect";
import axios from 'axios';
import styles from './Canvas.module.css';

const PROCESS_ID = "CNsvbnGoV1iJCkG3x1uBWhtC_tbTuJ0PZeRMNSLfhG8";
const HB_NODE = "https://hb.randao.net";

const Canvas = () => {
  const [canvas, setCanvas] = useState<number[][][]>([]);
  const [selectedColor, setSelectedColor] = useState<number[]>([0, 0, 0]);

  const fetchCanvas = async () => {
    try {
      const hyperbeamBaseUrl = `${HB_NODE}/${PROCESS_ID}~process@1.0`;
      const endpoint = `${hyperbeamBaseUrl}/now/state/serialize~json@1.0`;
      const response = await axios.get(endpoint);
      if (response.data?.pixels && Array.isArray(response.data.pixels)) {
        setCanvas(response.data.pixels);
        console.log('Test number:', response.data.testNumber); // Log test number
      } else {
        console.error('Invalid canvas data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching canvas:', error);
    }
  };

  useEffect(() => {
    fetchCanvas();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchCanvas, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePixelClick = async (x: number, y: number) => {
    try {
      const wallet = window.arweaveWallet;
      const signer = createSigner(wallet);
      
      await message({
        process: PROCESS_ID,
        signer,
        tags: [{ name: 'Action', value: 'changePixel' }],
        data: JSON.stringify({
          x: x + 1, // Convert to 1-based indexing for Lua
          y: y + 1,
          color: selectedColor
        })
      });

      // Fetch the updated canvas immediately
      fetchCanvas();
    } catch (error) {
      console.error('Error changing pixel:', error);
    }
  };

  const predefinedColors = [
    [0, 0, 0],      // Black
    [255, 255, 255], // White
    [255, 0, 0],    // Red
    [0, 255, 0],    // Green
    [0, 0, 255],    // Blue
    [255, 255, 0],  // Yellow
    [255, 0, 255],  // Magenta
    [0, 255, 255],  // Cyan
  ];

  return (
    <div className={styles.container}>
      <div className={styles.colorPicker}>
        {predefinedColors.map((color, index) => (
          <div
            key={index}
            className={styles.colorOption}
            style={{
              backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
              border: JSON.stringify(color) === JSON.stringify(selectedColor) ? '2px solid white' : 'none'
            }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
      <div className={styles.canvas}>
        {canvas.map((row, y) => (
          <div key={y} className={styles.row}>
            {row.map((pixel, x) => (
              <div
                key={x}
                className={styles.pixel}
                style={{
                  backgroundColor: `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
                }}
                onClick={() => handlePixelClick(x, y)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Canvas;
