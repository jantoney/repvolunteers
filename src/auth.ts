import { betterAuth } from "better-auth";
import { getAuthPool } from "./models/db.ts";
import { sendAdminPasswordResetEmail } from "./utils/admin-email.ts";

let _auth: ReturnType<typeof betterAuth>;

function createAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: getAuthPool(),
      emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url, token }) {
          // Build custom UI URL for password reset
          const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "http://localhost:8044";
          const resetUrl = `${baseUrl}/admin/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
          await sendAdminPasswordResetEmail({
            adminName: user.name || user.email,
            adminEmail: user.email,
            resetUrl,
          });
        },
      },
      user: {
        modelName: "user",
        fields: {
          id: "id",
          email: "email",
          emailVerified: "email_verified",
          name: "name",
          image: "image",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
        additionalFields: {
          isAdmin: {
            type: "boolean",
            defaultValue: false,
            required: false,
          },
        },
      },
      session: {
        modelName: "session",
        fields: {
          id: "id",
          userId: "user_id",
          token: "token",
          expiresAt: "expires_at",
          ipAddress: "ip_address",
          userAgent: "user_agent",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      account: {
        modelName: "account",
        fields: {
          id: "id",
          userId: "user_id",
          accountId: "account_id",
          providerId: "provider_id",
          accessToken: "access_token",
          refreshToken: "refresh_token",
          idToken: "id_token",
          accessTokenExpiresAt: "access_token_expires_at",
          refreshTokenExpiresAt: "refresh_token_expires_at",
          scope: "scope",
          password: "password",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      verification: {
        modelName: "verification",
        fields: {
          id: "id",
          identifier: "identifier",
          value: "value",
          expiresAt: "expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      secret: Deno.env.get("BETTER_AUTH_SECRET")!,
      baseURL: Deno.env.get("BETTER_AUTH_URL")! + "/api/auth",
    });
  }
  return _auth;
}

export function getAuth() {
  return createAuth();
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    return createAuth()[prop as keyof ReturnType<typeof betterAuth>];
  }
});

export type Session = ReturnType<typeof betterAuth>['$Infer']['Session'];
export type User = ReturnType<typeof betterAuth>['$Infer']['Session']['user'] & { isAdmin: boolean };
