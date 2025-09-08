import { useState } from 'react';
import { Painter } from '../Painter';
import { CanvasGrid } from '../CanvasGrid';
import { useCanvas } from '../../hooks/useCanvas';
import { useSticker } from '../../hooks/useSticker';
import styles from './Canvas.module.css';

type DrawingMode = 'pencil' | 'sticker' | 'spray';

const DRAGGING_ENABLED = false;

const Canvas = () => {
  const [selectedColor, setSelectedColor] = useState<number[]>([0, 0, 0]);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('pencil');
  const [lastAction, setLastAction] = useState<string>('');
  const [toolPreview, setToolPreview] = useState<{x: number, y: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPixels, setDraggedPixels] = useState<Set<string>>(new Set());
  
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
    // Handle sticker preview
    handleCanvasMouseMove(x, y, drawingMode === 'sticker');
    
    // Handle tool preview for pencil and spray brush
    if (drawingMode === 'pencil' || drawingMode === 'spray') {
      setToolPreview({ x, y });
    }
    
    // Handle dragging for pencil and spray brush
    if (DRAGGING_ENABLED && isDragging && (drawingMode === 'pencil' || drawingMode === 'spray')) {
      const pixelKey = `${x},${y}`;
      if (!draggedPixels.has(pixelKey)) {
        setDraggedPixels(prev => new Set(prev).add(pixelKey));
        handlePixelDraw(x, y);
      }
    }
  };

  const handleDrawingModeChange = (mode: DrawingMode) => {
    setDrawingMode(mode);
    if (mode === 'sticker') {
      clearSticker();
      setLastAction('Switched to sticker mode');
    } else if (mode === 'spray') {
      setLastAction('Switched to spray brush mode');
    } else {
      setLastAction('Switched to pencil mode');
    }
  };

  // Color blending utility function
  const blendColors = (color1: number[], color2: number[]): number[] => {
    return [
      Math.round((color1[0] + color2[0]) / 2),
      Math.round((color1[1] + color2[1]) / 2),
      Math.round((color1[2] + color2[2]) / 2)
    ];
  };

  // Handle pixel drawing for drag operations
  const handlePixelDraw = async (x: number, y: number) => {
    try {
      if (drawingMode === 'spray') {
        const existingColor = canvas[y] && canvas[y][x] ? canvas[y][x] : [255, 255, 255];
        const blendedColor = blendColors(selectedColor, existingColor);
        await placePixel(x, y, blendedColor);
        setLastAction(`Spray brush applied at (${x}, ${y})`);
      } else {
        await placePixel(x, y, selectedColor);
        setLastAction(`Pixel placed at (${x}, ${y})`);
      }
      
      // Refresh canvas immediately after each pixel
      setTimeout(() => fetchCanvas(), 500);
    } catch (error) {
      console.error('Error drawing pixel:', error);
      setLastAction(`Error: Failed to place pixel at (${x}, ${y})`);
    }
  };

  const handleCanvasMouseDown = (x: number, y: number) => {
    if (drawingMode === 'pencil' || drawingMode === 'spray') {
      if (DRAGGING_ENABLED) {
        setIsDragging(true);
        setDraggedPixels(new Set([`${x},${y}`]));
      }
      handlePixelDraw(x, y);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggedPixels(new Set());
    // No need to refresh canvas here since each pixel already refreshes individually
  };

  const handleCanvasMouseLeaveWrapper = () => {
    handleCanvasMouseLeave();
    setToolPreview(null);
    if (DRAGGING_ENABLED && isDragging) {
      handleCanvasMouseUp();
    }
  };

  const handleCanvasClick = async (x: number, y: number) => {
    try {
      if (drawingMode === 'sticker' && stickerPattern.length > 0) {
        const pixelCount = await placeSticker(x, y, stickerPattern);
        setLastAction(`Sticker placed successfully (${pixelCount} pixels)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchCanvas();
      }
    } catch (error) {
      console.error('Error changing pixel(s):', error);
      setLastAction(`Error: ${error instanceof Error ? error.message : 'Failed to place pixel(s)'}`);
    }
  };


  return (
    <div className={styles.container}>
      <Painter
        selectedColor={selectedColor}
        drawingMode={drawingMode}
        stickerCanvas={stickerCanvas}
        stickerPattern={stickerPattern}
        onColorSelect={setSelectedColor}
        onStickerPixelClick={handleStickerPixelClickWrapper}
        onClearSticker={clearStickerWrapper}
        onDrawingModeChange={handleDrawingModeChange}
        onActionUpdate={setLastAction}
      />

      <div className={styles.canvasSection}>
        {lastAction && (
          <div className={styles.instructions}>
            {lastAction}
          </div>
        )}

        <CanvasGrid
          canvas={canvas}
          placementPreview={placementPreview}
          toolPreview={toolPreview}
          drawingMode={drawingMode}
          selectedColor={selectedColor}
          isDrawingSticker={drawingMode === 'sticker'}
          stickerPattern={stickerPattern}
          onCanvasClick={handleCanvasClick}
          onCanvasMouseDown={handleCanvasMouseDown}
          onCanvasMouseUp={handleCanvasMouseUp}
          onCanvasMouseMove={handleCanvasMouseMoveWrapper}
          onCanvasMouseLeave={handleCanvasMouseLeaveWrapper}
        />
      </div>
    </div>
  );
};

export default Canvas;
