import type { MouseEvent, PointerEvent, ReactNode, WheelEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { CameraController } from '../interaction/CameraController'
import { interactionAuthority } from '../interaction/InteractionAuthority'
import { WorkspaceZoneLayer } from './WorkspaceZoneLayer'

type StadiumWorkspaceProps = {
  mode: 'Build' | 'Analyze' | 'Replay'
  guidance?: ReactNode
  onCanvasContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
  children: ReactNode
}

export function StadiumWorkspace({
  mode,
  guidance,
  onCanvasContextMenu,
  children,
}: StadiumWorkspaceProps) {
  // ─── Refs (zero re-renders) ─────────────────────────────────────────────────

  const contentRef = useRef<HTMLDivElement | null>(null)
  const cameraRef = useRef<CameraController | null>(null)
  /**
   * Tracks an in-progress pan gesture.
   * Stored in a ref so pointermove updates never trigger a render.
   */
  const panOriginRef = useRef<{
    pointerId: number
    x: number
    y: number
  } | null>(null)

  // ─── Minimal React state (only what must appear in the UI) ──────────────────

  /**
   * Zoom percentage shown in the chrome badge.
   * Updated on discrete zoom steps and zoom-change events — NOT on each
   * wheel tick (which would re-render every frame).
   */
  const [zoomPercent, setZoomPercent] = useState(100)

  const [guidanceMinimized, setGuidanceMinimized] = useState(
    () => window.localStorage.getItem('ea-studio:guide-minimized') === 'true',
  )

  // ─── Camera lifecycle ───────────────────────────────────────────────────────

  useEffect(() => {
    const camera = new CameraController()
    cameraRef.current = camera

    // Attach after mount so contentRef.current is available.
    camera.attach(contentRef.current)

    const unsub = camera.onZoomChange(zoom => {
      setZoomPercent(Math.round(zoom * 100))
    })

    return () => {
      unsub()
      camera.dispose()
      cameraRef.current = null
    }
  }, [])

  // ─── Pointer handlers ───────────────────────────────────────────────────────

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    // Ignore pointer-down that originates from within the canvas content.
    // Inner surfaces (composition nodes, D3 nodes, etc.) own those events.
    if ((event.target as HTMLElement).closest('.stadium-workspace__content')) return

    panOriginRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
    // Capture the pointer on the surface so pan continues even if the
    // cursor leaves the element mid-drag.
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const origin = panOriginRef.current
    if (!origin || origin.pointerId !== event.pointerId) return

    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y

    // Update origin for incremental delta on next move.
    panOriginRef.current = { ...origin, x: event.clientX, y: event.clientY }

    // Apply pan directly to camera — no React state involved.
    cameraRef.current?.pan(dx, dy)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (panOriginRef.current?.pointerId === event.pointerId) {
      panOriginRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // ─── Wheel handler ──────────────────────────────────────────────────────────

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    // Only zoom on pinch-gesture (trackpad) or Cmd/Ctrl+wheel (mouse).
    // Plain scroll without a modifier key is intentionally ignored so the
    // user can scroll overlaid inspector panels without zooming the stage.
    if (!event.metaKey && !event.ctrlKey) return
    // Yield to a content surface that has claimed wheel authority (D3, Three.js, etc.).
    if (!interactionAuthority.isWheelOwner('stadium-stage')) return
    event.preventDefault()
    cameraRef.current?.wheelZoom(event.deltaY)
  }

  // ─── Toolbar helpers ────────────────────────────────────────────────────────

  function handleZoomOut() {
    cameraRef.current?.stepZoom(-1)
  }

  function handleZoomIn() {
    cameraRef.current?.stepZoom(1)
  }

  function handleReset() {
    cameraRef.current?.reset()
    setZoomPercent(100)
  }

  // ─── Guidance helpers ───────────────────────────────────────────────────────

  function minimizeGuidance() {
    window.localStorage.setItem('ea-studio:guide-minimized', 'true')
    setGuidanceMinimized(true)
  }

  function restoreGuidance() {
    window.localStorage.setItem('ea-studio:guide-minimized', 'false')
    setGuidanceMinimized(false)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="stadium-workspace" data-mode={mode}>
      {/* ── Chrome bar ──────────────────────────────────────────────────── */}
      <div className="stadium-workspace__chrome">
        <span className="stadium-workspace__mode">{mode} workspace</span>
        <div className="overlay-actions">
          <span>{zoomPercent}%</span>
          <button type="button" aria-label="Zoom out" onClick={handleZoomOut}>
            −
          </button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
          <button type="button" aria-label="Zoom in" onClick={handleZoomIn}>
            +
          </button>
        </div>
      </div>

      {/* ── Pannable / zoomable surface ─────────────────────────────────── */}
      <div
        className="stadium-workspace__surface"
        aria-label={`${mode} stadium workspace canvas`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={onCanvasContextMenu}
      >
        {/* Semantic zone layer sits behind content, pointer-events: none */}
        <WorkspaceZoneLayer />

        {/* Guidance overlay — pointer events contained within the card */}
        {guidance != null ? (
          <div
            className={`stadium-workspace__guidance${
              guidanceMinimized ? ' is-minimized' : ''
            }`}
          >
            {guidanceMinimized ? (
              <button type="button" onClick={restoreGuidance}>
                Guide
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="stadium-workspace__guidance-minimize"
                  onClick={minimizeGuidance}
                >
                  Minimize
                </button>
                {guidance}
              </>
            )}
          </div>
        ) : null}

        {/*
         * Camera-controlled content.
         * `ref={contentRef}` — CameraController writes transform here directly.
         * The CSS transition is removed by CameraController.attach() so that
         * continuous pan feels instant rather than lagging behind 120 ms.
         *
         * IMPORTANT: Do NOT set `style.transform` here — the camera owns it.
         */}
        <div ref={contentRef} className="stadium-workspace__content">
          {children}
        </div>
      </div>
    </div>
  )
}
