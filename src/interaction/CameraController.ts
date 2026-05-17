const MIN_ZOOM = 0.35
const MAX_ZOOM = 1.8
const WHEEL_STEP = 0.08
const BUTTON_STEP = 0.1

type ZoomListener = (zoom: number) => void

export class CameraController {
  private x = 0
  private y = 0
  private zoom = 1
  private el: HTMLDivElement | null = null
  private rafId: number | null = null
  private listeners: Set<ZoomListener> = new Set()

  attach(el: HTMLDivElement | null): void {
    this.el = el
    if (el) {
      // Remove CSS transition so RAF-driven pan feels instant.
      el.style.transition = 'none'
      this.applyTransform()
    }
  }

  pan(dx: number, dy: number): void {
    this.x += dx
    this.y += dy
    this.scheduleRaf()
  }

  wheelZoom(deltaY: number): void {
    const direction = deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP
    this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((this.zoom + direction).toFixed(2))))
    this.scheduleRaf()
  }

  stepZoom(direction: 1 | -1): void {
    this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((this.zoom + direction * BUTTON_STEP).toFixed(2))))
    this.applyTransform()
    this.notifyZoom()
  }

  getZoom(): number {
    return this.zoom
  }

  reset(): void {
    this.x = 0
    this.y = 0
    this.zoom = 1
    this.applyTransform()
    this.notifyZoom()
  }

  onZoomChange(cb: ZoomListener): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.listeners.clear()
    this.el = null
  }

  private scheduleRaf(): void {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      this.applyTransform()
    })
  }

  private applyTransform(): void {
    if (this.el) {
      this.el.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.zoom})`
    }
  }

  private notifyZoom(): void {
    for (const cb of this.listeners) cb(this.zoom)
  }
}
