/**
 * Convenience hook that gives a React surface stable callbacks for claiming
 * and releasing wheel / pointer authority.
 *
 * Typical usage for a surface that should own the wheel while hovered:
 *
 *   const { onEnter, onLeave } = useInteractionSurface('composition-canvas')
 *   <div onMouseEnter={onEnter} onMouseLeave={onLeave} onWheel={...} />
 *
 * The hook also releases ownership automatically on unmount.
 */

import { useCallback, useEffect } from 'react'
import { interactionAuthority, type SurfaceId } from './InteractionAuthority'

export type InteractionSurfaceHandlers = {
  /** Call on mouseenter or focus to claim wheel ownership. */
  onEnter: () => void
  /** Call on mouseleave or blur to release wheel ownership. */
  onLeave: () => void
  /** Claim pointer lock (e.g. start of a drag gesture). */
  claimPointer: () => void
  /** Release pointer lock (e.g. end of a drag gesture). */
  releasePointer: () => void
  /** Low-level access if needed. */
  claimWheel: () => void
  releaseWheel: () => void
}

export function useInteractionSurface(surfaceId: SurfaceId): InteractionSurfaceHandlers {
  // Release both authorities on unmount so the stage regains control.
  useEffect(() => {
    return () => {
      interactionAuthority.releaseWheel(surfaceId)
      interactionAuthority.releasePointer(surfaceId)
    }
  }, [surfaceId])

  const claimWheel = useCallback(() => interactionAuthority.claimWheel(surfaceId), [surfaceId])
  const releaseWheel = useCallback(() => interactionAuthority.releaseWheel(surfaceId), [surfaceId])
  const claimPointer = useCallback(() => interactionAuthority.claimPointer(surfaceId), [surfaceId])
  const releasePointer = useCallback(() => interactionAuthority.releasePointer(surfaceId), [surfaceId])

  return {
    onEnter: claimWheel,
    onLeave: releaseWheel,
    claimWheel,
    releaseWheel,
    claimPointer,
    releasePointer,
  }
}
