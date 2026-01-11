'use server'

import { auth } from '@/lib/auth/config'
import { logger } from '@/lib/utils/logger'
import { db } from '@/lib/db'
import { user } from '@/lib/infrastructure/database/schemas'
import { eq } from 'drizzle-orm'
import { isProduction } from '@/lib/utils/environment'

interface SignUpData {
  name: string
  email: string
  password: string
}

interface SignUpResult {
  success: boolean
  error?: string
  user?: {
    id: string
    name: string
    email: string
    role?: string | null
  }
}

export async function signUpWithRole(
  data: SignUpData
): Promise<SignUpResult> {
  try {
    // Create the user using Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    })

    if (!signUpResult) {
      return {
        success: false,
        error: 'Failed to create account',
      }
    }

    const userId = signUpResult.user?.id

    if (!userId) {
      return {
        success: false,
        error: 'User ID not returned from sign-up',
      }
    }

    // In development mode, automatically assign super_admin role
    if (!isProduction()) {
      try {
        // Update user role directly in database using Drizzle
        await db
          .update(user)
          .set({ role: 'super_admin' })
          .where(eq(user.id, userId))

        return {
          success: true,
          user: {
            ...signUpResult.user,
            role: 'super_admin',
          },
        }
      } catch (roleError) {
        // Log the error but don't fail the sign-up
        logger.error('Failed to set super_admin role', roleError)
        // User was created but role assignment failed
        return {
          success: true,
          user: signUpResult.user,
        }
      }
    }

    // Production mode - return user without role modification
    return {
      success: true,
      user: signUpResult.user,
    }
  } catch (error) {
    logger.error('Sign-up error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
