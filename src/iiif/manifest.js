export function parseManifest(manifest) {
  const canvases = manifest.sequences[0].canvases

  const pages = canvases.map(canvas => ({
    label: canvas.label,
    width: canvas.width,
    height: canvas.height,
    serviceUrl: canvas.images[0].resource.service['@id']
  }))

  return { pages }
}

export function getTitle(manifest) {
  return manifest.label
}

export function getPageCount(parsed) {
  return parsed.pages.length
}

export function getPageImageUrl(page, options = {}) {
  const { size, width, height } = options

  let sizeParam
  if (size === 'full') {
    sizeParam = 'full'
  } else if (width) {
    sizeParam = `${width},`
  } else if (height) {
    sizeParam = `,${height}`
  } else {
    sizeParam = 'full'
  }

  return `${page.serviceUrl}/full/${sizeParam}/0/default.jpg`
}
