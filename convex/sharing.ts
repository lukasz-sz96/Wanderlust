import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';
import { checkPermission, FREE_LIMITS } from './roles';

// Helper to generate 8-character alphanumeric share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to get current user
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

// Create a share link for a trip
export const createShareLink = mutation({
  args: {
    tripId: v.id('trips'),
  },
  returns: v.object({
    shareCode: v.string(),
    shareUrl: v.string(),
  }),
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

    // Verify trip ownership
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.userId !== currentUser._id) {
      throw new Error('Not authorized to share this trip');
    }

    // Check if share already exists
    const existingShare = await ctx.db
      .query('sharedTrips')
      .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
      .unique();

    if (existingShare) {
      return {
        shareCode: existingShare.shareCode,
        shareUrl: `/shared/${existingShare.shareCode}`,
      };
    }

    // Check share limit for free users
    const hasUnlimitedShares = checkPermission(currentUser.role, 'unlimited_shares');

    if (!hasUnlimitedShares) {
      // Get all trips owned by user
      const userTrips = await ctx.db
        .query('trips')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .collect();

      // Count how many are already shared
      let sharedCount = 0;
      for (const userTrip of userTrips) {
        const shared = await ctx.db
          .query('sharedTrips')
          .withIndex('by_trip', (q) => q.eq('tripId', userTrip._id))
          .unique();
        if (shared) {
          sharedCount++;
        }
      }

      if (sharedCount >= FREE_LIMITS.maxSharedTrips) {
        throw new Error(
          `Free users can share up to ${FREE_LIMITS.maxSharedTrips} trips. Upgrade to Pro for unlimited shares.`,
        );
      }
    }

    // Generate unique share code
    let shareCode = generateShareCode();
    let codeExists = await ctx.db
      .query('sharedTrips')
      .withIndex('by_code', (q) => q.eq('shareCode', shareCode))
      .unique();

    // Regenerate if code already exists (very unlikely)
    while (codeExists) {
      shareCode = generateShareCode();
      codeExists = await ctx.db
        .query('sharedTrips')
        .withIndex('by_code', (q) => q.eq('shareCode', shareCode))
        .unique();
    }

    // Insert share record
    await ctx.db.insert('sharedTrips', {
      tripId: args.tripId,
      shareCode,
      isPublic: true,
      viewCount: 0,
      createdAt: Date.now(),
    });

    return {
      shareCode,
      shareUrl: `/shared/${shareCode}`,
    };
  },
});

// Get shared trip (PUBLIC - no auth required)
export const getSharedTrip = query({
  args: {
    shareCode: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      trip: v.object({
        _id: v.id('trips'),
        title: v.string(),
        description: v.optional(v.string()),
        coverImageUrl: v.optional(v.string()),
        destination: v.optional(
          v.object({
            name: v.string(),
            latitude: v.number(),
            longitude: v.number(),
          }),
        ),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        status: v.union(v.literal('planning'), v.literal('active'), v.literal('completed')),
      }),
      owner: v.object({
        _id: v.id('users'),
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      }),
      itineraryItems: v.array(
        v.object({
          _id: v.id('itineraryItems'),
          dayNumber: v.number(),
          orderIndex: v.number(),
          startTime: v.optional(v.string()),
          durationMinutes: v.optional(v.number()),
          notes: v.optional(v.string()),
          category: v.union(
            v.literal('activity'),
            v.literal('meal'),
            v.literal('transport'),
            v.literal('accommodation'),
            v.literal('other'),
          ),
          place: v.object({
            _id: v.id('places'),
            name: v.string(),
            description: v.optional(v.string()),
            latitude: v.number(),
            longitude: v.number(),
            address: v.optional(v.string()),
            city: v.optional(v.string()),
            country: v.optional(v.string()),
            category: v.optional(v.string()),
          }),
        }),
      ),
      viewCount: v.number(),
      showBranding: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    // Try lookup by shareCode first
    let sharedTrip = await ctx.db
      .query('sharedTrips')
      .withIndex('by_code', (q) => q.eq('shareCode', args.shareCode))
      .unique();

    // If not found, try by customSlug
    if (!sharedTrip) {
      sharedTrip = await ctx.db
        .query('sharedTrips')
        .withIndex('by_slug', (q) => q.eq('customSlug', args.shareCode))
        .unique();
    }

    // Return null if not found or not public
    if (!sharedTrip || !sharedTrip.isPublic) {
      return null;
    }

    // Get the trip
    const trip = await ctx.db.get(sharedTrip.tripId);
    if (!trip) {
      return null;
    }

    // Get the owner
    const owner = await ctx.db.get(trip.userId);
    if (!owner) {
      return null;
    }

    // Check if owner has hide_branding permission
    const showBranding = !checkPermission(owner.role, 'hide_branding');

    // Get cover image URL if exists
    let coverImageUrl: string | undefined;
    if (trip.coverImageId) {
      coverImageUrl = (await ctx.storage.getUrl(trip.coverImageId)) ?? undefined;
    }

    // Get itinerary items with places
    const items = await ctx.db
      .query('itineraryItems')
      .withIndex('by_trip', (q) => q.eq('tripId', trip._id))
      .collect();

    // Sort by dayNumber and orderIndex
    items.sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) {
        return a.dayNumber - b.dayNumber;
      }
      return a.orderIndex - b.orderIndex;
    });

    const itineraryItems: {
      _id: Id<'itineraryItems'>;
      dayNumber: number;
      orderIndex: number;
      startTime: string | undefined;
      durationMinutes: number | undefined;
      notes: string | undefined;
      category: 'activity' | 'meal' | 'transport' | 'accommodation' | 'other';
      place: {
        _id: Id<'places'>;
        name: string;
        description: string | undefined;
        latitude: number;
        longitude: number;
        address: string | undefined;
        city: string | undefined;
        country: string | undefined;
        category: string | undefined;
      };
    }[] = [];

    for (const item of items) {
      const place = await ctx.db.get(item.placeId);
      if (!place) {
        continue;
      }

      itineraryItems.push({
        _id: item._id,
        dayNumber: item.dayNumber,
        orderIndex: item.orderIndex,
        startTime: item.startTime,
        durationMinutes: item.durationMinutes,
        notes: item.notes,
        category: item.category,
        place: {
          _id: place._id,
          name: place.name,
          description: place.description,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address,
          city: place.city,
          country: place.country,
          category: place.category,
        },
      });
    }

    return {
      trip: {
        _id: trip._id,
        title: trip.title,
        description: trip.description,
        coverImageUrl,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
      },
      owner: {
        _id: owner._id,
        displayName: owner.displayName,
        avatarUrl: owner.avatarUrl,
      },
      itineraryItems,
      viewCount: sharedTrip.viewCount,
      showBranding,
    };
  },
});

// Get share settings for own trip
export const getShareSettings = query({
  args: {
    tripId: v.id('trips'),
  },
  returns: v.union(
    v.null(),
    v.object({
      shareCode: v.string(),
      isPublic: v.boolean(),
      customSlug: v.optional(v.string()),
      viewCount: v.number(),
      shareUrl: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser) {
      return null;
    }

    // Verify trip ownership
    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.userId !== currentUser._id) {
      return null;
    }

    // Get share settings
    const sharedTrip = await ctx.db
      .query('sharedTrips')
      .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
      .unique();

    if (!sharedTrip) {
      return null;
    }

    // Determine share URL (prefer custom slug if set)
    const shareUrl = sharedTrip.customSlug
      ? `/shared/${sharedTrip.customSlug}`
      : `/shared/${sharedTrip.shareCode}`;

    return {
      shareCode: sharedTrip.shareCode,
      isPublic: sharedTrip.isPublic,
      customSlug: sharedTrip.customSlug,
      viewCount: sharedTrip.viewCount,
      shareUrl,
    };
  },
});

// Update share settings
export const updateShareSettings = mutation({
  args: {
    tripId: v.id('trips'),
    isPublic: v.optional(v.boolean()),
    customSlug: v.optional(v.string()),
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

    // Verify trip ownership
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.userId !== currentUser._id) {
      throw new Error('Not authorized to update share settings');
    }

    // Get existing share
    const sharedTrip = await ctx.db
      .query('sharedTrips')
      .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
      .unique();

    if (!sharedTrip) {
      throw new Error('Trip is not shared. Create a share link first.');
    }

    // Prepare updates
    const updates: {
      isPublic?: boolean;
      customSlug?: string;
    } = {};

    if (args.isPublic !== undefined) {
      updates.isPublic = args.isPublic;
    }

    if (args.customSlug !== undefined) {
      // Check if user has custom_urls permission
      const hasCustomUrls = checkPermission(currentUser.role, 'custom_urls');
      if (!hasCustomUrls) {
        throw new Error('Custom URLs require Pro subscription');
      }

      // Validate slug format (lowercase, numbers, hyphens only)
      const slugRegex = /^[a-z0-9-]+$/;
      if (args.customSlug && !slugRegex.test(args.customSlug)) {
        throw new Error('Custom slug can only contain lowercase letters, numbers, and hyphens');
      }

      // Check slug uniqueness (if not empty)
      if (args.customSlug) {
        const existingSlug = await ctx.db
          .query('sharedTrips')
          .withIndex('by_slug', (q) => q.eq('customSlug', args.customSlug))
          .unique();

        if (existingSlug && existingSlug._id !== sharedTrip._id) {
          throw new Error('This custom URL is already taken');
        }
      }

      updates.customSlug = args.customSlug || undefined;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(sharedTrip._id, updates);
    }

    return null;
  },
});

// Delete share link
export const deleteShareLink = mutation({
  args: {
    tripId: v.id('trips'),
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

    // Verify trip ownership
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.userId !== currentUser._id) {
      throw new Error('Not authorized to delete share link');
    }

    // Find and delete share record
    const sharedTrip = await ctx.db
      .query('sharedTrips')
      .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
      .unique();

    if (sharedTrip) {
      await ctx.db.delete(sharedTrip._id);
    }

    return null;
  },
});

// Increment view count (called when viewing shared trip)
export const incrementViewCount = mutation({
  args: {
    shareCode: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Try lookup by shareCode first
    let sharedTrip = await ctx.db
      .query('sharedTrips')
      .withIndex('by_code', (q) => q.eq('shareCode', args.shareCode))
      .unique();

    // If not found, try by customSlug
    if (!sharedTrip) {
      sharedTrip = await ctx.db
        .query('sharedTrips')
        .withIndex('by_slug', (q) => q.eq('customSlug', args.shareCode))
        .unique();
    }

    if (sharedTrip && sharedTrip.isPublic) {
      await ctx.db.patch(sharedTrip._id, {
        viewCount: sharedTrip.viewCount + 1,
      });
    }

    return null;
  },
});
