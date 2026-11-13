import {
  CircleAlert,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Search,
} from "lucide-react";

export default function CitySearch({
  inputRef,
  query,
  onQueryChange,
  onBlur,
  onFocus,
  onKeyDown,
  searching,
  suggestions,
  activeSuggestion,
  onChooseCity,
  searchError,
  touched,
}) {
  return (
    <>
      <section className="search-row">
        <div
          className={`search-box ${touched && !query.trim() ? "invalid" : ""}`}
        >
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            placeholder="Search for a city…"
            aria-label="Search for a city"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={
              suggestions.length
                ? "city-suggestions"
                : searchError
                  ? "city-search-status"
                  : undefined
            }
            aria-expanded={suggestions.length > 0 || Boolean(searchError)}
            aria-invalid={touched && !query.trim()}
            aria-activedescendant={
              activeSuggestion >= 0
                ? `city-option-${activeSuggestion}`
                : undefined
            }
            aria-describedby={
              touched && !query.trim() ? "city-error" : undefined
            }
          />
          {searching && <LoaderCircle className="spin" size={17} />}
          <kbd>⌘ K</kbd>
          {(suggestions.length > 0 || searchError) && (
            <div className="suggestion-menu">
              {suggestions.length > 0 ? (
                <>
                  <div className="suggestion-caption">SUGGESTED LOCATIONS</div>
                  <div id="city-suggestions" role="listbox">
                    {suggestions.map((place, index) => (
                      <div
                        key={`${place.id}-${index}`}
                        id={`city-option-${index}`}
                        role="option"
                        aria-selected={activeSuggestion === index}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onChooseCity(place)}
                        className="suggestion"
                      >
                        <MapPin size={16} />
                        <span>
                          <strong>{place.name}</strong>
                          <small>
                            {[place.admin1, place.country]
                              .filter(Boolean)
                              .join(", ")}
                          </small>
                        </span>
                        <ChevronRight size={15} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p
                  className="search-error"
                  id="city-search-status"
                  role="status"
                  aria-live="polite"
                >
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
        <div
          className="inline-error"
          id="city-error"
          role="alert"
          aria-live="polite"
        >
          Enter a city name to search.
        </div>
      )}
    </>
  );
}
