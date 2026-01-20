const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export interface OverpassPlace {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  tags: {
    'name'?: string;
    'name:en'?: string;
    'tourism'?: string;
    'amenity'?: string;
    'historic'?: string;
    'leisure'?: string;
    'natural'?: string;
    'shop'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:country'?: string;
    'description'?: string;
    'website'?: string;
    'phone'?: string;
    'opening_hours'?: string;
    [key: string]: string | undefined;
  };
}

export interface SearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  address?: string;
  city?: string;
  country?: string;
  tags: string[];
  metadata: Record<string, string>;
}

const categoryMapping: Record<string, string> = {
  attraction: 'Attraction',
  museum: 'Museum',
  gallery: 'Art Gallery',
  viewpoint: 'Viewpoint',
  artwork: 'Artwork',
  theme_park: 'Theme Park',
  zoo: 'Zoo',
  aquarium: 'Aquarium',
  hotel: 'Hotel',
  hostel: 'Hostel',
  guest_house: 'Guest House',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bar: 'Bar',
  pub: 'Pub',
  fast_food: 'Fast Food',
  park: 'Park',
  garden: 'Garden',
  beach: 'Beach',
  nature_reserve: 'Nature Reserve',
  castle: 'Castle',
  ruins: 'Ruins',
  monument: 'Monument',
  memorial: 'Memorial',
  archaeological_site: 'Archaeological Site',
  church: 'Church',
  cathedral: 'Cathedral',
  mosque: 'Mosque',
  temple: 'Temple',
  synagogue: 'Synagogue',
};

const getCategory = (tags: OverpassPlace['tags']): string => {
  const categoryKeys = ['tourism', 'amenity', 'historic', 'leisure', 'natural'];

  for (const key of categoryKeys) {
    const value = tags[key];
    if (value && categoryMapping[value]) {
      return categoryMapping[value];
    }
  }

  for (const key of categoryKeys) {
    const value = tags[key];
    if (value) {
      return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
    }
  }

  return 'Place';
};

const buildQuery = (
  searchType: 'bbox' | 'around' | 'name',
  params: {
    bbox?: [number, number, number, number];
    lat?: number;
    lon?: number;
    radius?: number;
    name?: string;
    categories?: string[];
  },
): string => {
  const timeout = 25;
  const limit = 50;

  const categoryFilters = params.categories?.length
    ? params.categories
        .map((cat) => {
          const osmTag = Object.entries(categoryMapping).find(([_, v]) => v.toLowerCase() === cat.toLowerCase())?.[0];
          return osmTag || cat.toLowerCase();
        })
        .join('|')
    : 'attraction|museum|viewpoint|castle|monument|park|beach';

  let areaFilter = '';
  if (searchType === 'bbox' && params.bbox) {
    areaFilter = `(${params.bbox.join(',')})`;
  } else if (searchType === 'around' && params.lat && params.lon) {
    areaFilter = `(around:${params.radius || 5000},${params.lat},${params.lon})`;
  }

  const nameFilter = params.name ? `["name"~"${params.name}",i]` : '';

  return `
    [out:json][timeout:${timeout}];
    (
      node["tourism"~"${categoryFilters}"]${nameFilter}${areaFilter};
      node["historic"~"castle|monument|ruins|memorial|archaeological_site"]${nameFilter}${areaFilter};
      node["leisure"~"park|garden|beach|nature_reserve"]${nameFilter}${areaFilter};
      way["tourism"~"${categoryFilters}"]${nameFilter}${areaFilter};
      way["historic"~"castle|monument|ruins"]${nameFilter}${areaFilter};
    );
    out center ${limit};
  `;
};

const parseResults = (data: { elements: OverpassPlace[] }): SearchResult[] => {
  return data.elements
    .filter((el) => el.tags?.name || el.tags?.['name:en'])
    .map((el) => {
      const lat = el.lat || (el as any).center?.lat;
      const lon = el.lon || (el as any).center?.lon;

      if (!lat || !lon) return null;

      const name = el.tags['name:en'] || el.tags.name || 'Unknown';
      const category = getCategory(el.tags);

      const tags: string[] = [];
      if (el.tags.tourism) tags.push(el.tags.tourism);
      if (el.tags.historic) tags.push(el.tags.historic);
      if (el.tags.leisure) tags.push(el.tags.leisure);
      if (el.tags.amenity) tags.push(el.tags.amenity);

      const address = [el.tags['addr:housenumber'], el.tags['addr:street']].filter(Boolean).join(' ');

      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        latitude: lat,
        longitude: lon,
        category,
        address: address || undefined,
        city: el.tags['addr:city'],
        country: el.tags['addr:country'],
        tags: [...new Set(tags)],
        metadata: {
          osmId: String(el.id),
          osmType: el.type,
          ...(el.tags.website && { website: el.tags.website }),
          ...(el.tags.phone && { phone: el.tags.phone }),
          ...(el.tags.opening_hours && { openingHours: el.tags.opening_hours }),
          ...(el.tags.description && { description: el.tags.description }),
        },
      };
    })
    .filter((r): r is SearchResult => r !== null);
};

export const searchByLocation = async (
  lat: number,
  lon: number,
  radiusMeters: number = 5000,
  categories?: string[],
): Promise<SearchResult[]> => {
  const query = buildQuery('around', { lat, lon, radius: radiusMeters, categories });

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();
  return parseResults(data);
};

export const searchByBoundingBox = async (
  south: number,
  west: number,
  north: number,
  east: number,
  categories?: string[],
): Promise<SearchResult[]> => {
  const query = buildQuery('bbox', { bbox: [south, west, north, east], categories });

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();
  return parseResults(data);
};

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  country?: string;
}

export const geocodeLocation = async (query: string): Promise<GeocodedLocation | null> => {
  const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
  });

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    const item = data[0];
    const address = item.address || {};

    return {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      city: address.city || address.town || address.village || address.municipality || address.state,
      country: address.country,
    };
  } catch {
    return null;
  }
};

export const searchByName = async (name: string): Promise<SearchResult[]> => {
  const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  const params = new URLSearchParams({
    q: name,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '15',
  });

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, await response.text());
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Nominatim results:', data);

    return data.map((item: any) => {
      const address = item.address || {};
      const category = item.type?.replace(/_/g, ' ') || item.category || 'Place';

      return {
        id: `osm-${item.osm_type}-${item.osm_id}`,
        name: item.name || item.display_name.split(',')[0],
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        category: category.charAt(0).toUpperCase() + category.slice(1),
        city: address.city || address.town || address.village || address.municipality || address.state,
        country: address.country,
        tags: [item.category, item.type].filter(Boolean),
        metadata: {
          osmId: String(item.osm_id),
          osmType: item.osm_type,
          displayName: item.display_name,
        },
      };
    });
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};
