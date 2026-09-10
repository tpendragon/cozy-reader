import { Vault } from '@iiif/helpers/vault'
import { createPaintingAnnotationsHelper } from '@iiif/helpers/painting-annotations'
import { getValue } from '@iiif/helpers/i18n'

const MAX_SIZE = 1024

let vault = null
let paintingHelper = null

function getVault() {
  if (!vault) {
    vault = new Vault()
    paintingHelper = createPaintingAnnotationsHelper(vault)
  }
  return { vault, paintingHelper }
}

export async function parseManifest(url, json) {
  const { vault, paintingHelper } = getVault()
  const manifest = await vault.loadManifest(url, json)

  const canvases = vault.get(manifest.items)

  const pages = canvases.map(canvas => {
    const paintables = paintingHelper.getPaintables(canvas)
    const firstImage = paintables.items.find(item => item.type === 'image')
    const resource = firstImage ? vault.get(firstImage.resource) : null

    let serviceUrl = null
    if (resource && resource.service && resource.service.length > 0) {
      const service = resource.service[0]
      serviceUrl = service.id || service['@id']
    }

    return {
      label: getValue(canvas.label),
      width: canvas.width,
      height: canvas.height,
      serviceUrl,
      imageUrl: resource ? resource.id : null
    }
  })

  return { pages, title: getValue(manifest.label) }
}

export function getTitle(parsed) {
  return parsed.title
}

export function getPageCount(parsed) {
  return parsed.pages.length
}

export function getPageImageUrl(page, options = {}) {
  const { size, width, height, maxSize = MAX_SIZE } = options

  // If we have a IIIF image service, construct a URL from it
  if (page.serviceUrl) {
    let sizeParam
    if (size === 'full') {
      sizeParam = 'full'
    } else {
      sizeParam = `${pixelWidth(page, width, height, maxSize)},`
    }

    return `${page.serviceUrl}/full/${sizeParam}/0/default.jpg`
  }

  // Fall back to the static image URL
  return page.imageUrl
}

// Get the aspect ratio ourselves so we can support level 1.
function pixelWidth(page, width, height, maxSize) {
  const aspect = page.width / page.height
  let w = width

  if (!w && height && aspect) {
    w = height * aspect
  }
  if (!w) {
    w = maxSize
  }

  w = Math.min(w, maxSize)
  if (aspect) {
    w = Math.min(w, maxSize * aspect)
  }

  return Math.max(1, Math.round(w))
}
