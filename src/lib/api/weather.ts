const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_HISTORICAL_API = 'https://archive-api.open-meteo.com/v1/archive';

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  timezone: string;
}

const weatherCodeToCondition: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear sky', icon: '☀️' },
  1: { condition: 'Mainly clear', icon: '🌤️' },
  2: { condition: 'Partly cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Depositing rime fog', icon: '🌫️' },
  51: { condition: 'Light drizzle', icon: '🌧️' },
  53: { condition: 'Moderate drizzle', icon: '🌧️' },
  55: { condition: 'Dense drizzle', icon: '🌧️' },
  56: { condition: 'Light freezing drizzle', icon: '🌨️' },
  57: { condition: 'Dense freezing drizzle', icon: '🌨️' },
  61: { condition: 'Slight rain', icon: '🌧️' },
  63: { condition: 'Moderate rain', icon: '🌧️' },
  65: { condition: 'Heavy rain', icon: '🌧️' },
  66: { condition: 'Light freezing rain', icon: '🌨️' },
  67: { condition: 'Heavy freezing rain', icon: '🌨️' },
  71: { condition: 'Slight snow', icon: '🌨️' },
  73: { condition: 'Moderate snow', icon: '🌨️' },
  75: { condition: 'Heavy snow', icon: '❄️' },
  77: { condition: 'Snow grains', icon: '🌨️' },
  80: { condition: 'Slight rain showers', icon: '🌦️' },
  81: { condition: 'Moderate rain showers', icon: '🌦️' },
  82: { condition: 'Violent rain showers', icon: '⛈️' },
  85: { condition: 'Slight snow showers', icon: '🌨️' },
  86: { condition: 'Heavy snow showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

export const getWeatherInfo = (code: number): { condition: string; icon: string } => {
  return weatherCodeToCondition[code] || { condition: 'Unknown', icon: '❓' };
};

export const fetchWeather = async (
  latitude: number,
  longitude: number
): Promise<WeatherData | null> => {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'weather_code',
        'wind_speed_10m',
        'is_day',
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
      ].join(','),
      timezone: 'auto',
      forecast_days: '7',
    });

    const response = await fetch(`${OPEN_METEO_API}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch weather');
    }

    const data = await response.json();

    return {
      current: {
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
      },
      daily: data.daily.time.map((date: string, index: number) => ({
        date,
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        weatherCode: data.daily.weather_code[index],
        precipitationProbability: data.daily.precipitation_probability_max[index],
      })),
      timezone: data.timezone,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
};

export const formatTemperature = (temp: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string => {
  if (unit === 'fahrenheit') {
    return `${Math.round(temp * 9 / 5 + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
};

export interface HistoricalWeather {
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  condition: string;
  icon: string;
  date: string;
}

export const fetchHistoricalWeather = async (
  latitude: number,
  longitude: number,
  date: string
): Promise<HistoricalWeather | null> => {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      start_date: date,
      end_date: date,
      daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min'].join(','),
      timezone: 'auto',
    });

    const response = await fetch(`${OPEN_METEO_HISTORICAL_API}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch historical weather');
    }

    const data = await response.json();

    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      return null;
    }

    const weatherCode = data.daily.weather_code?.[0];
    const tempMax = data.daily.temperature_2m_max?.[0];
    const tempMin = data.daily.temperature_2m_min?.[0];

    if (weatherCode === undefined || tempMax === undefined || tempMin === undefined) {
      return null;
    }

    const info = getWeatherInfo(weatherCode);
    const avgTemp = (tempMax + tempMin) / 2;

    return {
      temperature: Math.round(avgTemp * 10) / 10,
      temperatureMax: tempMax,
      temperatureMin: tempMin,
      weatherCode,
      condition: info.condition,
      icon: info.icon,
      date,
    };
  } catch (error) {
    console.error('Historical weather fetch error:', error);
    return null;
  }
};
