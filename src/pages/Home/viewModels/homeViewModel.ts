import { useEffect, useRef } from 'react'
import { UseHomeViewModelReturnType } from '../types'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export const useHomeViewModel = (): UseHomeViewModelReturnType => {
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const sceneRef = useRef<THREE.Scene>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const planeMeshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>()
  const highlightMeshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>()
  const raycasterRef = useRef<THREE.Raycaster>()
  const mousePositionRef = useRef<THREE.Vector2>()
  const intersectsRef = useRef<THREE.Intersection<THREE.Object3D<THREE.Event>>[]>([])
  const canvasWidthRef = useRef<number>()
  const canvasHeightRef = useRef<number>()

  useEffect(() => {
    const canvas = document.getElementById('webgl')
    canvasWidthRef.current = canvas.clientWidth
    canvasHeightRef.current = canvas.clientHeight

    rendererRef.current = new THREE.WebGLRenderer({ canvas })
    rendererRef.current.setSize(canvasWidthRef.current, canvasHeightRef.current)

    sceneRef.current = new THREE.Scene()

    const aspectRatio = canvasWidthRef.current / canvasHeightRef.current
    cameraRef.current = new THREE.PerspectiveCamera(
      45,
      aspectRatio,
      0.1,
      1000
    )

    const orbit = new OrbitControls(cameraRef.current, rendererRef.current.domElement)

    cameraRef.current.position.set(0, 35, 0)

    orbit.update()

    planeMeshRef.current = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false
      })
    )
    planeMeshRef.current.rotateX(-Math.PI / 2)
    sceneRef.current.add(planeMeshRef.current)

    const grid = new THREE.GridHelper(20, 20)
    const anotherGrid = new THREE.GridHelper(20, 20)
    anotherGrid.translateY(2)

    sceneRef.current.add(grid)
    // sceneRef.current.add(anotherGrid);

    /** Add central Highlight Mesh */
    highlightMeshRef.current = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
      })
    )
    highlightMeshRef.current.rotateX(-Math.PI / 2)
    highlightMeshRef.current.position.set(0.5, 0, 0.5)

    sceneRef.current.add(highlightMeshRef.current)

    /** Axes coordinates
     *  X = red, Y = green, Z = blue
    */
    const axesHelper = new THREE.AxesHelper(5)
    sceneRef.current.add(axesHelper)

    /** Mouse position */
    mousePositionRef.current = new THREE.Vector2()
    raycasterRef.current = new THREE.Raycaster()

    rendererRef.current.setAnimationLoop(animate)
  }, [])

  useEffect(() => {
    const callback = (e: MouseEvent) => {
      /** From https://threejs.org/docs/#api/en/core/Raycaster */
      mousePositionRef.current.x = (e.clientX / canvasWidthRef.current) * 2 - 1
      mousePositionRef.current.y = -(e.clientY / canvasHeightRef.current) * 2 + 1

      raycasterRef.current.setFromCamera(mousePositionRef.current, cameraRef.current)

      intersectsRef.current = raycasterRef.current.intersectObject(planeMeshRef.current)

      if (intersectsRef.current.length === 0) {
        return
      }

      const intersect = intersectsRef.current[0]
      const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5)
      highlightMeshRef.current.position.set(highlightPos.x, 0, highlightPos.z)
    }

    window.addEventListener('mousemove', (e) => callback(e))

    return () => window.removeEventListener('mousemove', callback)
  }, [])

  const animate = () => {
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }

  return {
    val: 1
  }
}
