/**
 * Member Repository Interface
 * Defines the contract for member data operations
 */

import type {
  MemberEntity,
  MemberWithUserDetails,
  CreateMemberData,
  UpdateMemberData,
} from '../entities/member.entity'

export interface IMemberRepository {
  /**
   * Find a member by ID
   */
  findById(id: string): Promise<MemberEntity | null>

  /**
   * Find a member by user ID and organization ID
   */
  findByUserAndOrganization(userId: string, organizationId: string): Promise<MemberEntity | null>

  /**
   * Find all members of an organization with user details
   */
  findByOrganization(organizationId: string): Promise<MemberWithUserDetails[]>

  /**
   * Find all organizations a user belongs to
   */
  findByUser(userId: string): Promise<MemberEntity[]>

  /**
   * Create a new member
   */
  create(data: CreateMemberData): Promise<MemberEntity>

  /**
   * Update member data
   */
  update(id: string, data: UpdateMemberData): Promise<MemberEntity>

  /**
   * Delete a member
   */
  delete(id: string): Promise<void>

  /**
   * Count members in an organization
   */
  countByOrganization(organizationId: string): Promise<number>

  /**
   * Check if user is member of organization
   */
  isMember(userId: string, organizationId: string): Promise<boolean>
}
