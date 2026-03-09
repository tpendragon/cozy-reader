import { describe, it, expect } from 'vitest'
import { parseManifest, getPageImageUrl, getTitle, getPageCount } from '../../src/iiif/manifest.js'

const sampleManifest = {
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@type": "sc:Manifest",
  "label": "Lize's avonturen in 't wonderland.",
  "sequences": [{
    "@type": "sc:Sequence",
    "canvases": [
      {
        "@type": "sc:Canvas",
        "label": "1",
        "width": 5828,
        "height": 7200,
        "images": [{
          "@type": "oa:Annotation",
          "resource": {
            "@type": "dctypes:Image",
            "service": {
              "@context": "http://iiif.io/api/image/2/context.json",
              "@id": "https://iiif-cloud.princeton.edu/iiif/2/6b%2Fd6%2F55%2F6bd655f50b7a4cff90aab200a90cfc0c%2Fintermediate_file"
            }
          }
        }]
      },
      {
        "@type": "sc:Canvas",
        "label": "2",
        "width": 5820,
        "height": 7200,
        "images": [{
          "@type": "oa:Annotation",
          "resource": {
            "@type": "dctypes:Image",
            "service": {
              "@context": "http://iiif.io/api/image/2/context.json",
              "@id": "https://iiif-cloud.princeton.edu/iiif/2/ab%2Fcd%2F12%2Fabcd1234567890/intermediate_file"
            }
          }
        }]
      }
    ]
  }]
}

describe('IIIF Manifest Parser', () => {
  describe('parseManifest', () => {
    it('extracts pages from manifest', () => {
      const result = parseManifest(sampleManifest)
      expect(result.pages).toHaveLength(2)
    })

    it('extracts page dimensions', () => {
      const result = parseManifest(sampleManifest)
      expect(result.pages[0].width).toBe(5828)
      expect(result.pages[0].height).toBe(7200)
    })

    it('extracts image service URLs', () => {
      const result = parseManifest(sampleManifest)
      expect(result.pages[0].serviceUrl).toBe(
        'https://iiif-cloud.princeton.edu/iiif/2/6b%2Fd6%2F55%2F6bd655f50b7a4cff90aab200a90cfc0c%2Fintermediate_file'
      )
    })
  })

  describe('getTitle', () => {
    it('extracts title from manifest', () => {
      const result = getTitle(sampleManifest)
      expect(result).toBe("Lize's avonturen in 't wonderland.")
    })
  })

  describe('getPageCount', () => {
    it('returns number of pages', () => {
      const parsed = parseManifest(sampleManifest)
      expect(getPageCount(parsed)).toBe(2)
    })
  })

  describe('getPageImageUrl', () => {
    it('generates full/max quality URL', () => {
      const parsed = parseManifest(sampleManifest)
      const url = getPageImageUrl(parsed.pages[0], { size: 'full' })
      expect(url).toBe(
        'https://iiif-cloud.princeton.edu/iiif/2/6b%2Fd6%2F55%2F6bd655f50b7a4cff90aab200a90cfc0c%2Fintermediate_file/full/full/0/default.jpg'
      )
    })

    it('generates sized URL', () => {
      const parsed = parseManifest(sampleManifest)
      const url = getPageImageUrl(parsed.pages[0], { width: 1024 })
      expect(url).toBe(
        'https://iiif-cloud.princeton.edu/iiif/2/6b%2Fd6%2F55%2F6bd655f50b7a4cff90aab200a90cfc0c%2Fintermediate_file/full/1024,/0/default.jpg'
      )
    })

    it('generates height-constrained URL', () => {
      const parsed = parseManifest(sampleManifest)
      const url = getPageImageUrl(parsed.pages[0], { height: 2048 })
      expect(url).toBe(
        'https://iiif-cloud.princeton.edu/iiif/2/6b%2Fd6%2F55%2F6bd655f50b7a4cff90aab200a90cfc0c%2Fintermediate_file/full/,2048/0/default.jpg'
      )
    })
  })
})
