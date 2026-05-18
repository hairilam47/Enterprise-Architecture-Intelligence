export function downloadSvg(svgElement: SVGSVGElement, filename = 'export.svg'): void {
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgElement)
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  _triggerDownload(URL.createObjectURL(blob), filename)
}

export function downloadSvgAsPng(svgElement: SVGSVGElement, filename = 'export.png', scale = 2): void {
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgElement)
  const vb = svgElement.viewBox.baseVal
  const w = (vb.width || svgElement.clientWidth) * scale
  const h = (vb.height || svgElement.clientHeight) * scale

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(img.src)
    canvas.toBlob((blob) => {
      if (!blob) return
      _triggerDownload(URL.createObjectURL(blob), filename)
    }, 'image/png')
  }
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  img.src = URL.createObjectURL(blob)
}

function _triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
