/**
 * Invitation Repository Interface
 * Defines the contract for invitation data operations
 */

import type {
  InvitationEntity,
  InvitationWithInviterDetails,
  CreateInvitationData,
} from '../entities/invitation.entity'

export interface IInvitationRepository {
  /**
   * Find an invitation by ID
   */
  findById(id: string): Promise<InvitationEntity | null>

  /**
   * Find an invitation by ID with inviter details
   */
  findByIdWithDetails(id: string): Promise<InvitationWithInviterDetails | null>

  /**
   * Find an invitation by token hash
   */
  findByToken(tokenHash: string): Promise<InvitationEntity | null>

  /**
   * Find pending invitations for an organization with inviter details
   */
  findPendingByOrganization(organizationId: string): Promise<InvitationWithInviterDetails[]>

  /**
   * Find pending invitation by email and organization
   */
  findPendingByEmailAndOrganization(
    email: string,
    organizationId: string
  ): Promise<InvitationEntity | null>

  /**
   * Create a new invitation
   */
  create(data: CreateInvitationData): Promise<InvitationEntity>

  /**
   * Update invitation status
   */
  updateStatus(id: string, status: 'pending' | 'accepted' | 'expired'): Promise<InvitationEntity>

  /**
   * Delete an invitation
   */
  delete(id: string): Promise<void>

  /**
   * Delete all expired invitations
   */
  deleteExpired(): Promise<number>
}
