import * as THREE from 'three'
import { openBook, closeBook, nextPage, prevPage } from '../book/book.js'

let camera, scene, book, renderer
let raycaster, mouse
let isLeaningIn = false
let leanProgress = 0
const LEAN_SPEED = 2.5

const originalCameraPos = new THREE.Vector3()
const originalCameraLookAt = new THREE.Vector3()
const leanTargetPos = new THREE.Vector3()
const leanTargetLookAt = new THREE.Vector3()

export function setupMouseInteraction(cam, scn, bk, rnd) {
  camera = cam
  scene = scn
  book = bk
  renderer = rnd

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  originalCameraPos.copy(camera.position)
  originalCameraLookAt.set(0, 0.8, 0)

  // Lean position: directly above the book, looking straight down for reading
  leanTargetPos.set(0, 1.2, 0.15)
  leanTargetLookAt.set(0, 0.82, 0.1)

  renderer.domElement.addEventListener('click', onMouseClick)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  animate()
}

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children, true)

  for (const intersect of intersects) {
    if (intersect.object.userData.isBook) {
      if (!book.isOpen) {
        openBook(book)
      }
      return
    }
  }

  if (book.isOpen) {
    if (mouse.x > 0.2) {
      nextPage(book)
    } else if (mouse.x < -0.2) {
      prevPage(book)
    }
  }
}

function onKeyDown(event) {
  if (event.key === 'Shift') {
    // Toggle lean mode
    isLeaningIn = !isLeaningIn
  }

  if (event.key === 'ArrowRight' || event.key === 'd') {
    nextPage(book)
  } else if (event.key === 'ArrowLeft' || event.key === 'a') {
    prevPage(book)
  }

  if (event.key === 'Enter' || event.key === ' ') {
    if (!book.isOpen) {
      openBook(book)
    }
  }

  if (event.key === 'Escape') {
    if (book.isOpen) {
      closeBook(book)
    }
  }
}

function onKeyUp(event) {
  // Shift is now a toggle, no action needed on key up
}

function animate() {
  requestAnimationFrame(animate)

  if (isLeaningIn && leanProgress < 1) {
    leanProgress = Math.min(1, leanProgress + 0.016 * LEAN_SPEED)
  } else if (!isLeaningIn && leanProgress > 0) {
    leanProgress = Math.max(0, leanProgress - 0.016 * LEAN_SPEED)
  }

  const easedProgress = easeInOutCubic(leanProgress)
  camera.position.lerpVectors(originalCameraPos, leanTargetPos, easedProgress)

  // Also adjust where camera looks
  const currentLookAt = new THREE.Vector3()
  currentLookAt.lerpVectors(originalCameraLookAt, leanTargetLookAt, easedProgress)
  camera.lookAt(currentLookAt)
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
