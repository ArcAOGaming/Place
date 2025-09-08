import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './ColorSelector.module.css';

interface ColorSelectorProps {
  selectedColor: number[];
  onColorSelect: (color: number[]) => void;
  onActionUpdate: (action: string) => void;
}

// Color conversion utilities
const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  return [h, s * 100, v * 100];
};

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  h /= 60;
  s /= 100;
  v /= 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 1) [r, g, b] = [c, x, 0];
  else if (h >= 1 && h < 2) [r, g, b] = [x, c, 0];
  else if (h >= 2 && h < 3) [r, g, b] = [0, c, x];
  else if (h >= 3 && h < 4) [r, g, b] = [0, x, c];
  else if (h >= 4 && h < 5) [r, g, b] = [x, 0, c];
  else if (h >= 5 && h < 6) [r, g, b] = [c, 0, x];
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
};

export const ColorSelector = ({ selectedColor, onColorSelect, onActionUpdate }: ColorSelectorProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  
  const colorAreaRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Convert current RGB to HSV for internal state
  const [h, s, v] = rgbToHsv(selectedColor[0], selectedColor[1], selectedColor[2]);
  const [hue, setHue] = useState(h);
  const [saturation, setSaturation] = useState(s);
  const [brightness, setBrightness] = useState(v);

  // Update color based on HSV values
  const updateColor = useCallback((newH: number, newS: number, newV: number) => {
    const [r, g, b] = hsvToRgb(newH, newS, newV);
    onColorSelect([r, g, b]);
    onActionUpdate(`Color selected: RGB(${r}, ${g}, ${b})`);
  }, [onColorSelect, onActionUpdate]);

  // Handle color area mouse events
  const handleColorAreaMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleColorAreaMove(e);
  };

  const handleColorAreaMove = (e: React.MouseEvent | MouseEvent) => {
    if (!colorAreaRef.current) return;
    
    const rect = colorAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    
    const newSaturation = (x / rect.width) * 100;
    const newBrightness = ((rect.height - y) / rect.height) * 100;
    
    setSaturation(newSaturation);
    setBrightness(newBrightness);
    updateColor(hue, newSaturation, newBrightness);
  };

  // Handle brightness slider events
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsSliderDragging(true);
    handleSliderMove(e);
  };

  const handleSliderMove = (e: React.MouseEvent | MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const newHue = ((rect.height - y) / rect.height) * 360;
    
    setHue(newHue);
    updateColor(newHue, saturation, brightness);
  };

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleColorAreaMove(e);
      if (isSliderDragging) handleSliderMove(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsSliderDragging(false);
    };

    if (isDragging || isSliderDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isSliderDragging, saturation, brightness, hue, updateColor]);

  const rgbToHex = (rgb: number[]) => {
    return '#' + rgb.map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  return (
    <div className={styles.colorSelector}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>Color Picker</h3>
          <button 
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className={styles.currentColor}>
          <div 
            className={styles.colorDisplay}
            style={{
              backgroundColor: `rgb(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]})`
            }}
          />
          <div className={styles.colorInfo}>
            <span>RGB({selectedColor.join(', ')})</span>
            <span>{rgbToHex(selectedColor)}</span>
          </div>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className={styles.pickerContainer}>
          <div className={styles.colorArea}
               ref={colorAreaRef}
               onMouseDown={handleColorAreaMouseDown}
               style={{
                 background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`
               }}>
            <div 
              className={styles.colorCursor}
              style={{
                left: `${saturation}%`,
                top: `${100 - brightness}%`
              }}
            />
          </div>
          
          <div className={styles.hueSlider}
               ref={sliderRef}
               onMouseDown={handleSliderMouseDown}>
            <div 
              className={styles.hueCursor}
              style={{
                top: `${((360 - hue) / 360) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
