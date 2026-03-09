import * as THREE from 'three'

export function createLibrary(scene) {
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.8,
    metalness: 0.1
  })

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1a0d,
    roughness: 0.9,
    metalness: 0.05
  })

  createFloor(scene, darkWoodMaterial)
  createWalls(scene)
  createBookshelvesLeft(scene, woodMaterial)
  createBookshelvesRight(scene, woodMaterial)
  createBackWall(scene, woodMaterial)
  createCeiling(scene, darkWoodMaterial)
}

function createFloor(scene, material) {
  const floorGeometry = new THREE.PlaneGeometry(8, 8)
  const floor = new THREE.Mesh(floorGeometry, material)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)
}

function createWalls(scene) {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1810,
    roughness: 0.9,
    metalness: 0
  })

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    wallMaterial
  )
  backWall.position.set(0, 4, -4)
  backWall.receiveShadow = true
  scene.add(backWall)

  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    wallMaterial
  )
  leftWall.position.set(-4, 4, 0)
  leftWall.rotation.y = Math.PI / 2
  leftWall.receiveShadow = true
  scene.add(leftWall)

  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    wallMaterial
  )
  rightWall.position.set(4, 4, 0)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.receiveShadow = true
  scene.add(rightWall)
}

function createBookshelvesLeft(scene, material) {
  const shelfGroup = createBookshelfUnit(material)
  shelfGroup.position.set(-3, 0, -2)
  shelfGroup.rotation.y = Math.PI / 2
  scene.add(shelfGroup)

  const shelfGroup2 = createBookshelfUnit(material)
  shelfGroup2.position.set(-3, 0, 0.5)
  shelfGroup2.rotation.y = Math.PI / 2
  scene.add(shelfGroup2)
}

function createBookshelvesRight(scene, material) {
  const shelfGroup = createBookshelfUnit(material)
  shelfGroup.position.set(3, 0, -2)
  shelfGroup.rotation.y = -Math.PI / 2
  scene.add(shelfGroup)

  const shelfGroup2 = createBookshelfUnit(material)
  shelfGroup2.position.set(3, 0, 0.5)
  shelfGroup2.rotation.y = -Math.PI / 2
  scene.add(shelfGroup2)
}

function createBookshelfUnit(material) {
  const group = new THREE.Group()

  const frameGeometry = new THREE.BoxGeometry(0.1, 6, 2)
  const leftFrame = new THREE.Mesh(frameGeometry, material)
  leftFrame.position.set(-0.95, 3, 0)
  leftFrame.castShadow = true
  leftFrame.receiveShadow = true
  group.add(leftFrame)

  const rightFrame = new THREE.Mesh(frameGeometry, material)
  rightFrame.position.set(0.95, 3, 0)
  rightFrame.castShadow = true
  rightFrame.receiveShadow = true
  group.add(rightFrame)

  const shelfGeometry = new THREE.BoxGeometry(2, 0.05, 0.4)
  for (let i = 0; i < 8; i++) {
    const shelf = new THREE.Mesh(shelfGeometry, material)
    shelf.position.set(0, 0.5 + i * 0.75, 0.8)
    shelf.castShadow = true
    shelf.receiveShadow = true
    group.add(shelf)

    addBooksToShelf(group, 0.5 + i * 0.75, 0.8)
  }

  const backGeometry = new THREE.BoxGeometry(2, 6, 0.05)
  const back = new THREE.Mesh(backGeometry, material)
  back.position.set(0, 3, 0.55)
  group.add(back)

  return group
}

function addBooksToShelf(group, y, z) {
  const bookColors = [
    0x8b0000, 0x006400, 0x00008b, 0x8b4513,
    0x2f4f4f, 0x4b0082, 0x556b2f, 0x8b008b
  ]

  let x = -0.85
  while (x < 0.85) {
    const width = 0.03 + Math.random() * 0.06
    const height = 0.15 + Math.random() * 0.15
    const depth = 0.25 + Math.random() * 0.1

    const bookMaterial = new THREE.MeshStandardMaterial({
      color: bookColors[Math.floor(Math.random() * bookColors.length)],
      roughness: 0.7,
      metalness: 0.1
    })

    const bookGeometry = new THREE.BoxGeometry(width, height, depth)
    const book = new THREE.Mesh(bookGeometry, bookMaterial)

    const tilt = (Math.random() - 0.5) * 0.1
    book.rotation.z = tilt

    book.position.set(x + width / 2, y + height / 2 + 0.025, z - depth / 2 + 0.2)
    book.castShadow = true
    book.receiveShadow = true
    group.add(book)

    x += width + 0.01
  }
}

function createBackWall(scene, material) {
  const shelfGroup = createBookshelfUnit(material)
  shelfGroup.position.set(-1.5, 0, -3)
  shelfGroup.rotation.y = 0
  scene.add(shelfGroup)

  const shelfGroup2 = createBookshelfUnit(material)
  shelfGroup2.position.set(1.5, 0, -3)
  shelfGroup2.rotation.y = 0
  scene.add(shelfGroup2)
}

function createCeiling(scene, material) {
  const ceilingGeometry = new THREE.PlaneGeometry(8, 8)
  const ceiling = new THREE.Mesh(ceilingGeometry, material)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = 6
  scene.add(ceiling)

  const beamGeometry = new THREE.BoxGeometry(0.15, 0.2, 8)
  for (let i = -1; i <= 1; i++) {
    const beam = new THREE.Mesh(beamGeometry, material)
    beam.position.set(i * 2.5, 5.9, 0)
    beam.castShadow = true
    scene.add(beam)
  }
}
