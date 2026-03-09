import * as THREE from 'three'
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js'
import { openBook, nextPage, prevPage } from '../book/book.js'

let renderer, scene, book
let controller1, controller2
let controllerGrip1, controllerGrip2
const controllerModelFactory = new XRControllerModelFactory()

export function setupVRInteraction(rnd, scn, bk) {
  renderer = rnd
  scene = scn
  book = bk

  controller1 = renderer.xr.getController(0)
  controller1.addEventListener('selectstart', onSelectStart)
  controller1.addEventListener('selectend', onSelectEnd)
  scene.add(controller1)

  controller2 = renderer.xr.getController(1)
  controller2.addEventListener('selectstart', onSelectStart)
  controller2.addEventListener('selectend', onSelectEnd)
  scene.add(controller2)

  controllerGrip1 = renderer.xr.getControllerGrip(0)
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1))
  scene.add(controllerGrip1)

  controllerGrip2 = renderer.xr.getControllerGrip(1)
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2))
  scene.add(controllerGrip2)

  addControllerRay(controller1)
  addControllerRay(controller2)
}

function addControllerRay(controller) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ])

  const material = new THREE.LineBasicMaterial({
    color: 0xc9a96e,
    transparent: true,
    opacity: 0.5
  })

  const line = new THREE.Line(geometry, material)
  line.scale.z = 3
  controller.add(line)
}

function onSelectStart(event) {
  const controller = event.target

  const raycaster = new THREE.Raycaster()
  const tempMatrix = new THREE.Matrix4()

  tempMatrix.identity().extractRotation(controller.matrixWorld)

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

  const intersects = raycaster.intersectObjects(scene.children, true)

  for (const intersect of intersects) {
    if (intersect.object.userData.isBook) {
      if (!book.isOpen) {
        openBook(book)
      } else {
        const localPoint = book.group.worldToLocal(intersect.point.clone())
        if (localPoint.x > 0) {
          nextPage(book)
        } else {
          prevPage(book)
        }
      }
      return
    }
  }
}

function onSelectEnd(event) {
}
