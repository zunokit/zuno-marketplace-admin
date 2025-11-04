/**
 * InvitationsTable Component
 * Displays pending invitations with actions
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Crown, Shield, Edit as EditIcon, Eye, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Invitation } from '../types'
import type { ProjectRole } from '@/types/domain.types'

const roleIcons: Record<ProjectRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  editor: <EditIcon className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
}

const roleColors: Record<ProjectRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  editor: 'outline',
  viewer: 'outline',
}

const statusColors = {
  pending: 'default',
  accepted: 'secondary',
  expired: 'outline',
} as const

interface InvitationsTableProps {
  invitations: Invitation[]
  onRevokeInvitation: (invitationId: string) => void
}

export function InvitationsTable({ invitations, onRevokeInvitation }: InvitationsTableProps) {
  const isExpired = (expiresAt: Date) => new Date(expiresAt) < new Date()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Invited By</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">{invitation.email}</TableCell>
            <TableCell>
              <Badge variant={roleColors[invitation.role as ProjectRole]} className="gap-1">
                {roleIcons[invitation.role as ProjectRole]}
                <span>{invitation.role}</span>
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusColors[invitation.status]}>
                {invitation.status === 'pending' && (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {invitation.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <div>
                <p className="text-sm">{invitation.inviterName}</p>
                <p className="text-xs">{invitation.inviterEmail}</p>
              </div>
            </TableCell>
            <TableCell
              className={isExpired(invitation.expiresAt) ? 'text-destructive' : 'text-muted-foreground'}
            >
              {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-right">
              {invitation.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRevokeInvitation(invitation.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
