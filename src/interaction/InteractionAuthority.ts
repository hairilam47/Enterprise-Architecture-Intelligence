export type SurfaceId = 'stadium' | 'composition-canvas' | (string & {})

class InteractionAuthority {
  private wheelOwner: SurfaceId | null = null
  private pointerOwner: SurfaceId | null = null

  claimWheel(id: SurfaceId): void {
    this.wheelOwner = id
  }

  releaseWheel(id: SurfaceId): void {
    if (this.wheelOwner === id) this.wheelOwner = null
  }

  claimPointer(id: SurfaceId): void {
    this.pointerOwner = id
  }

  releasePointer(id: SurfaceId): void {
    if (this.pointerOwner === id) this.pointerOwner = null
  }

  hasWheelAuthority(id: SurfaceId): boolean {
    return this.wheelOwner === null || this.wheelOwner === id
  }

  hasPointerAuthority(id: SurfaceId): boolean {
    return this.pointerOwner === null || this.pointerOwner === id
  }
}

export const interactionAuthority = new InteractionAuthority()
