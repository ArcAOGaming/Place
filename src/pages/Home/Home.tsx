import { Canvas } from '../../components/Canvas'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <h1>Place</h1>
      <p>Click a color and then click on the canvas to place pixels</p>
      <Canvas />
    </div>
  )
}

export default Home
