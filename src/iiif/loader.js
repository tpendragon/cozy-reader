import { parseManifest, getPageImageUrl } from './manifest.js'

export async function fetchAndParseManifest(url) {
  const response = await fetch(url)
  const data = await response.json()

  const parsed = parseManifest(data)

  return {
    ...parsed,
    raw: data
  }
}

export async function preloadImages(manifest, options = {}) {
  const { maxPreload = 6, size = { height: 1024 } } = options

  const promises = manifest.pages.slice(0, maxPreload).map(page => {
    const url = getPageImageUrl(page, size)
    return preloadImage(url)
  })

  return Promise.allSettled(promises)
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
