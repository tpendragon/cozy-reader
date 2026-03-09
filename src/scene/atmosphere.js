import * as THREE from 'three'

let dustParticles = null
const particleCount = 200

export function createAtmosphere(scene) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const velocities = new Float32Array(particleCount * 3)
  const opacities = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6
    positions[i * 3 + 1] = Math.random() * 4 + 0.5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6

    velocities[i * 3] = (Math.random() - 0.5) * 0.002
    velocities[i * 3 + 1] = Math.random() * 0.001 + 0.0005
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002

    opacities[i] = Math.random() * 0.3 + 0.1
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))

  const material = new THREE.PointsMaterial({
    color: 0xffddaa,
    size: 0.02,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  dustParticles = new THREE.Points(geometry, material)
  scene.add(dustParticles)
}

export function updateAtmosphere(time) {
  if (!dustParticles) return

  const positions = dustParticles.geometry.attributes.position.array
  const velocities = dustParticles.geometry.attributes.velocity.array

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3

    positions[i3] += velocities[i3]
    positions[i3 + 1] += velocities[i3 + 1]
    positions[i3 + 2] += velocities[i3 + 2]

    positions[i3] += Math.sin(time + i) * 0.0005
    positions[i3 + 2] += Math.cos(time * 0.7 + i) * 0.0005

    if (positions[i3 + 1] > 5) {
      positions[i3 + 1] = 0.5
      positions[i3] = (Math.random() - 0.5) * 6
      positions[i3 + 2] = (Math.random() - 0.5) * 6
    }

    if (Math.abs(positions[i3]) > 3) {
      positions[i3] = -positions[i3] * 0.9
    }
    if (Math.abs(positions[i3 + 2]) > 3) {
      positions[i3 + 2] = -positions[i3 + 2] * 0.9
    }
  }

  dustParticles.geometry.attributes.position.needsUpdate = true
}
