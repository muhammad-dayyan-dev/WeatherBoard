# Weatherboard

A responsive personal weather dashboard built with React and Vite. It uses live Open-Meteo geocoding and forecast data, saves up to five favourite locations, supports Celsius/Fahrenheit and light/dark themes, and caches the app shell and last successful city forecasts for offline use.

## Run locally

```sh
npm install
npm run dev
```

For a production build and local preview:

```sh
npm run build
npm run preview
```

The service worker and install prompt require HTTPS (or localhost). No API key is needed. Open-Meteo provides free geocoding and forecast endpoints; search suggestions are debounced by 120 ms. Public API and network latency can push displayed suggestions beyond the challenge’s 300 ms target.

## Architecture decisions

- Single-page React client with no server-side application. The page is composed from focused `CitySearch`, `FavoriteSidebar`, `WeatherCards`, `DaylightCard`, `ReminderCard`, and `RemoveFavoriteDialog` components; `src/lib/weather.js` owns storage helpers and weather formatting. `App` coordinates page state and async requests.
- Open-Meteo's public geocoding endpoint provides city autocomplete and coordinates. The forecast endpoint supplies current conditions, daily highs/lows, daylight, UV and timezone-aware data. Weather condition codes are mapped to descriptive labels and icons in the client.
- User preferences and favourites are stored in localStorage with guarded reads and writes so storage failures do not crash the dashboard. The last forecast is cached per coordinate pair; the service worker also caches successful forecast GET requests and serves them offline.
- The responsive layout includes a mobile navigation drawer, keyboard-accessible search suggestions, inline errors, refresh states, a favourites confirmation dialog, a theme toggle and a persisted temperature unit.

## Notifications and known limitations

The browser Notifications API can show a daily reminder while this page is open. This project asks for permission only after explaining the reminder. The chosen time is saved locally. A true notification that fires while the tab is closed requires a push subscription, a VAPID key pair, and a server or push service to send scheduled Web Push messages. That infrastructure is outside the challenge's client-only constraint, so the app clearly tells users to keep it open for the reminder. It does not claim to schedule closed-tab notifications.

The challenge asks for GeoDB via RapidAPI, which requires a key. This implementation uses Open-Meteo's free geocoding endpoint instead, avoiding a client-exposed secret and keeping the app functional without signup. Forecast reliability and cached data freshness depend on the public API and the user's network.

## Deployment and repository

Public repository: [github.com/muhammad-dayyan-dev/WeatherBoard](https://github.com/muhammad-dayyan-dev/WeatherBoard). The latest QA fixes in this working tree have not been pushed yet. A live deployment has not been configured.

Build with `npm run build` and publish the generated `dist/` folder to Vercel, Netlify, or another static host configured for SPA fallback. Add the live URL here before submission.

## Agent prompt history

The full user prompt history available in this Codex desktop task is recorded in [PROMPTS.md](./PROMPTS.md), including the challenge request and all QA follow-ups.
