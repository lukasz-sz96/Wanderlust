import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Doc } from './_generated/dataModel';

/**
 * Get or create a user based on their auth identity.
 * Called on login to ensure the user exists in our database.
 */
export const getOrCreateUser = mutation({
  args: {
    authUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', args.authUserId))
      .unique();

    if (existingUser) {
      // Update user info if changed
      const now = Date.now();
      const updates: Partial<Doc<'users'>> = { updatedAt: now };

      if (args.email !== existingUser.email) {
        updates.email = args.email;
      }
      if (args.displayName && args.displayName !== existingUser.displayName) {
        updates.displayName = args.displayName;
      }
      if (args.avatarUrl && args.avatarUrl !== existingUser.avatarUrl) {
        updates.avatarUrl = args.avatarUrl;
      }

      if (Object.keys(updates).length > 1) {
        await ctx.db.patch(existingUser._id, updates);
      }

      return existingUser._id;
    }

    // Create new user
    const now = Date.now();
    const userId = await ctx.db.insert('users', {
      authUserId: args.authUserId,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Get the current authenticated user.
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      authUserId: v.string(),
      email: v.string(),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      preferences: v.optional(
        v.object({
          defaultMapStyle: v.optional(v.string()),
          temperatureUnit: v.optional(v.union(v.literal('celsius'), v.literal('fahrenheit'))),
        }),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    return user;
  },
});

/**
 * Get a user by their ID.
 */
export const getUser = query({
  args: { userId: v.id('users') },
  returns: v.union(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      authUserId: v.string(),
      email: v.string(),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      preferences: v.optional(
        v.object({
          defaultMapStyle: v.optional(v.string()),
          temperatureUnit: v.optional(v.union(v.literal('celsius'), v.literal('fahrenheit'))),
        }),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Update user preferences.
 */
export const updatePreferences = mutation({
  args: {
    defaultMapStyle: v.optional(v.string()),
    temperatureUnit: v.optional(v.union(v.literal('celsius'), v.literal('fahrenheit'))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const currentPreferences = user.preferences || {};
    const newPreferences = {
      ...currentPreferences,
      ...(args.defaultMapStyle !== undefined && {
        defaultMapStyle: args.defaultMapStyle,
      }),
      ...(args.temperatureUnit !== undefined && {
        temperatureUnit: args.temperatureUnit,
      }),
    };

    await ctx.db.patch(user._id, {
      preferences: newPreferences,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update user profile (display name and avatar).
 */
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      ...(args.displayName !== undefined && { displayName: args.displayName }),
      ...(args.avatarUrl !== undefined && { avatarUrl: args.avatarUrl }),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Helper to get the current user's ID, throwing if not authenticated.
 * For use in other Convex functions.
 */
export async function requireUser(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  db: {
    query: (table: 'users') => {
      withIndex: (
        name: 'by_auth_id',
        fn: (q: { eq: (field: 'authUserId', value: string) => unknown }) => unknown,
      ) => { unique: () => Promise<Doc<'users'> | null> };
    };
  };
}): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
    .unique();

  if (!user) {
    throw new Error('User not found. Please log in again.');
  }

  return user;
}
