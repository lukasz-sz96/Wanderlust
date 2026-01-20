import { useEffect, useState } from 'react';
import { Droplets, Loader2, Thermometer, Wind } from 'lucide-react';
import { Card, CardContent } from '../ui';
import {  fetchWeather, formatTemperature, getWeatherInfo } from '../../lib/api/weather';
import type {WeatherData} from '../../lib/api/weather';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  compact?: boolean;
  showForecast?: boolean;
}

export const WeatherWidget = ({ latitude, longitude, compact = false, showForecast = true }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadWeather = async () => {
      setIsLoading(true);
      setError(false);
      const data = await fetchWeather(latitude, longitude);
      if (data) {
        setWeather(data);
      } else {
        setError(true);
      }
      setIsLoading(false);
    };

    loadWeather();
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted" size={24} />
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return null;
  }

  const currentInfo = getWeatherInfo(weather.current.weatherCode);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-border-light/50">
        <span className="text-2xl">{currentInfo.icon}</span>
        <div>
          <p className="font-semibold text-foreground">{formatTemperature(weather.current.temperature)}</p>
          <p className="text-xs text-muted">{currentInfo.condition}</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Weather</h3>
          <span className="text-xs text-muted">{weather.timezone}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-5xl">{currentInfo.icon}</span>
          <div>
            <p className="text-3xl font-bold text-foreground">{formatTemperature(weather.current.temperature)}</p>
            <p className="text-muted">{currentInfo.condition}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Thermometer size={16} className="text-primary" />
            <div>
              <p className="text-muted text-xs">Feels like</p>
              <p className="text-foreground font-medium">{formatTemperature(weather.current.apparentTemperature)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets size={16} className="text-info" />
            <div>
              <p className="text-muted text-xs">Humidity</p>
              <p className="text-foreground font-medium">{weather.current.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wind size={16} className="text-secondary" />
            <div>
              <p className="text-muted text-xs">Wind</p>
              <p className="text-foreground font-medium">{Math.round(weather.current.windSpeed)} km/h</p>
            </div>
          </div>
        </div>

        {showForecast && weather.daily.length > 1 && (
          <div className="pt-4 border-t border-border-light">
            <p className="text-sm font-medium text-foreground mb-3">7-Day Forecast</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {weather.daily.slice(1).map((day) => {
                const dayInfo = getWeatherInfo(day.weatherCode);
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div key={day.date} className="flex-shrink-0 w-16 text-center p-2 rounded-lg bg-border-light/50">
                    <p className="text-xs text-muted mb-1">{dayName}</p>
                    <span className="text-xl">{dayInfo.icon}</span>
                    <div className="mt-1">
                      <p className="text-xs font-medium text-foreground">{Math.round(day.temperatureMax)}°</p>
                      <p className="text-xs text-muted">{Math.round(day.temperatureMin)}°</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
