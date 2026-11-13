import { ChevronRight, CloudSun, MapPin, Menu, Plus } from "lucide-react";

export default function FavoriteSidebar({
  favorites,
  city,
  mobileMenu,
  onChooseCity,
  onAddPlace,
  onCloseMenu,
}) {
  return (
    <>
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
            favorites.map((favorite) => (
              <button
                className={`favorite-item ${favorite.id === `${city.latitude},${city.longitude}` ? "selected" : ""}`}
                key={favorite.id}
                onClick={() => onChooseCity(favorite)}
              >
                <MapPin size={15} />
                <span>
                  {favorite.name}
                  <small>{favorite.country}</small>
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
        <button className="add-place" onClick={onAddPlace}>
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
          onClick={onCloseMenu}
          aria-label="Close navigation"
        />
      )}
    </>
  );
}
