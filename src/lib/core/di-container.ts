import { ProjectRepository } from "@/lib/infrastructure/database/repositories/project.repository";
import { ProjectEnvironmentRepository } from "@/lib/infrastructure/database/repositories/project-environment.repository";
import { ProjectAuditLogRepository } from "@/lib/infrastructure/database/repositories/project-audit-log.repository";
import { MemberRepository } from "@/lib/infrastructure/database/repositories/member.repository";
import { InvitationRepository } from "@/lib/infrastructure/database/repositories/invitation.repository";
import { QueryRepository } from "@/lib/infrastructure/database/repositories/query.repository";
import { EncryptionService } from "@/lib/infrastructure/external/encryption.service";
import { QueryBuilderService } from "@/lib/core/services/query-builder.service";
import { getEmailService } from "@/lib/infrastructure/external/email";
import { CreateProjectUseCase } from "@/lib/core/use-cases/projects/create-project.use-case";
import { UpdateProjectUseCase } from "@/lib/core/use-cases/projects/update-project.use-case";
import { DeleteProjectUseCase } from "@/lib/core/use-cases/projects/delete-project.use-case";
import { GetProjectUseCase } from "@/lib/core/use-cases/projects/get-project.use-case";
import { ListProjectsUseCase } from "@/lib/core/use-cases/projects/list-projects.use-case";
import { TestProjectConnectionUseCase } from "@/lib/core/use-cases/projects/test-project-connection.use-case";
import { GetProjectsRegistryUseCase } from "@/lib/core/use-cases/projects/get-projects-registry.use-case";
import { GetOrganizationMembersUseCase } from "@/lib/core/use-cases/members/get-organization-members.use-case";
import { GetOrganizationInvitationsUseCase } from "@/lib/core/use-cases/members/get-organization-invitations.use-case";
import { InviteUserUseCase } from "@/lib/core/use-cases/members/invite-user.use-case";
import { UpdateMemberRoleUseCase } from "@/lib/core/use-cases/members/update-member-role.use-case";
import { RemoveMemberUseCase } from "@/lib/core/use-cases/members/remove-member.use-case";
import { RevokeInvitationUseCase } from "@/lib/core/use-cases/members/revoke-invitation.use-case";
import { AcceptInvitationUseCase } from "@/lib/core/use-cases/members/accept-invitation.use-case";
import { GetInvitationDetailsUseCase } from "@/lib/core/use-cases/members/get-invitation-details.use-case";
import { ExecuteQueryUseCase } from "@/lib/core/use-cases/queries/execute-query.use-case";
import { SaveQueryUseCase } from "@/lib/core/use-cases/queries/save-query.use-case";

class DIContainer {
  private static instance: DIContainer;

  private _projectRepository?: ProjectRepository;
  private _projectEnvironmentRepository?: ProjectEnvironmentRepository;
  private _projectAuditLogRepository?: ProjectAuditLogRepository;
  private _memberRepository?: MemberRepository;
  private _invitationRepository?: InvitationRepository;
  private _queryRepository?: QueryRepository;
  private _encryptionService?: EncryptionService;
  private _queryBuilderService?: QueryBuilderService;

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  get projectRepository(): ProjectRepository {
    if (!this._projectRepository) {
      this._projectRepository = new ProjectRepository();
    }
    return this._projectRepository;
  }

  get projectEnvironmentRepository(): ProjectEnvironmentRepository {
    if (!this._projectEnvironmentRepository) {
      this._projectEnvironmentRepository = new ProjectEnvironmentRepository();
    }
    return this._projectEnvironmentRepository;
  }

  get projectAuditLogRepository(): ProjectAuditLogRepository {
    if (!this._projectAuditLogRepository) {
      this._projectAuditLogRepository = new ProjectAuditLogRepository();
    }
    return this._projectAuditLogRepository;
  }

  get encryptionService(): EncryptionService {
    if (!this._encryptionService) {
      this._encryptionService = new EncryptionService();
    }
    return this._encryptionService;
  }

  get queryBuilderService(): QueryBuilderService {
    if (!this._queryBuilderService) {
      this._queryBuilderService = new QueryBuilderService();
    }
    return this._queryBuilderService;
  }

  get memberRepository(): MemberRepository {
    if (!this._memberRepository) {
      this._memberRepository = new MemberRepository();
    }
    return this._memberRepository;
  }

  get invitationRepository(): InvitationRepository {
    if (!this._invitationRepository) {
      this._invitationRepository = new InvitationRepository();
    }
    return this._invitationRepository;
  }

  get queryRepository(): QueryRepository {
    if (!this._queryRepository) {
      this._queryRepository = new QueryRepository();
    }
    return this._queryRepository;
  }

  createProjectUseCase(): CreateProjectUseCase {
    return new CreateProjectUseCase(
      this.projectRepository,
      this.encryptionService,
      this.projectAuditLogRepository
    );
  }

  updateProjectUseCase(): UpdateProjectUseCase {
    return new UpdateProjectUseCase(
      this.projectRepository,
      this.encryptionService,
      this.projectAuditLogRepository
    );
  }

  deleteProjectUseCase(): DeleteProjectUseCase {
    return new DeleteProjectUseCase(
      this.projectRepository,
      this.encryptionService,
      this.projectAuditLogRepository
    );
  }

  getProjectUseCase(): GetProjectUseCase {
    return new GetProjectUseCase(
      this.projectRepository,
      this.encryptionService
    );
  }

  listProjectsUseCase(): ListProjectsUseCase {
    return new ListProjectsUseCase(this.projectRepository);
  }

  testProjectConnectionUseCase(): TestProjectConnectionUseCase {
    return new TestProjectConnectionUseCase();
  }

  getProjectsRegistryUseCase(): GetProjectsRegistryUseCase {
    return new GetProjectsRegistryUseCase(
      this.projectRepository,
      this.encryptionService
    );
  }

  getOrganizationMembersUseCase(): GetOrganizationMembersUseCase {
    return new GetOrganizationMembersUseCase(this.memberRepository);
  }

  getOrganizationInvitationsUseCase(): GetOrganizationInvitationsUseCase {
    return new GetOrganizationInvitationsUseCase(
      this.memberRepository,
      this.invitationRepository
    );
  }

  inviteUserUseCase(): InviteUserUseCase {
    return new InviteUserUseCase(
      this.memberRepository,
      this.invitationRepository,
      getEmailService()
    );
  }

  updateMemberRoleUseCase(): UpdateMemberRoleUseCase {
    return new UpdateMemberRoleUseCase(this.memberRepository);
  }

  removeMemberUseCase(): RemoveMemberUseCase {
    return new RemoveMemberUseCase(this.memberRepository);
  }

  revokeInvitationUseCase(): RevokeInvitationUseCase {
    return new RevokeInvitationUseCase(
      this.memberRepository,
      this.invitationRepository
    );
  }

  executeQueryUseCase(): ExecuteQueryUseCase {
    return new ExecuteQueryUseCase(this.queryRepository);
  }

  saveQueryUseCase(): SaveQueryUseCase {
    return new SaveQueryUseCase(this.queryRepository);
  }

  acceptInvitationUseCase(): AcceptInvitationUseCase {
    return new AcceptInvitationUseCase(
      this.memberRepository,
      this.invitationRepository
    );
  }

  getInvitationDetailsUseCase(): GetInvitationDetailsUseCase {
    return new GetInvitationDetailsUseCase(this.invitationRepository);
  }
}

export const container = DIContainer.getInstance();
