/**
 * useMembers Hook
 * Manages member and invitation state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import {
  getOrganizationMembersAction,
  getOrganizationInvitationsAction,
  revokeInvitationAction,
} from '@/app/actions/members/member-actions'
import { toast } from 'sonner'
import type { Member, Invitation } from '../types'

export function useMembers() {
  const { activeProject } = useActiveProject()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)

  const loadMembers = useCallback(async () => {
    if (!activeProject) return

    setIsLoadingMembers(true)
    const result = await getOrganizationMembersAction(activeProject.id)

    if (result.success && result.data) {
      setMembers(result.data)
    } else if (!result.success && 'error' in result) {
      toast.error(result.error)
    }

    setIsLoadingMembers(false)
  }, [activeProject])

  const loadInvitations = useCallback(async () => {
    if (!activeProject) return

    setIsLoadingInvitations(true)
    const result = await getOrganizationInvitationsAction(activeProject.id)

    if (result.success && result.data) {
      setInvitations(result.data)
    } else if (!result.success && 'error' in result) {
      // Silently fail if user doesn't have permission
      if (!result.error.includes('permission')) {
        toast.error(result.error)
      }
    }

    setIsLoadingInvitations(false)
  }, [activeProject])

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMembers(), loadInvitations()])
  }, [loadMembers, loadInvitations])

  const handleRevokeInvitation = useCallback(
    async (invitationId: string) => {
      const result = await revokeInvitationAction(invitationId)

      if (result.success) {
        toast.success(result.message || 'Invitation revoked')
        await loadInvitations()
      } else if (!result.success && 'error' in result) {
        toast.error(result.error)
      }
    },
    [loadInvitations]
  )

  useEffect(() => {
    if (activeProject) {
      void loadMembers()
      void loadInvitations()
    }
  }, [activeProject, loadMembers, loadInvitations])

  return {
    // State
    activeProject,
    members,
    invitations,
    isLoadingMembers,
    isLoadingInvitations,

    // Actions
    loadMembers,
    loadInvitations,
    refreshAll,
    revokeInvitation: handleRevokeInvitation,
  }
}
