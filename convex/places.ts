import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

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

    const place = await ctx.db.get(args.placeId);
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
    const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(placeId, filteredUpdates);
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

    const place = await ctx.db.get(args.placeId);
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
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.placeId);

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
    return await ctx.db.get(args.placeId);
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

    let query;
    if (args.category) {
      query = ctx.db
        .query('places')
        .withIndex('by_user_and_category', (q) => q.eq('userId', user._id).eq('category', args.category));
    } else {
      query = ctx.db.query('places').withIndex('by_user', (q) => q.eq('userId', user._id));
    }

    const places = await query.order('desc').take(args.limit || 100);
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
