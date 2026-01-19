import { v } from 'convex/values';
import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const generatePlaceRecommendations = action({
  args: {
    query: v.string(),
    preferences: v.optional(
      v.object({
        categories: v.optional(v.array(v.string())),
        mood: v.optional(v.string()),
        budget: v.optional(v.string()),
      })
    ),
  },
  returns: v.array(
    v.object({
      name: v.string(),
      description: v.string(),
      category: v.string(),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      whyVisit: v.string(),
      bestTimeToVisit: v.optional(v.string()),
      estimatedDuration: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const systemPrompt = `You are a knowledgeable travel advisor. When asked about travel destinations or places to visit, provide helpful, accurate recommendations.

Always respond with a JSON array of place recommendations. Each place should have:
- name: The place name
- description: A brief description (2-3 sentences)
- category: One of: landmark, restaurant, museum, park, beach, mountain, city, village, historical, entertainment, nature, shopping
- city: The city where it's located (if applicable)
- country: The country
- latitude: Approximate latitude (number)
- longitude: Approximate longitude (number)
- whyVisit: A compelling reason to visit (1-2 sentences)
- bestTimeToVisit: Best season or time to visit (optional)
- estimatedDuration: How long to spend there (optional)

Provide 3-5 recommendations. Focus on unique, memorable places that match the user's interests.`;

    let userPrompt = args.query;
    if (args.preferences) {
      if (args.preferences.categories?.length) {
        userPrompt += `\n\nI'm interested in: ${args.preferences.categories.join(', ')}`;
      }
      if (args.preferences.mood) {
        userPrompt += `\n\nMood/vibe I'm looking for: ${args.preferences.mood}`;
      }
      if (args.preferences.budget) {
        userPrompt += `\n\nBudget level: ${args.preferences.budget}`;
      }
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://wanderlust.app',
        'X-Title': 'Wanderlust Travel App',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter error:', error);
      throw new Error('Failed to get AI recommendations');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    try {
      // Extract JSON from response - AI sometimes includes intro text before the JSON
      let jsonContent = content;
      const arrayStart = content.indexOf('[');
      const objectStart = content.indexOf('{');

      if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
        // Response starts with array
        jsonContent = content.slice(arrayStart);
        // Find the matching closing bracket
        let depth = 0;
        let endIndex = 0;
        for (let i = 0; i < jsonContent.length; i++) {
          if (jsonContent[i] === '[') depth++;
          if (jsonContent[i] === ']') depth--;
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
        }
        if (endIndex > 0) {
          jsonContent = jsonContent.slice(0, endIndex);
        }
      } else if (objectStart !== -1) {
        // Response starts with object
        jsonContent = content.slice(objectStart);
      }

      const parsed = JSON.parse(jsonContent);
      const recommendations = parsed.recommendations || parsed.places || parsed;

      if (!Array.isArray(recommendations)) {
        return [];
      }

      return recommendations.map((place: Record<string, unknown>) => ({
        name: String(place.name || 'Unknown'),
        description: String(place.description || ''),
        category: String(place.category || 'landmark'),
        city: place.city ? String(place.city) : undefined,
        country: place.country ? String(place.country) : undefined,
        latitude: typeof place.latitude === 'number' ? place.latitude : undefined,
        longitude: typeof place.longitude === 'number' ? place.longitude : undefined,
        whyVisit: String(place.whyVisit || place.why_visit || ''),
        bestTimeToVisit: place.bestTimeToVisit ? String(place.bestTimeToVisit) : undefined,
        estimatedDuration: place.estimatedDuration ? String(place.estimatedDuration) : undefined,
      }));
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return [];
    }
  },
});

export const generateItinerary = action({
  args: {
    destination: v.string(),
    days: v.number(),
    interests: v.optional(v.array(v.string())),
    pace: v.optional(v.union(v.literal('relaxed'), v.literal('moderate'), v.literal('packed'))),
  },
  returns: v.array(
    v.object({
      dayNumber: v.number(),
      title: v.string(),
      activities: v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          category: v.string(),
          startTime: v.optional(v.string()),
          duration: v.optional(v.string()),
          location: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const systemPrompt = `You are an expert travel planner. Create detailed day-by-day itineraries for travelers.

Respond with a JSON array of days. Each day should have:
- dayNumber: The day number (1, 2, 3, etc.)
- title: A catchy title for the day (e.g., "Historic Old Town & Local Cuisine")
- activities: Array of activities, each with:
  - name: Activity/place name
  - description: Brief description
  - category: One of: activity, meal, transport, accommodation, other
  - startTime: Suggested start time (e.g., "09:00")
  - duration: How long (e.g., "2 hours")
  - location: Where it takes place

Create a balanced itinerary with a mix of sightseeing, meals, and rest time.`;

    let userPrompt = `Create a ${args.days}-day itinerary for ${args.destination}.`;
    if (args.interests?.length) {
      userPrompt += `\n\nInterests: ${args.interests.join(', ')}`;
    }
    if (args.pace) {
      userPrompt += `\n\nPace: ${args.pace}`;
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://wanderlust.app',
        'X-Title': 'Wanderlust Travel App',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate itinerary');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    try {
      const parsed = JSON.parse(content);
      const days = parsed.days || parsed.itinerary || parsed;

      if (!Array.isArray(days)) {
        return [];
      }

      return days.map((day: Record<string, unknown>) => ({
        dayNumber: Number(day.dayNumber || day.day_number || 1),
        title: String(day.title || `Day ${day.dayNumber}`),
        activities: Array.isArray(day.activities)
          ? day.activities.map((act: Record<string, unknown>) => ({
              name: String(act.name || ''),
              description: String(act.description || ''),
              category: String(act.category || 'activity'),
              startTime: act.startTime ? String(act.startTime) : undefined,
              duration: act.duration ? String(act.duration) : undefined,
              location: act.location ? String(act.location) : undefined,
            }))
          : [],
      }));
    } catch (e) {
      console.error('Failed to parse AI itinerary:', content);
      return [];
    }
  },
});

export const generatePlaceDescription = action({
  args: {
    placeName: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const locationInfo = [args.city, args.country].filter(Boolean).join(', ');
    const categoryInfo = args.category ? ` (${args.category})` : '';

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://wanderlust.app',
        'X-Title': 'Wanderlust Travel App',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content:
              'You are a travel writer. Write engaging, informative descriptions of places. Keep descriptions to 2-3 paragraphs, focusing on what makes the place special, its history, and what visitors can expect.',
          },
          {
            role: 'user',
            content: `Write a description for: ${args.placeName}${categoryInfo}${locationInfo ? ` in ${locationInfo}` : ''}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate description');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  },
});

export const surpriseMe = action({
  args: {
    currentLocation: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    travelStyle: v.optional(v.string()),
  },
  returns: v.object({
    destination: v.string(),
    country: v.string(),
    tagline: v.string(),
    description: v.string(),
    highlights: v.array(v.string()),
    bestFor: v.array(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    let prompt = 'Suggest a random, surprising travel destination that most people haven\'t heard of. ';
    if (args.travelStyle) {
      prompt += `The traveler enjoys: ${args.travelStyle}. `;
    }
    prompt += `
Respond with JSON containing:
- destination: The place name
- country: The country
- tagline: A catchy one-liner about the place
- description: 2-3 sentences about why it's special
- highlights: Array of 3-4 things to see/do there
- bestFor: Array of 2-3 types of travelers it's best for
- latitude: Approximate latitude
- longitude: Approximate longitude`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://wanderlust.app',
        'X-Title': 'Wanderlust Travel App',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a travel expert who knows hidden gems around the world. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get surprise destination');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    return {
      destination: String(parsed.destination || 'Unknown'),
      country: String(parsed.country || 'Unknown'),
      tagline: String(parsed.tagline || ''),
      description: String(parsed.description || ''),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String) : [],
      bestFor: Array.isArray(parsed.bestFor) ? parsed.bestFor.map(String) : [],
      latitude: typeof parsed.latitude === 'number' ? parsed.latitude : undefined,
      longitude: typeof parsed.longitude === 'number' ? parsed.longitude : undefined,
    };
  },
});
