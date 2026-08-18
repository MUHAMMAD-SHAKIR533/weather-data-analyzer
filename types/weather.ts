export type WeatherConditionKey =
  | "Sunny"
  | "Partly Cloudy"
  | "Cloudy"
  | "Rain"
  | "Storm"
  | "Fog"
  | "Snow"
  | "Unknown";

export interface WeatherConditionInfo {
  key: WeatherConditionKey;
  label: string;
  displayColor: string;
  accentColor: string;
  description: string;
}

export interface LocationOption {
  name: string;
  country: string;
  admin1?: string | null;
  latitude: number;
  longitude: number;
}

export interface WeatherRecord {
  date: string;
  temperature: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
  humidity: number | null;
  rainfall: number | null;
  windSpeed: number | null;
  weatherCode: number;
  condition: WeatherConditionKey;
}

export interface CurrentWeatherResponse {
  location: LocationOption;
  current: {
    temperature: number | null;
    humidity: number | null;
    rainfall: number | null;
    windSpeed: number | null;
    weatherCode: number;
    condition: WeatherConditionInfo;
    observedAt: string;
  };
}

export interface WeatherHistoryResponse {
  location: LocationOption;
  range: {
    start: string;
    end: string;
  };
  source: "cache" | "live" | "fallback";
  partial: boolean;
  records: WeatherRecord[];
}

export interface MetricSummary {
  count: number;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  standardDeviation: number | null;
}

export interface AnalysisResponse {
  location: LocationOption;
  range: {
    start: string;
    end: string;
  };
  source: "cache" | "live" | "fallback";
  partial: boolean;
  records: WeatherRecord[];
  metrics: {
    temperature: MetricSummary;
    humidity: MetricSummary;
    rainfall: MetricSummary;
    wind: MetricSummary;
  };
  conditions: Array<{
    label: WeatherConditionKey;
    count: number;
    displayColor: string;
    accentColor: string;
  }>;
}

export interface SearchLocationsResponse {
  results: LocationOption[];
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

