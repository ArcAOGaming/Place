import styles from './SprayBrush.module.css';

interface SprayBrushProps {
  selectedColor: number[];
  onActionUpdate: (action: string) => void;
}

export const SprayBrush = ({ selectedColor, onActionUpdate }: SprayBrushProps) => {
  const handleBrushSelect = () => {
    onActionUpdate(`Spray brush selected with color: RGB(${selectedColor.join(', ')})`);
  };

  return (
    <div className={styles.sprayBrush} onClick={handleBrushSelect}>
      <div className={styles.brushIcon}>
        <div className={styles.brushCore} style={{
          backgroundColor: `rgb(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]})`
        }} />
        <div className={styles.brushSpray}>
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className={styles.sprayDot}
              style={{
                backgroundColor: `rgba(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]}, ${0.4 + Math.random() * 0.3})`,
                transform: `rotate(${i * 45}deg) translateY(-${10 + Math.random() * 8}px)`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
      <div className={styles.colorPreview}>
        <div 
          className={styles.selectedColor}
          style={{
            backgroundColor: `rgb(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]})`
          }}
        />
      </div>
    </div>
  );
};
