import { useEffect, useState } from 'react';
import { connect, createSigner } from "@permaweb/aoconnect";
import axios from 'axios';
import styles from './Canvas.module.css';

const { message: configuredMessage } = connect({
  MU_URL: "https://ur-mu.randao.net",
  CU_URL: "https://ur-cu.randao.net",
  GATEWAY_URL: "https://arweave.net",
  MODE: "legacy"
});

const PROCESS_ID = 'CHPbivFn3bxhCi4XXjYddhuJlRZNHfh0txB6_WVGlEo';
const HB_NODE = "https://hb.randao.net";
const STICKER_SIZE = 5; // Increased sticker size for more detail

const Canvas = () => {
  const [canvas, setCanvas] = useState<number[][][]>([]);
  const [selectedColor, setSelectedColor] = useState<number[]>([0, 0, 0]);
  const [isFetching, setIsFetching] = useState(false);
  const [isDrawingSticker, setIsDrawingSticker] = useState(false);
  const [stickerPattern, setStickerPattern] = useState<Array<{x: number, y: number, color: number[]}>>([]);
  const [stickerCanvas, setStickerCanvas] = useState<number[][][]>(
    Array(STICKER_SIZE).fill(0).map(() => 
      Array(STICKER_SIZE).fill(0).map(() => [255, 255, 255])
    )
  );
  const [placementPreview, setPlacementPreview] = useState<{x: number, y: number} | null>(null);
  const [lastAction, setLastAction] = useState<string>('');

  const fetchCanvas = async () => {
    if (isFetching) return;
    
    setIsFetching(true);
    try {
      const hyperbeamBaseUrl = `${HB_NODE}/${PROCESS_ID}~process@1.0`;
      const endpoint = `${hyperbeamBaseUrl}/now/state/serialize~json@1.0`;
      const response = await axios.get(endpoint);
      if (response.data?.pixels && Array.isArray(response.data.pixels)) {
        setCanvas(response.data.pixels);
      } else {
        console.error('Invalid canvas data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching canvas:', error);
    } finally {
      setIsFetching(false);
    }
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

  const handleStickerPixelClick = (x: number, y: number) => {
    const newStickerCanvas = stickerCanvas.map(row => [...row]);
    newStickerCanvas[y][x] = selectedColor;
    setStickerCanvas(newStickerCanvas);

    // Update sticker pattern
    const pattern = [];
    for (let py = 0; py < STICKER_SIZE; py++) {
      for (let px = 0; px < STICKER_SIZE; px++) {
        const color = newStickerCanvas[py][px];
        if (color.join(',') !== '255,255,255') { // Only include non-white pixels
          pattern.push({ x: px, y: py, color });
        }
      }
    }
    setStickerPattern(pattern);
  };

  const clearSticker = () => {
    setStickerCanvas(Array(STICKER_SIZE).fill(0).map(() => 
      Array(STICKER_SIZE).fill(0).map(() => [255, 255, 255])
    ));
    setStickerPattern([]);
    setLastAction('Sticker cleared');
  };

  const handleCanvasMouseMove = (x: number, y: number) => {
    if (isDrawingSticker && stickerPattern.length > 0) {
      setPlacementPreview({ x, y });
    }
  };

  const handleCanvasMouseLeave = () => {
    setPlacementPreview(null);
  };

  const handleCanvasClick = async (x: number, y: number) => {
    if (x >= 25 || y >= 25) {
      setLastAction('Error: Position out of bounds');
      return;
    }

    try {
      const wallet = window.arweaveWallet;
      const signer = createSigner(wallet);

      if (isDrawingSticker && stickerPattern.length > 0) {
        // Apply sticker pattern at clicked location
        const pixels = stickerPattern.map(pixel => ({
          x: x + pixel.x - Math.floor(STICKER_SIZE / 2),
          y: y + pixel.y - Math.floor(STICKER_SIZE / 2),
          color: pixel.color
        })).filter(pixel => 
          pixel.x >= 0 && pixel.x < 25 && pixel.y >= 0 && pixel.y < 25
        );

        if (pixels.length === 0) {
          setLastAction('Error: Sticker would be completely out of bounds');
          return;
        }

        await configuredMessage({
          process: PROCESS_ID,
          signer,
          tags: [{ name: 'Action', value: 'changePixels' }],
          data: JSON.stringify({ pixels })
        });
        setLastAction('Sticker placed successfully');
      } else {
        // Single pixel change
        await configuredMessage({
          process: PROCESS_ID,
          signer,
          tags: [{ name: 'Action', value: 'changePixel' }],
          data: JSON.stringify({
            x,
            y,
            color: selectedColor
          })
        });
        setLastAction('Pixel placed successfully');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchCanvas();
    } catch (error) {
      console.error('Error changing pixel(s):', error);
      setLastAction('Error: Failed to place pixel(s)');
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
    [128, 0, 0],    // Maroon
    [0, 128, 0],    // Dark Green
    [0, 0, 128],    // Navy
    [128, 128, 0],  // Olive
    [128, 0, 128],  // Purple
    [0, 128, 128],  // Teal
    [255, 128, 0],  // Orange
    [255, 192, 203], // Pink
  ];

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.colorPicker}>
          {predefinedColors.map((color, index) => (
            <div
              key={index}
              className={`${styles.colorOption} ${JSON.stringify(color) === JSON.stringify(selectedColor) ? styles.selected : ''}`}
              style={{
                backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
              }}
              onClick={() => {
                setSelectedColor(color);
                setLastAction(`Color selected: RGB(${color.join(', ')})`);
              }}
            />
          ))}
        </div>
        <button 
          className={`${styles.modeButton} ${isDrawingSticker ? styles.active : ''}`}
          onClick={() => {
            setIsDrawingSticker(!isDrawingSticker);
            if (!isDrawingSticker) {
              clearSticker();
              setLastAction('Switched to sticker mode');
            } else {
              setLastAction('Switched to pixel mode');
            }
          }}
        >
          {isDrawingSticker ? 'Switch to Single Pixel' : 'Create Sticker'}
        </button>
      </div>

      {lastAction && (
        <div className={styles.instructions} style={{ marginBottom: '1rem' }}>
          {lastAction}
        </div>
      )}

      {isDrawingSticker && (
        <div className={styles.stickerEditor}>
          <h3>Sticker Editor</h3>
          <div className={styles.stickerCanvas}>
            {stickerCanvas.map((row, y) => (
              <div key={y} className={styles.row}>
                {row.map((pixel, x) => (
                  <div
                    key={x}
                    className={styles.pixel}
                    style={{
                      backgroundColor: `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
                    }}
                    onClick={() => handleStickerPixelClick(x, y)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className={styles.stickerControls}>
            <button 
              className={styles.clearButton} 
              onClick={clearSticker}
            >
              Clear Sticker
            </button>
            <div className={styles.instructions}>
              {stickerPattern.length === 0 
                ? 'Click pixels above to design your sticker'
                : 'Hover over the canvas below to preview placement'}
            </div>
          </div>
        </div>
      )}

      <div 
        className={styles.canvas}
        onMouseLeave={handleCanvasMouseLeave}
      >
        {canvas.map((row, y) => (
          <div key={y} className={styles.row}>
            {row.map((pixel, x) => {
              let displayColor = pixel;
              
              // Show sticker preview
              if (placementPreview && isDrawingSticker && stickerPattern.length > 0) {
                const offsetX = x - placementPreview.x + Math.floor(STICKER_SIZE / 2);
                const offsetY = y - placementPreview.y + Math.floor(STICKER_SIZE / 2);
                const stickerPixel = stickerPattern.find(p => p.x === offsetX && p.y === offsetY);
                if (stickerPixel) {
                  displayColor = stickerPixel.color;
                }
              }

              return (
                <div
                  key={x}
                  className={styles.pixel}
                  style={{
                    backgroundColor: `rgb(${displayColor[0]}, ${displayColor[1]}, ${displayColor[2]})`,
                    opacity: placementPreview ? 0.8 : 1
                  }}
                  onClick={() => handleCanvasClick(x, y)}
                  onMouseEnter={() => handleCanvasMouseMove(x, y)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Canvas;
