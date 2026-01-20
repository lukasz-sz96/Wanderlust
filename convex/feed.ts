import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { FREE_LIMITS, checkPermission } from './roles';
import type { Id } from './_generated/dataModel';

// Record an activity to the feed (internal only - called by other Convex functions)
export const recordActivity = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.union(
      v.literal('trip_created'),
      v.literal('place_visited'),
      v.literal('journal_posted'),
      v.literal('place_added'),
    ),
    referenceId: v.string(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the user to check their profile visibility
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      return null;
    }

    // Only record activity if user's profile is not private
    const visibility = user.profileVisibility || 'public';
    if (visibility === 'private') {
      return null;
    }

    // Insert the activity
    await ctx.db.insert('activityFeed', {
      userId: args.userId,
      type: args.type,
      referenceId: args.referenceId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return null;
  },
});

// Activity type for return values
const activityValidator = v.object({
  _id: v.id('activityFeed'),
  userId: v.id('users'),
  type: v.union(
    v.literal('trip_created'),
    v.literal('place_visited'),
    v.literal('journal_posted'),
    v.literal('place_added'),
  ),
  referenceId: v.string(),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  user: v.object({
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal('free'), v.literal('pro'), v.literal('moderator'), v.literal('admin'))),
  }),
});

// Get paginated activity feed from followed users
export const getFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // timestamp for pagination
  },
  returns: v.object({
    activities: v.array(activityValidator),
    nextCursor: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { activities: [], nextCursor: undefined };
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser) {
      return { activities: [], nextCursor: undefined };
    }

    const limit = args.limit || 20;

    // Get list of users current user follows
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', currentUser._id))
      .collect();

    const followingIds = new Set(follows.map((f) => f.followingId));

    if (followingIds.size === 0) {
      return { activities: [], nextCursor: undefined };
    }

    // Check if user has full feed access (pro/moderator/admin)
    const hasFullFeed = checkPermission(currentUser.role, 'full_feed');

    // Calculate cutoff time for free users
    let cutoffTime = 0;
    if (!hasFullFeed) {
      cutoffTime = Date.now() - FREE_LIMITS.feedHistoryDays * 24 * 60 * 60 * 1000;
    }

    // Batch fetch all followed users first
    const followingIdArray = Array.from(followingIds);
    const users = await Promise.all(followingIdArray.map((id) => ctx.db.get("users", id)));

    // Build user map, filtering out private profiles
    const userMap = new Map<string, { displayName: string | undefined; avatarUrl: string | undefined; role: 'free' | 'pro' | 'moderator' | 'admin' | undefined }>();
    for (let i = 0; i < followingIdArray.length; i++) {
      const user = users[i];
      if (!user) continue;
      const visibility = user.profileVisibility || 'public';
      if (visibility === 'private') continue;
      userMap.set(followingIdArray[i], {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });
    }

    // Fetch activities with proper limits per user to avoid memory bloat
    const activitiesPerUser = Math.ceil((limit + 1) * 2 / userMap.size) || limit + 1;
    const activityPromises = Array.from(userMap.keys()).map(async (userId) => {
      const activityQuery = ctx.db
        .query('activityFeed')
        .withIndex('by_user_and_created', (q) => q.eq('userId', userId as Id<'users'>))
        .order('desc');

      return activityQuery.take(activitiesPerUser);
    });

    const activityResults = await Promise.all(activityPromises);

    // Flatten and filter activities
    const allActivities: Array<{
      _id: Id<'activityFeed'>;
      userId: Id<'users'>;
      type: 'trip_created' | 'place_visited' | 'journal_posted' | 'place_added';
      referenceId: string;
      metadata?: unknown;
      createdAt: number;
      user: {
        displayName: string | undefined;
        avatarUrl: string | undefined;
        role: 'free' | 'pro' | 'moderator' | 'admin' | undefined;
      };
    }> = [];

    for (const activities of activityResults) {
      for (const activity of activities) {
        const userInfo = userMap.get(activity.userId);
        if (!userInfo) continue;

        // Apply cursor filter (use > not >= to avoid duplicates)
        if (args.cursor && activity.createdAt >= args.cursor) {
          continue;
        }

        // Apply cutoff time filter for free users
        if (cutoffTime > 0 && activity.createdAt < cutoffTime) {
          continue;
        }

        allActivities.push({
          _id: activity._id,
          userId: activity.userId,
          type: activity.type,
          referenceId: activity.referenceId,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
          user: userInfo,
        });
      }
    }

    // Sort by createdAt desc
    allActivities.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit + 1 to check for more
    const paginatedActivities = allActivities.slice(0, limit + 1);
    const hasMore = paginatedActivities.length > limit;
    const resultActivities = paginatedActivities.slice(0, limit);

    // Determine next cursor
    const nextCursor = hasMore ? resultActivities[resultActivities.length - 1]?.createdAt : undefined;

    return {
      activities: resultActivities,
      nextCursor,
    };
  },
});

// Get activities for a specific user
export const getUserActivities = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query('users')
          .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
          .unique()
      : null;

    const limit = args.limit || 20;

    // Get target user
    const targetUser = await ctx.db.get("users", args.userId);
    if (!targetUser) {
      return [];
    }

    // Check visibility permissions
    const isOwnProfile = currentUser?._id === args.userId;
    const visibility = targetUser.profileVisibility || 'public';

    // Private profiles: only owner can see
    if (!isOwnProfile && visibility === 'private') {
      return [];
    }

    // Friends visibility: check if following
    if (!isOwnProfile && visibility === 'friends') {
      if (!currentUser) {
        return [];
      }

      const followRecord = await ctx.db
        .query('follows')
        .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', args.userId))
        .unique();

      if (!followRecord) {
        return [];
      }
    }

    // Get activities for this user
    const activities = await ctx.db
      .query('activityFeed')
      .withIndex('by_user_and_created', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    // Map activities with user info
    return activities.map((activity) => ({
      _id: activity._id,
      userId: activity.userId,
      type: activity.type,
      referenceId: activity.referenceId,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: {
        displayName: targetUser.displayName,
        avatarUrl: targetUser.avatarUrl,
        role: targetUser.role,
      },
    }));
  },
});
