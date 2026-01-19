import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

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
  },
  returns: v.id('photos'),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
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
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
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
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
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
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
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
      })
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
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
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
      })
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
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
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
      })
    );

    return enrichedPhotos;
  },
});
