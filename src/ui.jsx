import { useState, useEffect, useRef } from "react";
import { WEEKDAYS, todayWeekdayKey } from "./utils.js";

// ─── ИКОНКИ ───────────────────────────────────────────────────────────────────

const make = (children, size = 20, sw = 2) =>
  function Icon() {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
        strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    );
  };

// eslint-disable-next-line react-refresh/only-export-components
export const Icons = {
  Home: make(<><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>, 22),
  Food: make(<><path d="M6 3v6a2 2 0 0 0 4 0V3" /><path d="M8 11v10" /><path d="M17 21V3c-2.5 1.5-3.5 4.5-3.5 8H17" /></>, 22),
  Dumbbell: make(<><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></>, 22),
  Scale: make(<><path d="M4 16a8 8 0 1 1 16 0" /><path d="m12 16 4-4" /><path d="M4 20h16" /></>, 22),
  Sliders: make(<><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>, 22),
  Plus: make(<><path d="M12 5v14M5 12h14" /></>, 18, 2.5),
  Check: make(<><path d="m5 12.5 4.5 4.5L19 7.5" /></>, 16, 3),
  ChevronDown: make(<><path d="m6 9 6 6 6-6" /></>, 18),
  Edit: make(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /></>, 16),
  Trash: make(<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>, 16),
  X: make(<><path d="M18 6 6 18M6 6l12 12" /></>, 16, 2.5),
  Flame: make(<><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-8z" /></>, 18),
  Drop: make(<><path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z" /></>, 18),
  Arrow: make(<><path d="M5 12h14M13 6l6 6-6 6" /></>, 18, 2.5),
  Undo: make(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>, 16),
  Down: make(<><path d="M7 7l10 10M17 9v8H9" /></>, 16, 2.5),
  Up: make(<><path d="M7 17 17 7M9 7h8v8" /></>, 16, 2.5),
  Flat: make(<><path d="M5 12h14" /></>, 16, 2.5),
};

// ─── ХУКИ ─────────────────────────────────────────────────────────────────────

// Плавный «счётчик»: число доезжает до нового значения
// eslint-disable-next-line react-refresh/only-export-components
export function useCountUp(value, ms = 800) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = a + (value - a) * eased;
      from.current = cur;
      setV(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return v;
}

export function Num({ value, decimals = 0 }) {
  const v = useCountUp(Number(value) || 0);
  return <>{decimals ? v.toFixed(decimals) : Math.round(v)}</>;
}

// ─── КОМПОНЕНТЫ ───────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h3 className="display sheet-title">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть"><Icons.X /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", small = false, disabled = false, full = false, style }) {
  const cls = ["btn", `btn--${variant}`, small && "btn--sm", full && "btn--full"].filter(Boolean).join(" ");
  return (
    <button className={cls} style={style} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function PageHeader({ eyebrow, muted, strong }) {
  return (
    <header className="page-head">
      <div className="eyebrow"><span className="eyebrow-ico"><Icons.Dumbbell /></span>{eyebrow}</div>
      <h1 className="display title">
        <span className="title-muted">{muted}</span>
        <span>{strong}</span>
      </h1>
    </header>
  );
}

export function Bar({ value, tone = "accent" }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={`bar bar--${tone}`}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function DayPills({ active, onChange }) {
  const todayIdx = todayWeekdayKey();
  return (
    <div className="day-pills" role="tablist">
      {WEEKDAYS.map((d, i) => (
        <button
          key={d}
          role="tab"
          aria-selected={active === i}
          className={`day-pill ${active === i ? "on" : ""}`}
          onClick={() => onChange(i)}
        >
          {d}
          {i === todayIdx && <i className="day-dot" />}
        </button>
      ))}
    </div>
  );
}

// Плавно раскрывающийся блок
export function Collapse({ open, children }) {
  return (
    <div className={`collapse ${open ? "open" : ""}`}>
      <div>{children}</div>
    </div>
  );
}
