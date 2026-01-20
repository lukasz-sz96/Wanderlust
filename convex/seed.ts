import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';

const DEMO_USERS = [
  { name: 'Sofia Martinez', email: 'sofia.demo@wanderlust.app', bio: 'Adventure seeker and mountain lover. 32 countries and counting! 🏔️', homeLocation: 'Barcelona, Spain', travelStyles: ['adventure', 'nature', 'photography'] },
  { name: 'James Chen', email: 'james.demo@wanderlust.app', bio: 'Food-obsessed traveler exploring street markets worldwide 🍜', homeLocation: 'Singapore', travelStyles: ['foodie', 'culture', 'urban'] },
  { name: 'Emma Thompson', email: 'emma.demo@wanderlust.app', bio: 'Solo female traveler | Budget tips | Sustainable tourism advocate 🌱', homeLocation: 'London, UK', travelStyles: ['solo', 'budget', 'eco-friendly'] },
  { name: 'Lucas Silva', email: 'lucas.demo@wanderlust.app', bio: 'Brazilian photographer chasing golden hours around the globe 📸', homeLocation: 'São Paulo, Brazil', travelStyles: ['photography', 'beaches', 'adventure'] },
  { name: 'Yuki Tanaka', email: 'yuki.demo@wanderlust.app', bio: 'Temple hopper & hot spring enthusiast. Finding zen one trip at a time 🏯', homeLocation: 'Kyoto, Japan', travelStyles: ['culture', 'wellness', 'nature'] },
  { name: 'Anna Kowalski', email: 'anna.demo@wanderlust.app', bio: 'History buff exploring ancient ruins and medieval castles 🏰', homeLocation: 'Krakow, Poland', travelStyles: ['history', 'architecture', 'museums'] },
  { name: 'Marcus Johnson', email: 'marcus.demo@wanderlust.app', bio: 'Hiking 50 peaks before 50. Currently at 38! ⛰️', homeLocation: 'Denver, USA', travelStyles: ['hiking', 'camping', 'adventure'] },
  { name: 'Priya Sharma', email: 'priya.demo@wanderlust.app', bio: 'Wellness retreats & spiritual journeys. Yoga everywhere I go 🧘‍♀️', homeLocation: 'Mumbai, India', travelStyles: ['wellness', 'spiritual', 'nature'] },
];

const DEMO_PLACES = [
  // Europe
  { name: 'Eiffel Tower', city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8584, lng: 2.2945, category: 'landmark', tags: ['iconic', 'architecture', 'romantic'], description: 'The iconic iron lattice tower on the Champ de Mars, a global cultural icon of France.' },
  { name: 'Colosseum', city: 'Rome', country: 'Italy', countryCode: 'IT', lat: 41.8902, lng: 12.4922, category: 'historic', tags: ['ancient', 'architecture', 'unesco'], description: 'The largest ancient amphitheatre ever built, this iconic symbol of Imperial Rome hosted gladiatorial contests.' },
  { name: 'Sagrada Família', city: 'Barcelona', country: 'Spain', countryCode: 'ES', lat: 41.4036, lng: 2.1744, category: 'landmark', tags: ['gaudi', 'architecture', 'unesco'], description: 'Gaudí\'s unfinished masterpiece, a breathtaking basilica that has been under construction since 1882.' },
  { name: 'Santorini Caldera', city: 'Santorini', country: 'Greece', countryCode: 'GR', lat: 36.4618, lng: 25.3764, category: 'nature', tags: ['sunset', 'volcanic', 'romantic'], description: 'A volcanic crater surrounded by white-washed buildings with blue domes overlooking the Aegean Sea.' },
  { name: 'Neuschwanstein Castle', city: 'Schwangau', country: 'Germany', countryCode: 'DE', lat: 47.5576, lng: 10.7498, category: 'landmark', tags: ['castle', 'fairytale', 'mountains'], description: 'A 19th-century Romanesque Revival palace that inspired Disney\'s Sleeping Beauty Castle.' },
  { name: 'Amsterdam Canals', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', lat: 52.3676, lng: 4.9041, category: 'culture', tags: ['canals', 'cycling', 'museums'], description: 'UNESCO-listed 17th-century canal ring with charming houseboats and world-class museums.' },
  { name: 'Hallstatt Village', city: 'Hallstatt', country: 'Austria', countryCode: 'AT', lat: 47.5622, lng: 13.6493, category: 'nature', tags: ['lake', 'alpine', 'picturesque'], description: 'A fairy-tale lakeside village nestled between mountains and a pristine alpine lake.' },
  { name: 'Charles Bridge', city: 'Prague', country: 'Czech Republic', countryCode: 'CZ', lat: 50.0865, lng: 14.4114, category: 'landmark', tags: ['historic', 'gothic', 'photography'], description: 'A medieval stone arch bridge lined with 30 baroque statues of saints.' },
  { name: 'Northern Lights', city: 'Tromsø', country: 'Norway', countryCode: 'NO', lat: 69.6492, lng: 18.9553, category: 'nature', tags: ['aurora', 'arctic', 'winter'], description: 'One of the best locations on Earth to witness the magical aurora borealis.' },
  { name: 'Blue Lagoon', city: 'Grindavík', country: 'Iceland', countryCode: 'IS', lat: 63.8804, lng: -22.4495, category: 'nature', tags: ['geothermal', 'spa', 'volcanic'], description: 'A geothermal spa with milky blue waters rich in minerals like silica and sulfur.' },

  // Asia
  { name: 'Great Wall of China', city: 'Beijing', country: 'China', countryCode: 'CN', lat: 40.4319, lng: 116.5704, category: 'historic', tags: ['ancient', 'unesco', 'hiking'], description: 'A series of fortifications spanning thousands of miles, one of the greatest wonders ever built.' },
  { name: 'Mount Fuji', city: 'Fujinomiya', country: 'Japan', countryCode: 'JP', lat: 35.3606, lng: 138.7274, category: 'nature', tags: ['mountain', 'iconic', 'hiking'], description: 'Japan\'s highest mountain and most iconic landmark, a perfectly symmetrical volcanic cone.' },
  { name: 'Taj Mahal', city: 'Agra', country: 'India', countryCode: 'IN', lat: 27.1751, lng: 78.0421, category: 'landmark', tags: ['unesco', 'architecture', 'romantic'], description: 'An ivory-white marble mausoleum, the jewel of Muslim art in India.' },
  { name: 'Angkor Wat', city: 'Siem Reap', country: 'Cambodia', countryCode: 'KH', lat: 13.4125, lng: 103.8670, category: 'historic', tags: ['temple', 'unesco', 'ancient'], description: 'The largest religious monument in the world, originally a Hindu temple for the Khmer Empire.' },
  { name: 'Ha Long Bay', city: 'Quảng Ninh', country: 'Vietnam', countryCode: 'VN', lat: 20.9101, lng: 107.1839, category: 'nature', tags: ['bay', 'unesco', 'cruising'], description: 'A stunning bay featuring thousands of limestone karsts and islands in various shapes and sizes.' },
  { name: 'Bali Rice Terraces', city: 'Ubud', country: 'Indonesia', countryCode: 'ID', lat: -8.4095, lng: 115.1889, category: 'nature', tags: ['rice', 'unesco', 'scenic'], description: 'Ancient subak irrigation system creating stunning emerald-green stepped rice paddies.' },
  { name: 'Marina Bay Sands', city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.2834, lng: 103.8607, category: 'landmark', tags: ['modern', 'skyline', 'luxury'], description: 'An integrated resort with the world\'s largest rooftop infinity pool.' },
  { name: 'Fushimi Inari Shrine', city: 'Kyoto', country: 'Japan', countryCode: 'JP', lat: 34.9671, lng: 135.7727, category: 'culture', tags: ['shrine', 'torii', 'hiking'], description: 'Famous for its thousands of vermillion torii gates winding up the mountain.' },

  // Americas
  { name: 'Machu Picchu', city: 'Cusco', country: 'Peru', countryCode: 'PE', lat: -13.1631, lng: -72.5450, category: 'historic', tags: ['inca', 'unesco', 'mountains'], description: 'A 15th-century Inca citadel set high in the Andes Mountains, the Lost City of the Incas.' },
  { name: 'Grand Canyon', city: 'Arizona', country: 'United States', countryCode: 'US', lat: 36.1069, lng: -112.1129, category: 'nature', tags: ['canyon', 'hiking', 'national-park'], description: 'A steep-sided canyon carved by the Colorado River, exposing nearly 2 billion years of Earth\'s history.' },
  { name: 'Christ the Redeemer', city: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR', lat: -22.9519, lng: -43.2105, category: 'landmark', tags: ['statue', 'iconic', 'viewpoint'], description: 'An Art Deco statue of Jesus Christ with arms outstretched overlooking Rio.' },
  { name: 'Niagara Falls', city: 'Niagara Falls', country: 'Canada', countryCode: 'CA', lat: 43.0828, lng: -79.0742, category: 'nature', tags: ['waterfall', 'border', 'boat-tour'], description: 'Three powerful waterfalls straddling the international border between Canada and the US.' },
  { name: 'Chichen Itza', city: 'Yucatan', country: 'Mexico', countryCode: 'MX', lat: 20.6843, lng: -88.5678, category: 'historic', tags: ['mayan', 'pyramid', 'unesco'], description: 'A large pre-Columbian archaeological site built by the Maya civilization.' },
  { name: 'Iguazu Falls', city: 'Foz do Iguaçu', country: 'Brazil', countryCode: 'BR', lat: -25.6953, lng: -54.4367, category: 'nature', tags: ['waterfall', 'unesco', 'rainforest'], description: 'One of the world\'s largest waterfall systems, spanning nearly 3km with 275 falls.' },
  { name: 'Antelope Canyon', city: 'Page', country: 'United States', countryCode: 'US', lat: 36.8619, lng: -111.3743, category: 'nature', tags: ['slot-canyon', 'photography', 'navajo'], description: 'A slot canyon known for its wave-like structure and light beams streaming through openings.' },
  { name: 'Banff National Park', city: 'Banff', country: 'Canada', countryCode: 'CA', lat: 51.4968, lng: -115.9281, category: 'nature', tags: ['mountains', 'lakes', 'hiking'], description: 'Canada\'s oldest national park with stunning turquoise lakes and snow-capped peaks.' },

  // Africa & Middle East
  { name: 'Pyramids of Giza', city: 'Giza', country: 'Egypt', countryCode: 'EG', lat: 29.9792, lng: 31.1342, category: 'historic', tags: ['ancient', 'unesco', 'wonder'], description: 'Ancient pyramid structures that served as tombs for pharaohs, the last remaining ancient wonder.' },
  { name: 'Victoria Falls', city: 'Livingstone', country: 'Zambia', countryCode: 'ZM', lat: -17.9244, lng: 25.8572, category: 'nature', tags: ['waterfall', 'unesco', 'adventure'], description: 'Locally known as "The Smoke That Thunders," the largest sheet of falling water in the world.' },
  { name: 'Serengeti National Park', city: 'Serengeti', country: 'Tanzania', countryCode: 'TZ', lat: -2.3333, lng: 34.8333, category: 'nature', tags: ['safari', 'wildlife', 'migration'], description: 'Home to the annual Great Migration of over 1.5 million wildebeest and 250,000 zebra.' },
  { name: 'Petra', city: 'Petra', country: 'Jordan', countryCode: 'JO', lat: 30.3285, lng: 35.4444, category: 'historic', tags: ['ancient', 'unesco', 'carved'], description: 'An ancient city carved into rose-red cliffs, the "Rose City" of the Nabataeans.' },
  { name: 'Table Mountain', city: 'Cape Town', country: 'South Africa', countryCode: 'ZA', lat: -33.9628, lng: 18.4098, category: 'nature', tags: ['mountain', 'cable-car', 'viewpoint'], description: 'A flat-topped mountain forming a prominent landmark overlooking Cape Town.' },
  { name: 'Burj Khalifa', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.1972, lng: 55.2744, category: 'landmark', tags: ['skyscraper', 'modern', 'tallest'], description: 'The world\'s tallest structure at 828 meters, with observation decks offering stunning views.' },
  { name: 'Marrakech Medina', city: 'Marrakech', country: 'Morocco', countryCode: 'MA', lat: 31.6295, lng: -7.9811, category: 'culture', tags: ['souk', 'unesco', 'historic'], description: 'A labyrinth of narrow alleyways filled with souks, palaces, and the famous Jemaa el-Fnaa square.' },

  // Oceania
  { name: 'Great Barrier Reef', city: 'Cairns', country: 'Australia', countryCode: 'AU', lat: -18.2871, lng: 147.6992, category: 'nature', tags: ['reef', 'diving', 'unesco'], description: 'The world\'s largest coral reef system, home to thousands of species of marine life.' },
  { name: 'Sydney Opera House', city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8568, lng: 151.2153, category: 'landmark', tags: ['architecture', 'iconic', 'unesco'], description: 'A multi-venue performing arts centre with its distinctive sail-shaped design.' },
  { name: 'Milford Sound', city: 'Fiordland', country: 'New Zealand', countryCode: 'NZ', lat: -44.6414, lng: 167.8978, category: 'nature', tags: ['fjord', 'scenic', 'cruising'], description: 'A fiord known for its towering Mitre Peak, rainforests, and beautiful waterfalls.' },
  { name: 'Uluru', city: 'Northern Territory', country: 'Australia', countryCode: 'AU', lat: -25.3444, lng: 131.0369, category: 'nature', tags: ['sacred', 'outback', 'unesco'], description: 'A massive sandstone monolith sacred to the Anangu Aboriginal people.' },
  { name: 'Bora Bora', city: 'Bora Bora', country: 'French Polynesia', countryCode: 'PF', lat: -16.5004, lng: -151.7415, category: 'nature', tags: ['island', 'luxury', 'lagoon'], description: 'A small South Pacific island surrounded by a turquoise lagoon and barrier reef.' },

  // Hidden Gems
  { name: 'Plitvice Lakes', city: 'Plitvice', country: 'Croatia', countryCode: 'HR', lat: 44.8654, lng: 15.5820, category: 'nature', tags: ['lakes', 'waterfalls', 'unesco'], description: 'Terraced lakes and cascading waterfalls in a forested national park.' },
  { name: 'Cappadocia', city: 'Göreme', country: 'Turkey', countryCode: 'TR', lat: 38.6431, lng: 34.8283, category: 'nature', tags: ['balloons', 'caves', 'unesco'], description: 'A surreal landscape of fairy chimneys, cave dwellings, and hot air balloon rides.' },
  { name: 'Cinque Terre', city: 'Cinque Terre', country: 'Italy', countryCode: 'IT', lat: 44.1461, lng: 9.6439, category: 'culture', tags: ['coastal', 'colorful', 'unesco'], description: 'Five centuries-old colorful seaside villages on the rugged Italian Riviera coastline.' },
  { name: 'Moraine Lake', city: 'Banff', country: 'Canada', countryCode: 'CA', lat: 51.3217, lng: -116.1860, category: 'nature', tags: ['lake', 'mountains', 'turquoise'], description: 'A glacially-fed lake with an intense turquoise color surrounded by the Valley of the Ten Peaks.' },
  { name: 'Salar de Uyuni', city: 'Uyuni', country: 'Bolivia', countryCode: 'BO', lat: -20.1338, lng: -67.4891, category: 'nature', tags: ['salt-flat', 'photography', 'unique'], description: 'The world\'s largest salt flat, creating a giant mirror effect during the rainy season.' },
];

const TRIP_TEMPLATES = [
  { title: 'European Dream', destinations: ['Paris', 'Rome', 'Barcelona'], duration: 14 },
  { title: 'Southeast Asia Adventure', destinations: ['Singapore', 'Vietnam', 'Cambodia'], duration: 21 },
  { title: 'Japan Explorer', destinations: ['Tokyo', 'Kyoto', 'Osaka'], duration: 10 },
  { title: 'South American Wonders', destinations: ['Peru', 'Brazil', 'Argentina'], duration: 18 },
  { title: 'African Safari', destinations: ['Tanzania', 'Kenya', 'South Africa'], duration: 12 },
  { title: 'New Zealand Road Trip', destinations: ['Auckland', 'Queenstown', 'Fiordland'], duration: 16 },
  { title: 'Greek Island Hopping', destinations: ['Athens', 'Santorini', 'Mykonos'], duration: 10 },
  { title: 'Nordic Lights Chase', destinations: ['Norway', 'Iceland', 'Finland'], duration: 12 },
];

const JOURNAL_ENTRIES = [
  { title: 'First Day Magic', content: 'Arrived early morning and the city was just waking up. The light was perfect for photos. Can\'t believe I\'m finally here!', mood: 'amazing' as const },
  { title: 'Getting Lost (Intentionally)', content: 'Put away the map today and just wandered. Found the most incredible little café hidden in an alley. Sometimes the best discoveries come from being lost.', mood: 'good' as const },
  { title: 'Cultural Immersion', content: 'Spent the day learning about local traditions. The people here are so welcoming and eager to share their culture. Made some connections that feel like they\'ll last a lifetime.', mood: 'amazing' as const },
  { title: 'Challenging Day', content: 'Language barrier hit hard today. Missed my bus and had to figure out alternatives. But you know what? I handled it. Travel isn\'t always easy, and that\'s okay.', mood: 'challenging' as const },
  { title: 'Sunset Reflections', content: 'Watched the sunset from the viewpoint everyone recommended. Worth every step of that hike. Feeling grateful and present.', mood: 'good' as const },
  { title: 'Food Adventures', content: 'Tried so many new dishes today! Some were amazing, some were... interesting. That\'s part of the adventure.', mood: 'good' as const },
  { title: 'Rest Day', content: 'Taking it easy today. Sometimes you need to slow down to really appreciate where you are. Found a nice spot to read and people-watch.', mood: 'neutral' as const },
  { title: 'Unexpected Connections', content: 'Met fellow travelers from all over the world at the hostel. Shared stories and travel tips until late. This is what it\'s all about.', mood: 'amazing' as const },
];

export const seedDemoData = mutation({
  args: {
    includeUsers: v.optional(v.boolean()),
  },
  returns: v.object({
    usersCreated: v.number(),
    placesCreated: v.number(),
    tripsCreated: v.number(),
    journalEntriesCreated: v.number(),
    bucketItemsCreated: v.number(),
    followsCreated: v.number(),
    activitiesCreated: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated. Please log in first.');
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error('User not found.');
    }

    const now = Date.now();
    const results = {
      usersCreated: 0,
      placesCreated: 0,
      tripsCreated: 0,
      journalEntriesCreated: 0,
      bucketItemsCreated: 0,
      followsCreated: 0,
      activitiesCreated: 0,
    };

    const userIds: Array<Id<'users'>> = [currentUser._id];

    if (args.includeUsers !== false) {
      for (const demoUser of DEMO_USERS) {
        const existingUser = await ctx.db
          .query('users')
          .withIndex('by_email', (q) => q.eq('email', demoUser.email))
          .unique();

        if (existingUser) {
          userIds.push(existingUser._id);
          continue;
        }

        const userId = await ctx.db.insert('users', {
          authUserId: `demo_${demoUser.email}`,
          email: demoUser.email,
          displayName: demoUser.name,
          bio: demoUser.bio,
          homeLocation: demoUser.homeLocation,
          travelStyles: demoUser.travelStyles,
          profileVisibility: 'public',
          createdAt: now - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        userIds.push(userId);
        results.usersCreated++;
      }
    }

    const placeMap = new Map<string, Id<'places'>>();
    const allPlaceIds: Array<Id<'places'>> = [];

    for (const userId of userIds) {
      const shuffledPlaces = [...DEMO_PLACES].sort(() => Math.random() - 0.5);
      const numPlaces = 15 + Math.floor(Math.random() * 20);
      const userPlaces = shuffledPlaces.slice(0, numPlaces);

      for (const place of userPlaces) {
        const placeId = await ctx.db.insert('places', {
          userId,
          source: 'user_created',
          name: place.name,
          description: place.description,
          latitude: place.lat,
          longitude: place.lng,
          city: place.city,
          country: place.country,
          countryCode: place.countryCode,
          category: place.category,
          tags: place.tags,
          createdAt: now - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000),
        });

        placeMap.set(`${userId}_${place.name}`, placeId);
        allPlaceIds.push(placeId);
        results.placesCreated++;

        const statuses: Array<'want_to_visit' | 'visited' | 'skipped'> = ['want_to_visit', 'visited', 'visited', 'want_to_visit'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await ctx.db.insert('bucketListItems', {
          userId,
          placeId,
          status,
          priority: Math.floor(Math.random() * 5) + 1,
          notes: status === 'visited' ? `Incredible experience at ${place.name}!` : undefined,
          visitedAt: status === 'visited' ? now - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000) : undefined,
          rating: status === 'visited' ? Math.floor(Math.random() * 2) + 4 : undefined,
          createdAt: now - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000),
        });
        results.bucketItemsCreated++;

        if (status === 'visited') {
          await ctx.db.insert('activityFeed', {
            userId,
            type: 'place_visited',
            referenceId: placeId,
            metadata: { placeName: place.name, rating: Math.floor(Math.random() * 2) + 4 },
            createdAt: now - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000),
          });
          results.activitiesCreated++;
        }
      }
    }

    for (const userId of userIds) {
      const numTrips = 2 + Math.floor(Math.random() * 3);
      const shuffledTemplates = [...TRIP_TEMPLATES].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numTrips; i++) {
        const template = shuffledTemplates[i % shuffledTemplates.length];
        const startOffset = Math.floor(Math.random() * 300);
        const startDate = new Date(now - startOffset * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + template.duration * 24 * 60 * 60 * 1000);
        const isCompleted = endDate.getTime() < now;

        const tripId = await ctx.db.insert('trips', {
          userId,
          title: template.title,
          description: `An unforgettable journey through ${template.destinations.join(', ')}.`,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          status: isCompleted ? 'completed' : 'planning',
          createdAt: now - (startOffset + 30) * 24 * 60 * 60 * 1000,
          updatedAt: now,
        });
        results.tripsCreated++;

        await ctx.db.insert('activityFeed', {
          userId,
          type: 'trip_created',
          referenceId: tripId,
          metadata: { destination: template.destinations[0] },
          createdAt: now - (startOffset + 30) * 24 * 60 * 60 * 1000,
        });
        results.activitiesCreated++;

        if (isCompleted) {
          const numEntries = 3 + Math.floor(Math.random() * 4);
          const shuffledEntries = [...JOURNAL_ENTRIES].sort(() => Math.random() - 0.5);

          for (let j = 0; j < numEntries; j++) {
            const entryTemplate = shuffledEntries[j % shuffledEntries.length];
            const entryDate = new Date(startDate.getTime() + j * 2 * 24 * 60 * 60 * 1000);

            const journalId = await ctx.db.insert('journalEntries', {
              userId,
              tripId,
              title: entryTemplate.title,
              content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: entryTemplate.content }] }] },
              mood: entryTemplate.mood,
              entryDate: entryDate.toISOString().split('T')[0],
              createdAt: entryDate.getTime(),
              updatedAt: entryDate.getTime(),
            });
            results.journalEntriesCreated++;

            await ctx.db.insert('activityFeed', {
              userId,
              type: 'journal_posted',
              referenceId: journalId,
              metadata: { title: entryTemplate.title, tripName: template.title },
              createdAt: entryDate.getTime(),
            });
            results.activitiesCreated++;
          }
        }
      }
    }

    for (let i = 0; i < userIds.length; i++) {
      for (let j = 0; j < userIds.length; j++) {
        if (i !== j && Math.random() > 0.3) {
          const existingFollow = await ctx.db
            .query('follows')
            .withIndex('by_pair', (q) => q.eq('followerId', userIds[i]).eq('followingId', userIds[j]))
            .unique();

          if (!existingFollow) {
            await ctx.db.insert('follows', {
              followerId: userIds[i],
              followingId: userIds[j],
              createdAt: now - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000),
            });
            results.followsCreated++;
          }
        }
      }
    }

    return results;
  },
});

export const clearAllDemoData = mutation({
  args: {
    clearDemoUsersOnly: v.optional(v.boolean()),
  },
  returns: v.object({
    usersDeleted: v.number(),
    placesDeleted: v.number(),
    tripsDeleted: v.number(),
    journalEntriesDeleted: v.number(),
    bucketItemsDeleted: v.number(),
    followsDeleted: v.number(),
    activitiesDeleted: v.number(),
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

    const results = {
      usersDeleted: 0,
      placesDeleted: 0,
      tripsDeleted: 0,
      journalEntriesDeleted: 0,
      bucketItemsDeleted: 0,
      followsDeleted: 0,
      activitiesDeleted: 0,
    };

    const demoEmails = DEMO_USERS.map((u) => u.email);

    if (args.clearDemoUsersOnly) {
      for (const email of demoEmails) {
        const user = await ctx.db
          .query('users')
          .withIndex('by_email', (q) => q.eq('email', email))
          .unique();

        if (user) {
          const places = await ctx.db.query('places').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
          for (const place of places) {
            const items = await ctx.db.query('bucketListItems').withIndex('by_place', (q) => q.eq('placeId', place._id)).collect();
            for (const item of items) {
              await ctx.db.delete('bucketListItems', item._id);
              results.bucketItemsDeleted++;
            }
            await ctx.db.delete('places', place._id);
            results.placesDeleted++;
          }

          const trips = await ctx.db.query('trips').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
          for (const trip of trips) {
            const entries = await ctx.db.query('journalEntries').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect();
            for (const entry of entries) {
              await ctx.db.delete('journalEntries', entry._id);
              results.journalEntriesDeleted++;
            }
            await ctx.db.delete('trips', trip._id);
            results.tripsDeleted++;
          }

          const activities = await ctx.db.query('activityFeed').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
          for (const activity of activities) {
            await ctx.db.delete('activityFeed', activity._id);
            results.activitiesDeleted++;
          }

          const followsAsFollower = await ctx.db.query('follows').withIndex('by_follower', (q) => q.eq('followerId', user._id)).collect();
          for (const follow of followsAsFollower) {
            await ctx.db.delete('follows', follow._id);
            results.followsDeleted++;
          }

          const followsAsFollowing = await ctx.db.query('follows').withIndex('by_following', (q) => q.eq('followingId', user._id)).collect();
          for (const follow of followsAsFollowing) {
            await ctx.db.delete('follows', follow._id);
            results.followsDeleted++;
          }

          await ctx.db.delete('users', user._id);
          results.usersDeleted++;
        }
      }
    } else {
      const places = await ctx.db.query('places').withIndex('by_user', (q) => q.eq('userId', currentUser._id)).collect();
      for (const place of places) {
        const items = await ctx.db.query('bucketListItems').withIndex('by_place', (q) => q.eq('placeId', place._id)).collect();
        for (const item of items) {
          await ctx.db.delete('bucketListItems', item._id);
          results.bucketItemsDeleted++;
        }
        await ctx.db.delete('places', place._id);
        results.placesDeleted++;
      }

      const trips = await ctx.db.query('trips').withIndex('by_user', (q) => q.eq('userId', currentUser._id)).collect();
      for (const trip of trips) {
        const entries = await ctx.db.query('journalEntries').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect();
        for (const entry of entries) {
          await ctx.db.delete('journalEntries', entry._id);
          results.journalEntriesDeleted++;
        }
        await ctx.db.delete('trips', trip._id);
        results.tripsDeleted++;
      }

      const activities = await ctx.db.query('activityFeed').withIndex('by_user', (q) => q.eq('userId', currentUser._id)).collect();
      for (const activity of activities) {
        await ctx.db.delete('activityFeed', activity._id);
        results.activitiesDeleted++;
      }
    }

    return results;
  },
});

export const seedMyPlaces = mutation({
  args: {
    count: v.optional(v.number()),
  },
  returns: v.object({
    placesCreated: v.number(),
    bucketItemsCreated: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated. Please log in first.');
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authUserId', identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error('User not found.');
    }

    const now = Date.now();
    const results = {
      placesCreated: 0,
      bucketItemsCreated: 0,
    };

    const numPlaces = args.count || 50;
    const shuffledPlaces = [...DEMO_PLACES].sort(() => Math.random() - 0.5);
    const placesToCreate = shuffledPlaces.slice(0, Math.min(numPlaces, DEMO_PLACES.length));

    for (const place of placesToCreate) {
      const existingPlace = await ctx.db
        .query('places')
        .withIndex('by_user', (q) => q.eq('userId', currentUser._id))
        .filter((q) => q.eq(q.field('name'), place.name))
        .first();

      if (existingPlace) {
        continue;
      }

      const placeId = await ctx.db.insert('places', {
        userId: currentUser._id,
        source: 'user_created',
        name: place.name,
        description: place.description,
        latitude: place.lat,
        longitude: place.lng,
        city: place.city,
        country: place.country,
        countryCode: place.countryCode,
        category: place.category,
        tags: place.tags,
        createdAt: now - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000),
      });
      results.placesCreated++;

      const statuses: Array<'want_to_visit' | 'visited'> = ['want_to_visit', 'visited'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await ctx.db.insert('bucketListItems', {
        userId: currentUser._id,
        placeId,
        status,
        priority: Math.floor(Math.random() * 5) + 1,
        notes: status === 'visited' ? `Amazing experience at ${place.name}!` : `Can't wait to visit ${place.name}!`,
        visitedAt: status === 'visited' ? now - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000) : undefined,
        rating: status === 'visited' ? Math.floor(Math.random() * 2) + 4 : undefined,
        createdAt: now - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000),
      });
      results.bucketItemsCreated++;
    }

    return results;
  },
});

export const seedDemoDataInternal = internalMutation({
  args: {},
  returns: v.object({
    usersCreated: v.number(),
    placesCreated: v.number(),
    tripsCreated: v.number(),
    journalEntriesCreated: v.number(),
    bucketItemsCreated: v.number(),
    followsCreated: v.number(),
    activitiesCreated: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const results = {
      usersCreated: 0,
      placesCreated: 0,
      tripsCreated: 0,
      journalEntriesCreated: 0,
      bucketItemsCreated: 0,
      followsCreated: 0,
      activitiesCreated: 0,
    };

    const userIds: Array<Id<'users'>> = [];

    for (const demoUser of DEMO_USERS) {
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', demoUser.email))
        .unique();

      if (existingUser) {
        userIds.push(existingUser._id);
        continue;
      }

      const userId = await ctx.db.insert('users', {
        authUserId: `demo_${demoUser.email}`,
        email: demoUser.email,
        displayName: demoUser.name,
        bio: demoUser.bio,
        homeLocation: demoUser.homeLocation,
        travelStyles: demoUser.travelStyles,
        profileVisibility: 'public',
        createdAt: now - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      });
      userIds.push(userId);
      results.usersCreated++;
    }

    for (const userId of userIds) {
      const shuffledPlaces = [...DEMO_PLACES].sort(() => Math.random() - 0.5);
      const numPlaces = 15 + Math.floor(Math.random() * 20);
      const userPlaces = shuffledPlaces.slice(0, numPlaces);

      for (const place of userPlaces) {
        const placeId = await ctx.db.insert('places', {
          userId,
          source: 'user_created',
          name: place.name,
          description: place.description,
          latitude: place.lat,
          longitude: place.lng,
          city: place.city,
          country: place.country,
          countryCode: place.countryCode,
          category: place.category,
          tags: place.tags,
          createdAt: now - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000),
        });
        results.placesCreated++;

        const statuses: Array<'want_to_visit' | 'visited' | 'skipped'> = ['want_to_visit', 'visited', 'visited', 'want_to_visit'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await ctx.db.insert('bucketListItems', {
          userId,
          placeId,
          status,
          priority: Math.floor(Math.random() * 5) + 1,
          notes: status === 'visited' ? `Incredible experience at ${place.name}!` : undefined,
          visitedAt: status === 'visited' ? now - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000) : undefined,
          rating: status === 'visited' ? Math.floor(Math.random() * 2) + 4 : undefined,
          createdAt: now - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000),
        });
        results.bucketItemsCreated++;

        if (status === 'visited') {
          await ctx.db.insert('activityFeed', {
            userId,
            type: 'place_visited',
            referenceId: placeId,
            metadata: { placeName: place.name, rating: Math.floor(Math.random() * 2) + 4 },
            createdAt: now - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000),
          });
          results.activitiesCreated++;
        }
      }
    }

    for (const userId of userIds) {
      const numTrips = 2 + Math.floor(Math.random() * 3);
      const shuffledTemplates = [...TRIP_TEMPLATES].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numTrips; i++) {
        const template = shuffledTemplates[i % shuffledTemplates.length];
        const startOffset = Math.floor(Math.random() * 300);
        const startDate = new Date(now - startOffset * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + template.duration * 24 * 60 * 60 * 1000);
        const isCompleted = endDate.getTime() < now;

        const tripId = await ctx.db.insert('trips', {
          userId,
          title: template.title,
          description: `An unforgettable journey through ${template.destinations.join(', ')}.`,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          status: isCompleted ? 'completed' : 'planning',
          createdAt: now - (startOffset + 30) * 24 * 60 * 60 * 1000,
          updatedAt: now,
        });
        results.tripsCreated++;

        await ctx.db.insert('activityFeed', {
          userId,
          type: 'trip_created',
          referenceId: tripId,
          metadata: { destination: template.destinations[0] },
          createdAt: now - (startOffset + 30) * 24 * 60 * 60 * 1000,
        });
        results.activitiesCreated++;

        if (isCompleted) {
          const numEntries = 3 + Math.floor(Math.random() * 4);
          const shuffledEntries = [...JOURNAL_ENTRIES].sort(() => Math.random() - 0.5);

          for (let j = 0; j < numEntries; j++) {
            const entryTemplate = shuffledEntries[j % shuffledEntries.length];
            const entryDate = new Date(startDate.getTime() + j * 2 * 24 * 60 * 60 * 1000);

            await ctx.db.insert('journalEntries', {
              userId,
              tripId,
              title: entryTemplate.title,
              content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: entryTemplate.content }] }] },
              mood: entryTemplate.mood,
              entryDate: entryDate.toISOString().split('T')[0],
              createdAt: entryDate.getTime(),
              updatedAt: now,
            });
            results.journalEntriesCreated++;
          }
        }
      }
    }

    for (let i = 0; i < userIds.length; i++) {
      const followerId = userIds[i];
      const potentialFollowees = userIds.filter((_, idx) => idx !== i);
      const numToFollow = 2 + Math.floor(Math.random() * Math.min(4, potentialFollowees.length));
      const toFollow = potentialFollowees.sort(() => Math.random() - 0.5).slice(0, numToFollow);

      for (const followingId of toFollow) {
        const existingFollow = await ctx.db
          .query('follows')
          .withIndex('by_pair', (q) => q.eq('followerId', followerId).eq('followingId', followingId))
          .first();

        if (!existingFollow) {
          await ctx.db.insert('follows', {
            followerId,
            followingId,
            createdAt: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
          });
          results.followsCreated++;
        }
      }
    }

    return results;
  },
});

export const clearDemoDataInternal = internalMutation({
  args: {
    clearAll: v.optional(v.boolean()),
  },
  returns: v.object({
    usersDeleted: v.number(),
    placesDeleted: v.number(),
    tripsDeleted: v.number(),
    journalEntriesDeleted: v.number(),
    bucketItemsDeleted: v.number(),
    followsDeleted: v.number(),
    activitiesDeleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const results = {
      usersDeleted: 0,
      placesDeleted: 0,
      tripsDeleted: 0,
      journalEntriesDeleted: 0,
      bucketItemsDeleted: 0,
      followsDeleted: 0,
      activitiesDeleted: 0,
    };

    if (args.clearAll) {
      const allUsers = await ctx.db.query('users').collect();
      const demoEmails = DEMO_USERS.map(u => u.email);
      const filteredDemoUsers = allUsers.filter(u => demoEmails.includes(u.email));

      for (const user of filteredDemoUsers) {
        const places = await ctx.db.query('places').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
        for (const place of places) {
          const items = await ctx.db.query('bucketListItems').withIndex('by_place', (q) => q.eq('placeId', place._id)).collect();
          for (const item of items) {
            await ctx.db.delete('bucketListItems', item._id);
            results.bucketItemsDeleted++;
          }
          await ctx.db.delete('places', place._id);
          results.placesDeleted++;
        }

        const trips = await ctx.db.query('trips').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
        for (const trip of trips) {
          const entries = await ctx.db.query('journalEntries').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect();
          for (const entry of entries) {
            await ctx.db.delete('journalEntries', entry._id);
            results.journalEntriesDeleted++;
          }
          await ctx.db.delete('trips', trip._id);
          results.tripsDeleted++;
        }

        const followsAsFollower = await ctx.db.query('follows').withIndex('by_follower', (q) => q.eq('followerId', user._id)).collect();
        for (const follow of followsAsFollower) {
          await ctx.db.delete('follows', follow._id);
          results.followsDeleted++;
        }

        const followsAsFollowee = await ctx.db.query('follows').withIndex('by_following', (q) => q.eq('followingId', user._id)).collect();
        for (const follow of followsAsFollowee) {
          await ctx.db.delete('follows', follow._id);
          results.followsDeleted++;
        }

        const activities = await ctx.db.query('activityFeed').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
        for (const activity of activities) {
          await ctx.db.delete('activityFeed', activity._id);
          results.activitiesDeleted++;
        }

        await ctx.db.delete('users', user._id);
        results.usersDeleted++;
      }
    }

    return results;
  },
});
