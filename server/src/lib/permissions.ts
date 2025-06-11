import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access";

/**
 * Custom permissions for the application
 * - food: Available for all organization members (owner, admin, member)
 * - management: Only available for owners and admins
 */
const statement = {
  ...defaultStatements,
  food: ["create", "read", "update", "delete"],
  management: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

// Owner role - has access to everything including management
export const owner = ac.newRole({
  ...ownerAc.statements,
  food: ["create", "read", "update", "delete"],
  management: ["create", "read", "update", "delete"],
});

// Admin role - has access to everything including management, but cannot delete organization
export const admin = ac.newRole({
  ...adminAc.statements,
  food: ["create", "read", "update", "delete"],
  management: ["create", "read", "update", "delete"],
});

// Member role - only has access to food permissions, no management access
export const member = ac.newRole({
  ...memberAc.statements,
  food: ["create", "read", "update", "delete"],
  // No management permissions for members
});

export type Roles = typeof owner | typeof admin | typeof member;
export type Statement = typeof statement;

export const rolePermissionMap = {
  owner: owner.statements,
  admin: admin.statements,
  member: member.statements,
};
export type Role = keyof typeof rolePermissionMap;
export type Permission = typeof statement;