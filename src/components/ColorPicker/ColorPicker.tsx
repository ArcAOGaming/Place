import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  selectedColor: number[];
  onColorSelect: (color: number[]) => void;
  onActionUpdate: (action: string) => void;
}

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

export const ColorPicker = ({ selectedColor, onColorSelect, onActionUpdate }: ColorPickerProps) => {
  const handleColorSelect = (color: number[]) => {
    onColorSelect(color);
    onActionUpdate(`Color selected: RGB(${color.join(', ')})`);
  };

  return (
    <div className={styles.colorPicker}>
      {predefinedColors.map((color, index) => (
        <div
          key={index}
          className={`${styles.colorOption} ${JSON.stringify(color) === JSON.stringify(selectedColor) ? styles.selected : ''}`}
          style={{
            backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
          }}
          onClick={() => handleColorSelect(color)}
        />
      ))}
    </div>
  );
};
