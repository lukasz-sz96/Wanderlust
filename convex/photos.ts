import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id('_storage'),
    tripId: v.optional(v.id('trips')),
    journalEntryId: v.optional(v.id('journalEntries')),
    placeId: v.optional(v.id('places')),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    takenAt: v.optional(v.number()),
    caption: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal('public'), v.literal('followers'), v.literal('private'))),
  },
  returns: v.id('photos'),
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

    const photoId = await ctx.db.insert('photos', {
      userId: user._id,
      storageId: args.storageId,
      tripId: args.tripId,
      journalEntryId: args.journalEntryId,
      placeId: args.placeId,
      width: args.width,
      height: args.height,
      latitude: args.latitude,
      longitude: args.longitude,
      takenAt: args.takenAt,
      caption: args.caption,
      visibility: args.visibility || 'private',
      createdAt: Date.now(),
    });

    return photoId;
  },
});

export const updateCaption = mutation({
  args: {
    photoId: v.id('photos'),
    caption: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || photo.userId !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch(args.photoId, { caption: args.caption });

    return null;
  },
});

export const remove = mutation({
  args: {
    photoId: v.id('photos'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || photo.userId !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.photoId);

    return null;
  },
});

export const listByJournalEntry = query({
  args: {
    journalEntryId: v.id('journalEntries'),
  },
  returns: v.array(
    v.object({
      _id: v.id('photos'),
      _creationTime: v.number(),
      userId: v.id('users'),
      storageId: v.id('_storage'),
      tripId: v.optional(v.id('trips')),
      journalEntryId: v.optional(v.id('journalEntries')),
      placeId: v.optional(v.id('places')),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      takenAt: v.optional(v.number()),
      caption: v.optional(v.string()),
      createdAt: v.number(),
      url: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const photos = await ctx.db
      .query('photos')
      .withIndex('by_journal_entry', (q) => q.eq('journalEntryId', args.journalEntryId))
      .collect();

    const authorizedPhotos = photos.filter((p) => p.userId === user._id);

    const enrichedPhotos = await Promise.all(
      authorizedPhotos.map(async (photo) => {
        const url = await ctx.storage.getUrl(photo.storageId);
        return {
          ...photo,
          url: url || '',
        };
      }),
    );

    return enrichedPhotos;
  },
});

export const listByTrip = query({
  args: {
    tripId: v.id('trips'),
  },
  returns: v.array(
    v.object({
      _id: v.id('photos'),
      _creationTime: v.number(),
      userId: v.id('users'),
      storageId: v.id('_storage'),
      tripId: v.optional(v.id('trips')),
      journalEntryId: v.optional(v.id('journalEntries')),
      placeId: v.optional(v.id('places')),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      takenAt: v.optional(v.number()),
      caption: v.optional(v.string()),
      createdAt: v.number(),
      url: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const photos = await ctx.db
      .query('photos')
      .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
      .collect();

    const authorizedPhotos = photos.filter((p) => p.userId === user._id);

    const enrichedPhotos = await Promise.all(
      authorizedPhotos.map(async (photo) => {
        const url = await ctx.storage.getUrl(photo.storageId);
        return {
          ...photo,
          url: url || '',
        };
      }),
    );

    return enrichedPhotos;
  },
});

export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('photos'),
      _creationTime: v.number(),
      userId: v.id('users'),
      storageId: v.id('_storage'),
      tripId: v.optional(v.id('trips')),
      journalEntryId: v.optional(v.id('journalEntries')),
      placeId: v.optional(v.id('places')),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      takenAt: v.optional(v.number()),
      caption: v.optional(v.string()),
      createdAt: v.number(),
      url: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const photos = await ctx.db
      .query('photos')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    photos.sort((a, b) => b.createdAt - a.createdAt);

    const enrichedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const url = await ctx.storage.getUrl(photo.storageId);
        return {
          ...photo,
          url: url || '',
        };
      }),
    );

    return enrichedPhotos;
  },
});

export const updateVisibility = mutation({
  args: {
    photoId: v.id('photos'),
    visibility: v.union(v.literal('public'), v.literal('followers'), v.literal('private')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || photo.userId !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch(args.photoId, { visibility: args.visibility });

    return null;
  },
});

const photoWithUserValidator = v.object({
  _id: v.id('photos'),
  _creationTime: v.number(),
  userId: v.id('users'),
  storageId: v.id('_storage'),
  tripId: v.optional(v.id('trips')),
  journalEntryId: v.optional(v.id('journalEntries')),
  placeId: v.optional(v.id('places')),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  takenAt: v.optional(v.number()),
  caption: v.optional(v.string()),
  visibility: v.optional(v.union(v.literal('public'), v.literal('followers'), v.literal('private'))),
  createdAt: v.number(),
  url: v.string(),
  user: v.object({
    _id: v.id('users'),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }),
  isOwner: v.boolean(),
});

export const listByPlace = query({
  args: {
    placeId: v.id('places'),
  },
  returns: v.array(photoWithUserValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    let currentUser: { _id: Id<'users'> } | null = null;
    let followingIds = new Set<string>();

    if (identity) {
      currentUser = await ctx.db
        .query('users')
        .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
        .unique();

      if (currentUser) {
        const follows = await ctx.db
          .query('follows')
          .withIndex('by_follower', (q) => q.eq('followerId', currentUser!._id))
          .collect();
        followingIds = new Set(follows.map((f) => f.followingId));
      }
    }

    const photos = await ctx.db
      .query('photos')
      .withIndex('by_place', (q) => q.eq('placeId', args.placeId))
      .collect();

    const visiblePhotos = photos.filter((photo) => {
      const visibility = photo.visibility || 'private';
      const isOwner = currentUser?._id === photo.userId;

      if (isOwner) return true;
      if (visibility === 'public') return true;
      if (visibility === 'followers' && followingIds.has(photo.userId)) return true;
      return false;
    });

    visiblePhotos.sort((a, b) => b.createdAt - a.createdAt);

    const enrichedPhotos = await Promise.all(
      visiblePhotos.map(async (photo) => {
        const [url, photoUser] = await Promise.all([
          ctx.storage.getUrl(photo.storageId),
          ctx.db.get(photo.userId),
        ]);

        return {
          ...photo,
          url: url || '',
          user: {
            _id: photo.userId,
            displayName: photoUser?.displayName,
            avatarUrl: photoUser?.avatarUrl,
          },
          isOwner: currentUser?._id === photo.userId,
        };
      }),
    );

    return enrichedPhotos;
  },
});

export const getPlacePhotoStats = query({
  args: {
    placeId: v.id('places'),
  },
  returns: v.object({
    totalPhotos: v.number(),
    publicPhotos: v.number(),
    hasPublicContent: v.boolean(),
    contributors: v.array(
      v.object({
        _id: v.id('users'),
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query('photos')
      .withIndex('by_place', (q) => q.eq('placeId', args.placeId))
      .collect();

    const publicPhotos = photos.filter((p) => p.visibility === 'public');
    const uniqueUserIds = [...new Set(publicPhotos.map((p) => p.userId))];

    const contributors = await Promise.all(
      uniqueUserIds.slice(0, 5).map(async (userId) => {
        const user = await ctx.db.get(userId);
        return {
          _id: userId,
          displayName: user?.displayName,
          avatarUrl: user?.avatarUrl,
        };
      }),
    );

    return {
      totalPhotos: photos.length,
      publicPhotos: publicPhotos.length,
      hasPublicContent: publicPhotos.length > 0,
      contributors,
    };
  },
});

export const getPlacesWithPublicPhotos = query({
  args: {},
  returns: v.array(v.id('places')),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const photos = await ctx.db
      .query('photos')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const publicPhotos = photos.filter((p) => p.visibility === 'public' && p.placeId);

    const uniquePlaceIds = [...new Set(publicPhotos.map((p) => p.placeId!))];
    return uniquePlaceIds;
  },
});
