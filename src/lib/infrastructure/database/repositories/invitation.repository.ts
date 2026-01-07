/**
 * Invitation Repository Implementation
 * Handles all database operations for invitations
 */

import { eq, and, lt } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import {
  invitation as invitationTable,
  user as userTable,
  organization as organizationTable,
} from '@/lib/infrastructure/database/schemas'
import type { IInvitationRepository } from '@/lib/core/domain/interfaces/invitation.repository.interface'
import type {
  InvitationEntity,
  InvitationWithInviterDetails,
  CreateInvitationData,
} from '@/lib/core/domain/entities/invitation.entity'
import type { ProjectRole } from '@/types/domain.types'

export class InvitationRepository implements IInvitationRepository {
  async findById(id: string): Promise<InvitationEntity | null> {
    const invitation = await db.query.invitation.findFirst({
      where: eq(invitationTable.id, id),
    })

    if (!invitation) return null

    return this.toInvitationEntity(invitation)
  }

  async findByIdWithDetails(id: string): Promise<InvitationWithInviterDetails | null> {
    const results = await db
      .select({
        id: invitationTable.id,
        organizationId: invitationTable.organizationId,
        email: invitationTable.email,
        role: invitationTable.role,
        inviterId: invitationTable.inviterId,
        token: invitationTable.token,
        status: invitationTable.status,
        expiresAt: invitationTable.expiresAt,
        createdAt: invitationTable.createdAt,
        updatedAt: invitationTable.updatedAt,
        inviterName: userTable.name,
        inviterEmail: userTable.email,
        organizationName: organizationTable.name,
      })
      .from(invitationTable)
      .innerJoin(userTable, eq(invitationTable.inviterId, userTable.id))
      .innerJoin(organizationTable, eq(invitationTable.organizationId, organizationTable.id))
      .where(eq(invitationTable.id, id))
      .limit(1)

    if (results.length === 0) return null

    return this.toInvitationWithInviterDetails(results[0])
  }

  async findByToken(tokenHash: string): Promise<InvitationEntity | null> {
    const invitation = await db.query.invitation.findFirst({
      where: eq(invitationTable.token, tokenHash),
    })

    if (!invitation) return null

    return this.toInvitationEntity(invitation)
  }

  async findPendingByOrganization(
    organizationId: string
  ): Promise<InvitationWithInviterDetails[]> {
    const results = await db
      .select({
        id: invitationTable.id,
        organizationId: invitationTable.organizationId,
        email: invitationTable.email,
        role: invitationTable.role,
        inviterId: invitationTable.inviterId,
        token: invitationTable.token,
        status: invitationTable.status,
        expiresAt: invitationTable.expiresAt,
        createdAt: invitationTable.createdAt,
        updatedAt: invitationTable.updatedAt,
        inviterName: userTable.name,
        inviterEmail: userTable.email,
        organizationName: organizationTable.name,
      })
      .from(invitationTable)
      .innerJoin(userTable, eq(invitationTable.inviterId, userTable.id))
      .innerJoin(organizationTable, eq(invitationTable.organizationId, organizationTable.id))
      .where(
        and(eq(invitationTable.organizationId, organizationId), eq(invitationTable.status, 'pending'))
      )
      .orderBy(invitationTable.createdAt)

    return results.map(this.toInvitationWithInviterDetails)
  }

  async findPendingByEmailAndOrganization(
    email: string,
    organizationId: string
  ): Promise<InvitationEntity | null> {
    const invitation = await db.query.invitation.findFirst({
      where: and(
        eq(invitationTable.organizationId, organizationId),
        eq(invitationTable.email, email),
        eq(invitationTable.status, 'pending')
      ),
    })

    if (!invitation) return null

    return this.toInvitationEntity(invitation)
  }

  async create(data: CreateInvitationData): Promise<InvitationEntity> {
    const [invitation] = await db
      .insert(invitationTable)
      .values({
        id: randomUUID(),
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
        inviterId: data.inviterId,
        token: data.token,
        status: 'pending',
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return this.toInvitationEntity(invitation)
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'accepted' | 'expired'
  ): Promise<InvitationEntity> {
    const [invitation] = await db
      .update(invitationTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(invitationTable.id, id))
      .returning()

    return this.toInvitationEntity(invitation)
  }

  async delete(id: string): Promise<void> {
    await db.delete(invitationTable).where(eq(invitationTable.id, id))
  }

  async deleteExpired(): Promise<number> {
    const now = new Date()
    const result = await db
      .delete(invitationTable)
      .where(and(eq(invitationTable.status, 'pending'), lt(invitationTable.expiresAt, now)))
      .returning()

    return result.length
  }

  private toInvitationEntity(data: {
    id: string
    organizationId: string
    email: string
    role: string | null
    inviterId: string
    token: string
    status: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
  }): InvitationEntity {
    return {
      id: data.id,
      organizationId: data.organizationId,
      email: data.email,
      role: (data.role || 'viewer') as ProjectRole,
      inviterId: data.inviterId,
      token: data.token,
      status: data.status as 'pending' | 'accepted' | 'expired',
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }

  private toInvitationWithInviterDetails(data: {
    id: string
    organizationId: string
    email: string
    role: string | null
    inviterId: string
    token: string
    status: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    inviterName: string | null
    inviterEmail: string | null
    organizationName: string | null
  }): InvitationWithInviterDetails {
    return {
      id: data.id,
      organizationId: data.organizationId,
      email: data.email,
      role: (data.role || 'viewer') as ProjectRole,
      inviterId: data.inviterId,
      token: data.token,
      status: data.status as 'pending' | 'accepted' | 'expired',
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      inviterName: data.inviterName || '',
      inviterEmail: data.inviterEmail || '',
      organizationName: data.organizationName || '',
    }
  }
}
