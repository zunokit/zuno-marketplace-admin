import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/infrastructure/database/schemas";
import { getEmailService } from "@/lib/infrastructure/external/email";
import { invitationEmailTemplate } from "@/lib/infrastructure/external/email/templates";
import { logger } from "@/lib/utils/logger";
import { getUrl } from "@/lib/utils/production";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: getUrl(),
  trustedOrigins: [getUrl()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  socialProviders: {
    // Add social providers here if needed
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
  },
  plugins: [
    organization({
      // Projects are represented as organizations in better-auth
      allowUserToCreateOrganization: async (user) => {
        // Only super admins can create projects
        return user.role?.includes("super_admin") || false;
      },
      // Send invitation email via integrated email service
      async sendInvitationEmail(data) {
        try {
          const emailService = getEmailService();

          // Extract organization name and inviter name from Better Auth data structure
          const organizationName = data.organization?.name || "Organization";
          const inviterName =
            data.inviter?.user?.name ||
            data.inviter?.user?.email ||
            "Team Admin";
          // Build invitation URL from environment
          const baseUrl = getUrl();
          const invitationUrl = `${baseUrl}/invite/accept?id=${data.invitation.id}`;

          const { html, text, subject } = invitationEmailTemplate({
            inviterName,
            organizationName,
            role: data.role || "member",
            invitationUrl,
            expiresInDays: 7,
          });

          const result = await emailService.send({
            to: data.email,
            subject,
            html,
            text,
          });

          if (!result.success) {
            logger.error(
              "Failed to send Better Auth invitation email",
              result.error,
              {
                email: data.email,
                organizationName,
              }
            );
            throw new Error("Failed to send invitation email");
          }

          logger.info("Better Auth invitation email sent successfully", {
            email: data.email,
            organizationName,
            messageId: result.messageId,
          });
        } catch (error) {
          logger.error("Error in sendInvitationEmail", error);
          throw error;
        }
      },
    }),
    admin({
      // Global admin plugin for user management
      defaultRole: "user",
      // Impersonation session duration (1 hour)
      impersonationSessionDuration: 60 * 60,
      // Access control for admin operations
      accessControl: {
        // Super admin has full access
        super_admin: {
          permissions: {
            project: ["create", "delete", "update", "read"],
            user: ["create", "delete", "update", "read", "impersonate"],
            system: ["*"],
          },
        },
        // Regular users can only read projects they're members of
        user: {
          permissions: {
            project: ["read"],
          },
        },
      },
    }),
  ],
});

export type Auth = typeof auth;
