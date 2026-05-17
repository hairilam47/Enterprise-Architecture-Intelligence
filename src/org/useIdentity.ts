import { useState } from 'react'
import { MOCK_IDENTITY, type IdentityContext } from './identityContext'

type UseIdentityResult = {
  identity: IdentityContext
  isLoaded: boolean
}

/**
 * Returns the current user identity context.
 * Uses a mock identity until a real auth provider is connected (Sprint 14+).
 */
export function useIdentity(): UseIdentityResult {
  const [identity] = useState<IdentityContext>(() => MOCK_IDENTITY)
  return { identity, isLoaded: true }
}
