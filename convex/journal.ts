import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const moodValidator = v.union(
  v.literal('amazing'),
  v.literal('good'),
  v.literal('neutral'),
  v.literal('challenging')
);

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    content: v.any(),
    tripId: v.optional(v.id('trips')),
    placeId: v.optional(v.id('places')),
    mood: v.optional(moodValidator),
    entryDate: v.string(),
    weatherSnapshot: v.optional(
      v.object({
        temperature: v.number(),
        condition: v.string(),
        icon: v.string(),
      })
    ),
  },
  returns: v.id('journalEntries'),
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

    const now = Date.now();
    const entryId = await ctx.db.insert('journalEntries', {
      userId: user._id,
      title: args.title,
      content: args.content,
      tripId: args.tripId,
      placeId: args.placeId,
      mood: args.mood,
      entryDate: args.entryDate,
      weatherSnapshot: args.weatherSnapshot,
      createdAt: now,
      updatedAt: now,
    });

    return entryId;
  },
});

export const update = mutation({
  args: {
    entryId: v.id('journalEntries'),
    title: v.optional(v.string()),
    content: v.optional(v.any()),
    tripId: v.optional(v.id('trips')),
    placeId: v.optional(v.id('places')),
    mood: v.optional(moodValidator),
    entryDate: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || entry.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.tripId !== undefined) updates.tripId = args.tripId;
    if (args.placeId !== undefined) updates.placeId = args.placeId;
    if (args.mood !== undefined) updates.mood = args.mood;
    if (args.entryDate !== undefined) updates.entryDate = args.entryDate;

    await ctx.db.patch(args.entryId, updates);

    return null;
  },
});

export const remove = mutation({
  args: {
    entryId: v.id('journalEntries'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || entry.userId !== user._id) {
      throw new Error('Not authorized');
    }

    const photos = await ctx.db
      .query('photos')
      .withIndex('by_journal_entry', (q) => q.eq('journalEntryId', args.entryId))
      .collect();

    for (const photo of photos) {
      await ctx.storage.delete(photo.storageId);
      await ctx.db.delete(photo._id);
    }

    await ctx.db.delete(args.entryId);

    return null;
  },
});

export const get = query({
  args: {
    entryId: v.id('journalEntries'),
  },
  returns: v.union(
    v.object({
      _id: v.id('journalEntries'),
      _creationTime: v.number(),
      userId: v.id('users'),
      tripId: v.optional(v.id('trips')),
      placeId: v.optional(v.id('places')),
      title: v.optional(v.string()),
      content: v.any(),
      mood: v.optional(moodValidator),
      weatherSnapshot: v.optional(
        v.object({
          temperature: v.number(),
          condition: v.string(),
          icon: v.string(),
        })
      ),
      entryDate: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      trip: v.optional(
        v.object({
          _id: v.id('trips'),
          title: v.string(),
        })
      ),
      place: v.optional(
        v.object({
          _id: v.id('places'),
          name: v.string(),
          city: v.optional(v.string()),
          country: v.optional(v.string()),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user || entry.userId !== user._id) {
      return null;
    }

    let trip;
    if (entry.tripId) {
      const tripDoc = await ctx.db.get(entry.tripId);
      if (tripDoc) {
        trip = { _id: tripDoc._id, title: tripDoc.title };
      }
    }

    let place;
    if (entry.placeId) {
      const placeDoc = await ctx.db.get(entry.placeId);
      if (placeDoc) {
        place = {
          _id: placeDoc._id,
          name: placeDoc.name,
          city: placeDoc.city,
          country: placeDoc.country,
        };
      }
    }

    return {
      ...entry,
      trip,
      place,
    };
  },
});

export const list = query({
  args: {
    tripId: v.optional(v.id('trips')),
  },
  returns: v.array(
    v.object({
      _id: v.id('journalEntries'),
      _creationTime: v.number(),
      userId: v.id('users'),
      tripId: v.optional(v.id('trips')),
      placeId: v.optional(v.id('places')),
      title: v.optional(v.string()),
      content: v.any(),
      mood: v.optional(moodValidator),
      weatherSnapshot: v.optional(
        v.object({
          temperature: v.number(),
          condition: v.string(),
          icon: v.string(),
        })
      ),
      entryDate: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      trip: v.optional(
        v.object({
          _id: v.id('trips'),
          title: v.string(),
        })
      ),
      place: v.optional(
        v.object({
          _id: v.id('places'),
          name: v.string(),
          city: v.optional(v.string()),
          country: v.optional(v.string()),
        })
      ),
      photoCount: v.number(),
    })
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

    let entries;
    if (args.tripId) {
      entries = await ctx.db
        .query('journalEntries')
        .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
        .collect();
      entries = entries.filter((e) => e.userId === user._id);
    } else {
      entries = await ctx.db
        .query('journalEntries')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
    }

    entries.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        let trip;
        if (entry.tripId) {
          const tripDoc = await ctx.db.get(entry.tripId);
          if (tripDoc) {
            trip = { _id: tripDoc._id, title: tripDoc.title };
          }
        }

        let place;
        if (entry.placeId) {
          const placeDoc = await ctx.db.get(entry.placeId);
          if (placeDoc) {
            place = {
              _id: placeDoc._id,
              name: placeDoc.name,
              city: placeDoc.city,
              country: placeDoc.country,
            };
          }
        }

        const photos = await ctx.db
          .query('photos')
          .withIndex('by_journal_entry', (q) => q.eq('journalEntryId', entry._id))
          .collect();

        return {
          ...entry,
          trip,
          place,
          photoCount: photos.length,
        };
      })
    );

    return enrichedEntries;
  },
});

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    thisMonth: v.number(),
    withPhotos: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { total: 0, thisMonth: 0, withPhotos: 0 };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!user) {
      return { total: 0, thisMonth: 0, withPhotos: 0 };
    }

    const entries = await ctx.db
      .query('journalEntries')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let withPhotos = 0;
    for (const entry of entries) {
      const photos = await ctx.db
        .query('photos')
        .withIndex('by_journal_entry', (q) => q.eq('journalEntryId', entry._id))
        .collect();
      if (photos.length > 0) withPhotos++;
    }

    return {
      total: entries.length,
      thisMonth: entries.filter((e) => new Date(e.entryDate) >= startOfMonth).length,
      withPhotos,
    };
  },
});
