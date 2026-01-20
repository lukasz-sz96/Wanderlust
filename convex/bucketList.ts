import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { internal } from './_generated/api';

const statusValidator = v.union(v.literal('want_to_visit'), v.literal('visited'), v.literal('skipped'));

export const add = mutation({
  args: {
    placeId: v.id('places'),
    status: statusValidator,
    priority: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id('bucketListItems'),
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

    const existing = await ctx.db
      .query('bucketListItems')
      .withIndex('by_place', (q) => q.eq('placeId', args.placeId))
      .filter((q) => q.eq(q.field('userId'), user._id))
      .unique();

    if (existing) {
      throw new Error('Place already in bucket list');
    }

    const items = await ctx.db
      .query('bucketListItems')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const maxPriority = items.reduce((max, item) => Math.max(max, item.priority), 0);

    const itemId = await ctx.db.insert('bucketListItems', {
      userId: user._id,
      placeId: args.placeId,
      status: args.status,
      priority: args.priority ?? maxPriority + 1,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return itemId;
  },
});

export const updateStatus = mutation({
  args: {
    itemId: v.id('bucketListItems'),
    status: statusValidator,
    rating: v.optional(v.number()),
    visitedDate: v.optional(v.string()),
    weatherSnapshot: v.optional(
      v.object({
        temperature: v.number(),
        condition: v.string(),
        icon: v.string(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const item = await ctx.db.get("bucketListItems", args.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || item.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const updates: {
      status: typeof args.status;
      visitedAt?: number;
      visitedDate?: string;
      rating?: number;
      weatherSnapshot?: { temperature: number; condition: string; icon: string };
    } = {
      status: args.status,
    };

    if (args.status === 'visited') {
      updates.visitedAt = Date.now();
      if (args.visitedDate) {
        updates.visitedDate = args.visitedDate;
      }
      if (args.rating !== undefined) {
        updates.rating = args.rating;
      }
      if (args.weatherSnapshot) {
        updates.weatherSnapshot = args.weatherSnapshot;
      }
    }

    await ctx.db.patch("bucketListItems", args.itemId, updates);

    // Record activity to feed when marking as visited
    if (args.status === 'visited') {
      const place = await ctx.db.get("places", item.placeId);
      await ctx.runMutation(internal.feed.recordActivity, {
        userId: user._id,
        type: 'place_visited',
        referenceId: item.placeId,
        metadata: { placeName: place?.name, rating: args.rating },
      });
    }

    return null;
  },
});

export const updatePriority = mutation({
  args: {
    itemId: v.id('bucketListItems'),
    priority: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const item = await ctx.db.get("bucketListItems", args.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || item.userId !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch("bucketListItems", args.itemId, { priority: args.priority });

    return null;
  },
});

export const updateNotes = mutation({
  args: {
    itemId: v.id('bucketListItems'),
    notes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const item = await ctx.db.get("bucketListItems", args.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || item.userId !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch("bucketListItems", args.itemId, { notes: args.notes });

    return null;
  },
});

export const remove = mutation({
  args: {
    itemId: v.id('bucketListItems'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const item = await ctx.db.get("bucketListItems", args.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || item.userId !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.delete("bucketListItems", args.itemId);

    return null;
  },
});

export const list = query({
  args: {
    status: v.optional(statusValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id('bucketListItems'),
      _creationTime: v.number(),
      userId: v.id('users'),
      placeId: v.id('places'),
      status: statusValidator,
      priority: v.number(),
      notes: v.optional(v.string()),
      visitedAt: v.optional(v.number()),
      visitedDate: v.optional(v.string()),
      rating: v.optional(v.number()),
      weatherSnapshot: v.optional(
        v.object({
          temperature: v.number(),
          condition: v.string(),
          icon: v.string(),
        }),
      ),
      createdAt: v.number(),
      place: v.union(
        v.object({
          _id: v.id('places'),
          name: v.string(),
          category: v.optional(v.string()),
          city: v.optional(v.string()),
          country: v.optional(v.string()),
          latitude: v.number(),
          longitude: v.number(),
          description: v.optional(v.string()),
        }),
        v.null(),
      ),
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

    let items;
    const status = args.status;
    if (status) {
      items = await ctx.db
        .query('bucketListItems')
        .withIndex('by_user_and_status', (q) => q.eq('userId', user._id).eq('status', status))
        .collect();
    } else {
      items = await ctx.db
        .query('bucketListItems')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
    }

    items.sort((a, b) => a.priority - b.priority);

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const place = await ctx.db.get("places", item.placeId);
        return {
          ...item,
          place: place
            ? {
                _id: place._id,
                name: place.name,
                category: place.category,
                city: place.city,
                country: place.country,
                latitude: place.latitude,
                longitude: place.longitude,
                description: place.description,
              }
            : null,
        };
      }),
    );

    return enrichedItems;
  },
});

export const getByPlace = query({
  args: {
    placeId: v.id('places'),
  },
  returns: v.union(
    v.object({
      _id: v.id('bucketListItems'),
      _creationTime: v.number(),
      userId: v.id('users'),
      placeId: v.id('places'),
      status: statusValidator,
      priority: v.number(),
      notes: v.optional(v.string()),
      visitedAt: v.optional(v.number()),
      visitedDate: v.optional(v.string()),
      rating: v.optional(v.number()),
      weatherSnapshot: v.optional(
        v.object({
          temperature: v.number(),
          condition: v.string(),
          icon: v.string(),
        }),
      ),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const item = await ctx.db
      .query('bucketListItems')
      .withIndex('by_place', (q) => q.eq('placeId', args.placeId))
      .filter((q) => q.eq(q.field('userId'), user._id))
      .unique();

    return item;
  },
});

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    wantToVisit: v.number(),
    visited: v.number(),
    skipped: v.number(),
    countries: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { total: 0, wantToVisit: 0, visited: 0, skipped: 0, countries: 0 };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      return { total: 0, wantToVisit: 0, visited: 0, skipped: 0, countries: 0 };
    }

    const items = await ctx.db
      .query('bucketListItems')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const visitedItems = items.filter((item) => item.status === 'visited');
    const countries = new Set<string>();

    for (const item of items) {
      const place = await ctx.db.get("places", item.placeId);
      if (place?.country) {
        countries.add(place.country);
      }
    }

    return {
      total: items.length,
      wantToVisit: items.filter((i) => i.status === 'want_to_visit').length,
      visited: visitedItems.length,
      skipped: items.filter((i) => i.status === 'skipped').length,
      countries: countries.size,
    };
  },
});

export const reorder = mutation({
  args: {
    itemIds: v.array(v.id('bucketListItems')),
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

    for (let i = 0; i < args.itemIds.length; i++) {
      const item = await ctx.db.get("bucketListItems", args.itemIds[i]);
      if (item && item.userId === user._id) {
        await ctx.db.patch("bucketListItems", args.itemIds[i], { priority: i + 1 });
      }
    }

    return null;
  },
});
