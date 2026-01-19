import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const categoryValidator = v.union(
  v.literal('activity'),
  v.literal('meal'),
  v.literal('transport'),
  v.literal('accommodation'),
  v.literal('other')
);

export const add = mutation({
  args: {
    tripId: v.id('trips'),
    placeId: v.id('places'),
    dayNumber: v.number(),
    startTime: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    category: v.optional(categoryValidator),
  },
  returns: v.id('itineraryItems'),
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

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new Error('Trip not found or not authorized');
    }

    const existingItems = await ctx.db
      .query('itineraryItems')
      .withIndex('by_trip_and_day', (q) =>
        q.eq('tripId', args.tripId).eq('dayNumber', args.dayNumber)
      )
      .collect();

    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.orderIndex), 0);

    const itemId = await ctx.db.insert('itineraryItems', {
      tripId: args.tripId,
      placeId: args.placeId,
      dayNumber: args.dayNumber,
      orderIndex: maxOrder + 1,
      startTime: args.startTime,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
      category: args.category ?? 'activity',
      aiGenerated: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.tripId, { updatedAt: Date.now() });

    return itemId;
  },
});

export const update = mutation({
  args: {
    itemId: v.id('itineraryItems'),
    dayNumber: v.optional(v.number()),
    startTime: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    category: v.optional(categoryValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const trip = await ctx.db.get(item.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const updates: Record<string, unknown> = {};
    if (args.dayNumber !== undefined) updates.dayNumber = args.dayNumber;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.durationMinutes !== undefined) updates.durationMinutes = args.durationMinutes;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.category !== undefined) updates.category = args.category;

    await ctx.db.patch(args.itemId, updates);
    await ctx.db.patch(item.tripId, { updatedAt: Date.now() });

    return null;
  },
});

export const remove = mutation({
  args: {
    itemId: v.id('itineraryItems'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const trip = await ctx.db.get(item.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.delete(args.itemId);
    await ctx.db.patch(item.tripId, { updatedAt: Date.now() });

    return null;
  },
});

export const reorder = mutation({
  args: {
    tripId: v.id('trips'),
    dayNumber: v.number(),
    itemIds: v.array(v.id('itineraryItems')),
  },
  returns: v.null(),
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

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      throw new Error('Not authorized');
    }

    for (let i = 0; i < args.itemIds.length; i++) {
      const item = await ctx.db.get(args.itemIds[i]);
      if (item && item.tripId === args.tripId) {
        await ctx.db.patch(args.itemIds[i], {
          orderIndex: i + 1,
          dayNumber: args.dayNumber,
        });
      }
    }

    await ctx.db.patch(args.tripId, { updatedAt: Date.now() });

    return null;
  },
});

export const listByTrip = query({
  args: {
    tripId: v.id('trips'),
  },
  returns: v.array(
    v.object({
      _id: v.id('itineraryItems'),
      _creationTime: v.number(),
      tripId: v.id('trips'),
      placeId: v.id('places'),
      dayNumber: v.number(),
      orderIndex: v.number(),
      startTime: v.optional(v.string()),
      durationMinutes: v.optional(v.number()),
      notes: v.optional(v.string()),
      category: categoryValidator,
      aiGenerated: v.boolean(),
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
        }),
        v.null()
      ),
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

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      return [];
    }

    const items = await ctx.db
      .query('itineraryItems')
      .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
      .collect();

    items.sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.orderIndex - b.orderIndex;
    });

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const place = await ctx.db.get(item.placeId);
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
              }
            : null,
        };
      })
    );

    return enrichedItems;
  },
});

export const listByDay = query({
  args: {
    tripId: v.id('trips'),
    dayNumber: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id('itineraryItems'),
      _creationTime: v.number(),
      tripId: v.id('trips'),
      placeId: v.id('places'),
      dayNumber: v.number(),
      orderIndex: v.number(),
      startTime: v.optional(v.string()),
      durationMinutes: v.optional(v.number()),
      notes: v.optional(v.string()),
      category: categoryValidator,
      aiGenerated: v.boolean(),
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
        }),
        v.null()
      ),
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

    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== user._id) {
      return [];
    }

    const items = await ctx.db
      .query('itineraryItems')
      .withIndex('by_trip_and_day', (q) =>
        q.eq('tripId', args.tripId).eq('dayNumber', args.dayNumber)
      )
      .collect();

    items.sort((a, b) => a.orderIndex - b.orderIndex);

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const place = await ctx.db.get(item.placeId);
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
              }
            : null,
        };
      })
    );

    return enrichedItems;
  },
});
