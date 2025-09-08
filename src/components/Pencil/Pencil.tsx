import styles from './Pencil.module.css';

interface PencilProps {
  selectedColor: number[];
  onActionUpdate: (action: string) => void;
}

export const Pencil = ({ selectedColor, onActionUpdate }: PencilProps) => {
  const handlePencilSelect = () => {
    onActionUpdate(`Pencil tool selected with color: RGB(${selectedColor.join(', ')})`);
  };

  return (
    <div className={styles.pencil} onClick={handlePencilSelect}>
      <div className={styles.pencilIcon}>
        <div className={styles.pencilBody}>
          <div className={styles.pencilWood}></div>
          <div 
            className={styles.pencilTip}
            style={{
              backgroundColor: `rgb(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]})`
            }}
          ></div>
        </div>
        <div className={styles.pencilEraser}></div>
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
