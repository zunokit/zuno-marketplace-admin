'use client'

/**
 * Invitation Acceptance Page
 * Page for users to accept organization invitations
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  Clock,
  Mail,
  Shield,
} from 'lucide-react'
import {
  acceptInvitationAction,
  getInvitationDetailsAction,
} from '@/app/actions/members/accept-invitation-action'
import { toast } from 'sonner'

type InvitationDetails = {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
  organizationId: string
  organizationName: string
  inviterName: string
  inviterEmail: string
}

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const invitationId = searchParams.get('id')
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!invitationId || !token) {
      setError('Invalid invitation link')
      setIsLoading(false)
      return
    }

    loadInvitationDetails()
  }, [invitationId, token])

  async function loadInvitationDetails() {
    if (!invitationId) return

    setIsLoading(true)
    setError(null)

    const result = await getInvitationDetailsAction(invitationId)

    if (result.success && result.data) {
      setInvitation(result.data as InvitationDetails)

      // Check if expired
      const expiresAt = new Date(result.data.expiresAt)
      if (new Date() > expiresAt) {
        setError('This invitation has expired')
      } else if (result.data.status !== 'pending') {
        setError(`This invitation has already been ${result.data.status}`)
      }
    } else {
      setError('error' in result ? result.error : 'Failed to load invitation')
    }

    setIsLoading(false)
  }

  async function handleAcceptInvitation() {
    if (!invitationId || !token) {
      toast.error('Invalid invitation link')
      return
    }

    setIsAccepting(true)

    const result = await acceptInvitationAction(invitationId, token)

    if (result.success) {
      toast.success(result.message || 'Invitation accepted successfully!')
      setAccepted(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      toast.error('error' in result ? result.error : 'Failed to accept invitation')
      setError('error' in result ? result.error : 'Failed to accept invitation')
    }

    setIsAccepting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Invitation Accepted!</CardTitle>
            <CardDescription>
              You have successfully joined the organization
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting you to the dashboard...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription className="text-destructive">
              {error || 'This invitation is not valid'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const roleDescriptions: Record<string, string> = {
    owner: 'Full access to all features and settings',
    admin: 'Manage members and project data',
    editor: 'View and edit project data',
    viewer: 'Read-only access to project data',
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{invitation.organizationName}</h3>
              <p className="text-sm text-muted-foreground">
                Invited by {invitation.inviterName}
              </p>
            </div>

            {/* Invitation Details */}
            <div className="space-y-3 bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{invitation.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{invitation.role}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {roleDescriptions[invitation.role] || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="text-sm font-medium">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
            >
              {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAccepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard')}
              disabled={isAccepting}
            >
              Decline
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            By accepting, you will be added to the organization and will have access
            according to your assigned role.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
