import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    authUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        defaultMapStyle: v.optional(v.string()),
        temperatureUnit: v.optional(v.union(v.literal('celsius'), v.literal('fahrenheit'))),
        distanceUnit: v.optional(v.union(v.literal('km'), v.literal('mi'))),
        dateFormat: v.optional(v.union(v.literal('mdy'), v.literal('dmy'), v.literal('ymd'))),
        profileVisibility: v.optional(v.union(v.literal('public'), v.literal('private'))),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    bio: v.optional(v.string()),
    travelStyles: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    homeLocation: v.optional(v.string()),
    coverPhotoId: v.optional(v.id('_storage')),
    profileVisibility: v.optional(v.union(v.literal('public'), v.literal('friends'), v.literal('private'))),
    role: v.optional(v.union(v.literal('free'), v.literal('pro'), v.literal('moderator'), v.literal('admin'))),
    roleUpdatedAt: v.optional(v.number()),
  })
    .index('by_auth_id', ['authUserId'])
    .index('by_email', ['email'])
    .index('by_role', ['role']),

  places: defineTable({
    userId: v.id('users'),
    externalId: v.optional(v.string()),
    source: v.union(v.literal('osm'), v.literal('ai_generated'), v.literal('user_created')),
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
  })
    .index('by_user', ['userId'])
    .index('by_user_and_category', ['userId', 'category']),

  bucketListItems: defineTable({
    userId: v.id('users'),
    placeId: v.id('places'),
    status: v.union(v.literal('want_to_visit'), v.literal('visited'), v.literal('skipped')),
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
  })
    .index('by_user', ['userId'])
    .index('by_user_and_status', ['userId', 'status'])
    .index('by_place', ['placeId']),

  trips: defineTable({
    userId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    coverImageId: v.optional(v.id('_storage')),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_status', ['userId', 'status']),

  itineraryItems: defineTable({
    tripId: v.id('trips'),
    placeId: v.id('places'),
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
    aiGenerated: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_trip', ['tripId'])
    .index('by_trip_and_day', ['tripId', 'dayNumber']),

  journalEntries: defineTable({
    userId: v.id('users'),
    tripId: v.optional(v.id('trips')),
    placeId: v.optional(v.id('places')),
    title: v.optional(v.string()),
    content: v.any(), // Tiptap JSON
    mood: v.optional(v.union(v.literal('amazing'), v.literal('good'), v.literal('neutral'), v.literal('challenging'))),
    weatherSnapshot: v.optional(
      v.object({
        temperature: v.number(),
        condition: v.string(),
        icon: v.string(),
      }),
    ),
    entryDate: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_date', ['userId', 'entryDate'])
    .index('by_trip', ['tripId']),

  photos: defineTable({
    userId: v.id('users'),
    tripId: v.optional(v.id('trips')),
    journalEntryId: v.optional(v.id('journalEntries')),
    placeId: v.optional(v.id('places')),
    storageId: v.id('_storage'),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    takenAt: v.optional(v.number()),
    caption: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal('public'), v.literal('followers'), v.literal('private'))),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_trip', ['tripId'])
    .index('by_journal_entry', ['journalEntryId'])
    .index('by_place', ['placeId'])
    .index('by_visibility', ['visibility']),

  follows: defineTable({
    followerId: v.id('users'),
    followingId: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_follower', ['followerId'])
    .index('by_following', ['followingId'])
    .index('by_pair', ['followerId', 'followingId']),

  activityFeed: defineTable({
    userId: v.id('users'),
    type: v.union(
      v.literal('trip_created'),
      v.literal('place_visited'),
      v.literal('journal_posted'),
      v.literal('place_added'),
    ),
    referenceId: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_created', ['createdAt'])
    .index('by_user_and_created', ['userId', 'createdAt']),

  sharedTrips: defineTable({
    tripId: v.id('trips'),
    ownerId: v.id('users'), // Denormalized for efficient counting
    shareCode: v.string(),
    isPublic: v.boolean(),
    customSlug: v.optional(v.string()),
    viewCount: v.number(),
    createdAt: v.number(),
  })
    .index('by_trip', ['tripId'])
    .index('by_code', ['shareCode'])
    .index('by_slug', ['customSlug'])
    .index('by_owner', ['ownerId']),
});
