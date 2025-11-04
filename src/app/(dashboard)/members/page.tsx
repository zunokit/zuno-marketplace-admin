'use client'

/**
 * Members Management Page
 * Manage organization members and invitations
 * Refactored for better maintainability and type safety
 */

import { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus } from 'lucide-react'
import { InviteUserDialog } from '@/components/members/invite-user-dialog'
import { UpdateRoleDialog } from '@/components/members/update-role-dialog'
import { RemoveMemberDialog } from '@/components/members/remove-member-dialog'
import { useMembers } from '@/components/features/members/hooks/useMembers'
import { MembersTable } from '@/components/features/members/components/MembersTable'
import { InvitationsTable } from '@/components/features/members/components/InvitationsTable'
import type { Member } from '@/components/features/members/types'

export default function MembersPage() {
  const {
    activeProject,
    members,
    invitations,
    isLoadingMembers,
    isLoadingInvitations,
    refreshAll,
    revokeInvitation,
  } = useMembers()

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [updateRoleDialogOpen, setUpdateRoleDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const handleUpdateRole = useCallback((member: Member) => {
    setSelectedMember(member)
    setUpdateRoleDialogOpen(true)
  }, [])

  const handleRemoveMember = useCallback((member: Member) => {
    setSelectedMember(member)
    setRemoveMemberDialogOpen(true)
  }, [])

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Project Selected</CardTitle>
            <CardDescription>
              Please select a project from the dropdown to manage members
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage team members and invitations for {activeProject.name}
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People who have access to this project</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No members yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invite users to collaborate on this project
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              ) : (
                <MembersTable
                  members={members}
                  onUpdateRole={handleUpdateRole}
                  onRemoveMember={handleRemoveMember}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Invitations sent to users not yet accepted</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInvitations ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No pending invitations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invite users to start collaborating
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              ) : (
                <InvitationsTable invitations={invitations} onRevokeInvitation={revokeInvitation} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InviteUserDialog
        organizationId={activeProject.id}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={refreshAll}
      />

      {selectedMember && (
        <>
          <UpdateRoleDialog
            member={selectedMember}
            open={updateRoleDialogOpen}
            onOpenChange={setUpdateRoleDialogOpen}
            onSuccess={refreshAll}
          />

          <RemoveMemberDialog
            member={selectedMember}
            open={removeMemberDialogOpen}
            onOpenChange={setRemoveMemberDialogOpen}
            onSuccess={refreshAll}
          />
        </>
      )}
    </div>
  )
}
