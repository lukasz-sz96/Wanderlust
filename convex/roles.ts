import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { Doc } from './_generated/dataModel';

// Role hierarchy and permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  free: ['basic'],
  pro: [
    'basic',
    'unlimited_follows',
    'unlimited_shares',
    'full_feed',
    'custom_urls',
    'analytics',
    'pro_badge',
    'hide_branding',
  ],
  moderator: [
    'basic',
    'unlimited_follows',
    'unlimited_shares',
    'full_feed',
    'custom_urls',
    'analytics',
    'pro_badge',
    'hide_branding',
    'moderate',
  ],
  admin: [
    'basic',
    'unlimited_follows',
    'unlimited_shares',
    'full_feed',
    'custom_urls',
    'analytics',
    'pro_badge',
    'hide_branding',
    'moderate',
    'manage_roles',
    'admin_panel',
  ],
};

// Limits for free users
export const FREE_LIMITS = {
  maxFollows: 50,
  maxSharedTrips: 3,
  feedHistoryDays: 7,
};

export function checkPermission(role: string | undefined, permission: string): boolean {
  const userRole = role || 'free';
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function getUserRole(user: Doc<'users'>): string {
  return user.role || 'free';
}

export const getCurrentRole = query({
  args: {},
  returns: v.object({
    role: v.string(),
    permissions: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { role: 'free', permissions: ['basic'] };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    const role = user?.role || 'free';
    return {
      role,
      permissions: ROLE_PERMISSIONS[role] || ['basic'],
    };
  },
});

export const hasPermission = query({
  args: { permission: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return checkPermission('free', args.permission);
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    return checkPermission(user?.role, args.permission);
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(v.literal('free'), v.literal('pro'), v.literal('moderator'), v.literal('admin')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser || !checkPermission(currentUser.role, 'manage_roles')) {
      throw new Error('Not authorized to manage roles');
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      roleUpdatedAt: Date.now(),
    });

    return null;
  },
});

export const listUsers = query({
  args: {
    role: v.optional(v.union(v.literal('free'), v.literal('pro'), v.literal('moderator'), v.literal('admin'))),
    search: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id('users'),
      email: v.string(),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      role: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser || !checkPermission(currentUser.role, 'admin_panel')) {
      return [];
    }

    let users = await ctx.db.query('users').collect();

    if (args.role) {
      users = users.filter((u) => (u.role || 'free') === args.role);
    }

    if (args.search) {
      const search = args.search.toLowerCase();
      users = users.filter(
        (u) => u.email.toLowerCase().includes(search) || u.displayName?.toLowerCase().includes(search),
      );
    }

    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: u.role || 'free',
      createdAt: u.createdAt,
    }));
  },
});
