import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";

export const STORE = {
  city: "wb.city",
  favorites: "wb.favorites",
  unit: "wb.unit",
  theme: "wb.theme",
  reminder: "wb.reminder",
};

export const safeGet = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const weatherInfo = (code, isDay = true) => {
  if (code === 0)
    return { label: "Clear sky", Icon: isDay ? Sun : Moon, tone: "sun" };
  if (code === 1)
    return {
      label: "Mostly clear",
      Icon: isDay ? CloudSun : Moon,
      tone: "sun",
    };
  if (code === 2)
    return { label: "Partly cloudy", Icon: CloudSun, tone: "sun" };
  if (code === 3) return { label: "Overcast", Icon: Cloud, tone: "cloud" };
  if ([45, 48].includes(code))
    return { label: "Foggy", Icon: CloudFog, tone: "cloud" };
  if ([51, 53, 55].includes(code))
    return { label: "Drizzle", Icon: CloudDrizzle, tone: "rain" };
  if ([61, 63, 65, 80, 81, 82].includes(code))
    return { label: "Rain", Icon: CloudRain, tone: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { label: "Snow", Icon: CloudSnow, tone: "snow" };
  if ([95, 96, 99].includes(code))
    return { label: "Thunderstorm", Icon: CloudLightning, tone: "storm" };
  return { label: "Cloudy", Icon: Cloud, tone: "cloud" };
};

export const temp = (n, unit) =>
  Number.isFinite(n)
    ? `${Math.round(unit === "F" ? (n * 9) / 5 + 32 : n)}°`
    : "—";

export const dayName = (date, index) =>
  index === 0
    ? "Today"
    : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
        new Date(`${date}T12:00:00`),
      );

export const formatApiTime = (value) => {
  if (!value) return "—";
  const [hour, minute] = value.split("T").at(-1).split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening";
};
