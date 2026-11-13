import { Bell } from "lucide-react";

export function ReminderCard({ time, message, onTimeChange, onEnable }) {
  return (
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
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
        />
        <button className="reminder-btn" onClick={onEnable}>
          <Bell size={14} />
          <span>Enable</span>
        </button>
      </div>
      {message && (
        <p className="reminder-message" role="status">
          {message}
        </p>
      )}
    </article>
  );
}
