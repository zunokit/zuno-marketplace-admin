'use client'

/**
 * Members Management Page
 * Manage organization members and invitations
 */

import { useEffect, useState, useCallback } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import {
  getOrganizationMembersAction,
  getOrganizationInvitationsAction,
  revokeInvitationAction,
} from '@/actions/members/member-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  UserPlus,
  Crown,
  Shield,
  Edit as EditIcon,
  Eye,
  MoreHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { InviteUserDialog } from '@/components/members/invite-user-dialog'
import { UpdateRoleDialog } from '@/components/members/update-role-dialog'
import { RemoveMemberDialog } from '@/components/members/remove-member-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Member = {
  id: string
  role: string
  createdAt: Date
  userId: string
  userName: string
  userEmail: string
  userImage: string | null
  userRole: string
}

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
  createdAt: Date
  inviterName: string
  inviterEmail: string
}

const roleIcons = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  editor: <EditIcon className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
}

const roleColors = {
  owner: 'default',
  admin: 'secondary',
  editor: 'outline',
  viewer: 'outline',
} as const

export default function MembersPage() {
  const { activeProject } = useActiveProject()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [updateRoleDialogOpen, setUpdateRoleDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const loadMembers = useCallback(async () => {
    if (!activeProject) return

    setIsLoadingMembers(true)
    const result = await getOrganizationMembersAction(activeProject.id)

    if (result.success && result.data) {
      setMembers(result.data as Member[])
    } else {
      toast.error('error' in result ? result.error : 'Failed to load members')
    }

    setIsLoadingMembers(false)
  }, [activeProject])

  const loadInvitations = useCallback(async () => {
    if (!activeProject) return

    setIsLoadingInvitations(true)
    const result = await getOrganizationInvitationsAction(activeProject.id)

    if (result.success && result.data) {
      setInvitations(result.data as Invitation[])
    } else {
      // Silently fail if user doesn't have permission
      if (result && 'error' in result && !result.error.includes('permission')) {
        toast.error(result.error)
      }
    }

    setIsLoadingInvitations(false)
  }, [activeProject])

  useEffect(() => {
    if (activeProject) {
      void loadMembers()
      void loadInvitations()
    }
    // loadMembers and loadInvitations are memoized with activeProject
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject])

  function handleUpdateRole(member: Member) {
    setSelectedMember(member)
    setUpdateRoleDialogOpen(true)
  }

  function handleRemoveMember(member: Member) {
    setSelectedMember(member)
    setRemoveMemberDialogOpen(true)
  }

  async function handleRevokeInvitation(invitationId: string) {
    const result = await revokeInvitationAction(invitationId)

    if (result.success) {
      toast.success(result.message || 'Invitation revoked')
      loadInvitations()
    } else {
      toast.error('error' in result ? result.error : 'Failed to revoke invitation')
    }
  }

  function handleDialogSuccess() {
    loadMembers()
    loadInvitations()
  }

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
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                People who have access to this project
              </CardDescription>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.userImage || undefined} />
                              <AvatarFallback>
                                {member.userName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.userName}</div>
                              {member.userRole === 'super_admin' && (
                                <Badge variant="default" className="text-xs mt-1">
                                  Super Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant={roleColors[member.role as keyof typeof roleColors]}>
                            <span className="mr-1">
                              {roleIcons[member.role as keyof typeof roleIcons]}
                            </span>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateRole(member)}>
                                <EditIcon className="h-4 w-4 mr-2" />
                                Update Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that have been sent but not yet accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInvitations ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No pending invitations
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          {invitation.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleColors[invitation.role as keyof typeof roleColors]}>
                            <span className="mr-1">
                              {roleIcons[invitation.role as keyof typeof roleIcons]}
                            </span>
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invitation.inviterName}</div>
                            <div className="text-xs text-muted-foreground">
                              {invitation.inviterEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvitation(invitation.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {activeProject && (
        <>
          <InviteUserDialog
            organizationId={activeProject.id}
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            onSuccess={handleDialogSuccess}
          />

          {selectedMember && (
            <>
              <UpdateRoleDialog
                member={selectedMember}
                open={updateRoleDialogOpen}
                onOpenChange={setUpdateRoleDialogOpen}
                onSuccess={handleDialogSuccess}
              />

              <RemoveMemberDialog
                member={selectedMember}
                open={removeMemberDialogOpen}
                onOpenChange={setRemoveMemberDialogOpen}
                onSuccess={handleDialogSuccess}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
