import { createFileRoute } from '@tanstack/react-router';
import { useAction, useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import { Button, Card, CardContent, Input, Badge, useToast } from '../../../components/ui';
import { Compass, Sparkles, Search, MapPin, Clock, Calendar, Plus, Loader2, Shuffle, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/places/discover')({
  component: DiscoverPage,
});

type Recommendation = {
  name: string;
  description: string;
  category: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  whyVisit: string;
  bestTimeToVisit?: string;
  estimatedDuration?: string;
};

type SurpriseDestination = {
  destination: string;
  country: string;
  tagline: string;
  description: string;
  highlights: string[];
  bestFor: string[];
  latitude?: number;
  longitude?: number;
};

const DiscoverPage = () => {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [surprise, setSurprise] = useState<SurpriseDestination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [addingPlace, setAddingPlace] = useState<string | null>(null);
  const toast = useToast();

  const getRecommendations = useAction(api.ai.generatePlaceRecommendations);
  const getSurprise = useAction(api.ai.surpriseMe);
  const createPlace = useMutation(api.places.create);
  const addToBucketList = useMutation(api.bucketList.add);

  const categories = ['landmark', 'museum', 'restaurant', 'nature', 'beach', 'mountain', 'historical', 'entertainment'];

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSurprise(null);
    try {
      const results = await getRecommendations({
        query: query.trim(),
        preferences: selectedCategories.length > 0 ? { categories: selectedCategories } : undefined,
      });
      setRecommendations(results);
      if (results.length === 0) {
        toast.info('No recommendations found. Try a different search.');
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      toast.error('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSurpriseMe = async () => {
    setIsSurpriseLoading(true);
    setRecommendations([]);
    try {
      const result = await getSurprise({});
      setSurprise(result);
    } catch (error) {
      console.error('Failed to get surprise:', error);
      toast.error('Failed to get surprise destination. Please try again.');
    } finally {
      setIsSurpriseLoading(false);
    }
  };

  const handleAddPlace = async (rec: Recommendation) => {
    setAddingPlace(rec.name);
    try {
      const placeId = await createPlace({
        name: rec.name,
        description: rec.description,
        category: rec.category,
        city: rec.city,
        country: rec.country,
        latitude: rec.latitude || 0,
        longitude: rec.longitude || 0,
        source: 'ai_generated',
      });

      await addToBucketList({
        placeId,
        status: 'want_to_visit',
      });

      toast.success(`${rec.name} added to your bucket list!`);
    } catch (error) {
      console.error('Failed to add place:', error);
      toast.error('Failed to add place. Please try again.');
    } finally {
      setAddingPlace(null);
    }
  };

  const handleAddSurprise = async () => {
    if (!surprise) return;

    setAddingPlace(surprise.destination);
    try {
      const placeId = await createPlace({
        name: surprise.destination,
        description: surprise.description,
        category: 'city',
        country: surprise.country,
        latitude: surprise.latitude || 0,
        longitude: surprise.longitude || 0,
        source: 'ai_generated',
      });

      await addToBucketList({
        placeId,
        status: 'want_to_visit',
      });

      toast.success(`${surprise.destination} added to your bucket list!`);
    } catch (error) {
      console.error('Failed to add place:', error);
      toast.error('Failed to add place. Please try again.');
    } finally {
      setAddingPlace(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-muted">AI-powered place recommendations</p>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Where do you want to go? (e.g., 'beaches in Southeast Asia', 'historic cities in Europe')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </Button>
          </div>

          <div>
            <p className="text-sm text-muted mb-2">Filter by category:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-secondary text-white'
                      : 'bg-border-light text-muted hover:bg-border'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border-light">
            <Button
              variant="ghost"
              onClick={handleSurpriseMe}
              disabled={isSurpriseLoading}
              leftIcon={isSurpriseLoading ? <Loader2 size={18} className="animate-spin" /> : <Shuffle size={18} />}
              className="w-full"
            >
              Surprise Me with a Random Destination
            </Button>
          </div>
        </CardContent>
      </Card>

      {surprise && (
        <Card className="mb-6 border-2 border-secondary">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-secondary" size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{surprise.destination}</h2>
                    <p className="text-muted flex items-center gap-1">
                      <MapPin size={14} />
                      {surprise.country}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddSurprise}
                    disabled={addingPlace === surprise.destination}
                    leftIcon={
                      addingPlace === surprise.destination ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )
                    }
                  >
                    Add to Bucket List
                  </Button>
                </div>

                <p className="text-lg text-secondary font-medium mt-2 italic">"{surprise.tagline}"</p>

                <p className="text-foreground mt-3">{surprise.description}</p>

                {surprise.highlights.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-foreground mb-2">Highlights:</p>
                    <ul className="list-disc list-inside text-muted text-sm space-y-1">
                      {surprise.highlights.map((highlight, i) => (
                        <li key={i}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {surprise.bestFor.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {surprise.bestFor.map((type, i) => (
                      <Badge key={i} variant="default">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length === 0 && !surprise && !isLoading && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Compass className="text-secondary" size={40} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Discover new places</h3>
              <p className="text-muted mb-6 max-w-sm">
                Search for destinations or let AI surprise you with hidden gems
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Recommendations</h2>
          {recommendations.map((rec, index) => (
            <Card key={index} hoverable>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-light/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-primary" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{rec.name}</h3>
                        <p className="text-sm text-muted">{[rec.city, rec.country].filter(Boolean).join(', ')}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddPlace(rec)}
                        disabled={addingPlace === rec.name}
                        leftIcon={
                          addingPlace === rec.name ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />
                        }
                      >
                        Add
                      </Button>
                    </div>

                    <Badge variant="default" className="mb-2">
                      {rec.category}
                    </Badge>

                    <p className="text-muted text-sm mb-3">{rec.description}</p>

                    <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                      <p className="text-sm text-secondary font-medium flex items-center gap-2">
                        <Sparkles size={14} />
                        Why visit:
                      </p>
                      <p className="text-sm text-foreground mt-1">{rec.whyVisit}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted">
                      {rec.bestTimeToVisit && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {rec.bestTimeToVisit}
                        </span>
                      )}
                      {rec.estimatedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {rec.estimatedDuration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
