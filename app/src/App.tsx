import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { XR, createXRStore, useXRHitTest, useXREvent } from '@react-three/xr'
import { Matrix4, Vector3, type Mesh } from 'three'

const store = createXRStore({ hitTest: true })

function Reticle({ onSelect }: { onSelect: (position: Vector3) => void }) {
  const ref = useRef<Mesh>(null)
  const [hasHit, setHasHit] = useState(false)
  const matrixHelper = useRef(new Matrix4())
  const position = useRef(new Vector3())

  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length === 0) {
        setHasHit(false)
        return
      }
      getWorldMatrix(matrixHelper.current, results[0])
      position.current.setFromMatrixPosition(matrixHelper.current)
      setHasHit(true)
    },
    'viewer',
    'plane',
  )

  useFrame(() => {
    if (hasHit && ref.current) {
      ref.current.position.copy(position.current)
    }
  })

  // Posiciona o objeto em qualquer evento de seleção (toque na tela ou
  // gatilho do controlador), sem exigir que o raio acerte o anel fino da
  // retícula, que na prática é um alvo pequeno demais pra clicar com precisão.
  useXREvent('select', () => {
    if (hasHit) {
      onSelect(position.current.clone())
    }
  })

  return (
    <mesh ref={ref} visible={hasHit} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.08, 0.1, 32]} />
      <meshBasicMaterial color="white" />
    </mesh>
  )
}

function PlacedMarker({ position }: { position: Vector3 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

export default function App() {
  const [placed, setPlaced] = useState<Vector3[]>([])

  return (
    <>
      <button
        type="button"
        onClick={() => store.enterAR()}
        className="absolute top-5 left-1/2 z-10 -translate-x-1/2 rounded-md bg-white px-6 py-3 text-base font-medium shadow-md"
      >
        Entrar em AR
      </button>
      <Canvas>
        <XR store={store}>
          <ambientLight intensity={1} />
          <directionalLight position={[1, 2, 1]} />
          <Reticle onSelect={(position) => setPlaced((prev) => [...prev, position])} />
          {placed.map((position, index) => (
            <PlacedMarker key={index} position={position} />
          ))}
        </XR>
      </Canvas>
    </>
  )
}
