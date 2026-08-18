import sampleData from "@/sample-data.json";
import type { LocationOption, WeatherRecord } from "@/types/weather";
import { getConditionKeyFromCode } from "@/lib/weatherCodes";

type RawSampleRecord = {
  date: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  weather_condition: string;
};

type RawSampleData = {
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  records: RawSampleRecord[];
};

const typedSample = sampleData as RawSampleData;

export const sampleLocation: LocationOption = {
  name: typedSample.location.name,
  country: typedSample.location.country,
  latitude: typedSample.location.latitude,
  longitude: typedSample.location.longitude,
};

export const sampleRecords: WeatherRecord[] = typedSample.records.map((record) => ({
  date: record.date,
  temperature: record.temperature,
  temperatureMin: null,
  temperatureMax: null,
  humidity: record.humidity,
  rainfall: record.rainfall,
  windSpeed: record.wind_speed,
  weatherCode: conditionToCode(record.weather_condition),
  condition: getConditionKeyFromCode(conditionToCode(record.weather_condition)),
}));

function conditionToCode(condition: string) {
  switch (condition) {
    case "Sunny":
      return 0;
    case "Partly Cloudy":
      return 2;
    case "Cloudy":
      return 3;
    case "Rain":
      return 61;
    case "Storm":
      return 95;
    case "Fog":
      return 45;
    default:
      return 3;
  }
}

