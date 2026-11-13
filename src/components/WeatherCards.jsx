import {
  Clock3,
  Droplets,
  LoaderCircle,
  Moon,
  Sun,
  Sunrise,
  Wind,
} from "lucide-react";
import { dayName, formatApiTime, temp, weatherInfo } from "../lib/weather.js";

function CurrentWeatherCard({
  city,
  current,
  daily,
  loading,
  unit,
  detailsOpen,
  onToggleDetails,
  cardRef,
}) {
  const info = weatherInfo(current?.weather_code ?? 2, current?.is_day !== 0);
  const CurrentIcon = info.Icon;
  return (
    <article className="card current-card" ref={cardRef}>
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
          aria-label={
            detailsOpen
              ? "Hide current weather details"
              : "Show current weather details"
          }
          aria-expanded={detailsOpen}
          aria-controls="current-weather-details"
          onClick={onToggleDetails}
        >
          •••
        </button>
        {detailsOpen && (
          <div
            className="details-popover"
            id="current-weather-details"
            role="region"
            aria-label="Today's weather details"
          >
            <strong>Today in {city.name}</strong>
            <div>
              <span>High</span>
              <b>{temp(daily?.temperature_2m_max?.[0], unit)}</b>
            </div>
            <div>
              <span>Low</span>
              <b>{temp(daily?.temperature_2m_min?.[0], unit)}</b>
            </div>
            <div>
              <span>Precipitation</span>
              <b>{current?.precipitation ?? "—"} mm</b>
            </div>
            <div>
              <span>Last observation</span>
              <b>{formatApiTime(current?.time)}</b>
            </div>
          </div>
        )}
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
                <span>UV max today</span>
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
        <div className="loading-state">Weather data will appear here.</div>
      )}
    </article>
  );
}

function ForecastCard({ daily, loading, unit }) {
  return (
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
          {daily.time.slice(0, 5).map((date, index) => {
            const info = weatherInfo(daily.weather_code[index]);
            const DayIcon = info.Icon;
            return (
              <div
                className={`forecast-row ${index === 0 ? "forecast-today" : ""}`}
                key={date}
              >
                <span className="forecast-day">{dayName(date, index)}</span>
                <div className={`forecast-icon ${info.tone}`}>
                  <DayIcon size={21} strokeWidth={1.7} />
                </div>
                <span className="forecast-condition">{info.label}</span>
                <span className="forecast-range">
                  <b>{temp(daily.temperature_2m_max[index], unit)}</b>
                  <span className="range-track">
                    <i
                      style={{
                        left: `${18 + index * 6}%`,
                        width: `${28 + (index % 3) * 8}%`,
                      }}
                    />
                  </span>
                  <em>{temp(daily.temperature_2m_min[index], unit)}</em>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="loading-state">Forecast is not available yet.</div>
      )}
      <div className="outlook-foot">
        <span>
          <span className="live-pulse" />
          Updated just now
        </span>
        <span>Source: Open-Meteo</span>
      </div>
    </article>
  );
}

export function WeatherCards({
  city,
  weather,
  loading,
  unit,
  detailsOpen,
  onToggleDetails,
  cardRef,
}) {
  return (
    <section className="weather-grid">
      <CurrentWeatherCard
        city={city}
        current={weather?.current}
        daily={weather?.daily}
        loading={loading}
        unit={unit}
        detailsOpen={detailsOpen}
        onToggleDetails={onToggleDetails}
        cardRef={cardRef}
      />
      <ForecastCard daily={weather?.daily} loading={loading} unit={unit} />
    </section>
  );
}

export function DaylightCard({ city, weather }) {
  const daily = weather?.daily;
  return (
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
  );
}
