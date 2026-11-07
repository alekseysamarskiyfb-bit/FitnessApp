import { useState, useMemo } from "react";
import { FOODS_DB } from "../foods.js";
import { WEEKDAYS_FULL, MEAL_TYPES, todayWeekdayKey, uid, calcMealMacros } from "../utils.js";
import { Icons, PageHeader, Btn, Modal, Field, DayPills, Collapse, Num } from "../ui.jsx";

const r1 = (n) => Math.round(n * 10) / 10;

export default function NutritionPage({ nutrition, setNutrition }) {
  const [activeDay, setActiveDay] = useState(todayWeekdayKey());
  const [editModal, setEditModal] = useState(null);
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [gramsInput, setGramsInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState({});

  const dayName = WEEKDAYS_FULL[activeDay];
  const dayData = useMemo(() => nutrition[dayName] || {}, [nutrition, dayName]);

  const searchResults = useMemo(() => {
    if (!foodSearch.trim()) return [];
    const q = foodSearch.toLowerCase();
    return FOODS_DB.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [foodSearch]);

  const preview = useMemo(() => {
    if (!selectedFood || !gramsInput) return null;
    const g = parseFloat(gramsInput);
    if (!g || g <= 0) return null;
    const k = g / 100;
    return {
      calories: Math.round(selectedFood.calories * k),
      protein: r1(selectedFood.protein * k),
      fat: r1(selectedFood.fat * k),
      carbs: r1(selectedFood.carbs * k),
    };
  }, [selectedFood, gramsInput]);

  function openAddItem(mealType) {
    setSelectedFood(null); setFoodSearch(""); setGramsInput(""); setShowDropdown(false);
    setEditModal({ day: dayName, mealType, itemIndex: null });
  }
  function openEditItem(mealType, idx) {
    const item = dayData[mealType].items[idx];
    const food = FOODS_DB.find((f) => f.name === item.name) || {
      name: item.name, calories: item.calories ?? item.caloriesPer100g ?? 0,
      protein: item.protein ?? 0, fat: item.fat ?? 0, carbs: item.carbs ?? 0,
    };
    setSelectedFood(food); setFoodSearch(item.name); setGramsInput(String(item.grams)); setShowDropdown(false);
    setEditModal({ day: dayName, mealType, itemIndex: idx });
  }
  function saveItem() {
    if (!selectedFood || !gramsInput) return;
    const g = parseFloat(gramsInput);
    if (!g || g <= 0) return;
    const newItem = {
      id: uid(), name: selectedFood.name, grams: g,
      calories: selectedFood.calories, protein: selectedFood.protein, fat: selectedFood.fat, carbs: selectedFood.carbs,
      caloriesPer100g: selectedFood.calories,
    };
    setNutrition((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[editModal.day]) updated[editModal.day] = {};
      if (!updated[editModal.day][editModal.mealType]) updated[editModal.day][editModal.mealType] = { items: [] };
      if (editModal.itemIndex !== null) updated[editModal.day][editModal.mealType].items[editModal.itemIndex] = newItem;
      else updated[editModal.day][editModal.mealType].items.push(newItem);
      return updated;
    });
    setEditModal(null);
  }
  function deleteItem(mealType, idx) {
    setNutrition((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[editModal?.day || dayName][mealType].items.splice(idx, 1);
      return updated;
    });
    setEditModal(null);
  }

  const dayTotals = useMemo(() => {
    return MEAL_TYPES.reduce((acc, mt) => {
      const m = dayData[mt];
      if (!m) return acc;
      const macro = calcMealMacros(m.items);
      acc.calories += macro.calories; acc.protein += macro.protein; acc.fat += macro.fat; acc.carbs += macro.carbs;
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }, [dayData]);

  return (
    <div className="page">
      <PageHeader eyebrow="Недельный план" muted="Питание" strong="По дням" />

      <DayPills active={activeDay} onChange={setActiveDay} />

      <section className="card">
        <div className="row between">
          <span className="eyebrow muted-eyebrow">{dayName}</span>
          <Icons.Flame />
        </div>
        <div className="figure">
          <span className="display huge accent-text"><Num value={dayTotals.calories} /></span>
          <span className="unit">ккал</span>
        </div>
        <div className="stats3">
          {[["Белки", dayTotals.protein], ["Жиры", dayTotals.fat], ["Углеводы", dayTotals.carbs]].map(([l, v]) => (
            <div key={l}><span>{l}</span><b>{r1(v)} <small>г</small></b></div>
          ))}
        </div>
      </section>

      <section className="stack">
        {MEAL_TYPES.map((mt) => {
          const meal = dayData[mt] || { items: [] };
          const macros = calcMealMacros(meal.items);
          const open = !!expandedMeal[mt];
          return (
            <div key={mt} className="card card--flush">
              <button className="acc-head" onClick={() => setExpandedMeal((p) => ({ ...p, [mt]: !p[mt] }))}>
                <span className="acc-title">
                  <b>{mt}</b>
                  <small>{meal.items.length} прод. · Б {r1(macros.protein)} · Ж {r1(macros.fat)} · У {r1(macros.carbs)}</small>
                </span>
                <span className="acc-kcal"><b>{macros.calories}</b> ккал</span>
                <span className={`chev ${open ? "flip" : ""}`}><Icons.ChevronDown /></span>
              </button>
              <Collapse open={open}>
                <div className="acc-body">
                  {meal.items.map((item, idx) => {
                    const k = item.grams / 100;
                    const cal = Math.round(k * (item.calories ?? item.caloriesPer100g ?? 0));
                    return (
                      <div key={item.id} className="item-row">
                        <div className="item-text">
                          <b>{item.name}</b>
                          <small>{item.grams} г · Б {r1(k * (item.protein ?? 0))} · Ж {r1(k * (item.fat ?? 0))} · У {r1(k * (item.carbs ?? 0))}</small>
                        </div>
                        <span className="item-kcal">{cal}</span>
                        <button className="icon-btn" onClick={() => openEditItem(mt, idx)} aria-label="Изменить"><Icons.Edit /></button>
                      </div>
                    );
                  })}
                  {meal.items.length === 0 && <p className="empty-note">Пока пусто</p>}
                  <button className="add-row" onClick={() => openAddItem(mt)}><Icons.Plus /> Добавить продукт</button>
                </div>
              </Collapse>
            </div>
          );
        })}
      </section>

      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.itemIndex !== null ? "Изменить продукт" : "Добавить продукт"}
      >
        <div className="form">
          <div className="dropdown-wrap">
            <Field label="Продукт">
              <input
                value={foodSearch}
                onChange={(e) => { setFoodSearch(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedFood(null); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Начните вводить название"
              />
            </Field>
            {showDropdown && searchResults.length > 0 && (
              <div className="dropdown">
                {searchResults.map((food) => (
                  <button
                    key={food.name}
                    className="dropdown-item"
                    onClick={() => { setSelectedFood(food); setFoodSearch(food.name); setShowDropdown(false); }}
                  >
                    <b>{food.name}</b>
                    <small>{food.calories} ккал · Б {food.protein} · Ж {food.fat} · У {food.carbs} (на 100 г)</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field label="Количество, г">
            <input type="number" value={gramsInput} onChange={(e) => setGramsInput(e.target.value)} placeholder="250" min="1" />
          </Field>

          {preview && (
            <div className="preview">
              {[["Ккал", preview.calories], ["Белки", `${preview.protein} г`], ["Жиры", `${preview.fat} г`], ["Углев.", `${preview.carbs} г`]].map(([l, v]) => (
                <div key={l}><span>{l}</span><b>{v}</b></div>
              ))}
            </div>
          )}

          <div className="form-actions">
            {editModal?.itemIndex !== null && (
              <Btn variant="danger" onClick={() => deleteItem(editModal.mealType, editModal.itemIndex)}><Icons.Trash /> Удалить</Btn>
            )}
            <Btn onClick={saveItem} full disabled={!selectedFood || !gramsInput}>Сохранить</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
