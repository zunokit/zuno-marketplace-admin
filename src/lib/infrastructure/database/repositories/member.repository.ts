/**
 * Member Repository Implementation
 * Handles all database operations for members
 */

import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import {
  member as memberTable,
  user as userTable,
} from '@/lib/infrastructure/database/schemas'
import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type {
  MemberEntity,
  MemberWithUserDetails,
  CreateMemberData,
  UpdateMemberData,
} from '@/lib/core/domain/entities/member.entity'
import type { ProjectRole } from '@/types/domain.types'

export class MemberRepository implements IMemberRepository {
  async findById(id: string): Promise<MemberEntity | null> {
    const member = await db.query.member.findFirst({
      where: eq(memberTable.id, id),
    })

    if (!member) return null

    return this.toMemberEntity(member)
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<MemberEntity | null> {
    const member = await db.query.member.findFirst({
      where: and(eq(memberTable.userId, userId), eq(memberTable.organizationId, organizationId)),
    })

    if (!member) return null

    return this.toMemberEntity(member)
  }

  async findByOrganization(organizationId: string): Promise<MemberWithUserDetails[]> {
    const results = await db
      .select({
        id: memberTable.id,
        organizationId: memberTable.organizationId,
        userId: memberTable.userId,
        role: memberTable.role,
        createdAt: memberTable.createdAt,
        updatedAt: memberTable.updatedAt,
        userName: userTable.name,
        userEmail: userTable.email,
        userImage: userTable.image,
        userGlobalRole: userTable.role,
      })
      .from(memberTable)
      .innerJoin(userTable, eq(memberTable.userId, userTable.id))
      .where(eq(memberTable.organizationId, organizationId))
      .orderBy(memberTable.createdAt)

    return results.map(this.toMemberWithUserDetails)
  }

  async findByUser(userId: string): Promise<MemberEntity[]> {
    const members = await db.query.member.findMany({
      where: eq(memberTable.userId, userId),
    })

    return members.map(this.toMemberEntity)
  }

  async create(data: CreateMemberData): Promise<MemberEntity> {
    const [member] = await db
      .insert(memberTable)
      .values({
        id: randomUUID(),
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return this.toMemberEntity(member)
  }

  async update(id: string, data: UpdateMemberData): Promise<MemberEntity> {
    const [member] = await db
      .update(memberTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(memberTable.id, id))
      .returning()

    return this.toMemberEntity(member)
  }

  async delete(id: string): Promise<void> {
    await db.delete(memberTable).where(eq(memberTable.id, id))
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const result = await db.query.member.findMany({
      where: eq(memberTable.organizationId, organizationId),
    })

    return result.length
  }

  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const member = await this.findByUserAndOrganization(userId, organizationId)
    return member !== null
  }

  private toMemberEntity(data: {
    id: string
    organizationId: string
    userId: string
    role: string
    createdAt: Date
    updatedAt: Date
  }): MemberEntity {
    return {
      id: data.id,
      organizationId: data.organizationId,
      userId: data.userId,
      role: data.role as ProjectRole,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }

  private toMemberWithUserDetails(data: {
    id: string
    organizationId: string
    userId: string
    role: string
    createdAt: Date
    updatedAt: Date
    userName: string | null
    userEmail: string | null
    userImage: string | null
    userGlobalRole: string | null
  }): MemberWithUserDetails {
    const userGlobalRole = data.userGlobalRole || 'user'
    return {
      id: data.id,
      organizationId: data.organizationId,
      userId: data.userId,
      role: data.role as ProjectRole,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      userName: data.userName || '',
      userEmail: data.userEmail || '',
      userImage: data.userImage,
      userGlobalRole,
      userRole: userGlobalRole, // Add backward compatibility alias
    }
  }
}
