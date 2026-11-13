import { useEffect, useRef } from "react";
import { Heart } from "lucide-react";

export function RemoveFavoriteDialog({ city, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        "button:not([disabled])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  if (!city) return null;
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onCancel()
      }
    >
      <div
        className="confirm-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <div className="confirm-icon">
          <Heart size={19} />
        </div>
        <h2 id="confirm-title">Remove this favourite?</h2>
        <p id="confirm-description">
          {city.name} will be removed from your saved places.
        </p>
        <div className="modal-actions">
          <button ref={cancelRef} className="cancel-btn" onClick={onCancel}>
            Keep it
          </button>
          <button className="remove-btn" onClick={onConfirm}>
            Remove place
          </button>
        </div>
      </div>
    </div>
  );
}
