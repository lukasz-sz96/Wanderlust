import { Cloud, Thermometer } from 'lucide-react';
import { formatTemperature, getWeatherInfo } from '../../lib/api/weather';

interface WeatherSnapshotProps {
  temperature: number;
  condition: string;
  icon: string;
  temperatureUnit?: 'celsius' | 'fahrenheit';
  className?: string;
}

export const WeatherSnapshot = ({
  temperature,
  condition,
  icon,
  temperatureUnit = 'celsius',
  className = '',
}: WeatherSnapshotProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl">{icon}</span>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{formatTemperature(temperature, temperatureUnit)}</span>
        <span className="text-muted">{condition}</span>
      </div>
    </div>
  );
};

interface WeatherSnapshotData {
  temperature: number;
  condition: string;
  icon: string;
}

export const WeatherSnapshotBadge = ({
  weather,
  temperatureUnit = 'celsius',
}: {
  weather: WeatherSnapshotData;
  temperatureUnit?: 'celsius' | 'fahrenheit';
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-info/10 text-sm">
      <span>{weather.icon}</span>
      <span className="font-medium text-foreground">{formatTemperature(weather.temperature, temperatureUnit)}</span>
    </div>
  );
};

export default WeatherSnapshot;
