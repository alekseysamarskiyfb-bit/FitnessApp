import { useState } from "react";
import { today, uid } from "../utils.js";
import { Icons, PageHeader, Btn, Num } from "../ui.jsx";

const shortDate = (d) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export default function WeightPage({ weightHistory, setWeightHistory }) {
  const [weightInput, setWeightInput] = useState("");
  const [filter, setFilter] = useState("30");

  const todayKey = today();
  const todayEntry = weightHistory.find((e) => e.date === todayKey);
  const sorted = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted.length ? sorted[sorted.length - 1] : null;

  function saveWeight() {
    const w = parseFloat(weightInput);
    if (!w || w < 20 || w > 400) return;
    setWeightHistory((prev) => {
      const rest = prev.filter((e) => e.date !== todayKey);
      return [...rest, { id: uid(), date: todayKey, weight: w }].sort((a, b) => a.date.localeCompare(b.date));
    });
    setWeightInput("");
  }
  function deleteEntry(id) {
    setWeightHistory((p) => p.filter((e) => e.id !== id));
  }

  const now = new Date();
  const daysAgo = (e) => (now - new Date(e.date)) / (1000 * 60 * 60 * 24);

  const filtered = sorted.filter((e) => {
    if (filter === "7") return daysAgo(e) <= 7;
    if (filter === "30") return daysAgo(e) <= 30;
    return true;
  });

  // Средний вес за 7 дней и изменение к прошлой неделе
  const avg = (arr) => (arr.length ? arr.reduce((s, e) => s + e.weight, 0) / arr.length : null);
  const currentWeekAvg = avg(sorted.filter((e) => daysAgo(e) <= 7));
  const previousWeekAvg = avg(sorted.filter((e) => daysAgo(e) > 7 && daysAgo(e) <= 14));
  const weeklyDiff =
    currentWeekAvg !== null && previousWeekAvg !== null
      ? parseFloat((currentWeekAvg - previousWeekAvg).toFixed(1))
      : null;
  const trendLabel =
    weeklyDiff === null ? "Мало данных" : weeklyDiff < -0.1 ? "Снижение" : weeklyDiff > 0.1 ? "Набор" : "Стабильно";

  // ── График ──
  const W = 320, H = 170, padL = 38, padR = 14, padT = 14, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  let points = [];
  let minW = 0, maxW = 0;
  if (filtered.length > 0) {
    minW = Math.min(...filtered.map((e) => e.weight)) - 0.5;
    maxW = Math.max(...filtered.map((e) => e.weight)) + 0.5;
    const range = maxW - minW || 1;
    const times = filtered.map((e) => new Date(e.date).getTime());
    const t0 = Math.min(...times);
    const tRange = Math.max(...times) - t0 || 1;
    points = filtered.map((e) => ({
      x: filtered.length === 1 ? padL + innerW / 2 : padL + ((new Date(e.date).getTime() - t0) / tRange) * innerW,
      y: padT + innerH - ((e.weight - minW) / range) * innerH,
    }));
  }
  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = points.length > 1
    ? `${line} L${points[points.length - 1].x},${padT + innerH} L${points[0].x},${padT + innerH} Z`
    : "";

  return (
    <div className="page">
      <PageHeader eyebrow="История и прогресс" muted="Вес" strong="И прогресс" />

      {/* Главный блок */}
      <section className="card card--accent">
        <span className="eyebrow eyebrow--ink">Текущий вес</span>
        <div className="figure">
          <span className="display huge">{last ? <Num value={last.weight} decimals={1} /> : "—"}</span>
          <span className="unit">кг</span>
        </div>
        <div className="stats2">
          <div>
            <span>Среднее за 7 дней</span>
            <b>{currentWeekAvg === null ? "—" : currentWeekAvg.toFixed(1)} <small>кг</small></b>
          </div>
          <div>
            <span>{trendLabel}</span>
            <b>
              {weeklyDiff === null ? "—" : `${weeklyDiff > 0 ? "+" : ""}${weeklyDiff}`} <small>кг</small>
            </b>
          </div>
        </div>
      </section>

      {/* Ввод */}
      <section className="card">
        <div className="row between">
          <span className="eyebrow muted-eyebrow">{todayEntry ? "Обновить вес" : "Записать вес"}</span>
          {todayEntry && <span className="hint">Сегодня: {todayEntry.weight} кг</span>}
        </div>
        <div className="inline-row">
          <input
            type="number"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveWeight()}
            placeholder="Например, 95.4"
            step="0.1" min="20" max="400"
          />
          <Btn onClick={saveWeight}>Сохранить</Btn>
        </div>
      </section>

      {/* График */}
      <section className="card">
        <div className="row between">
          <span className="eyebrow muted-eyebrow">График</span>
          <div className="seg">
            {[["7", "7 дн"], ["30", "30 дн"], ["all", "Всё"]].map(([v, l]) => (
              <button key={v} className={filter === v ? "on" : ""} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {points.length === 0 ? (
          <p className="empty-note">Нет данных за этот период</p>
        ) : (
          <svg key={filter + filtered.length} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="График веса">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7316" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#ff7316" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={padL} x2={W - padR} y1={padT + (innerH / 3) * i} y2={padT + (innerH / 3) * i} className="chart-grid" />
            ))}
            <text x={padL - 8} y={padT + 4} className="chart-label" textAnchor="end">{maxW.toFixed(1)}</text>
            <text x={padL - 8} y={padT + innerH + 4} className="chart-label" textAnchor="end">{minW.toFixed(1)}</text>
            <text x={padL} y={H - 6} className="chart-label">{shortDate(filtered[0].date)}</text>
            {filtered.length > 1 && (
              <text x={W - padR} y={H - 6} className="chart-label" textAnchor="end">{shortDate(filtered[filtered.length - 1].date)}</text>
            )}
            {area && <path d={area} fill="url(#areaGrad)" className="chart-area" />}
            {points.length > 1 && <path d={line} pathLength="1" className="chart-line" />}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3.5} className="chart-dot"
                style={{ animationDelay: `${0.4 + (i / points.length) * 0.8}s` }} />
            ))}
          </svg>
        )}
      </section>

      {/* История */}
      <section>
        <h2 className="display section-title">История</h2>
        <div className="card list">
          {[...sorted].reverse().map((e) => (
            <div key={e.id} className="hist-row">
              <div className="hist-text">
                <b>{new Date(e.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</b>
                {e.date === todayKey && <small className="accent-text">Сегодня</small>}
              </div>
              <span className="hist-val">{e.weight} <small>кг</small></span>
              <button className="icon-btn icon-btn--danger" onClick={() => deleteEntry(e.id)} aria-label="Удалить"><Icons.Trash /></button>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="empty"><b>Нет записей</b><small>Добавьте первый вес выше</small></div>
          )}
        </div>
      </section>
    </div>
  );
}
