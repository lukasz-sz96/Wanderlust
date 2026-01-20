import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

const placeSourceValidator = v.union(v.literal('osm'), v.literal('ai_generated'), v.literal('user_created'));

export const create = mutation({
  args: {
    externalId: v.optional(v.string()),
    source: placeSourceValidator,
    name: v.string(),
    description: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    mapillaryImageKey: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.id('places'),
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

    const placeId = await ctx.db.insert('places', {
      userId: user._id,
      externalId: args.externalId,
      source: args.source,
      name: args.name,
      description: args.description,
      latitude: args.latitude,
      longitude: args.longitude,
      address: args.address,
      city: args.city,
      country: args.country,
      countryCode: args.countryCode,
      category: args.category,
      tags: args.tags,
      mapillaryImageKey: args.mapillaryImageKey,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return placeId;
  },
});

export const update = mutation({
  args: {
    placeId: v.id('places'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    mapillaryImageKey: v.optional(v.string()),
    coverPhotoId: v.optional(v.id('photos')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const place = await ctx.db.get("places", args.placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || place.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const { placeId, ...updates } = args;
    const entries = Object.entries(updates) as Array<[string, unknown]>;
    const filteredUpdates = Object.fromEntries(entries.filter(([, value]) => value !== undefined));

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch("places", placeId, filteredUpdates);
    }

    return null;
  },
});

export const remove = mutation({
  args: {
    placeId: v.id('places'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const place = await ctx.db.get("places", args.placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || place.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const bucketListItems = await ctx.db
      .query('bucketListItems')
      .withIndex('by_place', (q) => q.eq('placeId', args.placeId))
      .collect();

    for (const item of bucketListItems) {
      await ctx.db.delete("bucketListItems", item._id);
    }

    await ctx.db.delete("places", args.placeId);

    return null;
  },
});

export const get = query({
  args: {
    placeId: v.id('places'),
  },
  returns: v.union(
    v.object({
      _id: v.id('places'),
      _creationTime: v.number(),
      userId: v.id('users'),
      externalId: v.optional(v.string()),
      source: placeSourceValidator,
      name: v.string(),
      description: v.optional(v.string()),
      aiDescription: v.optional(v.string()),
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      mapillaryImageKey: v.optional(v.string()),
      coverPhotoId: v.optional(v.id('photos')),
      metadata: v.optional(v.any()),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get("places", args.placeId);
  },
});

export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('places'),
      _creationTime: v.number(),
      userId: v.id('users'),
      externalId: v.optional(v.string()),
      source: placeSourceValidator,
      name: v.string(),
      description: v.optional(v.string()),
      aiDescription: v.optional(v.string()),
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      mapillaryImageKey: v.optional(v.string()),
      coverPhotoId: v.optional(v.id('photos')),
      metadata: v.optional(v.any()),
      createdAt: v.number(),
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

    let placesQuery;
    if (args.category) {
      placesQuery = ctx.db
        .query('places')
        .withIndex('by_user_and_category', (q) => q.eq('userId', user._id).eq('category', args.category));
    } else {
      placesQuery = ctx.db.query('places').withIndex('by_user', (q) => q.eq('userId', user._id));
    }

    const places = await placesQuery.order('desc').take(args.limit || 100);
    return places;
  },
});

export const search = query({
  args: {
    searchTerm: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id('places'),
      _creationTime: v.number(),
      userId: v.id('users'),
      externalId: v.optional(v.string()),
      source: placeSourceValidator,
      name: v.string(),
      description: v.optional(v.string()),
      aiDescription: v.optional(v.string()),
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      mapillaryImageKey: v.optional(v.string()),
      coverPhotoId: v.optional(v.id('photos')),
      metadata: v.optional(v.any()),
      createdAt: v.number(),
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

    const places = await ctx.db
      .query('places')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return places.filter(
      (place) =>
        place.name.toLowerCase().includes(searchLower) ||
        place.city?.toLowerCase().includes(searchLower) ||
        place.country?.toLowerCase().includes(searchLower) ||
        place.description?.toLowerCase().includes(searchLower),
    );
  },
});

export const getCategories = query({
  args: {},
  returns: v.array(v.string()),
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

    const places = await ctx.db
      .query('places')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const categories = new Set<string>();
    places.forEach((place) => {
      if (place.category) {
        categories.add(place.category);
      }
    });

    return Array.from(categories).sort();
  },
});

export const listCommunityPlaces = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('places'),
      name: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      category: v.optional(v.string()),
      photoCount: v.number(),
      journalCount: v.number(),
      visitCount: v.number(),
      previewUrl: v.optional(v.string()),
      contributors: v.array(
        v.object({
          _id: v.id('users'),
          displayName: v.optional(v.string()),
          avatarUrl: v.optional(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const placeDataMap = new Map<
      Id<'places'>,
      {
        photoCount: number;
        journalCount: number;
        visitCount: number;
        userIds: Set<string>;
        previewStorageId?: Id<'_storage'>;
      }
    >();

    const publicPhotos = await ctx.db
      .query('photos')
      .withIndex('by_visibility', (q) => q.eq('visibility', 'public'))
      .collect();

    for (const photo of publicPhotos) {
      if (!photo.placeId) continue;

      if (!placeDataMap.has(photo.placeId)) {
        placeDataMap.set(photo.placeId, {
          photoCount: 0,
          journalCount: 0,
          visitCount: 0,
          userIds: new Set()
        });
      }

      const entry = placeDataMap.get(photo.placeId)!;
      entry.photoCount++;
      entry.userIds.add(photo.userId);
      if (!entry.previewStorageId) {
        entry.previewStorageId = photo.storageId;
      }
    }

    const publicUsers = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('profileVisibility'), 'public'))
      .collect();
    const publicUserIds = new Set(publicUsers.map(u => u._id));

    const visitedItems = await ctx.db
      .query('bucketListItems')
      .filter((q) => q.eq(q.field('status'), 'visited'))
      .collect();

    for (const item of visitedItems) {
      if (!publicUserIds.has(item.userId)) continue;

      if (!placeDataMap.has(item.placeId)) {
        placeDataMap.set(item.placeId, {
          photoCount: 0,
          journalCount: 0,
          visitCount: 0,
          userIds: new Set()
        });
      }

      const entry = placeDataMap.get(item.placeId)!;
      entry.visitCount++;
      entry.userIds.add(item.userId);
    }

    const journalEntries = await ctx.db
      .query('journalEntries')
      .filter((q) => q.neq(q.field('placeId'), undefined))
      .collect();

    for (const entry of journalEntries) {
      if (!entry.placeId) continue;
      if (!publicUserIds.has(entry.userId)) continue;

      if (!placeDataMap.has(entry.placeId)) {
        placeDataMap.set(entry.placeId, {
          photoCount: 0,
          journalCount: 0,
          visitCount: 0,
          userIds: new Set()
        });
      }

      const data = placeDataMap.get(entry.placeId)!;
      data.journalCount++;
      data.userIds.add(entry.userId);
    }

    const sortedPlaceIds = Array.from(placeDataMap.entries())
      .sort((a, b) => {
        const scoreA = a[1].photoCount * 3 + a[1].journalCount * 2 + a[1].visitCount;
        const scoreB = b[1].photoCount * 3 + b[1].journalCount * 2 + b[1].visitCount;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(([id]) => id);

    const communityPlaces = await Promise.all(
      sortedPlaceIds.map(async (placeId) => {
        const place = await ctx.db.get("places", placeId);
        if (!place) return null;

        const data = placeDataMap.get(placeId)!;

        let previewUrl: string | undefined;
        if (data.previewStorageId) {
          previewUrl = await ctx.storage.getUrl(data.previewStorageId) || undefined;
        }

        const contributorIds = Array.from(data.userIds).slice(0, 3);
        const contributors = await Promise.all(
          contributorIds.map(async (odlUserId) => {
            const user = await ctx.db.get("users", odlUserId as Id<'users'>);
            return {
              _id: odlUserId as Id<'users'>,
              displayName: user?.displayName,
              avatarUrl: user?.avatarUrl,
            };
          }),
        );

        return {
          _id: place._id,
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          city: place.city,
          country: place.country,
          category: place.category,
          photoCount: data.photoCount,
          journalCount: data.journalCount,
          visitCount: data.visitCount,
          previewUrl,
          contributors,
        };
      }),
    );

    return communityPlaces.filter((p): p is NonNullable<typeof p> => p !== null);
  },
});
