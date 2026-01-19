import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const statusValidator = v.union(
  v.literal('planning'),
  v.literal('active'),
  v.literal('completed')
);

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    destination: v.optional(
      v.object({
        name: v.string(),
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  returns: v.id('trips'),
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

    const now = Date.now();
    const tripId = await ctx.db.insert('trips', {
      userId: user._id,
      title: args.title,
      description: args.description,
      destination: args.destination,
      startDate: args.startDate,
      endDate: args.endDate,
      status: 'planning',
      createdAt: now,
      updatedAt: now,
    });

    return tripId;
  },
});

export const update = mutation({
  args: {
    tripId: v.id('trips'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    destination: v.optional(
      v.object({
        name: v.string(),
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(statusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user || trip.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.destination !== undefined) updates.destination = args.destination;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.tripId, updates);

    return null;
  },
});

export const remove = mutation({
  args: {
    tripId: v.id('trips'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user || trip.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const itineraryItems = await ctx.db
      .query('itineraryItems')
      .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
      .collect();

    for (const item of itineraryItems) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.tripId);

    return null;
  },
});

export const get = query({
  args: {
    tripId: v.id('trips'),
  },
  returns: v.union(
    v.object({
      _id: v.id('trips'),
      _creationTime: v.number(),
      userId: v.id('users'),
      title: v.string(),
      description: v.optional(v.string()),
      coverImageId: v.optional(v.id('_storage')),
      coverImageUrl: v.optional(v.string()),
      destination: v.optional(
        v.object({
          name: v.string(),
          latitude: v.number(),
          longitude: v.number(),
        })
      ),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      status: statusValidator,
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user || trip.userId !== user._id) {
      return null;
    }

    let coverImageUrl: string | undefined;
    if (trip.coverImageId) {
      coverImageUrl = await ctx.storage.getUrl(trip.coverImageId) ?? undefined;
    }

    return {
      ...trip,
      coverImageUrl,
    };
  },
});

export const list = query({
  args: {
    status: v.optional(statusValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id('trips'),
      _creationTime: v.number(),
      userId: v.id('users'),
      title: v.string(),
      description: v.optional(v.string()),
      coverImageId: v.optional(v.id('_storage')),
      coverImageUrl: v.optional(v.string()),
      destination: v.optional(
        v.object({
          name: v.string(),
          latitude: v.number(),
          longitude: v.number(),
        })
      ),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      status: statusValidator,
      createdAt: v.number(),
      updatedAt: v.number(),
      itemCount: v.number(),
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

    let trips;
    if (args.status) {
      trips = await ctx.db
        .query('trips')
        .withIndex('by_user_and_status', (q) =>
          q.eq('userId', user._id).eq('status', args.status)
        )
        .collect();
    } else {
      trips = await ctx.db
        .query('trips')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
    }

    trips.sort((a, b) => b.updatedAt - a.updatedAt);

    const enrichedTrips = await Promise.all(
      trips.map(async (trip) => {
        let coverImageUrl: string | undefined;
        if (trip.coverImageId) {
          coverImageUrl = await ctx.storage.getUrl(trip.coverImageId) ?? undefined;
        }

        const itineraryItems = await ctx.db
          .query('itineraryItems')
          .withIndex('by_trip', (q) => q.eq('tripId', trip._id))
          .collect();

        return {
          ...trip,
          coverImageUrl,
          itemCount: itineraryItems.length,
        };
      })
    );

    return enrichedTrips;
  },
});

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    planning: v.number(),
    active: v.number(),
    completed: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { total: 0, planning: 0, active: 0, completed: 0 };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();

    if (!user) {
      return { total: 0, planning: 0, active: 0, completed: 0 };
    }

    const trips = await ctx.db
      .query('trips')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    return {
      total: trips.length,
      planning: trips.filter((t) => t.status === 'planning').length,
      active: trips.filter((t) => t.status === 'active').length,
      completed: trips.filter((t) => t.status === 'completed').length,
    };
  },
});
