import * as THREE from 'three'
import { VRButton } from 'three/addons/webxr/VRButton.js'

import { createLibrary } from './scene/library.js'
import { createDesk } from './scene/desk.js'
import { createLighting, updateLighting } from './scene/lighting.js'
import { createAtmosphere, updateAtmosphere } from './scene/atmosphere.js'
import { createBook, updateBook } from './book/book.js'
import { setupMouseInteraction } from './interaction/mouse.js'
import { setupVRInteraction } from './interaction/vr.js'
import { fetchAndParseManifest } from './iiif/loader.js'
import { hideLoadingOverlay } from './loading/loading.js'
import { initAudio, startAmbience, playPageTurn} from './audio/ambience.js'

const MANIFEST_URL = 'https://figgy.princeton.edu/concern/scanned_resources/cd460a0c-450f-4beb-8bd1-6d4ee3078d72/manifest'

class CozyReader {
  constructor(manifest) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0604)
    this.scene.fog = new THREE.FogExp2(0x0a0604, 0.08)

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this.camera.position.set(0, 1.6, 1.5)
    this.camera.lookAt(0, 0.8, 0)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.renderer.xr.enabled = true

    document.getElementById('container').appendChild(this.renderer.domElement)

    this.clock = new THREE.Clock()
    this.book = null
    this.manifest = null
    this.audioInitialized = false

    this.setupVR()
    this.init(manifest)
  }

  setupVR() {
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (supported) {
          const vrButton = VRButton.createButton(this.renderer)
          document.body.appendChild(vrButton)
          document.getElementById('vr-button').style.display = 'none'
        }
      })
    }
  }

  async init(manifest) {
    createLibrary(this.scene)
    createDesk(this.scene)
    createLighting(this.scene)
    createAtmosphere(this.scene)

    this.manifest = await fetchAndParseManifest(manifest)

    this.book = await createBook(this.scene, this.manifest, playPageTurn)

    setupMouseInteraction(this.camera, this.scene, this.book, this.renderer)
    setupVRInteraction(this.renderer, this.scene, this.book)

    window.addEventListener('resize', () => this.onResize())

    document.addEventListener('click', () => this.initAudioOnInteraction(), { once: true })
    document.addEventListener('keydown', () => this.initAudioOnInteraction(), { once: true })

    hideLoadingOverlay()

    this.renderer.setAnimationLoop((time) => this.animate(time))
  }

  initAudioOnInteraction() {
    if (!this.audioInitialized) {
      this.audioInitialized = true
      initAudio()
      startAmbience()
    }
  }

  animate(_time) {
    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    updateLighting(elapsed)
    updateAtmosphere(elapsed)

    if (this.book) {
      updateBook(this.book, delta)
    }

    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

const urlParams = new URLSearchParams(window.location.search);
const manifest = urlParams.get('manifest'); // Returns '123'
new CozyReader(manifest || MANIFEST_URL)
