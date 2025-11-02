import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization, admin } from 'better-auth/plugins'
import { db } from '@/lib/db'
import * as schema from '@/lib/infrastructure/database/schemas/auth.schema'

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is not defined')
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL is not defined')
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') || [],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  socialProviders: {
    // Add social providers here if needed
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
  },
  plugins: [
    organization({
      // Projects are represented as organizations in better-auth
      allowUserToCreateOrganization: async (user) => {
        // Only super admins can create projects
        return user.role?.includes('super_admin') || false
      },
      // Send invitation email (you can customize this)
      async sendInvitationEmail(data) {
        console.log('Invitation email:', data)
        // TODO: Implement email sending (e.g., with Resend, SendGrid, etc.)
        // For now, just log the invitation
      },
    }),
    admin({
      // Global admin plugin for user management
      defaultRole: 'user',
      // Impersonation session duration (1 hour)
      impersonationSessionDuration: 60 * 60,
      // Access control for admin operations
      accessControl: {
        // Super admin has full access
        super_admin: {
          permissions: {
            project: ['create', 'delete', 'update', 'read'],
            user: ['create', 'delete', 'update', 'read', 'impersonate'],
            system: ['*'],
          },
        },
        // Regular users can only read projects they're members of
        user: {
          permissions: {
            project: ['read'],
          },
        },
      },
    }),
  ],
})

export type Auth = typeof auth
