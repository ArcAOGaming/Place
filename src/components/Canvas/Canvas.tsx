import { useState } from 'react';
import { ColorPicker } from '../ColorPicker';
import { StickerEditor } from '../StickerEditor';
import { CanvasGrid } from '../CanvasGrid';
import { useCanvas } from '../../hooks/useCanvas';
import { useSticker } from '../../hooks/useSticker';
import styles from './Canvas.module.css';

const Canvas = () => {
  const [selectedColor, setSelectedColor] = useState<number[]>([0, 0, 0]);
  const [isDrawingSticker, setIsDrawingSticker] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  
  const { canvas, fetchCanvas, placePixel, placeSticker } = useCanvas();
  const {
    stickerPattern,
    stickerCanvas,
    placementPreview,
    handleStickerPixelClick,
    clearSticker,
    handleCanvasMouseMove,
    handleCanvasMouseLeave
  } = useSticker();


  const handleStickerPixelClickWrapper = (x: number, y: number) => {
    handleStickerPixelClick(x, y, selectedColor);
  };

  const clearStickerWrapper = () => {
    clearSticker();
    setLastAction('Sticker cleared');
  };

  const handleCanvasMouseMoveWrapper = (x: number, y: number) => {
    handleCanvasMouseMove(x, y, isDrawingSticker);
  };

  const handleCanvasClick = async (x: number, y: number) => {
    try {
      if (isDrawingSticker && stickerPattern.length > 0) {
        const pixelCount = await placeSticker(x, y, stickerPattern);
        setLastAction(`Sticker placed successfully (${pixelCount} pixels)`);
      } else {
        await placePixel(x, y, selectedColor);
        setLastAction('Pixel placed successfully');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchCanvas();
    } catch (error) {
      console.error('Error changing pixel(s):', error);
      setLastAction(`Error: ${error instanceof Error ? error.message : 'Failed to place pixel(s)'}`);
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <ColorPicker 
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          onActionUpdate={setLastAction}
        />
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
        <StickerEditor
          selectedColor={selectedColor}
          stickerCanvas={stickerCanvas}
          stickerPattern={stickerPattern}
          onStickerPixelClick={handleStickerPixelClickWrapper}
          onClearSticker={clearStickerWrapper}
        />
      )}

      <CanvasGrid
        canvas={canvas}
        placementPreview={placementPreview}
        isDrawingSticker={isDrawingSticker}
        stickerPattern={stickerPattern}
        onCanvasClick={handleCanvasClick}
        onCanvasMouseMove={handleCanvasMouseMoveWrapper}
        onCanvasMouseLeave={handleCanvasMouseLeave}
      />
    </div>
  );
};

export default Canvas;
