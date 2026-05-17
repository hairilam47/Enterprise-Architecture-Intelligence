/**
 * Sprint 22A.2 — InteractionAuthority
 *
 * Singleton that tracks which surface currently owns wheel and pointer
 * interaction. A surface must claim ownership before handling events, and
 * release when it loses focus or hover. The stadium stage is the default
 * fallback owner for both wheel and pointer.
 *
 * This is a plain module-level singleton (not a React context) so that
 * event handlers that run outside React's render cycle can read/write it
 * without triggering re-renders.
 */

export type SurfaceId =
  | 'stadium-stage'
  | 'composition-canvas'
  | 'd3-graph'
  | 'three-view'
  | 'timeline-panel'
  | 'inspector-panel'
  | 'left-sidebar'

const DEFAULT_WHEEL_OWNER: SurfaceId = 'stadium-stage'

class InteractionAuthorityImpl {
  private _wheelOwner: SurfaceId = DEFAULT_WHEEL_OWNER
  private _pointerOwner: SurfaceId | null = null

  // ─── Wheel authority ─────────────────────────────────────────────────────────

  /**
   * Claim exclusive wheel ownership for a surface.
   * Call on `mouseenter` / `focus` for surfaces with their own scroll.
   */
  claimWheel(surface: SurfaceId): void {
    this._wheelOwner = surface
  }

  /**
   * Release wheel ownership back to the stadium stage.
   * Call on `mouseleave` / `blur`.
   */
  releaseWheel(surface: SurfaceId): void {
    if (this._wheelOwner === surface) {
      this._wheelOwner = DEFAULT_WHEEL_OWNER
    }
  }

  /** Returns true when `surface` currently owns wheel events. */
  isWheelOwner(surface: SurfaceId): boolean {
    return this._wheelOwner === surface
  }

  getWheelOwner(): SurfaceId {
    return this._wheelOwner
  }

  // ─── Pointer authority ───────────────────────────────────────────────────────

  /**
   * Claim pointer lock for a surface (e.g. while dragging a canvas node).
   * The stadium will ignore pointer-move events while another surface holds
   * the pointer lock.
   */
  claimPointer(surface: SurfaceId): void {
    this._pointerOwner = surface
  }

  /** Release pointer lock. */
  releasePointer(surface: SurfaceId): void {
    if (this._pointerOwner === surface) {
      this._pointerOwner = null
    }
  }

  /** Returns true when a surface (other than the stage) holds the pointer. */
  hasPointerLock(): boolean {
    return this._pointerOwner !== null
  }

  isPointerOwner(surface: SurfaceId): boolean {
    return this._pointerOwner === surface
  }

  getPointerOwner(): SurfaceId | null {
    return this._pointerOwner
  }
}

export const interactionAuthority = new InteractionAuthorityImpl()
