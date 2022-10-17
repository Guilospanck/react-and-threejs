import { useEffect, useRef } from 'react'
import { UseHomeViewModelReturnType } from '../types'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export const useHomeViewModel = (): UseHomeViewModelReturnType => {
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const sceneRef = useRef<THREE.Scene>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()

  useEffect(() => {
    rendererRef.current = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl') })
    rendererRef.current.setSize(window.innerWidth, window.innerHeight)

    sceneRef.current = new THREE.Scene()
    cameraRef.current = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    const orbit = new OrbitControls(cameraRef.current, rendererRef.current.domElement)

    cameraRef.current.position.set(10, 15, -22)

    orbit.update()

    const planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false
      })
    )
    planeMesh.rotateX(-Math.PI / 2)

    sceneRef.current.add(planeMesh)

    const grid = new THREE.GridHelper(20, 20)

    sceneRef.current.add(grid)

    const highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
      })
    )
    highlightMesh.rotateX(-Math.PI / 2)
    highlightMesh.position.set(0.5, 0, 0.5)

    sceneRef.current.add(highlightMesh)

    rendererRef.current.setAnimationLoop(animate)
  }, [])

  const animate = () => {
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }

  return {
    val: 1
  }
}
