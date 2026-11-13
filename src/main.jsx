import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  ChevronRight,
  Heart,
  Plus,
  X,
  Bell,
  Menu,
  LoaderCircle,
  RefreshCw,
  Sunrise,
  Moon,
  Check,
  ArrowDown,
  ArrowUp,
  CloudSun,
  CloudDrizzle,
  CircleAlert,
  WifiOff,
  Clock3,
} from "lucide-react";
import "./styles.css";

const STORE = {
  city: "wb.city",
  favorites: "wb.favorites",
  unit: "wb.unit",
  theme: "wb.theme",
  reminder: "wb.reminder",
};
const safeGet = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
const weatherInfo = (code) => {
  if (code === 0) return { label: "Clear sky", Icon: Sun, tone: "sun" };
  if ([1, 2].includes(code))
    return {
      label: code === 1 ? "Mostly clear" : "Partly cloudy",
      Icon: CloudSun,
      tone: "sun",
    };
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
const temp = (n, unit) => `${Math.round(unit === "F" ? (n * 9) / 5 + 32 : n)}°`;
const dayName = (date, i) =>
  i === 0
    ? "Today"
    : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
        new Date(`${date}T12:00:00`),
      );
const formatApiTime = (value) => {
  if (!value) return "—";
  const [hour, minute] = value.split("T").at(-1).split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};
const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

function App() {
  const initial = safeGet(STORE.city, {
    name: "London",
    latitude: 51.5072,
    longitude: -0.1276,
    country: "United Kingdom",
    admin1: "England",
  });
  const [city, setCity] = useState(initial);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [touched, setTouched] = useState(false);
  const [favorites, setFavorites] = useState(() =>
    safeGet(STORE.favorites, []),
  );
  const [unit, setUnit] = useState(() => safeGet(STORE.unit, "C"));
  const [theme, setTheme] = useState(() => safeGet(STORE.theme, "light"));
  const [reminder, setReminder] = useState(() =>
    safeGet(STORE.reminder, "07:00"),
  );
  const [reminderMessage, setReminderMessage] = useState("");
  const [confirmCity, setConfirmCity] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [now, setNow] = useState(new Date());
  const inputRef = useRef(null);
  const searchTimer = useRef(null);
  const searchRequest = useRef(0);
  const weatherRequest = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    safeSet(STORE.city, city);
  }, [city]);
  useEffect(() => {
    safeSet(STORE.favorites, favorites);
  }, [favorites]);
  useEffect(() => {
    safeSet(STORE.unit, unit);
  }, [unit]);
  useEffect(() => {
    safeSet(STORE.theme, theme);
  }, [theme]);
  useEffect(() => {
    safeSet(STORE.reminder, reminder);
  }, [reminder]);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const loadWeather = useCallback(async (target, { quiet = false } = {}) => {
    const requestId = ++weatherRequest.current;
    if (!quiet) {
      setLoading(true);
      setError("");
    }
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({
        latitude: target.latitude,
        longitude: target.longitude,
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max",
        timezone: "auto",
        forecast_days: "6",
        wind_speed_unit: "kmh",
      }).toString();
      const res = await fetch(url);
      if (!res.ok)
        throw new Error(
          res.status === 429
            ? "The weather service is busy. Please try again in a minute."
            : "We couldn’t load this forecast. Check your connection and try again.",
        );
      const data = await res.json();
      if (requestId !== weatherRequest.current) return;
      const result = { ...data, fetchedAt: new Date().toISOString() };
      setWeather(result);
      setError("");
      try {
        localStorage.setItem(
          `wb.weather.${target.latitude},${target.longitude}`,
          JSON.stringify(result),
        );
      } catch {}
    } catch (e) {
      if (requestId !== weatherRequest.current) return;
      let cached = null;
      try {
        cached = JSON.parse(
          localStorage.getItem(
            `wb.weather.${target.latitude},${target.longitude}`,
          ),
        );
      } catch {}
      if (cached) {
        setWeather(cached);
        setError("");
        setOffline(true);
      } else
        setError(
          e.message ||
            "Weather data is unavailable. Check your connection and try again.",
        );
    } finally {
      if (requestId === weatherRequest.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadWeather(city);
  }, [city, loadWeather]);
  useEffect(() => {
    const on = () => {
      setOffline(false);
      loadWeather(city, { quiet: true });
    };
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [city, loadWeather]);

  const findCities = (text) => {
    const requestId = ++searchRequest.current;
    setQuery(text);
    setTouched(false);
    setSearchError("");
    setSuggestions([]);
    clearTimeout(searchTimer.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text.trim())}&count=6&language=en&format=json`,
        );
        if (!res.ok)
          throw new Error(
            "City search is unavailable. Please check your connection and try again.",
          );
        const data = await res.json();
        if (requestId !== searchRequest.current) return;
        setSuggestions(
          (data.results || []).filter(
            (p) => p.latitude != null && p.longitude != null,
          ),
        );
        setSearchError(
          data.results?.length
            ? ""
            : "No cities found. Try a different spelling or nearby city.",
        );
      } catch (e) {
        if (requestId === searchRequest.current) {
          setSuggestions([]);
          setSearchError(
            e.message ||
              "City search failed. Check your connection and try again.",
          );
        }
      } finally {
        if (requestId === searchRequest.current) setSearching(false);
      }
    }, 260);
  };
  const chooseCity = (p) => {
    ++searchRequest.current;
    clearTimeout(searchTimer.current);
    setCity({
      name: p.name,
      admin1: p.admin1 || "",
      country: p.country || "",
      latitude: p.latitude,
      longitude: p.longitude,
      timezone: p.timezone,
    });
    setQuery("");
    setSuggestions([]);
    setSearchError("");
    setTouched(false);
    window.setTimeout(() => setTouched(false), 0);
    setMobileMenu(false);
  };
  const toggleFavorite = () => {
    const id = `${city.latitude},${city.longitude}`;
    if (favorites.some((f) => f.id === id))
      setConfirmCity(favorites.find((f) => f.id === id));
    else if (favorites.length >= 5)
      setError(
        "You’ve reached the five-city limit. Remove a favourite to save another.",
      );
    else setFavorites([...favorites, { id, ...city }]);
  };
  const confirmRemove = () => {
    if (confirmCity)
      setFavorites(favorites.filter((f) => f.id !== confirmCity.id));
    setConfirmCity(null);
  };
  const isFavorite = favorites.some(
    (f) => f.id === `${city.latitude},${city.longitude}`,
  );
  const askReminder = async () => {
    setReminderMessage("");
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setReminderMessage(
        "Notifications aren’t supported in this browser. Your weather dashboard will still work as usual.",
      );
      return;
    }
    setReminderMessage(
      "Allow notifications to receive a daily weather check-in while Weatherboard is open.",
    );
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setReminderMessage(
        `Reminder set for ${reminder}. Keep Weatherboard open to receive it.`,
      );
      await registerSW();
    } else if (permission === "denied")
      setReminderMessage(
        "Notifications are blocked in browser settings. You can enable them there anytime; all other features still work.",
      );
    else
      setReminderMessage("No permission granted. You can set this up anytime.");
  };
  const saveReminderTime = (time) => {
    setReminder(time);
    if ("Notification" in window && Notification.permission === "granted")
      setReminderMessage(
        `Reminder updated to ${time}. Keep Weatherboard open to receive it.`,
      );
  };
  useEffect(() => {
    let timer;
    const check = () => {
      if (!("Notification" in window) || Notification.permission !== "granted")
        return;
      const [hh, mm] = reminder.split(":").map(Number);
      const key = `wb.notified.${new Date().toDateString()}`;
      if (
        new Date().getHours() === hh &&
        new Date().getMinutes() === mm &&
        !sessionStorage.getItem(key)
      ) {
        navigator.serviceWorker?.ready.then((reg) =>
          reg.showNotification(`Weather in ${city.name}`, {
            body: "Take a moment to check today’s forecast.",
            icon: "/icons/icon-192.png",
            tag: "daily-weather",
          }),
        );
        sessionStorage.setItem(key, "1");
      }
    };
    timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [reminder, city.name]);

  const current = weather?.current;
  const daily = weather?.daily;
  const info = weatherInfo(current?.weather_code ?? 2);
  const CurrentIcon = info.Icon;
  const isDay = current?.is_day !== 0;
  const localTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: city.timezone || weather?.timezone || "UTC",
  });
  const saved = weather?.fetchedAt
    ? new Date(weather.fetchedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <CloudSun size={21} />
          </div>
          <span>weatherboard</span>
        </div>
        <div className="side-label">YOUR SPACE</div>
        <button className="nav-item active">
          <CloudSun size={17} />
          <span>Overview</span>
          <span className="nav-dot" />
        </button>
        <div className="side-section-title">
          <span>FAVOURITE PLACES</span>
          <span className="fave-count">{favorites.length}/5</span>
        </div>
        <div className="favorite-list">
          {favorites.length ? (
            favorites.map((f) => (
              <button
                className={`favorite-item ${f.id === `${city.latitude},${city.longitude}` ? "selected" : ""}`}
                key={f.id}
                onClick={() => chooseCity(f)}
              >
                <MapPin size={15} />
                <span>
                  {f.name}
                  <small>{f.country}</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))
          ) : (
            <p className="empty-favs">
              Your favourite places will appear here.
            </p>
          )}
        </div>
        <button
          className="add-place"
          onClick={() => {
            inputRef.current?.focus();
            setMobileMenu(false);
          }}
        >
          <Plus size={15} /> Add a place
        </button>
        <div className="sidebar-spacer" />
        <div className="side-note">
          <div className="note-top">
            <span className="live-pulse" />
            Live weather
          </div>
          <p>Forecasts for the places you call home.</p>
          <span className="source-label">POWERED BY OPEN-METEO</span>
        </div>
        <div className="profile-row">
          <div className="avatar">W</div>
          <div>
            <strong>Your weather</strong>
            <small>Personal dashboard</small>
          </div>
          <Menu size={16} />
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} /> <span>Overview</span>
          </div>
          <div className="top-actions">
            <div className="clock">
              <span className="clock-dot" />
              {localTime} <span className="zone">LOCAL TIME</span>
            </div>
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button
              className="unit-switch"
              onClick={() => setUnit(unit === "C" ? "F" : "C")}
              aria-label="Toggle temperature unit"
            >
              <span className={unit === "C" ? "unit-active" : ""}>°C</span>
              <span className="unit-divider" />
              <span className={unit === "F" ? "unit-active" : ""}>°F</span>
            </button>
            <div className="top-avatar">W</div>
          </div>
        </header>
        <div className="content-wrap">
          {offline && (
            <div className="offline-banner">
              <WifiOff size={15} />
              <span>
                You’re offline. Showing the last saved forecast
                {weather ? ` from ${saved}` : ""}.
              </span>
            </div>
          )}
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                {new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: city.timezone || "UTC",
                })
                  .format(now)
                  .toUpperCase()}
              </div>
              <h1>
                {getGreeting()}
                <span className="greeting-period">.</span>
              </h1>
              <p className="subhead">
                Here’s what’s happening with the weather.
              </p>
            </div>
            <button
              className="refresh-btn"
              onClick={() => loadWeather(city)}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
              <span>{loading ? "Updating…" : "Refresh"}</span>
            </button>
          </section>
          <section className="search-row">
            <div
              className={`search-box ${touched && !query.trim() ? "invalid" : ""}`}
            >
              <Search size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => findCities(e.target.value)}
                onBlur={() => setTouched(true)}
                onFocus={() => setTouched(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    setSuggestions([]);
                  }
                  if (e.key === "Enter" && suggestions[0])
                    chooseCity(suggestions[0]);
                }}
                placeholder="Search for a city…"
                aria-label="Search for a city"
                aria-expanded={suggestions.length > 0}
              />
              {searching && <LoaderCircle className="spin" size={17} />}
              <kbd>⌘ K</kbd>
              {(suggestions.length > 0 || searchError) && (
                <div className="suggestion-menu">
                  {suggestions.length > 0 ? (
                    <>
                      <div className="suggestion-caption">
                        SUGGESTED LOCATIONS
                      </div>
                      {suggestions.map((p, i) => (
                        <button
                          key={`${p.id}-${i}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => chooseCity(p)}
                          className="suggestion"
                        >
                          <MapPin size={16} />
                          <span>
                            <strong>{p.name}</strong>
                            <small>
                              {[p.admin1, p.country].filter(Boolean).join(", ")}
                            </small>
                          </span>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="search-error">
                      <CircleAlert size={15} />
                      {searchError}
                    </p>
                  )}
                </div>
              )}
            </div>
            <span className="search-hint">Search any city worldwide</span>
          </section>
          {touched && !query.trim() && (
            <div className="inline-error">Enter a city name to search.</div>
          )}
          {error && (
            <div className="error-banner">
              <CircleAlert size={17} />
              <span>{error}</span>
              <button onClick={() => loadWeather(city)}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR LOCATION</span>
              <h2>
                <MapPin size={17} />
                {city.name}
                <span className="location-separator">·</span>
                <span className="location-detail">
                  {[city.admin1, city.country].filter(Boolean).join(", ")}
                </span>
              </h2>
            </div>
            <button
              className={`favorite-toggle ${isFavorite ? "is-favorite" : ""}`}
              onClick={toggleFavorite}
              title={
                isFavorite ? "Remove from favourites" : "Add to favourites"
              }
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
              <span>{isFavorite ? "Saved" : "Save place"}</span>
            </button>
          </div>
          <section className="weather-grid">
            <article className="card current-card">
              <div className="card-top">
                <div>
                  <span className="card-label">CURRENT WEATHER</span>
                  <span className="updated-label">
                    <span className="live-pulse" />
                    Live conditions
                  </span>
                </div>
                <button
                  className="more-btn"
                  aria-label="Current weather details"
                >
                  •••
                </button>
              </div>
              {loading && !current ? (
                <div className="loading-state">
                  <LoaderCircle className="spin" size={28} />
                  <span>Fetching the latest conditions…</span>
                </div>
              ) : current ? (
                <>
                  <div className="current-main">
                    <div>
                      <div className="temperature">
                        {temp(current.temperature_2m, unit)}
                        <span className="degree-period">.</span>
                      </div>
                      <div className="condition-name">{info.label}</div>
                      <div className="feels-like">
                        Feels like {temp(current.apparent_temperature, unit)}
                      </div>
                    </div>
                    <div className={`hero-weather-icon ${info.tone}`}>
                      <CurrentIcon size={69} strokeWidth={1.4} />
                      <i />
                      <i />
                    </div>
                  </div>
                  <div className="current-divider" />
                  <div className="weather-stats">
                    <div className="stat">
                      <div className="stat-icon humidity">
                        <Droplets size={16} />
                      </div>
                      <div>
                        <span>Humidity</span>
                        <strong>
                          {current.relative_humidity_2m}
                          <small>%</small>
                        </strong>
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-icon wind">
                        <Wind size={16} />
                      </div>
                      <div>
                        <span>Wind speed</span>
                        <strong>
                          {Math.round(current.wind_speed_10m)}
                          <small> km/h</small>
                        </strong>
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-icon uv">
                        <Sun size={16} />
                      </div>
                      <div>
                        <span>UV index</span>
                        <strong>
                          {daily?.uv_index_max?.[0]?.toFixed(0) || "—"}
                          <small>
                            {" "}
                            {daily?.uv_index_max?.[0] > 5 ? "High" : "Low"}
                          </small>
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="loading-state">
                  Weather data will appear here.
                </div>
              )}
            </article>
            <article className="card outlook-card">
              <div className="card-top">
                <div>
                  <span className="card-label">THE OUTLOOK</span>
                  <span className="updated-label">Next 5 days</span>
                </div>
                <span className="outlook-badge">5 DAY</span>
              </div>
              {loading && !daily ? (
                <div className="loading-state">
                  <LoaderCircle className="spin" size={24} />
                  <span>Loading forecast…</span>
                </div>
              ) : daily ? (
                <div className="forecast-list">
                  {daily.time.slice(0, 5).map((date, i) => {
                    const wi = weatherInfo(daily.weather_code[i]);
                    const DayIcon = wi.Icon;
                    return (
                      <div
                        className={`forecast-row ${i === 0 ? "forecast-today" : ""}`}
                        key={date}
                      >
                        <span className="forecast-day">{dayName(date, i)}</span>
                        <div className={`forecast-icon ${wi.tone}`}>
                          <DayIcon size={21} strokeWidth={1.7} />
                        </div>
                        <span className="forecast-condition">{wi.label}</span>
                        <span className="forecast-range">
                          <b>{temp(daily.temperature_2m_max[i], unit)}</b>
                          <span className="range-track">
                            <i
                              style={{
                                left: `${18 + i * 6}%`,
                                width: `${28 + (i % 3) * 8}%`,
                              }}
                            />
                          </span>
                          <em>{temp(daily.temperature_2m_min[i], unit)}</em>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="loading-state">
                  Forecast is not available yet.
                </div>
              )}
              <div className="outlook-foot">
                <span>
                  <span className="live-pulse" />
                  Updated just now
                </span>
                <span>Source: Open-Meteo</span>
              </div>
            </article>
          </section>
          <section className="lower-grid">
            <article className="card sun-card">
              <div className="lower-title">
                <div>
                  <span className="card-label">DAYLIGHT</span>
                  <h3>Sunrise &amp; sunset</h3>
                </div>
                <div className="sun-symbol">
                  <Sun size={19} />
                </div>
              </div>
              <div className="sun-times">
                <div>
                  <span className="sun-time-icon rise">
                    <Sunrise size={18} />
                  </span>
                  <div>
                    <small>Sunrise</small>
                    <strong>{formatApiTime(daily?.sunrise?.[0])}</strong>
                  </div>
                </div>
                <div className="sun-arc">
                  <span />
                  <i />
                </div>
                <div className="sun-set">
                  <div>
                    <small>Sunset</small>
                    <strong>{formatApiTime(daily?.sunset?.[0])}</strong>
                  </div>
                  <span className="sun-time-icon set">
                    <Moon size={17} />
                  </span>
                </div>
              </div>
              <div className="daylight-foot">
                <span>
                  <Clock3 size={14} />
                  Local time
                </span>
                <span>
                  {city.timezone?.replaceAll("_", " ") ||
                    weather?.timezone?.replaceAll("_", " ") ||
                    "Local timezone"}
                </span>
              </div>
            </article>
            <article className="card reminder-card">
              <div className="reminder-copy">
                <div className="bell-mark">
                  <Bell size={17} />
                </div>
                <div>
                  <span className="card-label">A LITTLE NUDGE</span>
                  <h3>Your daily weather check-in</h3>
                  <p>Get a gentle reminder to check the forecast.</p>
                </div>
              </div>
              <div className="reminder-controls">
                <label htmlFor="reminder-time">Daily at</label>
                <input
                  id="reminder-time"
                  type="time"
                  value={reminder}
                  onChange={(e) => saveReminderTime(e.target.value)}
                />
                <button className="reminder-btn" onClick={askReminder}>
                  <Bell size={14} />
                  <span>Enable</span>
                </button>
              </div>
              {reminderMessage && (
                <p className="reminder-message" role="status">
                  {reminderMessage}
                </p>
              )}
            </article>
          </section>
          <footer className="page-footer">
            <span>
              Made for your everyday forecast{" "}
              <span className="footer-spark">✳</span>
            </span>
            <span>
              <span className="footer-weather">
                <CloudSun size={14} />
              </span>{" "}
              Real-time weather · Open-Meteo
            </span>
          </footer>
        </div>
      </main>
      {confirmCity && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setConfirmCity(null)
          }
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="confirm-icon">
              <Heart size={19} />
            </div>
            <h2 id="confirm-title">Remove this favourite?</h2>
            <p>{confirmCity.name} will be removed from your saved places.</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setConfirmCity(null)}
              >
                Keep it
              </button>
              <button className="remove-btn" onClick={confirmRemove}>
                Remove place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function registerSW() {
  try {
    if ("serviceWorker" in navigator)
      await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.warn("Service worker registration failed", e);
  }
}
if (import.meta.env.PROD) registerSW();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
