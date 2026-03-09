import * as THREE from 'three'
import { getPageImageUrl } from '../iiif/manifest.js'

// THANK YOU https://zachernuk.neocities.org/2021/gutenberg/

// Book dimensions
const PAGE_WIDTH = 0.28
const PAGE_HEIGHT = 0.38
const PAGE_THICKNESS = 0.002

// Bone configuration for page curl
const BONE_COUNT = 10
const SEGMENT_COUNT = BONE_COUNT - 1

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

export async function createBook(scene, manifest, playPageTurn) {
  // Calculate number of physical pages (each has front and back)
  const physicalPageCount = Math.ceil(manifest.pages.length / 2)

  const book = {
    group: new THREE.Group(),
    isOpen: true,  // Start open
    manifest,
    pages: [],
    physicalPageCount,
    totalImages: manifest.pages.length,
    openness: 1,
    targetOpenness: 1,
    currentTurn: 0,      // Which page is currently being turned (0 to physicalPageCount)
    targetTurn: 0,
    textureCache: new Map(),
    textureLoader: new THREE.TextureLoader(),
    playPageTurn: playPageTurn
  }

  createBookBase(book)
  createPages(book)
  await preloadTextures(book, 0, 4)

  book.group.position.set(0, 0.82, 0.1)
  scene.add(book.group)

  return book
}

function createBookBase(book) {
  // Richer, darker material for an antique leather/cloth feel
  const coverMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1610, 
    roughness: 0.85,
    metalness: 0.05
  })

  // Dimensions relative to your pages to create the classic overhang
  const coverWidth = PAGE_WIDTH + 0.015
  const coverDepth = PAGE_HEIGHT + 0.02 
  const coverThickness = 0.006
  const spineWidth = 0.03

  const baseGroup = new THREE.Group()

  // Right Cover Board
  const rightCoverGeo = new THREE.BoxGeometry(coverWidth, coverThickness, coverDepth)
  const rightCover = new THREE.Mesh(rightCoverGeo, coverMaterial)
  // Shift right so the left edge meets the spine perfectly
  rightCover.position.set(coverWidth / 2 + spineWidth / 2, -coverThickness / 2, 0)
  rightCover.receiveShadow = true
  baseGroup.add(rightCover)

  // Left Cover Board
  const leftCoverGeo = new THREE.BoxGeometry(coverWidth, coverThickness, coverDepth)
  const leftCover = new THREE.Mesh(leftCoverGeo, coverMaterial)
  // Shift left so the right edge meets the spine
  leftCover.position.set(-(coverWidth / 2 + spineWidth / 2), -coverThickness / 2, 0)
  leftCover.receiveShadow = true
  baseGroup.add(leftCover)

  // Inner Hinge / Crease
  // A dark strip where the pages meet the spine to hide the gap and add depth
  const hingeMaterial = new THREE.MeshStandardMaterial({ color: 0x140a07, roughness: 0.9 })
  const hingeGeo = new THREE.PlaneGeometry(spineWidth, coverDepth)
  hingeGeo.rotateX(-Math.PI / 2)
  const hinge = new THREE.Mesh(hingeGeo, hingeMaterial)
  hinge.position.set(0, 0, 0)
  hinge.receiveShadow = true
  baseGroup.add(hinge)

  baseGroup.userData.isBook = true
  book.group.add(baseGroup)
}

function createPages(book) {
  // Create physical pages - limit for performance
  const pageCount = Math.min(book.physicalPageCount, 30)

  for (let i = 0; i < pageCount; i++) {
    const page = createPage(i)
    // Initial position - will be updated in updatePage
    page.group.position.set(0, 0.005 + (pageCount - i) * PAGE_THICKNESS, 0)
    page.pageIndex = i
    book.pages.push(page)
    book.group.add(page.group)
  }
}

function createPage(pageIndex) {
  const group = new THREE.Group()
  const segmentWidth = PAGE_WIDTH / SEGMENT_COUNT

  // Create bones for curling effect
  const bones = []
  const rootBone = new THREE.Bone()
  rootBone.position.set(0, 0, 0)
  bones.push(rootBone)

  let parentBone = rootBone
  for (let i = 1; i < BONE_COUNT; i++) {
    const bone = new THREE.Bone()
    bone.position.set(segmentWidth, 0, 0)
    parentBone.add(bone)
    bones.push(bone)
    parentBone = bone
  }

  // Front side - faces up when page is on right (unturned)
  const frontGeometry = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, SEGMENT_COUNT, 1)
  frontGeometry.rotateX(-Math.PI / 2)
  frontGeometry.translate(PAGE_WIDTH / 2, 0, 0)
  addSkinningAttributes(frontGeometry)

  const frontMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    roughness: 0.8,
    metalness: 0,
    side: THREE.FrontSide
  })

  const frontSkeleton = new THREE.Skeleton(bones)
  const frontMesh = new THREE.SkinnedMesh(frontGeometry, frontMaterial)
  frontMesh.add(bones[0])
  frontMesh.bind(frontSkeleton)
  frontMesh.castShadow = true
  frontMesh.receiveShadow = true
  frontMesh.frustumCulled = false

  // Back side - clone bones for independent skeleton
  const backBones = cloneBoneHierarchy(bones)

  const backGeometry = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, SEGMENT_COUNT, 1)
  backGeometry.rotateX(Math.PI / 2)
  backGeometry.translate(PAGE_WIDTH / 2, 0, 0)
  addSkinningAttributes(backGeometry)

  // Flip UVs so texture appears right-side up after 180° rotation
  const uvs = backGeometry.attributes.uv
  for (let i = 0; i < uvs.count; i++) {
    uvs.setX(i, 1 - uvs.getX(i))
    uvs.setY(i, 1 - uvs.getY(i))
  }
  uvs.needsUpdate = true

  const backMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    roughness: 0.8,
    metalness: 0,
    side: THREE.FrontSide
  })

  const backSkeleton = new THREE.Skeleton(backBones)
  const backMesh = new THREE.SkinnedMesh(backGeometry, backMaterial)
  backMesh.add(backBones[0])
  backMesh.bind(backSkeleton)
  backMesh.castShadow = true
  backMesh.receiveShadow = true
  backMesh.frustumCulled = false
  backMesh.position.y = -0.0005

  group.add(frontMesh)
  group.add(backMesh)

  return {
    group,
    frontMesh,
    backMesh,
    frontMaterial,
    backMaterial,
    bones: frontSkeleton.bones,
    backBones: backSkeleton.bones,
    turnProgress: 0,
    frontTextureIdx: pageIndex * 2,
    backTextureIdx: pageIndex * 2 + 1
  }
}

function cloneBoneHierarchy(bones) {
  const cloned = []
  const root = new THREE.Bone()
  root.position.copy(bones[0].position)
  cloned.push(root)

  let parent = root
  for (let i = 1; i < bones.length; i++) {
    const bone = new THREE.Bone()
    bone.position.copy(bones[i].position)
    parent.add(bone)
    cloned.push(bone)
    parent = bone
  }
  return cloned
}

function addSkinningAttributes(geometry) {
  const positions = geometry.attributes.position
  const skinIndices = []
  const skinWeights = []

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const normalizedX = x / PAGE_WIDTH
    const boneFloat = normalizedX * SEGMENT_COUNT
    const boneIndex = Math.floor(Math.max(0, Math.min(SEGMENT_COUNT - 1, boneFloat)))
    const blend = boneFloat - boneIndex

    skinIndices.push(boneIndex, Math.min(boneIndex + 1, BONE_COUNT - 1), 0, 0)
    skinWeights.push(1 - blend, blend, 0, 0)
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))
}

async function preloadTextures(book, startIdx, count) {
  const promises = []
  for (let i = startIdx; i < Math.min(startIdx + count, book.totalImages); i++) {
    promises.push(loadTexture(book, i))
  }
  await Promise.all(promises)
  applyTexturesToPages(book)
}

async function loadTexture(book, imageIndex) {
  if (imageIndex < 0 || imageIndex >= book.totalImages) return null
  if (book.textureCache.has(imageIndex)) return book.textureCache.get(imageIndex)

  const url = getPageImageUrl(book.manifest.pages[imageIndex], { height: 1200 })

  try {
    const texture = await new Promise((resolve, reject) => {
      book.textureLoader.load(url, tex => {
        tex.colorSpace = THREE.SRGBColorSpace
        resolve(tex)
      }, undefined, reject)
    })
    book.textureCache.set(imageIndex, texture)
    return texture
  } catch (e) {
    console.warn(`Failed to load image ${imageIndex}:`, e)
    return null
  }
}

function applyTexturesToPages(book) {
  book.pages.forEach((page, physicalIdx) => {
    // Physical page N has:
    // - Front (visible on right): Image 2N
    // - Back (visible on left when turned): Image 2N + 1
    const frontImageIdx = physicalIdx * 2
    const backImageIdx = physicalIdx * 2 + 1

    const frontTex = book.textureCache.get(frontImageIdx)
    if (frontTex && page.frontMaterial.map !== frontTex) {
      page.frontMaterial.map = frontTex
      page.frontMaterial.needsUpdate = true
    }

    const backTex = book.textureCache.get(backImageIdx)
    if (backTex && page.backMaterial.map !== backTex) {
      page.backMaterial.map = backTex
      page.backMaterial.needsUpdate = true
    }
  })
}

export function updateBook(book, delta) {
  // Smooth openness
  if (book.isOpen) {
    book.targetOpenness = 1
  } else {
    book.targetOpenness = 0
  }
  book.openness = lerp(book.openness, book.targetOpenness, delta * 3)

  // Smooth page turning
  book.currentTurn = lerp(book.currentTurn, book.targetTurn, delta * 4)

  // Snap when close to target
  if (Math.abs(book.currentTurn - book.targetTurn) < 0.01) {
    book.currentTurn = book.targetTurn
  }

  // Update all pages
  book.pages.forEach((page, idx) => {
    updatePage(book, page, idx, delta)
  })

  // Preload textures for upcoming pages
  const currentPhysicalPage = Math.floor(book.targetTurn)
  preloadTextures(book, currentPhysicalPage * 2, 6)
}

function updatePage(book, page, pageIndex, delta) {
  const pageCount = book.pages.length

  // Calculate target turn progress for this page
  const turnTarget = smoothstep(pageIndex, pageIndex + 1, book.currentTurn)
  page.turnProgress = lerp(page.turnProgress, turnTarget, delta * 5)

  // Snap to target when very close
  if (Math.abs(page.turnProgress - turnTarget) < 0.01) {
    page.turnProgress = turnTarget
  }

  const Y_SPACING = 0.00001
  const rightStackY = (pageCount - pageIndex) * Y_SPACING
  const leftStackY = pageIndex * Y_SPACING
  
  page.group.position.y = 0.001 + lerp(rightStackY, leftStackY, page.turnProgress)

  // Apply rotation and fanning (leave your current applyPageDeformation as is!)
  applyPageDeformation(page, pageCount, pageIndex)
}

function applyPageDeformation(page, pageCount, pageIndex) {
  const turn = page.turnProgress
  const bones = page.bones
  const backBones = page.backBones
  const boneCount = bones.length

  // The maximum angle the pages fan upwards from the spine
  const maxFanAngle = Math.PI / 12

  // Prevent division by zero if testing with only 1 page
  const pageDivisor = Math.max(1, pageCount - 1)

  // Calculate the fan angles for this specific page on both sides
  // Right stack: page 0 is top (max angle), last page is bottom (0 angle)
  const rightFanAngle = (1 - (pageIndex / pageDivisor)) * maxFanAngle
  
  // Left stack: page 0 is bottom (0 angle), last page is top (max angle)
  // Note: left side angles are negative so they stack inwards from 180 degrees
  const leftFanAngle = -(pageIndex / pageDivisor) * maxFanAngle

  // Interpolate the root spine rotation
  const spineRotation = lerp(rightFanAngle, Math.PI + leftFanAngle, turn)

  const flattenAngle = lerp(-rightFanAngle, -leftFanAngle, turn)

  // Distribute this flattening curve over the first few bones near the spine
  // to create that classic drooping gutter curve.
  const bendBones = 4
  const perBoneFlatten = flattenAngle / bendBones

  // Active turning curl (peaks mid-air, drops to 0 when resting flat)
  const curlIntensity = Math.sin(turn * Math.PI) * 0.15

  for (let i = 0; i < boneCount; i++) {
    let rotation = 0

    if (i === 0) {
      // Root bone handles the main flip and fanning base
      rotation = spineRotation
    } else {
      // 1. Apply mid-air droop
      const boneT = i / (boneCount - 1)
      rotation += curlIntensity * Math.sin(boneT * Math.PI)

      // 2. Apply the resting flattening curve to the bones near the spine
      if (i <= bendBones) {
        rotation += perBoneFlatten
      }
    }

    // Apply to both front and back skeletons
    bones[i].rotation.z = rotation
    backBones[i].rotation.z = rotation
  }
}

export function openBook(book) {
  book.isOpen = true
}

export function closeBook(book) {
  book.isOpen = false
}

export function nextPage(book) {
  if (!book.isOpen) return
  if (book.targetTurn >= book.physicalPageCount) return
  book.playPageTurn()
  book.targetTurn += 1
}

export function prevPage(book) {
  if (!book.isOpen) return
  if (book.targetTurn <= 0) return
  book.playPageTurn()
  book.targetTurn -= 1
}
