import styles from './CanvasGrid.module.css';

interface CanvasGridProps {
  canvas: number[][][];
  placementPreview: {x: number, y: number} | null;
  isDrawingSticker: boolean;
  stickerPattern: Array<{x: number, y: number, color: number[]}>;
  onCanvasClick: (x: number, y: number) => void;
  onCanvasMouseMove: (x: number, y: number) => void;
  onCanvasMouseLeave: () => void;
}

const STICKER_SIZE = 3;

export const CanvasGrid = ({ 
  canvas, 
  placementPreview, 
  isDrawingSticker, 
  stickerPattern, 
  onCanvasClick, 
  onCanvasMouseMove, 
  onCanvasMouseLeave 
}: CanvasGridProps) => {
  return (
    <div 
      className={styles.canvas}
      onMouseLeave={onCanvasMouseLeave}
    >
      {canvas.map((row, y) => (
        <div key={y} className={styles.row}>
          {row.map((pixel, x) => {
            let displayColor = pixel;
            
            // STICKER PREVIEW LOGIC:
            if (placementPreview && isDrawingSticker && stickerPattern.length > 0) {
              const centerOffsetX = Math.floor(STICKER_SIZE / 2);
              const centerOffsetY = Math.floor(STICKER_SIZE / 2);
              
              const stickerX = x - placementPreview.x + centerOffsetX;
              const stickerY = y - placementPreview.y + centerOffsetY;
              
              const stickerPixel = stickerPattern.find(p => p.x === stickerX && p.y === stickerY);
              
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
                onClick={() => onCanvasClick(x, y)}
                onMouseEnter={() => onCanvasMouseMove(x, y)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
