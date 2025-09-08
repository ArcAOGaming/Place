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
const STICKER_SIZE = 3; // 3x3 sticker grid for better usability
// COORDINATE SYSTEM EXPLANATION:
// Lua Backend: Uses 1-based indexing, coordinates (1,1) to (10,10)
//   - (1,1) = top-left corner
//   - (10,10) = bottom-right corner
//   - WIDTH = 10, HEIGHT = 10
// Frontend: Uses 0-based indexing, coordinates (0,0) to (9,9)
//   - (0,0) = top-left corner (maps to Lua's (1,1))
//   - (9,9) = bottom-right corner (maps to Lua's (10,10))
const CANVAS_WIDTH = 10; // Frontend canvas: 0-9, Lua backend: 1-10
const CANVAS_HEIGHT = 10;

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
        // COORDINATE CONVERSION: Lua sends 1-based indexed array
        // Convert to 0-based indexed array for frontend display
        const convertedCanvas: number[][][] = [];
        
        // Lua sends pixels[1][1] to pixels[10][10], we need [0][0] to [9][9]
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
    // Validate click coordinates (frontend uses 0-based indexing)
    if (x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT || x < 0 || y < 0) {
      setLastAction('Error: Position out of bounds');
      return;
    }

    try {
      const wallet = window.arweaveWallet;
      const signer = createSigner(wallet);

      if (isDrawingSticker && stickerPattern.length > 0) {
        // STICKER PLACEMENT LOGIC:
        // - Center the sticker on the clicked position
        // - Crop any pixels that would go outside canvas boundaries
        // - Convert frontend coordinates (0-based) to Lua coordinates (1-based)
        
        const centerOffsetX = Math.floor(STICKER_SIZE / 2); // For 3x3: offset = 1
        const centerOffsetY = Math.floor(STICKER_SIZE / 2);
        
        // Calculate final pixel positions in frontend coordinate system (0-based)
        const pixels = stickerPattern.map(pixel => ({
          x: x + pixel.x - centerOffsetX, // Center sticker on click position
          y: y + pixel.y - centerOffsetY,
          color: pixel.color
        })).filter(pixel => 
          // Crop to canvas boundaries (keep only pixels within 0-9 range)
          pixel.x >= 0 && pixel.x < CANVAS_WIDTH && 
          pixel.y >= 0 && pixel.y < CANVAS_HEIGHT
        );

        if (pixels.length === 0) {
          setLastAction('Error: Sticker would be completely out of bounds');
          return;
        }

        // Convert frontend coordinates (0-based) to Lua coordinates (1-based)
        const luaPixels = pixels.map(pixel => ({
          x: pixel.x, // Frontend (0-9) -> Lua (1-10)
          y: pixel.y, // Frontend (0-9) -> Lua (1-10)
          color: pixel.color
        }));

        await configuredMessage({
          process: PROCESS_ID,
          signer,
          tags: [{ name: 'Action', value: 'changePixels' }],
          data: JSON.stringify({ pixels: luaPixels })
        });
        setLastAction(`Sticker placed successfully (${pixels.length} pixels)`);
      } else {
        // SINGLE PIXEL PLACEMENT:
        // Convert frontend coordinate (0-based) to Lua coordinate (1-based)
        await configuredMessage({
          process: PROCESS_ID,
          signer,
          tags: [{ name: 'Action', value: 'changePixel' }],
          data: JSON.stringify({
            x: x, // Frontend (0-9) -> Lua (1-10)
            y: y, // Frontend (0-9) -> Lua (1-10)
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
              // Frontend coordinates: y=0-9, x=0-9 (matches click coordinates)
              let displayColor = pixel;
              
              // STICKER PREVIEW LOGIC:
              // Show preview of sticker centered on mouse position
              // Display all sticker pixels, even those that would be cropped
              // (Visual feedback shows full sticker, but actual placement will crop)
              if (placementPreview && isDrawingSticker && stickerPattern.length > 0) {
                const centerOffsetX = Math.floor(STICKER_SIZE / 2);
                const centerOffsetY = Math.floor(STICKER_SIZE / 2);
                
                // Calculate which sticker pixel corresponds to current canvas position
                const stickerX = x - placementPreview.x + centerOffsetX;
                const stickerY = y - placementPreview.y + centerOffsetY;
                
                // Find matching sticker pixel
                const stickerPixel = stickerPattern.find(p => p.x === stickerX && p.y === stickerY);
                
                // Show preview for all sticker pixels (even if they'd be cropped in actual placement)
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
