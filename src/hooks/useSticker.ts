import { useState } from 'react';

const STICKER_SIZE = 3;

export const useSticker = () => {
  const [stickerPattern, setStickerPattern] = useState<Array<{x: number, y: number, color: number[]}>>([]);
  const [stickerCanvas, setStickerCanvas] = useState<number[][][]>(
    Array(STICKER_SIZE).fill(0).map(() => 
      Array(STICKER_SIZE).fill(0).map(() => [255, 255, 255])
    )
  );
  const [placementPreview, setPlacementPreview] = useState<{x: number, y: number} | null>(null);

  const handleStickerPixelClick = (x: number, y: number, selectedColor: number[]) => {
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
  };

  const handleCanvasMouseMove = (x: number, y: number, isDrawingSticker: boolean) => {
    if (isDrawingSticker && stickerPattern.length > 0) {
      setPlacementPreview({ x, y });
    }
  };

  const handleCanvasMouseLeave = () => {
    setPlacementPreview(null);
  };

  return {
    stickerPattern,
    stickerCanvas,
    placementPreview,
    handleStickerPixelClick,
    clearSticker,
    handleCanvasMouseMove,
    handleCanvasMouseLeave
  };
};
