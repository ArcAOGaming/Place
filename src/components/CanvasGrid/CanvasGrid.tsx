import styles from './CanvasGrid.module.css';

interface CanvasGridProps {
  canvas: number[][][];
  placementPreview: {x: number, y: number} | null;
  toolPreview: {x: number, y: number} | null;
  drawingMode: 'pencil' | 'sticker' | 'spray';
  selectedColor: number[];
  isDrawingSticker: boolean;
  stickerPattern: Array<{x: number, y: number, color: number[]}>;
  onCanvasClick: (x: number, y: number) => void;
  onCanvasMouseDown: (x: number, y: number) => void;
  onCanvasMouseUp: () => void;
  onCanvasMouseMove: (x: number, y: number) => void;
  onCanvasMouseLeave: () => void;
}

const STICKER_SIZE = 3;

export const CanvasGrid = ({ 
  canvas, 
  placementPreview, 
  toolPreview,
  drawingMode,
  selectedColor,
  isDrawingSticker, 
  stickerPattern, 
  onCanvasClick, 
  onCanvasMouseDown,
  onCanvasMouseUp,
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
            let opacity = 1;
            let showPreview = false;
            
            // STICKER PREVIEW LOGIC:
            if (placementPreview && isDrawingSticker && stickerPattern.length > 0) {
              const centerOffsetX = Math.floor(STICKER_SIZE / 2);
              const centerOffsetY = Math.floor(STICKER_SIZE / 2);
              
              const stickerX = x - placementPreview.x + centerOffsetX;
              const stickerY = y - placementPreview.y + centerOffsetY;
              
              const stickerPixel = stickerPattern.find(p => p.x === stickerX && p.y === stickerY);
              
              if (stickerPixel) {
                displayColor = stickerPixel.color;
                opacity = 0.8;
                showPreview = true;
              }
            }
            
            // PENCIL/SPRAY BRUSH PREVIEW LOGIC:
            if (toolPreview && (drawingMode === 'pencil' || drawingMode === 'spray') && 
                toolPreview.x === x && toolPreview.y === y) {
              if (drawingMode === 'pencil') {
                displayColor = selectedColor;
              } else if (drawingMode === 'spray') {
                // Show blended color preview for spray brush
                displayColor = [
                  Math.round((selectedColor[0] + pixel[0]) / 2),
                  Math.round((selectedColor[1] + pixel[1]) / 2),
                  Math.round((selectedColor[2] + pixel[2]) / 2)
                ];
              }
              opacity = 0.7;
              showPreview = true;
            }

            return (
              <div
                key={x}
                className={`${styles.pixel} ${showPreview ? styles.preview : ''}`}
                style={{
                  backgroundColor: `rgb(${displayColor[0]}, ${displayColor[1]}, ${displayColor[2]})`,
                  opacity: opacity
                }}
                onClick={() => onCanvasClick(x, y)}
                onMouseDown={() => onCanvasMouseDown(x, y)}
                onMouseUp={onCanvasMouseUp}
                onMouseEnter={() => onCanvasMouseMove(x, y)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
