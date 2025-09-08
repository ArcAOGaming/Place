import { Canvas } from './components/Canvas'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AO Place: The First Hyperbeam Game</h1>
        <p className={styles.subtitle}>
          Running on AO's Hyperbeam - a decentralized game engine for real-time multiplayer experiences
        </p>
      </header>

      <section className={styles.howTo}>
        <h2>How to Play</h2>
        <div className={styles.instructions}>
          <div className={styles.step}>
            <h3>1. Connect Your Wallet</h3>
            <p>Use an Arweave wallet to participate in the canvas</p>
          </div>
          <div className={styles.step}>
            <h3>2. Choose Your Mode</h3>
            <p>Pick between single pixel placement or create custom stickers</p>
          </div>
          <div className={styles.step}>
            <h3>3. Select Colors</h3>
            <p>Choose from our palette of vibrant colors</p>
          </div>
          <div className={styles.step}>
            <h3>4. Create & Place</h3>
            <p>Click to place pixels or design and apply stickers</p>
          </div>
        </div>
      </section>

      <Canvas />

      <footer className={styles.footer}>
        <p>Built on AO's Hyperbeam Network</p>
        <p>Join the decentralized pixel art revolution!</p>
      </footer>
    </div>
  )
}

export default App
