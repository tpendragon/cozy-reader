import * as THREE from 'three'

export function createDesk(scene) {
  const group = new THREE.Group()

  const deskMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3222,
    roughness: 0.6,
    metalness: 0.1
  })

  const topGeometry = new THREE.BoxGeometry(1.8, 0.08, 1.2)
  const top = new THREE.Mesh(topGeometry, deskMaterial)
  top.position.set(0, 0.76, 0)
  top.castShadow = true
  top.receiveShadow = true
  group.add(top)

  const feltMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a4a1a,
    roughness: 0.95,
    metalness: 0
  })

  const feltGeometry = new THREE.PlaneGeometry(1.4, 0.9)
  const felt = new THREE.Mesh(feltGeometry, feltMaterial)
  felt.rotation.x = -Math.PI / 2
  felt.position.set(0, 0.81, 0)
  felt.receiveShadow = true
  group.add(felt)

  const legGeometry = new THREE.BoxGeometry(0.1, 0.76, 0.1)
  const legPositions = [
    [-0.8, 0.38, 0.5],
    [0.8, 0.38, 0.5],
    [-0.8, 0.38, -0.5],
    [0.8, 0.38, -0.5]
  ]

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, deskMaterial)
    leg.position.set(...pos)
    leg.castShadow = true
    leg.receiveShadow = true
    group.add(leg)
  })

  addCandlestick(group, -0.7, 0.81, -0.35)
  addCandlestick(group, 0.7, 0.81, -0.35)

  scene.add(group)
  return group
}

function addCandlestick(group, x, y, z) {
  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8860b,
    roughness: 0.3,
    metalness: 0.8
  })

  const baseGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.02, 16)
  const base = new THREE.Mesh(baseGeometry, brassMaterial)
  base.position.set(x, y + 0.01, z)
  base.castShadow = true
  group.add(base)

  const stemGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.12, 8)
  const stem = new THREE.Mesh(stemGeometry, brassMaterial)
  stem.position.set(x, y + 0.08, z)
  stem.castShadow = true
  group.add(stem)

  const holderGeometry = new THREE.CylinderGeometry(0.025, 0.015, 0.03, 12)
  const holder = new THREE.Mesh(holderGeometry, brassMaterial)
  holder.position.set(x, y + 0.155, z)
  holder.castShadow = true
  group.add(holder)

  const candleMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    roughness: 0.9,
    metalness: 0
  })

  const candleGeometry = new THREE.CylinderGeometry(0.015, 0.018, 0.15, 8)
  const candle = new THREE.Mesh(candleGeometry, candleMaterial)
  candle.position.set(x, y + 0.245, z)
  candle.castShadow = true
  group.add(candle)
}
