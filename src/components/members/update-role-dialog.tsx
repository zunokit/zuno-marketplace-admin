'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { updateMemberRoleAction } from '@/actions/members/member-actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Member = {
  id: string
  role: string
  userName: string
  userEmail: string
}

type UpdateRoleDialogProps = {
  member: Member
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UpdateRoleDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: UpdateRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRole, setSelectedRole] = useState(member.role)

  async function handleSubmit() {
    if (selectedRole === member.role) {
      toast.info('No changes made')
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)

    const result = await updateMemberRoleAction(
      member.id,
      selectedRole as 'owner' | 'admin' | 'editor' | 'viewer'
    )

    if (result.success) {
      toast.success(result.message || 'Role updated successfully')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('error' in result ? result.error : 'Failed to update role')
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Member Role</DialogTitle>
          <DialogDescription>
            Change the role for{' '}
            <strong className="font-semibold text-foreground">{member.userName}</strong>
            {' '}({member.userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="text-sm text-muted-foreground capitalize">
              {member.role}
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-xs text-muted-foreground">
                      Can view data only
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div>
                    <div className="font-medium">Editor</div>
                    <div className="text-xs text-muted-foreground">
                      Can view and edit data
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs text-muted-foreground">
                      Can manage members and data
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="owner">
                  <div>
                    <div className="font-medium">Owner</div>
                    <div className="text-xs text-muted-foreground">
                      Full access to all features
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Updating...' : 'Update Role'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
