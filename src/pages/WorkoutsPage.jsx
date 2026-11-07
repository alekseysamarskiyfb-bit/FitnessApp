import { useState } from "react";
import { WEEKDAYS, WEEKDAYS_FULL, todayWeekdayKey, uid } from "../utils.js";
import { Icons, PageHeader, Btn, Modal, Field, DayPills } from "../ui.jsx";

export default function WorkoutsPage({ workouts, setWorkouts }) {
  const [activeDay, setActiveDay] = useState(todayWeekdayKey());
  const [editModal, setEditModal] = useState(null);
  const [workoutForm, setWorkoutForm] = useState({ name: "", notes: "", exercises: [] });
  const [exForm, setExForm] = useState({ name: "", sets: "", reps: "" });

  const dayName = WEEKDAYS_FULL[activeDay];
  const workout = workouts[dayName];

  function openEdit() {
    if (workout) setWorkoutForm(JSON.parse(JSON.stringify(workout)));
    else setWorkoutForm({ name: "", notes: "", exercises: [] });
    setEditModal(dayName);
  }
  function saveWorkout() {
    setWorkouts((p) => ({ ...p, [editModal]: workoutForm.name ? workoutForm : null }));
    setEditModal(null);
  }
  function addEx() {
    if (!exForm.name) return;
    setWorkoutForm((p) => ({
      ...p,
      exercises: [...p.exercises, { id: uid(), ...exForm, sets: parseInt(exForm.sets) || 3, reps: parseInt(exForm.reps) || 10 }],
    }));
    setExForm({ name: "", sets: "", reps: "" });
  }
  function removeEx(id) {
    setWorkoutForm((p) => ({ ...p, exercises: p.exercises.filter((e) => e.id !== id) }));
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Недельный план" muted="Тренировки" strong="На неделю" />

      <DayPills active={activeDay} onChange={setActiveDay} />

      {workout ? (
        <section key={activeDay} className="stack tight swap">
          <div className="card card--accent">
            <div className="row between start">
              <div>
                <span className="eyebrow eyebrow--ink">{dayName}</span>
                <h2 className="display workout-name">{workout.name}</h2>
                <p className="on-accent">{workout.exercises.length} упражнений{workout.notes ? ` · ${workout.notes}` : ""}</p>
              </div>
              <button className="icon-btn icon-btn--ink" onClick={openEdit} aria-label="Изменить"><Icons.Edit /></button>
            </div>
          </div>

          <div className="card list">
            {workout.exercises.map((ex, i) => (
              <div key={ex.id} className="ex-row">
                <span className="ex-num">{i + 1}</span>
                <b className="ex-name">{ex.name}</b>
                <span className="ex-sets">{ex.sets}×{ex.reps}</span>
              </div>
            ))}
            {workout.exercises.length === 0 && <p className="empty-note">Упражнения не добавлены</p>}
          </div>
        </section>
      ) : (
        <section key={activeDay} className="card empty-card swap">
          <h2 className="display section-title">День отдыха</h2>
          <p className="muted">{dayName}</p>
          <Btn onClick={openEdit}><Icons.Plus /> Добавить тренировку</Btn>
        </section>
      )}

      <section>
        <h2 className="display section-title">Неделя</h2>
        <div className="card list">
          {WEEKDAYS.map((d, i) => {
            const w = workouts[WEEKDAYS_FULL[i]];
            return (
              <button key={d} className={`week-row ${activeDay === i ? "on" : ""}`} onClick={() => setActiveDay(i)}>
                <span className="week-day">{d}</span>
                <span className="week-name">{w ? w.name : <span className="faint">Отдых</span>}</span>
                {w && <span className="week-count">{w.exercises.length} упр.</span>}
              </button>
            );
          })}
        </div>
      </section>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Тренировка · ${editModal ?? ""}`}>
        <div className="form">
          <Field label="Название">
            <input value={workoutForm.name} onChange={(e) => setWorkoutForm((p) => ({ ...p, name: e.target.value }))} placeholder="Грудь + Трицепс" />
          </Field>
          <Field label="Заметки">
            <input value={workoutForm.notes} onChange={(e) => setWorkoutForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Необязательно" />
          </Field>

          <div className="form-block">
            <p className="form-title">Упражнения</p>
            {workoutForm.exercises.map((ex) => (
              <div key={ex.id} className="chip-row">
                <span>{ex.name}</span>
                <em>{ex.sets}×{ex.reps}</em>
                <button className="icon-btn" onClick={() => removeEx(ex.id)} aria-label="Убрать"><Icons.X /></button>
              </div>
            ))}
            <div className="new-ex">
              <input value={exForm.name} onChange={(e) => setExForm((p) => ({ ...p, name: e.target.value }))} placeholder="Новое упражнение" />
              <div className="grid2 tight-gap">
                <input type="number" value={exForm.sets} onChange={(e) => setExForm((p) => ({ ...p, sets: e.target.value }))} placeholder="Подходы" />
                <input type="number" value={exForm.reps} onChange={(e) => setExForm((p) => ({ ...p, reps: e.target.value }))} placeholder="Повторы" />
              </div>
              <Btn variant="secondary" small onClick={addEx}><Icons.Plus /> Добавить упражнение</Btn>
            </div>
          </div>

          <div className="form-actions">
            {workout && (
              <Btn variant="danger" onClick={() => { setWorkouts((p) => ({ ...p, [editModal]: null })); setEditModal(null); }}>
                <Icons.Trash />
              </Btn>
            )}
            <Btn onClick={saveWorkout} full>Сохранить</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
