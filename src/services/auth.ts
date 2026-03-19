import type { AuthProfile } from '../types'

export function decodeCredential(credential: string): AuthProfile {
  const payload = credential.split('.')[1]
  const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  return { sub: json.sub, name: json.name, email: json.email, picture: json.picture }
}
