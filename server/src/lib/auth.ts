import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { organization, emailOTP, customSession } from "better-auth/plugins";
import Redis from "ioredis";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import { PasswordReset } from "../emails/password-reset";
import { VerificationEmail } from "../emails/verification-email";
import OTPEmail from "../emails/otp";
import { sendEmail } from "./email";
import { SubscriptionService } from "../service/subscription";
import {
  ac,
  owner,
  admin,
  member,
  rolePermissionMap,
  type Permission,
  type Role,
} from "./permissions";
import { createAuthMiddleware, APIError } from "better-auth/api";

const redis = new Redis({
  host: "localhost",
  port: 6379,
  // password: 'yourpassword',
  // tls: {} // optional if using encrypted connections
  retryStrategy(times) {
    return Math.min(times * 50, 2000); // reconnect logic
  },
});

const redisKeyPrefix = "better-auth:";
// Helper function to create default subscription for new users
async function ensureUserHasSubscription(userId: string) {
  const existingSubscription =
    await SubscriptionService.getUserSubscription(userId);
  if (!existingSubscription) {
    console.log("📝 Creating default subscription for new user:", { userId });
    await SubscriptionService.createDefaultSubscription(userId);
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  advanced: {
    cookiePrefix: "better-auth",
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // if (ctx.path !== "/sign-in/email") {
      //   console.log("ctx", ctx.query);
      //   return;
      // }
      // if (ctx.path === "/get-session") {
      //   console.log("Skipping x-org-slug check for get-session");
      //   console.log("x-org-slug", ctx.headers["x-org-slug"]);
      //   return;
      // }
      // if (!ctx.body?.email.endsWith("@gmail.com")) {
      //   throw new APIError("BAD_REQUEST", {
      //     message: "Email must end with @example.com",
      //   });
      // }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create default subscription for new users
          await ensureUserHasSubscription(user.id);
        },
      },
    },
    // session: {
    //   create: {
    //     before: async (session) => {
    //       const organization = { id: "google" };
    //       return {
    //         data: {
    //           ...session,
    //           activeOrganizationId: organization.id,
    //         },
    //       };
    //     },
    //   },
    // },
  },
  emailAndPassword: {
    enabled: true,
    // requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      console.log("📧 Sending password reset email:", {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        token: token,
        url: url,
      });

      const html = renderToStaticMarkup(
        React.createElement(PasswordReset, {
          resetLink: url,
          userName: user.name,
          expiresIn: "1 hour",
        })
      );
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html,
      });

      console.log("✅ Password reset email sent successfully to:", user.email);
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }, request) => {
        console.log("🗑️ Sending account deletion verification email:", {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          token: token,
          url: url,
        });

        // Send verification email for account deletion
        await sendEmail({
          to: user.email,
          subject: "Confirm account deletion",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Account Deletion Confirmation</h2>
              <p>Hello ${user.name},</p>
              <p>We received a request to delete your account. If you want to proceed with deleting your account, please click the button below:</p>
              <a href="${url}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Delete My Account</a>
              <p>If you didn't request this deletion, you can safely ignore this email.</p>
              <p><strong>Warning:</strong> This action is irreversible. All your data will be permanently deleted.</p>
            </div>
          `,
        });

        console.log(
          "✅ Account deletion verification email sent successfully to:",
          user.email
        );
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async (
        { user, newEmail, url, token },
        request
      ) => {
        console.log("📧 Sending email change verification:", {
          userId: user.id,
          currentEmail: user.email,
          newEmail: newEmail,
          userName: user.name,
          token: token,
          url: url,
        });

        // Send verification email to current email for email change
        await sendEmail({
          to: user.email,
          subject: "Confirm email change",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Email Change Confirmation</h2>
              <p>Hello ${user.name},</p>
              <p>We received a request to change your email address to: <strong>${newEmail}</strong></p>
              <p>To confirm this change, please click the button below:</p>
              <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Confirm Email Change</a>
              <p>If you didn't request this change, please contact our support team immediately.</p>
            </div>
          `,
        });

        console.log(
          "✅ Email change verification sent successfully to current email:",
          user.email
        );
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log("📧 Sending email verification:", {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        url: url,
      });

      const html = renderToStaticMarkup(
        React.createElement(VerificationEmail, {
          verificationLink: url,
          userName: user.name,
        })
      );
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html,
      });

      console.log("✅ Email verification sent successfully to:", user.email);
    },
    expiresIn: 60 * 60 * 24, // 1 day,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "GITHUB_CLIENT_ID",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "GITHUB_CLIENT_SECRET",
    },
  },
  secondaryStorage: {
    get: async (key) => {
      const value = await redis.get(redisKeyPrefix + key);
      return value ? value : null;
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(redisKeyPrefix + key, value, "EX", ttl);
      else await redis.set(redisKeyPrefix + key, value);
    },
    delete: async (key) => {
      await redis.del(redisKeyPrefix + key);
    },
  },
  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
    modelName: "RateLimit",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  plugins: [
    openAPI(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log("📧 Sending OTP email:", {
          email,
          otp,
          type,
        });

        const html = renderToStaticMarkup(
          React.createElement(OTPEmail, { otp })
        );

        await sendEmail({
          to: email,
          subject: "Your verification code",
          html,
        });

        console.log("✅ OTP email sent successfully to:", email);
      },
      otpLength: 6,
      expiresIn: 60 * 10, // 10 minutes
    }),
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
      allowUserToCreateOrganization: async (user) => {
        // Check if user has pro subscription
        return await SubscriptionService.canCreateOrganizations(user.id);
      },
      organizationCreation: {
        disabled: false,
        beforeCreate: async ({ organization, user }, request) => {
          return {
            data: {
              ...organization,
              metadata: {
                createdBy: user.id,
                createdAt: new Date().toISOString(),
              },
            },
          };
        },
        afterCreate: async ({ organization, member, user }, request) => {
          console.log("🏢 Organization created:", {
            organizationId: organization.id,
            organizationName: organization.name,
            organizationSlug: organization.slug,
            createdBy: user.id,
            memberRole: member.role,
          });
        },
      },
      sendInvitationEmail: async (data) => {
        console.log("📧 Sending organization invitation:", {
          invitationId: data.id,
          email: data.email,
          organizationId: data.organization.id,
          organizationName: data.organization.name,
          inviterEmail: data.inviter.user.email,
          role: data.role,
        });

        const inviteLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/accept-invitation/${data.id}`;

        await sendEmail({
          to: data.email,
          subject: `You're invited to join ${data.organization.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Organization Invitation</h2>
              <p>Hello,</p>
              <p>You've been invited by <strong>${data.inviter.user.name}</strong> (${data.inviter.user.email}) to join <strong>${data.organization.name}</strong> as a <strong>${data.role}</strong>.</p>
              <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Accept Invitation</a>
              <p>If you don't want to join this organization, you can safely ignore this email.</p>
              <p>This invitation will expire in 48 hours.</p>
            </div>
          `,
        });

        console.log(
          "✅ Organization invitation sent successfully to:",
          data.email
        );
      },
    }),
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    customSession(async ({ user, session }, { headers }): Promise<any> => {
      const orgSlug = headers?.get("x-org-slug");
      const organizations = await auth.api.listOrganizations({
        headers: headers,
      });
      let member: OrgMember = null;
      let role: Role = "member";
      let permissions = {};

      if (organizations.length > 0) {
        const matchedOrg = orgSlug
          ? organizations.find((org) => org.slug === orgSlug)
          : null;

        // if org matched, set it as active organization or else set the first organization as active
        await auth.api.setActiveOrganization({
          headers: headers,
          body: {
            organizationId: matchedOrg ? matchedOrg.id : organizations[0].id,
            organizationSlug: matchedOrg
              ? matchedOrg.slug
              : organizations[0].slug,
          },
        });

        member = await auth.api.getActiveMember({
          headers: headers,
        });

        if (member) {
          role = member.role as Role;
          permissions = rolePermissionMap[role];
        }
      }
      return {
        role,
        permissions,
        user,
        session,
        orgSlug,
      };
    }),
  ],
});

type OrgMember = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null | undefined;
  };
  id: string;
  createdAt: Date;
  userId: string;
  organizationId: string;
  role: string;
  teamId?: string | undefined;
} | null;
