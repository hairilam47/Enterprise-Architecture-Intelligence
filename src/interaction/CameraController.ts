/**
 * Sprint 22A.2 — CameraController
 *
 * Imperative camera that applies CSS transforms directly to a DOM element via
 * requestAnimationFrame. No React state is involved during continuous pan or
 * wheel-zoom so no re-renders occur per frame.
 *
 * React components should keep a single `useRef<CameraController>` and read
 * `getZoom()` only when needed for display (e.g. the zoom badge), listening
 * via `onZoomChange()`.
 */

const MIN_ZOOM = 0.35
const MAX_ZOOM = 1.8
/** How far a single wheel tick moves zoom (matches original 0.08 step). */
const WHEEL_ZOOM_STEP = 0.08
/** How far a single button click moves zoom. */
const BUTTON_ZOOM_STEP = 0.1

type ZoomListener = (zoom: number) => void

export class CameraController {
  private _x = 0
  private _y = 0
  private _z = 1

  private _el: HTMLElement | null = null
  private _rafId: number | null = null
  private _pendingFlush = false

  private _zoomListeners = new Set<ZoomListener>()

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Attach to the element whose `style.transform` this controller owns.
   * Immediately removes any CSS transition so that continuous pan feels
   * instant instead of laggy.
   */
  attach(el: HTMLElement | null): void {
    this._el = el
    if (el) {
      // Disable the CSS transition while under camera control — we apply
      // transforms every RAF frame so the transition only adds perceived lag.
      el.style.transitionProperty = 'none'
      el.style.transitionDuration = '0ms'
      el.style.willChange = 'transform'
      el.style.transformOrigin = '0 0'
      this._flush()
    }
  }

  dispose(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
    this._zoomListeners.clear()
    this._el = null
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  getZoom(): number {
    return this._z
  }

  getViewport(): { x: number; y: number; zoom: number } {
    return { x: this._x, y: this._y, zoom: this._z }
  }

  // ─── Mutations (called from event handlers — never setState) ─────────────────

  /**
   * Translate by (dx, dy) pixels in screen space.
   * Called on every pointermove during a pan gesture.
   */
  pan(dx: number, dy: number): void {
    this._x += dx
    this._y += dy
    this._scheduleDirty()
  }

  /**
   * Wheel-based zoom (no modifier key filtering — caller decides).
   * Matches the original ±0.08 per wheel-tick behaviour.
   */
  wheelZoom(deltaY: number): void {
    const direction = deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP
    const next = Number(
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this._z + direction)).toFixed(2)
    )
    if (next === this._z) return
    this._z = next
    this._scheduleDirty()
    this._notifyZoom()
  }

  /**
   * Discrete zoom step from a toolbar button (+ / −).
   * Flushes immediately (no RAF delay) since the step is intentional.
   */
  stepZoom(direction: 1 | -1): void {
    const next = Number(
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this._z + direction * BUTTON_ZOOM_STEP)).toFixed(2)
    )
    this._z = next
    this._flush()
    this._notifyZoom()
  }

  /** Return to origin, zoom 1:1. */
  reset(): void {
    this._x = 0
    this._y = 0
    this._z = 1
    this._flush()
    this._notifyZoom()
  }

  // ─── Observer ────────────────────────────────────────────────────────────────

  /**
   * Subscribe to zoom changes. Returns an unsubscribe function.
   * Use this to keep a React zoom-badge in sync without subscribing to
   * continuous pan updates.
   */
  onZoomChange(listener: ZoomListener): () => void {
    this._zoomListeners.add(listener)
    return () => this._zoomListeners.delete(listener)
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private _scheduleDirty(): void {
    this._pendingFlush = true
    if (this._rafId !== null) return
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null
      if (this._pendingFlush) {
        this._pendingFlush = false
        this._flush()
      }
    })
  }

  private _flush(): void {
    if (!this._el) return
    this._el.style.transform = `translate(${this._x}px,${this._y}px) scale(${this._z})`
  }

  private _notifyZoom(): void {
    const z = this._z
    this._zoomListeners.forEach(fn => fn(z))
  }
}
