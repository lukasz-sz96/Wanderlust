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
    limit: v.optional(v.number()),
    cursor: v.optional(v.id('users')),
  },
  returns: v.object({
    users: v.array(
      v.object({
        _id: v.id('users'),
        email: v.string(),
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        role: v.string(),
        createdAt: v.number(),
      }),
    ),
    nextCursor: v.optional(v.id('users')),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { users: [], nextCursor: undefined, hasMore: false };
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser || !checkPermission(currentUser.role, 'admin_panel')) {
      return { users: [], nextCursor: undefined, hasMore: false };
    }

    const limit = args.limit || 50;

    // Use role index if filtering by role, otherwise get all
    let query = args.role
      ? ctx.db.query('users').withIndex('by_role', (q) => q.eq('role', args.role))
      : ctx.db.query('users');

    // Collect with a reasonable limit to avoid memory issues
    const maxFetch = args.search ? 500 : limit + 1; // Fetch more if searching
    let users = await query.take(maxFetch);

    // Apply cursor manually (skip users until we find cursor)
    if (args.cursor) {
      const cursorIndex = users.findIndex((u) => u._id === args.cursor);
      if (cursorIndex !== -1) {
        users = users.slice(cursorIndex + 1);
      }
    }

    // Apply search filter if provided
    if (args.search) {
      const search = args.search.toLowerCase().trim();
      users = users.filter(
        (u) => u.email.toLowerCase().includes(search) || u.displayName?.toLowerCase().includes(search),
      );
    }

    // Handle role filter for users without role field (they're 'free')
    if (args.role === 'free') {
      users = users.filter((u) => !u.role || u.role === 'free');
    }

    // Apply pagination
    const hasMore = users.length > limit;
    const resultUsers = users.slice(0, limit);

    return {
      users: resultUsers.map((u) => ({
        _id: u._id,
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        role: u.role || 'free',
        createdAt: u.createdAt,
      })),
      nextCursor: hasMore ? resultUsers[resultUsers.length - 1]?._id : undefined,
      hasMore,
    };
  },
});
