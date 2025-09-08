import { Canvas } from './components/Canvas'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AO Pixel Art: The First Hyperbeam Game</h1>
        <p className={styles.subtitle}>
          Running on AO's Hyperbeam - a decentralized game engine for real-time multiplayer experiences
        </p>
      </header>

      <main className={styles.main}>
        <Canvas />
      </main>

      <footer className={styles.footer}>
        <p>Built on AO's Hyperbeam Network</p>
        <p>Join the decentralized pixel art revolution!</p>
      </footer>
    </div>
  )
}

export default App
