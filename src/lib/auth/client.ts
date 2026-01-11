import { createAuthClient } from 'better-auth/client'
import { organizationClient, adminClient } from 'better-auth/client/plugins'
import { getUrl } from '@/lib/utils/production'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || getUrl(),
  plugins: [
    organizationClient(),
    adminClient(),
  ],
})

export type AuthClient = typeof authClient
