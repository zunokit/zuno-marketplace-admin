/**
 * MembersTable Component
 * Displays team members with actions
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Crown, Shield, Edit as EditIcon, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Member } from '../types'
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

interface MembersTableProps {
  members: Member[]
  onUpdateRole: (member: Member) => void
  onRemoveMember: (member: Member) => void
}

export function MembersTable({ members, onUpdateRole, onRemoveMember }: MembersTableProps) {
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
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
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.userImage || undefined} alt={member.userName} />
                  <AvatarFallback>{getInitials(member.userName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.userName}</p>
                  <p className="text-xs text-muted-foreground">{member.userRole}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{member.userEmail}</TableCell>
            <TableCell>
              <Badge variant={roleColors[member.role as ProjectRole]} className="gap-1">
                {roleIcons[member.role as ProjectRole]}
                <span>{member.role}</span>
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onUpdateRole(member)}>
                    <EditIcon className="h-4 w-4 mr-2" />
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onRemoveMember(member)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
