import { createAuthClient } from "better-auth/client";
import { organizationClient, adminClient } from "better-auth/client/plugins";
import { getUrl } from "@/lib/utils/environment";

export const authClient = createAuthClient({
  baseURL: getUrl(),
  plugins: [organizationClient(), adminClient()],
});

export type AuthClient = typeof authClient;
