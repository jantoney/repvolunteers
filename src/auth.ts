import { betterAuth } from "better-auth";
import { getAuthPool } from "./models/db.ts";
import { hasMicrosoftAdminGroup } from "./utils/microsoft-admin.ts";

let _auth: ReturnType<typeof betterAuth>;

type MicrosoftTokenProfile = Record<string, unknown> & {
  sub?: string;
  oid?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  upn?: string;
  picture?: string;
  idToken?: string;
};

type OAuth2Tokens = {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
};

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - normalized.length % 4) % 4),
    "=",
  );
  return atob(padded);
}

function decodeJwtPayload(idToken: string): MicrosoftTokenProfile | null {
  const parts = idToken.split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as MicrosoftTokenProfile;
  } catch {
    return null;
  }
}

function mapMicrosoftProfile(profile: MicrosoftTokenProfile) {
  const email = profile.email ?? profile.preferred_username ?? profile.upn;
  const id = profile.oid ?? profile.sub ?? email ?? crypto.randomUUID();

  return {
    id: String(id),
    name: profile.name ?? email,
    email,
    image: profile.picture,
    emailVerified: Boolean(email),
    isAdmin: hasMicrosoftAdminGroup(profile.idToken ?? null),
  };
}

function createAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: getAuthPool(),
      emailAndPassword: {
        enabled: false,
      },
      user: {
        modelName: "user",
        fields: {
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
          userId: "user_id",
          token: "token",
          expiresAt: "expires_at",
          ipAddress: "ip_address",
          userAgent: "user_agent",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      verification: {
        modelName: "verification",
        fields: {
          identifier: "identifier",
          value: "value",
          expiresAt: "expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      account: {
        accountLinking: {
          trustedProviders: ["microsoft"],
        },
        modelName: "account",
        fields: {
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
      socialProviders: {
        microsoft: {
          clientId: requiredEnv("MICROSOFT_CLIENT_ID"),
          clientSecret: requiredEnv("MICROSOFT_CLIENT_SECRET"),
          tenantId: requiredEnv("MICROSOFT_TENANT_ID"),
          overrideUserInfoOnSignIn: true,
          disableProfilePhoto: true,
          async getUserInfo(tokens: OAuth2Tokens) {
            if (!tokens.idToken) {
              throw new Error("Microsoft id_token was not returned");
            }

            const profile = decodeJwtPayload(tokens.idToken);
            if (!profile) {
              throw new Error("Microsoft id_token could not be decoded");
            }

            return {
              user: {
                ...mapMicrosoftProfile({ ...profile, idToken: tokens.idToken }),
              },
              data: profile,
            };
          },
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
  },
});

export type Session = ReturnType<typeof betterAuth>["$Infer"]["Session"];
export type User =
  & ReturnType<typeof betterAuth>["$Infer"]["Session"]["user"]
  & { isAdmin: boolean };
