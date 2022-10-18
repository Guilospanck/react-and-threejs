import { useEffect, useRef } from 'react'
import { UseHomeViewModelReturnType } from '../types'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type GridProps = {
  width?: number, height?: number
}
type MeshProps = {
  width?: number, height?: number, visible?: boolean, transparent?: boolean
}

export const useHomeViewModel = (): UseHomeViewModelReturnType => {
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const sceneRef = useRef<THREE.Scene>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const highlightMeshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>()
  const raycasterRef = useRef<THREE.Raycaster>()
  const mousePositionRef = useRef<THREE.Vector2>()
  const intersectsRef = useRef<THREE.Intersection<THREE.Object3D<THREE.Event>>[]>([])
  const canvasWidthRef = useRef<number>()
  const canvasHeightRef = useRef<number>()
  const FLOOR_HEIGHT: number = 4 // defines the height of each floor of our "building"
  const GRID_LENGTH: number = 20

  useEffect(() => {
    /** Get canvas object */
    const canvas = document.getElementById('webgl')
    canvasWidthRef.current = canvas.clientWidth
    canvasHeightRef.current = canvas.clientHeight

    /** Create and set the size of a WebGL renderer */
    rendererRef.current = new THREE.WebGLRenderer({ canvas })
    rendererRef.current.setSize(canvasWidthRef.current, canvasHeightRef.current)

    /** Create the scene object */
    sceneRef.current = new THREE.Scene()

    /** Create a perspective camera with the aspect ratio of the Canvas */
    const aspectRatio = canvasWidthRef.current / canvasHeightRef.current
    cameraRef.current = new THREE.PerspectiveCamera(
      45,
      aspectRatio,
      0.1,
      1000
    )

    /** Orbit allows us to rotate and translate our view */
    const orbit = new OrbitControls(cameraRef.current, rendererRef.current.domElement)

    /** Defines initial camera position */
    cameraRef.current.position.set(20, 20, 20)

    orbit.update()

    /** Creates plane meshes */
    const planeMesh = meshBuilder({})
    planeMesh.rotateX(-Math.PI / 2)

    const anotherPlaneMesh = meshBuilder({})
    anotherPlaneMesh.rotateX(-Math.PI / 2) // when rotating an object, you are also rotating its coordinate axes
    anotherPlaneMesh.translateZ(FLOOR_HEIGHT) // this is why here we're using translateZ

    /** Adds our plane meshes to our scene */
    sceneRef.current.add(planeMesh)
    sceneRef.current.add(anotherPlaneMesh)

    /** Creates grid to help visualize our planes */
    const grid = gridBuilder({})
    const anotherGrid = gridBuilder({})
    anotherGrid.translateY(FLOOR_HEIGHT)

    /** Adds our grids to our scene */
    sceneRef.current.add(grid)
    sceneRef.current.add(anotherGrid)

    /** Add central Highlight Mesh */
    highlightMeshRef.current = meshBuilder({ width: 1, height: 1, transparent: true, visible: true })
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

      intersectsRef.current = raycasterRef.current.intersectObjects(sceneRef.current.children)

      if (intersectsRef.current.length === 0) {
        return
      }

      /** Get interceptions with Mesh objects */
      let meshIntersects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = []
      for (let i = 0; i < intersectsRef.current.length; i++) {
        const object = intersectsRef.current[i].object
        if (object.type !== 'Mesh') { continue }

        const intersect = intersectsRef.current[i]
        meshIntersects.push(intersect)
        meshIntersects = meshIntersects.sort((a, b) => {
          const aPositionZ = a.object.position.z
          const bPositionZ = b.object.position.z

          if (aPositionZ > bPositionZ) { return 1 }
          if (aPositionZ < bPositionZ) { return -1 }
          return 0
        })
      }

      if (meshIntersects.length === 0) { return }

      // Adds 0.5 because it will render the center of the square object (1x1), so we must offset by 0.5
      // to render it properly inside the grid
      const highlightPos = new THREE.Vector3().copy(meshIntersects[0].point).floor().addScalar(0.5)
      const currentPosition = [highlightPos.x, meshIntersects[0].object.position.y, highlightPos.z]
      highlightMeshRef.current.position.set(currentPosition[0], currentPosition[1], currentPosition[2])
    }

    window.addEventListener('mousemove', (e) => callback(e))

    return () => window.removeEventListener('mousemove', callback)
  }, [])

  const gridBuilder = ({ width = GRID_LENGTH, height = GRID_LENGTH }: GridProps): THREE.GridHelper => {
    return new THREE.GridHelper(width, height)
  }

  const meshBuilder = ({ width = GRID_LENGTH, height = GRID_LENGTH, visible = false, transparent = false }: MeshProps): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> => {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible,
        transparent
      })
    )
  }

  const animate = () => {
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }

  return {
    val: 1
  }
}
