import { useState, useMemo } from "react";
import {
  today, todayLabel, todayWeekdayKey, WEEKDAYS_FULL, MEAL_TYPES, calcMealCal, calcMealMacros,
} from "../utils.js";
import { Icons, PageHeader, Bar, Num, Collapse } from "../ui.jsx";

// ─── ВОДА ─────────────────────────────────────────────────────────────────────

function WaterCard({ waterData, setWaterData, waterGoal }) {
  const todayKey = today();
  const todayWater = waterData[todayKey] || { total: 0, log: [] };
  const [customWater, setCustomWater] = useState("");
  const [showLog, setShowLog] = useState(false);

  const pct = waterGoal > 0 ? Math.min(100, Math.round((todayWater.total / waterGoal) * 100)) : 0;
  const remaining = Math.max(0, waterGoal - todayWater.total);

  function addWater(ml) {
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    setWaterData((prev) => {
      const day = prev[todayKey] || { total: 0, log: [] };
      return { ...prev, [todayKey]: { total: day.total + ml, log: [...day.log, { time, amount: ml }] } };
    });
  }
  function removeLastWater() {
    setWaterData((prev) => {
      const day = prev[todayKey];
      if (!day || !day.log.length) return prev;
      const newLog = day.log.slice(0, -1);
      return { ...prev, [todayKey]: { total: newLog.reduce((s, e) => s + e.amount, 0), log: newLog } };
    });
  }
  function addCustom() {
    const ml = parseInt(customWater);
    if (!ml || ml <= 0 || ml > 5000) return;
    addWater(ml);
    setCustomWater("");
  }

  return (
    <section className="card">
      <div className="row between">
        <span className="eyebrow muted-eyebrow"><Icons.Drop /> Вода</span>
        <span className="hint">{pct >= 100 ? "Цель достигнута" : `Ещё ${remaining} мл`}</span>
      </div>

      <div className="figure">
        <span className="display big"><Num value={todayWater.total} /></span>
        <span className="unit">/ {waterGoal} мл</span>
      </div>
      <Bar value={pct} />

      <div className="quick">
        {[150, 250, 500].map((ml) => (
          <button key={ml} className="quick-btn" onClick={() => addWater(ml)}>+{ml}</button>
        ))}
      </div>

      <div className="inline-input">
        <input
          type="number"
          value={customWater}
          onChange={(e) => setCustomWater(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Другое количество, мл"
        />
        <button className="inline-add" onClick={addCustom} aria-label="Добавить"><Icons.Plus /></button>
      </div>

      {todayWater.log.length > 0 && (
        <>
          <div className="row between log-bar">
            <button className="link" onClick={() => setShowLog((p) => !p)}>
              <span className={`chev ${showLog ? "flip" : ""}`}><Icons.ChevronDown /></span>
              {todayWater.log.length} записей
            </button>
            <button className="link" onClick={removeLastWater}><Icons.Undo /> Отменить</button>
          </div>
          <Collapse open={showLog}>
            <ul className="log">
              {[...todayWater.log].reverse().map((entry, i) => (
                <li key={i}><span>{entry.time}</span><b>+{entry.amount} мл</b></li>
              ))}
            </ul>
          </Collapse>
        </>
      )}
    </section>
  );
}

// ─── СЕГОДНЯ ──────────────────────────────────────────────────────────────────

export default function TodayPage({
  routine, weightHistory, nutrition, workouts, completions, setCompletions,
  goals, waterGoal, waterData, setWaterData, go,
}) {
  const [expanded, setExpanded] = useState({});
  const todayKey = today();
  const wdName = WEEKDAYS_FULL[todayWeekdayKey()];
  const todayNutrition = nutrition[wdName] || {};
  const todayWorkout = workouts[wdName] || null;
  const todayCompletions = useMemo(() => completions[todayKey] || {}, [completions, todayKey]);

  const sortedTasks = useMemo(() => [...routine].sort((a, b) => a.time.localeCompare(b.time)), [routine]);
  const completed = sortedTasks.filter((t) => todayCompletions[t.id]).length;
  const taskPct = sortedTasks.length ? Math.round((completed / sortedTasks.length) * 100) : 0;

  const lastWeight = weightHistory.length ? weightHistory[weightHistory.length - 1] : null;
  const prevWeight = weightHistory.length > 1 ? weightHistory[weightHistory.length - 2] : null;
  const diff = lastWeight && prevWeight ? parseFloat((lastWeight.weight - prevWeight.weight).toFixed(1)) : null;

  // Едой считается только то, что отмечено в расписании
  const completedMealTypes = useMemo(() => {
    const types = new Set();
    sortedTasks.forEach((t) => { if (t.type === "meal" && todayCompletions[t.id]) types.add(t.mealType); });
    return types;
  }, [sortedTasks, todayCompletions]);

  const mealCals = MEAL_TYPES.reduce((acc, mt) => {
    acc[mt] = completedMealTypes.has(mt) && todayNutrition[mt] ? calcMealCal(todayNutrition[mt].items) : 0;
    return acc;
  }, {});
  const totalCal = Object.values(mealCals).reduce((s, v) => s + v, 0);

  const totalMacros = MEAL_TYPES.reduce((acc, mt) => {
    const m = todayNutrition[mt];
    if (!completedMealTypes.has(mt) || !m) return acc;
    const macro = calcMealMacros(m.items);
    acc.protein += macro.protein; acc.fat += macro.fat; acc.carbs += macro.carbs;
    return acc;
  }, { protein: 0, fat: 0, carbs: 0 });
  const r1 = (n) => Math.round(n * 10) / 10;

  const calPct = goals.calories > 0 ? Math.round((totalCal / goals.calories) * 100) : 0;

  function toggleDone(id) {
    setCompletions((prev) => ({
      ...prev,
      [todayKey]: { ...(prev[todayKey] || {}), [id]: !(prev[todayKey] || {})[id] },
    }));
  }

  function taskContent(task) {
    if (task.type === "meal") {
      const meal = todayNutrition[task.mealType];
      const cal = meal ? calcMealCal(meal.items) : 0;
      return {
        subtitle: `${cal} ккал`,
        detail: meal?.items?.map((i) => `${i.name} — ${i.grams} г (${Math.round((i.grams * (i.calories ?? i.caloriesPer100g ?? 0)) / 100)} ккал)`).join("\n") || "Нет данных",
      };
    }
    if (task.type === "workout") {
      if (!todayWorkout) return { subtitle: "Выходной", detail: "Тренировка не запланирована" };
      return {
        subtitle: `${todayWorkout.name} · ${todayWorkout.exercises.length} упр.`,
        detail: todayWorkout.exercises.map((e) => `${e.name} — ${e.sets}×${e.reps}`).join("\n"),
      };
    }
    return { subtitle: task.notes || "", detail: task.notes || "" };
  }

  const macros = [
    ["Белки", r1(totalMacros.protein), goals.protein],
    ["Жиры", r1(totalMacros.fat), goals.fat],
    ["Углеводы", r1(totalMacros.carbs), goals.carbs],
  ];

  return (
    <div className="page">
      <PageHeader eyebrow={todayLabel()} muted="Сегодня" strong="Всё по плану" />

      {/* Главный блок: калории и БЖУ */}
      <section className="card card--accent">
        <div className="row between">
          <span className="eyebrow eyebrow--ink">Съедено сегодня</span>
          <Icons.Flame />
        </div>
        <div className="figure">
          <span className="display huge"><Num value={totalCal} /></span>
          <span className="unit">{goals.calories > 0 ? `/ ${goals.calories} ккал` : "ккал"}</span>
        </div>
        {goals.calories > 0 && <Bar value={calPct} tone="ink" />}

        <div className="macros">
          {macros.map(([label, cur, goal]) => (
            <div key={label}>
              <span className="macro-label">{label}</span>
              <b className="macro-val">{cur}{goal > 0 && <small> / {goal} г</small>}</b>
              <Bar value={goal > 0 ? (cur / goal) * 100 : 0} tone="ink" />
            </div>
          ))}
        </div>

        <div className="meals-row">
          {MEAL_TYPES.map((mt) => (
            <div key={mt}><span>{mt}</span><b>{mealCals[mt]}</b></div>
          ))}
        </div>
      </section>

      {/* Вес и задачи */}
      <div className="grid2">
        <button className="card tile" onClick={() => go("weight")}>
          <span className="eyebrow muted-eyebrow">Вес</span>
          <div className="figure">
            <span className="display big">{lastWeight ? <Num value={lastWeight.weight} decimals={1} /> : "—"}</span>
            <span className="unit">кг</span>
          </div>
          {diff !== null && (
            <span className="delta">
              {diff < 0 ? <Icons.Down /> : diff > 0 ? <Icons.Up /> : <Icons.Flat />}
              {diff > 0 ? "+" : ""}{diff} кг
            </span>
          )}
        </button>

        <div className="card tile">
          <span className="eyebrow muted-eyebrow">Задачи</span>
          <div className="figure">
            <span className="display big"><Num value={completed} /></span>
            <span className="unit">/ {sortedTasks.length}</span>
          </div>
          <Bar value={taskPct} />
        </div>
      </div>

      {todayWorkout && (
        <button className="card link-card" onClick={() => go("workouts")}>
          <span className="ico-circle"><Icons.Dumbbell /></span>
          <span className="link-card-text">
            <b>{todayWorkout.name}</b>
            <small>{todayWorkout.exercises.length} упражнений · сегодня</small>
          </span>
          <span className="link-card-arrow"><Icons.Arrow /></span>
        </button>
      )}

      <WaterCard waterData={waterData} setWaterData={setWaterData} waterGoal={waterGoal} />

      {/* Расписание */}
      <section>
        <h2 className="display section-title">Расписание</h2>
        <div className="card list">
          {sortedTasks.map((task) => {
            const done = !!todayCompletions[task.id];
            const open = !!expanded[task.id];
            const { subtitle, detail } = taskContent(task);
            const canExpand = task.type !== "generic" || !!detail;
            return (
              <div key={task.id} className={`task ${done ? "done" : ""}`}>
                <div className="task-main">
                  <button className={`check ${done ? "on" : ""}`} onClick={() => toggleDone(task.id)} aria-label="Отметить">
                    {done && <span className="check-ico"><Icons.Check /></span>}
                  </button>
                  <div className="task-text">
                    <b>{task.title}</b>
                    <small>{task.time}{subtitle ? ` · ${subtitle}` : ""}</small>
                  </div>
                  {canExpand && (
                    <button className="icon-btn" onClick={() => setExpanded((p) => ({ ...p, [task.id]: !p[task.id] }))} aria-label="Подробнее">
                      <span className={`chev ${open ? "flip" : ""}`}><Icons.ChevronDown /></span>
                    </button>
                  )}
                </div>
                {canExpand && (
                  <Collapse open={open}>
                    <div className="task-detail">
                      {(detail || "").split("\n").map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                  </Collapse>
                )}
              </div>
            );
          })}
          {sortedTasks.length === 0 && (
            <div className="empty">
              <b>Нет задач</b>
              <small>Настройте расписание в разделе «Настройки»</small>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
