import { useEffect, useRef } from 'react'
import { UseHomeViewModelReturnType } from '../types'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BASE64_TEXTURES } from '../textures/index'

type GridProps = {
  width?: number, height?: number
}
type MeshProps = {
  width?: number, height?: number, visible?: boolean, transparent?: boolean, color?: THREE.Color,
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
  const objectsRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material>[]>([])
  const arrowRef = useRef<THREE.ArrowHelper>()

  useEffect(() => {
    buildSceneAndNecessaryFeatures()

    /** Creates plane meshes */
    const planeMesh = meshBuilder({})
    planeMesh.rotateX(-Math.PI / 2)
    // currentMap(GRID_LENGTH, 0)

    const anotherPlaneMesh = meshBuilder({})
    anotherPlaneMesh.rotateX(-Math.PI / 2) // when rotating an object, you are also rotating its coordinate axes
    anotherPlaneMesh.translateZ(FLOOR_HEIGHT) // this is why here we're using translateZ
    // currentMap(GRID_LENGTH, FLOOR_HEIGHT)

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

    /** Texture Ref */
    const mesh = meshBuilder({ width: 4, height: 4, visible: true })
    addTextureToMeshAndCorrectItsPositionAndRotation({ mesh, xCoord: 6, zCoord: 6, imageBase64: BASE64_TEXTURES.reaktorLogo })

    /** Adds highlighted mesh to our scene */
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

  /** Mouse Move event */
  useEffect(() => {
    const callback = (e: MouseEvent) => {
      /** Reset used variables */
      intersectsRef.current = []
      highlightMeshRef.current.material.color.setHex(0xFFFFFF)

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
        // eslint-disable-next-line dot-notation
        if (object.parent.type !== 'Scene' || object.type !== 'Mesh' || !('geometry' in object) || object['geometry'].type !== 'PlaneGeometry') { continue }
        const intersect = intersectsRef.current[i]
        meshIntersects.push(intersect)
      }

      /** Sort it so the highest plane will have priority over a lowest one */
      meshIntersects = meshIntersects.sort((a, b) => {
        const aPositionZ = a.object.position.z
        const bPositionZ = b.object.position.z

        if (aPositionZ > bPositionZ) { return -1 }
        if (aPositionZ < bPositionZ) { return 1 }
        return 0
      })

      intersectsRef.current = meshIntersects

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

  /** Mouse Down event */
  useEffect(() => {
    const sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 4, 2),
      new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xFFEA00
      })
    )

    const callback = () => {
      /** If not inside the grid, return */
      if (intersectsRef.current.length === 0) { return }

      console.log(highlightMeshRef.current.position)

      /** If an object already exists, return */
      const objectExist = objectsRef.current.find(obj =>
        obj.position.x === highlightMeshRef.current.position.x &&
        obj.position.z === highlightMeshRef.current.position.z)
      if (objectExist) { return }

      /** Clones object and adds it to the scene */
      const sphereClone = sphereMesh.clone()
      sphereClone.position.copy(highlightMeshRef.current.position)
      sphereClone.position.y = sphereClone.position.y + 0.4
      sceneRef.current.add(sphereClone)

      /** Change the color of the highlighted mesh */
      highlightMeshRef.current.material.color.setHex(0x00FFFF)

      /** Add raycaster helper */
      if (arrowRef.current) {
        sceneRef.current.remove(arrowRef.current)
      }
      arrowRef.current = new THREE.ArrowHelper(raycasterRef.current.ray.direction, raycasterRef.current.ray.origin, 200, 0xFFA500)
      sceneRef.current.add(arrowRef.current)

      /** Updated the objects array */
      objectsRef.current.push(sphereClone)
    }

    window.addEventListener('mousedown', callback)

    return () => window.removeEventListener('mousedown', callback)
  }, [])

  const buildSceneAndNecessaryFeatures = () => {
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
    cameraRef.current.position.set(0, 40, 0)

    orbit.update()
  }

  const gridBuilder = ({ width = GRID_LENGTH, height = GRID_LENGTH }: GridProps): THREE.GridHelper => {
    return new THREE.GridHelper(width, height)
  }

  const meshBuilder = ({ width = GRID_LENGTH, height = GRID_LENGTH, visible = false, transparent = false, color = new THREE.Color(0xffffff) }: MeshProps): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> => {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible,
        transparent,
        color
      })
    )
  }

  const addTextureToMeshAndCorrectItsPositionAndRotation = async ({ mesh, xCoord, zCoord, imageBase64 }: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>, xCoord: number, zCoord: number, imageBase64: string }) => {
    const texture = await loadTextureAsync(imageBase64)
    mesh.material.map = texture

    putMeshIntoTheRightPlaneAndCoordinates(mesh, xCoord, zCoord)
  }

  /**
   * Loads some texture image asynchronously.
   *
   * @param imageBase64 A base64 image to be displayed in BASE64 format.
   */
  const loadTextureAsync = async (imageBase64: string = BASE64_TEXTURES.reaktorLogo): Promise<THREE.Texture> => {
    const textureLoader = new THREE.TextureLoader()
    const texture = await textureLoader.loadAsync(imageBase64)

    return texture
  }

  const putMeshIntoTheRightPlaneAndCoordinates = (mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>, xCoord: number, zCoord: number) => {
    mesh.rotateX(-Math.PI / 2)
    mesh.position.set(xCoord, 0, zCoord)
    sceneRef.current.add(mesh)
  }

  const animate = () => {
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }

  /**
   *    0 - - - - x
   *    |
   *    |
   *    |
   *    z
 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentMap = (gridNum: number, y: number): Number[][] => {
    const matrix = []

    for (let i = -gridNum / 2; i < gridNum / 2; i++) {
      const x = i + 0.5
      for (let j = -gridNum / 2; j < gridNum / 2; j++) {
        const z = j + 0.5
        matrix.push([x, y, z])
      }
    }

    printMatrix(matrix, gridNum)
    return matrix
  }

  const printMatrix = (matrix: Number[][], gridNum: number) => {
    const longestStringLength = 16
    let print = ''

    for (let i = 0; i < matrix.length; i++) {
      if ((i + 1) % gridNum === 1) {
        print = print + '|'
      }

      const coordinates = matrix[i]
      const coordinatesStr = ` (${coordinates[0]}, ${coordinates[1]}, ${coordinates[2]})`
      const currentLength = coordinatesStr.length
      const lengthToAdd = longestStringLength - currentLength

      print = print + coordinatesStr + ' '.repeat(lengthToAdd)

      if ((i + 1) % gridNum === 0 && i !== 0) {
        print = print + ' |\n'
      }
    }

    console.log(print)
  }

  return {
    val: 1
  }
}
