import styles from './StickerEditor.module.css';

interface StickerEditorProps {
  selectedColor: number[];
  stickerCanvas: number[][][];
  stickerPattern: Array<{x: number, y: number, color: number[]}>;
  onStickerPixelClick: (x: number, y: number) => void;
  onClearSticker: () => void;
}

const STICKER_SIZE = 3;

export const StickerEditor = ({ 
  selectedColor, 
  stickerCanvas, 
  stickerPattern, 
  onStickerPixelClick, 
  onClearSticker 
}: StickerEditorProps) => {
  return (
    <div className={styles.stickerEditor}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  onStickerPixelClick(x, y);
                }}
                title={`Click to paint with selected color`}
              />
            ))}
          </div>
        ))}
      </div>
      <button 
        className={styles.clearButton} 
        onClick={onClearSticker}
      >
        Clear Sticker
      </button>
    </div>
  );
};
