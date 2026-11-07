import { useState } from "react";
import { MEAL_TYPES, uid } from "../utils.js";
import { Icons, PageHeader, Btn, Modal, Field } from "../ui.jsx";

function GoalRow({ label, hint, value, onChange, placeholder, unit }) {
  return (
    <label className="goal-row">
      <span className="goal-text">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <span className="unit-input">
        <input type="number" min="0" value={value || ""} onChange={onChange} placeholder={placeholder} />
        <em>{unit}</em>
      </span>
    </label>
  );
}

const EMPTY_FORM = { title: "", time: "08:00", type: "generic", mealType: "Завтрак", notes: "" };
const TYPE_LABEL = { generic: "Задача", meal: "Приём пищи", workout: "Тренировка" };

export default function SettingsPage({
  routine, setRoutine, weightHistory, setWeightHistory, nutrition, setNutrition,
  workouts, setWorkouts, goals, setGoals, waterGoal, setWaterGoal, waterData, setWaterData,
  completions, setCompletions,
}) {
  const [addModal, setAddModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // null | "ok" | "err"

  function openAdd() { setForm(EMPTY_FORM); setEditTask(null); setAddModal(true); }
  function openEdit(task) { setForm({ ...task }); setEditTask(task.id); setAddModal(true); }
  function saveTask() {
    if (!form.title && form.type === "generic") return;
    if (editTask) setRoutine((p) => p.map((t) => (t.id === editTask ? { ...t, ...form } : t)));
    else setRoutine((p) => [...p, { ...form, id: uid() }]);
    setAddModal(false);
  }
  function deleteTask(id) { setRoutine((p) => p.filter((t) => t.id !== id)); }

  function exportData() {
    const data = {
      routine, nutrition, workouts, weightHistory, goals, waterGoal, waterData, completions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fitness-backup.json"; a.click();
  }

  function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.routine) setRoutine(data.routine);
        if (data.nutrition) setNutrition(data.nutrition);
        if (data.workouts) setWorkouts(data.workouts);
        if (data.weightHistory) setWeightHistory(data.weightHistory);
        if (data.goals) setGoals(data.goals);
        if (data.waterGoal !== undefined) setWaterGoal(data.waterGoal);
        if (data.waterData) setWaterData(data.waterData);
        if (data.completions) setCompletions(data.completions);
        setImportStatus("ok");
      } catch {
        setImportStatus("err");
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const sorted = [...routine].sort((a, b) => a.time.localeCompare(b.time));
  const setGoal = (key) => (e) => setGoals((p) => ({ ...p, [key]: parseInt(e.target.value) || 0 }));

  return (
    <div className="page">
      <PageHeader eyebrow="Цели и данные" muted="Настройки" strong="Под себя" />

      <section>
        <h2 className="display section-title">Цели</h2>
        <div className="card list">
          <GoalRow label="Калории" hint="В день" value={goals.calories} onChange={setGoal("calories")} placeholder="2000" unit="ккал" />
          <GoalRow label="Белки" value={goals.protein} onChange={setGoal("protein")} placeholder="150" unit="г" />
          <GoalRow label="Жиры" value={goals.fat} onChange={setGoal("fat")} placeholder="70" unit="г" />
          <GoalRow label="Углеводы" value={goals.carbs} onChange={setGoal("carbs")} placeholder="250" unit="г" />
          <GoalRow label="Вода" hint="В день" value={waterGoal} onChange={(e) => setWaterGoal(parseInt(e.target.value) || 2500)} placeholder="2500" unit="мл" />
        </div>
      </section>

      <section>
        <div className="row between section-row">
          <h2 className="display section-title">Расписание</h2>
          <Btn small onClick={openAdd}><Icons.Plus /> Добавить</Btn>
        </div>
        <div className="card list">
          {sorted.map((task) => (
            <div key={task.id} className="sched-row">
              <span className="sched-time">{task.time}</span>
              <span className="sched-text">
                <b>{task.title || (task.type === "meal" ? task.mealType : "Тренировка")}</b>
                <small>{TYPE_LABEL[task.type]}</small>
              </span>
              <button className="icon-btn" onClick={() => openEdit(task)} aria-label="Изменить"><Icons.Edit /></button>
              <button className="icon-btn icon-btn--danger" onClick={() => deleteTask(task.id)} aria-label="Удалить"><Icons.Trash /></button>
            </div>
          ))}
          {sorted.length === 0 && <div className="empty"><b>Расписание пусто</b></div>}
        </div>
      </section>

      <section>
        <h2 className="display section-title">Данные</h2>
        <div className="card list">
          <div className="data-row">
            <span className="goal-text"><b>Экспорт</b><small>Скачать резервную копию</small></span>
            <Btn variant="secondary" small onClick={exportData}>Скачать</Btn>
          </div>
          <div className="data-row">
            <span className="goal-text">
              <b>Импорт</b>
              <small className={importStatus ? `status-${importStatus}` : ""}>
                {importStatus === "ok" ? "Данные загружены" : importStatus === "err" ? "Ошибка: неверный файл" : "Восстановить из копии"}
              </small>
            </span>
            <label className="btn btn--secondary btn--sm">
              Загрузить
              <input type="file" accept=".json,application/json" onChange={importData} hidden />
            </label>
          </div>
          <div className="data-row">
            <span className="goal-text"><b className="danger-text">Сбросить всё</b><small>Без возможности восстановления</small></span>
            <Btn variant="danger" small onClick={() => setConfirmReset(true)}>Сброс</Btn>
          </div>
        </div>
      </section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Сброс данных">
        <p className="muted modal-text">Все данные будут удалены безвозвратно. Вы уверены?</p>
        <div className="form-actions">
          <Btn variant="secondary" full onClick={() => setConfirmReset(false)}>Отмена</Btn>
          <Btn variant="danger" full onClick={() => { localStorage.clear(); window.location.reload(); }}>Удалить всё</Btn>
        </div>
      </Modal>

      <Modal open={addModal} onClose={() => setAddModal(false)} title={editTask ? "Изменить задачу" : "Новая задача"}>
        <div className="form">
          <Field label="Тип">
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="generic">Задача</option>
              <option value="meal">Приём пищи</option>
              <option value="workout">Тренировка</option>
            </select>
          </Field>
          {form.type === "generic" && (
            <Field label="Название">
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Выпить воды" />
            </Field>
          )}
          {form.type === "meal" && (
            <Field label="Приём пищи">
              <select value={form.mealType} onChange={(e) => setForm((p) => ({ ...p, mealType: e.target.value, title: e.target.value }))}>
                {MEAL_TYPES.map((mt) => <option key={mt}>{mt}</option>)}
              </select>
            </Field>
          )}
          <Field label="Время">
            <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
          </Field>
          <Field label="Заметки">
            <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Необязательно" />
          </Field>
          <div className="form-actions">
            {editTask && (
              <Btn variant="danger" onClick={() => { deleteTask(editTask); setAddModal(false); }}><Icons.Trash /></Btn>
            )}
            <Btn onClick={saveTask} full>Сохранить</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
