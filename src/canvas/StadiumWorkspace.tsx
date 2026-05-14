import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, WheelEvent } from 'react'
import { WorkspaceZoneLayer } from './WorkspaceZoneLayer'

type StadiumWorkspaceProps = {
  mode: 'Build' | 'Analyze' | 'Replay'
  guidance?: ReactNode
  onCanvasContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
  children: ReactNode
}

export function StadiumWorkspace({ mode, guidance, onCanvasContextMenu, children }: StadiumWorkspaceProps) {
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [guidanceMinimized, setGuidanceMinimized] = useState(() => window.localStorage.getItem('ea-studio:guide-minimized') === 'true')
  const panStartRef = useRef<{ pointerId: number; x: number; y: number; viewportX: number; viewportY: number } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const pendingViewportRef = useRef(viewport)

  useEffect(() => {
    pendingViewportRef.current = viewport
  }, [viewport])

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current)
    },
    [],
  )

  function scheduleViewportUpdate(nextViewport: typeof viewport) {
    pendingViewportRef.current = nextViewport
    if (animationFrameRef.current !== null) return

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null
      setViewport(pendingViewportRef.current)
    })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('.stadium-workspace__content')) return
    panStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      viewportX: viewport.x,
      viewportY: viewport.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const panStart = panStartRef.current
    if (!panStart || panStart.pointerId !== event.pointerId) return
    scheduleViewportUpdate({
      ...pendingViewportRef.current,
      x: panStart.viewportX + event.clientX - panStart.x,
      y: panStart.viewportY + event.clientY - panStart.y,
    })
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (panStartRef.current?.pointerId === event.pointerId) {
      panStartRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!event.metaKey && !event.ctrlKey) return
    event.preventDefault()
    const direction = event.deltaY > 0 ? -0.08 : 0.08
    const current = pendingViewportRef.current
    scheduleViewportUpdate({
      ...current,
      zoom: Math.min(1.6, Math.max(0.55, Number((current.zoom + direction).toFixed(2)))),
    })
  }

  return (
    <div className="stadium-workspace" data-mode={mode}>
      <div className="stadium-workspace__chrome">
        <span className="stadium-workspace__mode">{mode} workspace</span>
        <div className="overlay-actions">
          <span>{Math.round(viewport.zoom * 100)}%</span>
          <button type="button" aria-label="Zoom out" onClick={() => scheduleViewportUpdate({ ...pendingViewportRef.current, zoom: Math.max(0.55, pendingViewportRef.current.zoom - 0.1) })}>-</button>
          <button type="button" onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}>Reset</button>
          <button type="button" aria-label="Zoom in" onClick={() => scheduleViewportUpdate({ ...pendingViewportRef.current, zoom: Math.min(1.6, pendingViewportRef.current.zoom + 0.1) })}>+</button>
        </div>
      </div>
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
        <WorkspaceZoneLayer />
        {guidance ? (
          <div className={`stadium-workspace__guidance ${guidanceMinimized ? 'is-minimized' : ''}`}>
            {guidanceMinimized ? (
              <button type="button" onClick={() => {
                window.localStorage.setItem('ea-studio:guide-minimized', 'false')
                setGuidanceMinimized(false)
              }}>
                Guide
              </button>
            ) : (
              <>
                <button type="button" className="stadium-workspace__guidance-minimize" onClick={() => {
                  window.localStorage.setItem('ea-studio:guide-minimized', 'true')
                  setGuidanceMinimized(true)
                }}>
                  Minimize
                </button>
                {guidance}
              </>
            )}
          </div>
        ) : null}
        <div
          className="stadium-workspace__content"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
