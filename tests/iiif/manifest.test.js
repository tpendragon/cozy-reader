import { describe, it, expect } from 'vitest'
import { parseManifest, getPageImageUrl, getTitle, getPageCount } from '../../src/iiif/manifest.js'

const PRINCETON = 'https://iiif-cloud.princeton.edu/iiif/2/6b%2Fd6%2F55%2F6bd655f50b7a4cff90aab200a90cfc0c%2Fintermediate_file'
const HOOD = 'https://hood.resourcespace.com/iiif/image/1189502'

const p2Manifest = {
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": "https://example.org/p2/manifest",
  "@type": "sc:Manifest",
  "label": "Lize's avonturen in 't wonderland.",
  "sequences": [{
    "@id": "https://example.org/p2/sequence",
    "@type": "sc:Sequence",
    "canvases": [
      {
        "@id": "https://example.org/p2/canvas/1",
        "@type": "sc:Canvas",
        "label": "1",
        "width": 5828,
        "height": 7200,
        "images": [{
          "@id": "https://example.org/p2/annotation/1",
          "@type": "oa:Annotation",
          "motivation": "sc:painting",
          "on": "https://example.org/p2/canvas/1",
          "resource": {
            "@id": `${PRINCETON}/full/full/0/default.jpg`,
            "@type": "dctypes:Image",
            "format": "image/jpeg",
            "width": 5828,
            "height": 7200,
            "service": {
              "@context": "http://iiif.io/api/image/2/context.json",
              "@id": PRINCETON,
              "profile": "http://iiif.io/api/image/2/level2.json"
            }
          }
        }]
      },
      {
        "@id": "https://example.org/p2/canvas/2",
        "@type": "sc:Canvas",
        "label": "2",
        "width": 5820,
        "height": 7200,
        "images": [{
          "@id": "https://example.org/p2/annotation/2",
          "@type": "oa:Annotation",
          "motivation": "sc:painting",
          "on": "https://example.org/p2/canvas/2",
          "resource": {
            "@id": "https://example.org/iiif/2/other/full/full/0/default.jpg",
            "@type": "dctypes:Image",
            "format": "image/jpeg",
            "width": 5820,
            "height": 7200,
            "service": {
              "@context": "http://iiif.io/api/image/2/context.json",
              "@id": "https://example.org/iiif/2/other",
              "profile": "http://iiif.io/api/image/2/level2.json"
            }
          }
        }]
      }
    ]
  }]
}

// A level 1 service, as served by the Hood's ResourceSpace endpoint.
const p3Manifest = {
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/p3/manifest",
  "type": "Manifest",
  "label": { "none": ["Master F.v.S Silverpoint Sketchbook"] },
  "items": [{
    "id": "https://example.org/p3/canvas/3",
    "type": "Canvas",
    "height": 6079,
    "width": 3951,
    "label": { "none": ["Master F.v.S Silverpoint Sketchbook (Front Cover)"] },
    "items": [{
      "id": "https://example.org/p3/canvas/3/annotation-page",
      "type": "AnnotationPage",
      "items": [{
        "id": "https://example.org/p3/annotation/3",
        "type": "Annotation",
        "motivation": "painting",
        "target": "https://example.org/p3/canvas/3",
        "body": {
          "id": `${HOOD}/full/max/0/default.jpg`,
          "type": "Image",
          "format": "image/jpeg",
          "height": 6079,
          "width": 3951,
          "service": [{
            "@id": HOOD,
            "@type": "ImageService2",
            "profile": "level1"
          }]
        }
      }]
    }]
  }]
}

// A canvas painted with a plain image, with no image service to size against.
const staticManifest = {
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/static/manifest",
  "type": "Manifest",
  "label": { "none": ["A single photograph"] },
  "items": [{
    "id": "https://example.org/static/canvas/1",
    "type": "Canvas",
    "height": 1000,
    "width": 800,
    "items": [{
      "id": "https://example.org/static/canvas/1/annotation-page",
      "type": "AnnotationPage",
      "items": [{
        "id": "https://example.org/static/annotation/1",
        "type": "Annotation",
        "motivation": "painting",
        "target": "https://example.org/static/canvas/1",
        "body": {
          "id": "https://example.org/images/photo.jpg",
          "type": "Image",
          "format": "image/jpeg",
          "height": 1000,
          "width": 800
        }
      }]
    }]
  }]
}

// parseManifest loads over the network unless it is handed the JSON directly.
const parse = manifest => parseManifest(manifest['@id'] || manifest.id, manifest)

describe('IIIF Manifest Parser', () => {
  describe('parseManifest', () => {
    it('extracts pages from a presentation 2 manifest', async () => {
      const result = await parse(p2Manifest)
      expect(result.pages).toHaveLength(2)
    })

    it('extracts page dimensions', async () => {
      const result = await parse(p2Manifest)
      expect(result.pages[0].width).toBe(5828)
      expect(result.pages[0].height).toBe(7200)
    })

    it('extracts image service URLs', async () => {
      const result = await parse(p2Manifest)
      expect(result.pages[0].serviceUrl).toBe(PRINCETON)
    })

    it('extracts pages from a presentation 3 manifest', async () => {
      const result = await parse(p3Manifest)
      expect(result.pages).toHaveLength(1)
      expect(result.pages[0].label).toBe('Master F.v.S Silverpoint Sketchbook (Front Cover)')
      expect(result.pages[0].width).toBe(3951)
      expect(result.pages[0].height).toBe(6079)
      expect(result.pages[0].serviceUrl).toBe(HOOD)
    })

    it('keeps the image URL for a canvas with no image service', async () => {
      const result = await parse(staticManifest)
      expect(result.pages[0].serviceUrl).toBeNull()
      expect(result.pages[0].imageUrl).toBe('https://example.org/images/photo.jpg')
    })
  })

  describe('getTitle', () => {
    it('extracts the title', async () => {
      expect(getTitle(await parse(p2Manifest))).toBe("Lize's avonturen in 't wonderland.")
    })

    it('extracts a title from a language map', async () => {
      expect(getTitle(await parse(p3Manifest))).toBe('Master F.v.S Silverpoint Sketchbook')
    })
  })

  describe('getPageCount', () => {
    it('returns number of pages', async () => {
      expect(getPageCount(await parse(p2Manifest))).toBe(2)
    })
  })

  describe('getPageImageUrl', () => {
    const portrait = { serviceUrl: HOOD, width: 3951, height: 6079 }
    const landscape = { serviceUrl: 'https://example.org/iiif/wide', width: 4000, height: 1000 }

    it('generates full quality URL', () => {
      expect(getPageImageUrl(portrait, { size: 'full' })).toBe(`${HOOD}/full/full/0/default.jpg`)
    })

    it('asks for a width, which is all a level 1 service guarantees', () => {
      expect(getPageImageUrl(portrait, { width: 500 })).toBe(`${HOOD}/full/500,/0/default.jpg`)
    })

    it('converts a requested height to a width using the aspect ratio', () => {
      // 3951 / 6079 * 600 = 389.9
      expect(getPageImageUrl(portrait, { height: 600 })).toBe(`${HOOD}/full/390,/0/default.jpg`)
    })

    it('never asks for a width whose height would exceed maxSize', () => {
      // 1024 tall is 666 wide, so that is as wide as we can ask for
      expect(getPageImageUrl(portrait, { height: 4000, maxSize: 1024 }))
        .toBe(`${HOOD}/full/666,/0/default.jpg`)
    })

    it('caps the width itself for a landscape page', () => {
      expect(getPageImageUrl(landscape, { width: 3000, maxSize: 1024 }))
        .toBe('https://example.org/iiif/wide/full/1024,/0/default.jpg')
    })

    it('falls back to the static image URL with no service', () => {
      const page = { serviceUrl: null, imageUrl: 'https://example.org/images/photo.jpg' }
      expect(getPageImageUrl(page, { height: 1024 })).toBe('https://example.org/images/photo.jpg')
    })
  })
})
