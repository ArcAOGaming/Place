import { ColorSelector } from '../ColorSelector';
import { Pencil } from '../Pencil';
import { StickerEditor } from '../StickerEditor';
import { SprayBrush } from '../SprayBrush';
import styles from './Painter.module.css';

type DrawingMode = 'pencil' | 'sticker' | 'spray';

interface PainterProps {
  selectedColor: number[];
  drawingMode: DrawingMode;
  stickerCanvas: number[][][];
  stickerPattern: Array<{x: number, y: number, color: number[]}>;
  onColorSelect: (color: number[]) => void;
  onStickerPixelClick: (x: number, y: number) => void;
  onClearSticker: () => void;
  onDrawingModeChange: (mode: DrawingMode) => void;
  onActionUpdate: (action: string) => void;
}

export const Painter = ({
  selectedColor,
  drawingMode,
  stickerCanvas,
  stickerPattern,
  onColorSelect,
  onStickerPixelClick,
  onClearSticker,
  onDrawingModeChange,
  onActionUpdate
}: PainterProps) => {
  return (
    <div className={styles.painterWrapper}>
      <div className={styles.colorSection}>
        <ColorSelector
          selectedColor={selectedColor}
          onColorSelect={onColorSelect}
          onActionUpdate={onActionUpdate}
        />
      </div>
      
      <div className={styles.painterContainer}>
        <div 
          className={`${styles.toolSection} ${drawingMode === 'pencil' ? styles.activeSection : ''}`}
          onClick={() => onDrawingModeChange('pencil')}
        >
          <h3 className={styles.sectionTitle}>Pencil</h3>
          <div className={styles.toolContent}>
            <Pencil 
              selectedColor={selectedColor}
              onActionUpdate={onActionUpdate}
            />
          </div>
        </div>
        
        <div 
          className={`${styles.toolSection} ${drawingMode === 'spray' ? styles.activeSection : ''}`}
          onClick={() => onDrawingModeChange('spray')}
        >
          <h3 className={styles.sectionTitle}>Spray Brush</h3>
          <div className={styles.toolContent}>
            <SprayBrush
              selectedColor={selectedColor}
              onActionUpdate={onActionUpdate}
            />
          </div>
        </div>
        
        <div 
          className={`${styles.toolSection} ${drawingMode === 'sticker' ? styles.activeSection : ''}`}
          onClick={() => onDrawingModeChange('sticker')}
        >
          <h3 className={styles.sectionTitle}>Sticker Editor</h3>
          <div className={styles.toolContent}>
            <StickerEditor
              selectedColor={selectedColor}
              stickerCanvas={stickerCanvas}
              stickerPattern={stickerPattern}
              onStickerPixelClick={onStickerPixelClick}
              onClearSticker={onClearSticker}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
