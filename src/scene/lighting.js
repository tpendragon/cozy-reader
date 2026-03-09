import * as THREE from 'three'

const candleLights = []

export function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0x2a1a0f, 0.6)
  scene.add(ambientLight)

  addCandleLight(scene, -0.7, 1.12, -0.35, 3.0)
  addCandleLight(scene, 0.7, 1.12, -0.35, 3.0)

  addWallSconce(scene, -2.8, 2.2, -1.5, 3.0)
  addWallSconce(scene, -2.8, 2.2, 0.5, 3.0)
  addWallSconce(scene, 2.8, 2.2, -1.5, 3.0)
  addWallSconce(scene, 2.8, 2.2, 0.5, 3.0)

  addWallSconce(scene, -1, 2.5, -2.8, 1.5)
  addWallSconce(scene, 1, 2.5, -2.8, 1.5)
}

function addCandleLight(scene, x, y, z, intensity) {
  const light = new THREE.PointLight(0xffaa66, intensity, 6, 1.5)
  light.position.set(x, y, z)
  light.castShadow = true
  light.shadow.mapSize.width = 512
  light.shadow.mapSize.height = 512
  light.shadow.camera.near = 0.1
  light.shadow.camera.far = 6
  light.shadow.bias = -0.002
  scene.add(light)

  candleLights.push({
    light,
    baseIntensity: intensity,
    phase: Math.random() * Math.PI * 2,
    speed: 3 + Math.random() * 2
  })
}

function addWallSconce(scene, x, y, z, intensity) {
  const light = new THREE.PointLight(0xffaa55, intensity, 10, 1.5)
  light.position.set(x, y, z)
  light.castShadow = false
  light.shadow.mapSize.width = 256
  light.shadow.mapSize.height = 256
  scene.add(light)

  candleLights.push({
    light,
    baseIntensity: intensity,
    phase: Math.random() * Math.PI * 2,
    speed: 2 + Math.random() * 2
  })
}

export function updateLighting(time) {
  candleLights.forEach(candle => {
    const flicker1 = Math.sin(time * candle.speed + candle.phase) * 0.1
    const flicker2 = Math.sin(time * candle.speed * 2.7 + candle.phase * 1.3) * 0.05
    const flicker3 = Math.sin(time * candle.speed * 5.1 + candle.phase * 0.7) * 0.03

    const randomFlicker = (Math.random() - 0.5) * 0.02

    candle.light.intensity = candle.baseIntensity * (1 + flicker1 + flicker2 + flicker3 + randomFlicker)
  })
}
