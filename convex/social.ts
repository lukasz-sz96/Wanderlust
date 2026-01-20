import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { Id, Doc } from './_generated/dataModel';
import { checkPermission, FREE_LIMITS } from './roles';

// Helper to get user by auth identity
async function getCurrentUser(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  db: {
    query: (table: 'users') => {
      withIndex: (
        name: string,
        fn: (q: { eq: (field: string, value: string) => unknown }) => unknown,
      ) => { unique: () => Promise<Doc<'users'> | null> };
    };
  };
}): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return await ctx.db
    .query('users')
    .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
    .unique();
}

// Get user profile with stats
export const getProfile = query({
  args: {
    userId: v.optional(v.id('users')),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('users'),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      bio: v.optional(v.string()),
      travelStyles: v.optional(v.array(v.string())),
      languages: v.optional(v.array(v.string())),
      homeLocation: v.optional(v.string()),
      coverPhotoId: v.optional(v.id('_storage')),
      coverPhotoUrl: v.optional(v.string()),
      profileVisibility: v.optional(v.union(v.literal('public'), v.literal('friends'), v.literal('private'))),
      role: v.optional(v.union(v.literal('free'), v.literal('pro'), v.literal('moderator'), v.literal('admin'))),
      createdAt: v.number(),
      stats: v.object({
        followers: v.number(),
        following: v.number(),
        countries: v.number(),
        trips: v.number(),
        places: v.number(),
        journals: v.number(),
      }),
      isOwnProfile: v.boolean(),
      isFollowing: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query('users')
          .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
          .unique()
      : null;

    // Determine which user's profile to fetch
    let targetUserId: Id<'users'> | null = null;
    if (args.userId) {
      targetUserId = args.userId;
    } else if (currentUser) {
      targetUserId = currentUser._id;
    } else {
      return null;
    }

    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) {
      return null;
    }

    // Check visibility permissions
    const isOwnProfile = currentUser?._id === targetUserId;
    const visibility = targetUser.profileVisibility || 'public';

    if (!isOwnProfile && visibility === 'private') {
      return null;
    }

    // Check if friends visibility and not following
    let isFollowing = false;
    if (currentUser && !isOwnProfile) {
      const followRecord = await ctx.db
        .query('follows')
        .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', targetUserId))
        .unique();
      isFollowing = !!followRecord;
    }

    if (!isOwnProfile && visibility === 'friends' && !isFollowing) {
      return null;
    }

    // Count followers
    const followers = await ctx.db
      .query('follows')
      .withIndex('by_following', (q) => q.eq('followingId', targetUserId))
      .collect();
    const followersCount = followers.length;

    // Count following
    const following = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', targetUserId))
      .collect();
    const followingCount = following.length;

    // Count trips
    const trips = await ctx.db
      .query('trips')
      .withIndex('by_user', (q) => q.eq('userId', targetUserId))
      .collect();
    const tripsCount = trips.length;

    // Count places
    const places = await ctx.db
      .query('places')
      .withIndex('by_user', (q) => q.eq('userId', targetUserId))
      .collect();
    const placesCount = places.length;

    // Count journals
    const journals = await ctx.db
      .query('journalEntries')
      .withIndex('by_user', (q) => q.eq('userId', targetUserId))
      .collect();
    const journalsCount = journals.length;

    // Count unique countries from visited bucket list items
    const visitedItems = await ctx.db
      .query('bucketListItems')
      .withIndex('by_user_and_status', (q) => q.eq('userId', targetUserId).eq('status', 'visited'))
      .collect();

    const countriesSet = new Set<string>();
    for (const item of visitedItems) {
      const place = await ctx.db.get(item.placeId);
      if (place?.countryCode) {
        countriesSet.add(place.countryCode);
      }
    }
    const countriesCount = countriesSet.size;

    // Get cover photo URL if exists
    let coverPhotoUrl: string | undefined;
    if (targetUser.coverPhotoId) {
      coverPhotoUrl = (await ctx.storage.getUrl(targetUser.coverPhotoId)) ?? undefined;
    }

    return {
      _id: targetUser._id,
      displayName: targetUser.displayName,
      avatarUrl: targetUser.avatarUrl,
      bio: targetUser.bio,
      travelStyles: targetUser.travelStyles,
      languages: targetUser.languages,
      homeLocation: targetUser.homeLocation,
      coverPhotoId: targetUser.coverPhotoId,
      coverPhotoUrl,
      profileVisibility: targetUser.profileVisibility,
      role: targetUser.role,
      createdAt: targetUser.createdAt,
      stats: {
        followers: followersCount,
        following: followingCount,
        countries: countriesCount,
        trips: tripsCount,
        places: placesCount,
        journals: journalsCount,
      },
      isOwnProfile,
      isFollowing,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    travelStyles: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    homeLocation: v.optional(v.string()),
    profileVisibility: v.optional(v.union(v.literal('public'), v.literal('friends'), v.literal('private'))),
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

    if (!currentUser) {
      throw new Error('User not found');
    }

    const updates: {
      updatedAt: number;
      bio?: string;
      travelStyles?: string[];
      languages?: string[];
      homeLocation?: string;
      profileVisibility?: 'public' | 'friends' | 'private';
    } = {
      updatedAt: Date.now(),
    };

    if (args.bio !== undefined) {
      updates.bio = args.bio;
    }
    if (args.travelStyles !== undefined) {
      updates.travelStyles = args.travelStyles;
    }
    if (args.languages !== undefined) {
      updates.languages = args.languages;
    }
    if (args.homeLocation !== undefined) {
      updates.homeLocation = args.homeLocation;
    }
    if (args.profileVisibility !== undefined) {
      updates.profileVisibility = args.profileVisibility;
    }

    await ctx.db.patch(currentUser._id, updates);

    return null;
  },
});

// Upload cover photo
export const uploadCoverPhoto = mutation({
  args: {
    coverPhotoId: v.id('_storage'),
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

    if (!currentUser) {
      throw new Error('User not found');
    }

    await ctx.db.patch(currentUser._id, {
      coverPhotoId: args.coverPhotoId,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Follow a user
export const follow = mutation({
  args: {
    userId: v.id('users'),
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

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Cannot follow yourself
    if (currentUser._id === args.userId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', args.userId))
      .unique();

    if (existingFollow) {
      throw new Error('Already following this user');
    }

    // Check follow limit for free users
    const hasUnlimitedFollows = checkPermission(currentUser.role, 'unlimited_follows');

    if (!hasUnlimitedFollows) {
      const currentFollowing = await ctx.db
        .query('follows')
        .withIndex('by_follower', (q) => q.eq('followerId', currentUser._id))
        .collect();

      if (currentFollowing.length >= FREE_LIMITS.maxFollows) {
        throw new Error(
          `Free users can follow up to ${FREE_LIMITS.maxFollows} users. Upgrade to Pro for unlimited follows.`,
        );
      }
    }

    // Create follow relationship
    await ctx.db.insert('follows', {
      followerId: currentUser._id,
      followingId: args.userId,
      createdAt: Date.now(),
    });

    return null;
  },
});

// Unfollow a user
export const unfollow = mutation({
  args: {
    userId: v.id('users'),
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

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Find the follow record
    const followRecord = await ctx.db
      .query('follows')
      .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', args.userId))
      .unique();

    if (!followRecord) {
      throw new Error('Not following this user');
    }

    // Delete the follow relationship
    await ctx.db.delete(followRecord._id);

    return null;
  },
});

// Check if current user follows target user
export const isFollowing = query({
  args: {
    userId: v.id('users'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser) {
      return false;
    }

    const followRecord = await ctx.db
      .query('follows')
      .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', args.userId))
      .unique();

    return !!followRecord;
  },
});

// Get followers for a user
export const getFollowers = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id('follows')),
  },
  returns: v.object({
    followers: v.array(
      v.object({
        _id: v.id('users'),
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        bio: v.optional(v.string()),
        isFollowing: v.boolean(),
        followedAt: v.number(),
      }),
    ),
    nextCursor: v.optional(v.id('follows')),
    hasMore: v.boolean(),
  }),
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
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return { followers: [], nextCursor: undefined, hasMore: false };
    }

    // Check visibility
    const isOwnProfile = currentUser?._id === args.userId;
    const visibility = targetUser.profileVisibility || 'public';

    if (!isOwnProfile && visibility === 'private') {
      return { followers: [], nextCursor: undefined, hasMore: false };
    }

    // Get followers
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_following', (q) => q.eq('followingId', args.userId))
      .collect();

    // Apply cursor pagination manually
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = follows.findIndex((f) => f._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedFollows = follows.slice(startIndex, startIndex + limit + 1);
    const hasMore = paginatedFollows.length > limit;
    const resultFollows = paginatedFollows.slice(0, limit);

    // Get follower user details
    const followers: {
      _id: Id<'users'>;
      displayName: string | undefined;
      avatarUrl: string | undefined;
      bio: string | undefined;
      isFollowing: boolean;
      followedAt: number;
    }[] = [];

    for (const follow of resultFollows) {
      const user = await ctx.db.get(follow.followerId);
      if (!user) {
        continue;
      }

      // Check if current user follows this follower
      let isFollowingThem = false;
      if (currentUser) {
        const followRecord = await ctx.db
          .query('follows')
          .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', user._id))
          .unique();
        isFollowingThem = !!followRecord;
      }

      followers.push({
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isFollowing: isFollowingThem,
        followedAt: follow.createdAt,
      });
    }

    return {
      followers,
      nextCursor: hasMore ? resultFollows[resultFollows.length - 1]?._id : undefined,
      hasMore,
    };
  },
});

// Get users that a user follows
export const getFollowing = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id('follows')),
  },
  returns: v.object({
    following: v.array(
      v.object({
        _id: v.id('users'),
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        bio: v.optional(v.string()),
        isFollowing: v.boolean(),
        followedAt: v.number(),
      }),
    ),
    nextCursor: v.optional(v.id('follows')),
    hasMore: v.boolean(),
  }),
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
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return { following: [], nextCursor: undefined, hasMore: false };
    }

    // Check visibility
    const isOwnProfile = currentUser?._id === args.userId;
    const visibility = targetUser.profileVisibility || 'public';

    if (!isOwnProfile && visibility === 'private') {
      return { following: [], nextCursor: undefined, hasMore: false };
    }

    // Get following
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', args.userId))
      .collect();

    // Apply cursor pagination manually
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = follows.findIndex((f) => f._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedFollows = follows.slice(startIndex, startIndex + limit + 1);
    const hasMore = paginatedFollows.length > limit;
    const resultFollows = paginatedFollows.slice(0, limit);

    // Get following user details
    const following: {
      _id: Id<'users'>;
      displayName: string | undefined;
      avatarUrl: string | undefined;
      bio: string | undefined;
      isFollowing: boolean;
      followedAt: number;
    }[] = [];

    for (const follow of resultFollows) {
      const user = await ctx.db.get(follow.followingId);
      if (!user) {
        continue;
      }

      // Check if current user follows this user
      let isFollowingThem = false;
      if (currentUser) {
        if (currentUser._id === user._id) {
          // Can't follow yourself
          isFollowingThem = false;
        } else {
          const followRecord = await ctx.db
            .query('follows')
            .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', user._id))
            .unique();
          isFollowingThem = !!followRecord;
        }
      }

      following.push({
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isFollowing: isFollowingThem,
        followedAt: follow.createdAt,
      });
    }

    return {
      following,
      nextCursor: hasMore ? resultFollows[resultFollows.length - 1]?._id : undefined,
      hasMore,
    };
  },
});

// Search users by name, location, or bio
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('users'),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      bio: v.optional(v.string()),
      homeLocation: v.optional(v.string()),
      isFollowing: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query('users')
          .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
          .unique()
      : null;
    const limit = args.limit || 20;
    const searchQuery = args.query.toLowerCase().trim();

    if (!searchQuery) {
      return [];
    }

    // Get all users (in production, you'd want a search index)
    const allUsers = await ctx.db.query('users').collect();

    // Filter to only public profiles and match search query
    const matchingUsers = allUsers.filter((user) => {
      // Only include public profiles
      const visibility = user.profileVisibility || 'public';
      if (visibility !== 'public') {
        return false;
      }

      // Exclude current user from search results
      if (currentUser && user._id === currentUser._id) {
        return false;
      }

      // Search in displayName, bio, and homeLocation
      const displayName = user.displayName?.toLowerCase() || '';
      const bio = user.bio?.toLowerCase() || '';
      const homeLocation = user.homeLocation?.toLowerCase() || '';

      return displayName.includes(searchQuery) || bio.includes(searchQuery) || homeLocation.includes(searchQuery);
    });

    // Limit results
    const limitedUsers = matchingUsers.slice(0, limit);

    // Get follow status for each user
    const results: {
      _id: Id<'users'>;
      displayName: string | undefined;
      avatarUrl: string | undefined;
      bio: string | undefined;
      homeLocation: string | undefined;
      isFollowing: boolean;
    }[] = [];

    for (const user of limitedUsers) {
      let isFollowingUser = false;
      if (currentUser) {
        const followRecord = await ctx.db
          .query('follows')
          .withIndex('by_pair', (q) => q.eq('followerId', currentUser._id).eq('followingId', user._id))
          .unique();
        isFollowingUser = !!followRecord;
      }

      results.push({
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        homeLocation: user.homeLocation,
        isFollowing: isFollowingUser,
      });
    }

    return results;
  },
});
