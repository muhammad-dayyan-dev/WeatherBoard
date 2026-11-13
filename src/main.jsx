import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  MapPin,
  Sun,
  ChevronRight,
  Heart,
  Menu,
  RefreshCw,
  Moon,
  CloudSun,
  CircleAlert,
  WifiOff,
} from "lucide-react";
import "./styles.css";
import CitySearch from "./components/CitySearch.jsx";
import FavoriteSidebar from "./components/FavoriteSidebar.jsx";
import { DaylightCard, WeatherCards } from "./components/WeatherCards.jsx";
import { ReminderCard } from "./components/ReminderCard.jsx";
import { RemoveFavoriteDialog } from "./components/RemoveFavoriteDialog.jsx";
import { STORE, getGreeting, safeGet, safeSet } from "./lib/weather.js";

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
  const [favoriteLimitError, setFavoriteLimitError] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [touched, setTouched] = useState(false);
  const [favorites, setFavorites] = useState(() =>
    safeGet(STORE.favorites, []),
  );
  const [favoriteNotice, setFavoriteNotice] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const currentCardRef = useRef(null);
  const searchTimer = useRef(null);
  const searchRequest = useRef(0);
  const weatherRequest = useRef(0);
  const searchHasInput = useRef(false);

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
    if (!detailsOpen) return;
    const onPointerDown = (event) => {
      if (!currentCardRef.current?.contains(event.target))
        setDetailsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setDetailsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [detailsOpen]);
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
    if (text.trim()) searchHasInput.current = true;
    setQuery(text);
    setTouched(false);
    setSearchError("");
    setSuggestions([]);
    setActiveSuggestion(-1);
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
        const cities = (data.results || []).filter(
          (p) => p.latitude != null && p.longitude != null,
        );
        setSuggestions(cities);
        setActiveSuggestion(-1);
        setSearchError(
          cities.length
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
    }, 120);
  };
  const chooseCity = (p) => {
    ++searchRequest.current;
    clearTimeout(searchTimer.current);
    searchHasInput.current = false;
    setWeather(null);
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
    setFavoriteNotice("");
    setDetailsOpen(false);
    setMobileMenu(false);
    inputRef.current?.blur();
  };
  const toggleFavorite = () => {
    const id = `${city.latitude},${city.longitude}`;
    if (favorites.some((f) => f.id === id)) {
      setFavoriteNotice("");
      setConfirmCity(favorites.find((f) => f.id === id));
    } else if (favorites.length >= 5) {
      setFavoriteLimitError(
        "You’ve reached the five-city limit. Remove a favourite to save another.",
      );
    } else {
      setFavorites([...favorites, { id, ...city }]);
      setFavoriteNotice(`${city.name} added to favourites.`);
      setFavoriteLimitError("");
    }
  };
  const confirmRemove = () => {
    if (confirmCity) {
      setFavorites(favorites.filter((f) => f.id !== confirmCity.id));
      setFavoriteNotice(`${confirmCity.name} removed from favourites.`);
      setFavoriteLimitError("");
    }
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
      <FavoriteSidebar
        favorites={favorites}
        city={city}
        mobileMenu={mobileMenu}
        onChooseCity={chooseCity}
        onAddPlace={() => {
          inputRef.current?.focus();
          setMobileMenu(false);
        }}
        onCloseMenu={() => setMobileMenu(false)}
      />
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
              aria-pressed={theme === "dark"}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button
              className="unit-switch"
              onClick={() => setUnit(unit === "C" ? "F" : "C")}
              aria-label={`Temperature unit: degrees ${unit === "C" ? "Celsius" : "Fahrenheit"}`}
              aria-pressed={unit === "F"}
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
          <CitySearch
            inputRef={inputRef}
            query={query}
            onQueryChange={findCities}
            onBlur={() => {
              if (searchHasInput.current && !query.trim()) setTouched(true);
            }}
            onFocus={() => setTouched(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                ++searchRequest.current;
                clearTimeout(searchTimer.current);
                setQuery("");
                setSuggestions([]);
                setSearchError("");
                setActiveSuggestion(-1);
                setSearching(false);
                setTouched(false);
                searchHasInput.current = false;
              } else if (event.key === "ArrowDown" && suggestions.length) {
                event.preventDefault();
                setActiveSuggestion((index) =>
                  index < suggestions.length - 1 ? index + 1 : 0,
                );
              } else if (event.key === "ArrowUp" && suggestions.length) {
                event.preventDefault();
                setActiveSuggestion((index) =>
                  index > 0 ? index - 1 : suggestions.length - 1,
                );
              }
              if (event.key === "Enter" && suggestions.length) {
                event.preventDefault();
                chooseCity(suggestions[activeSuggestion] || suggestions[0]);
              } else if (event.key === "Enter" && !query.trim())
                setTouched(true);
            }}
            searching={searching}
            suggestions={suggestions}
            activeSuggestion={activeSuggestion}
            onChooseCity={chooseCity}
            searchError={searchError}
            touched={touched}
          />
          {favoriteLimitError && (
            <div className="error-banner favorite-limit-error" role="alert">
              <CircleAlert size={17} />
              <span>{favoriteLimitError}</span>
              <button onClick={() => setFavoriteLimitError("")}>Dismiss</button>
            </div>
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
            <div className="place-actions">
              <button
                className={`favorite-toggle ${isFavorite ? "is-favorite" : ""}`}
                onClick={toggleFavorite}
                aria-label={
                  isFavorite
                    ? `Remove ${city.name} from favourites`
                    : `Add ${city.name} to favourites`
                }
                title={
                  isFavorite ? "Remove from favourites" : "Add to favourites"
                }
              >
                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                <span>{isFavorite ? "Saved" : "Add favourite"}</span>
              </button>
              {favoriteNotice && (
                <span className="favorite-notice" role="status">
                  {favoriteNotice}
                </span>
              )}
            </div>
          </div>
          <WeatherCards
            city={city}
            weather={weather}
            loading={loading}
            unit={unit}
            detailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen((open) => !open)}
            cardRef={currentCardRef}
          />
          <section className="lower-grid">
            <DaylightCard city={city} weather={weather} />
            <ReminderCard
              time={reminder}
              message={reminderMessage}
              onTimeChange={saveReminderTime}
              onEnable={askReminder}
            />
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
        <RemoveFavoriteDialog
          city={confirmCity}
          onCancel={() => setConfirmCity(null)}
          onConfirm={confirmRemove}
        />
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
