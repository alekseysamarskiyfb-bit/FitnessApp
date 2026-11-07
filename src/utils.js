import { useState, useCallback } from "react";

// ─── УТИЛИТЫ И ДАННЫЕ ПО УМОЛЧАНИЮ ───────────────────────────────────────────
// ─── УТИЛИТЫ ──────────────────────────────────────────────────────────────────

export const today = () => {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
export const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
};
export const weekdayIndex = () => new Date().getDay();
export const DAYS = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
export const DAYS_FULL = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
export const WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
export const WEEKDAYS_FULL = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
export const MEAL_TYPES = ["Завтрак","Обед","Перекус","Ужин"];

export function todayWeekdayKey() {
  const d = new Date().getDay();
  const map = [6,0,1,2,3,4,5];
  return map[d];
}

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch { return initial; }
  });
  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* localStorage недоступен — работаем без сохранения */ }
      return next;
    });
  }, [key]);
  return [val, set];
}

export function uid() { return Math.random().toString(36).slice(2, 9); }

export const DEFAULT_ROUTINE = [
  { id: uid(), title: "Подъём", time: "07:00", type: "generic", notes: "" },
  { id: uid(), title: "Выпить воды", time: "07:10", type: "generic", notes: "500 мл" },
  { id: uid(), title: "Завтрак", time: "09:00", type: "meal", mealType: "Завтрак", notes: "" },
  { id: uid(), title: "Обед", time: "13:00", type: "meal", mealType: "Обед", notes: "" },
  { id: uid(), title: "Перекус", time: "16:00", type: "meal", mealType: "Перекус", notes: "" },
  { id: uid(), title: "Тренировка", time: "18:00", type: "workout", notes: "" },
  { id: uid(), title: "Ужин", time: "20:00", type: "meal", mealType: "Ужин", notes: "" },
  { id: uid(), title: "Сон", time: "23:00", type: "generic", notes: "" },
];

export const DEFAULT_NUTRITION = WEEKDAYS_FULL.reduce((acc, day) => {
  acc[day] = {
    "Завтрак": { items: [
      { id: uid(), name: "Овсянка (варёная)",   grams: 80,  calories: 71,  protein: 2.5, fat: 1.5, carbs: 12 },
      { id: uid(), name: "Молоко 1.5%",         grams: 200, calories: 44,  protein: 3,   fat: 1.5, carbs: 5  },
    ]},
    "Обед": { items: [
      { id: uid(), name: "Куриная грудка (варёная)", grams: 250, calories: 165, protein: 31,  fat: 3.6, carbs: 0  },
      { id: uid(), name: "Рис белый (варёный)",      grams: 150, calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
      { id: uid(), name: "Брокколи",                 grams: 150, calories: 34,  protein: 2.8, fat: 0.4, carbs: 7  },
    ]},
    "Перекус": { items: [
      { id: uid(), name: "Творог 5%", grams: 200, calories: 121, protein: 17,  fat: 5,   carbs: 1.8 },
    ]},
    "Ужин": { items: [
      { id: uid(), name: "Лосось (запечённый)", grams: 200, calories: 206, protein: 20, fat: 13, carbs: 0 },
      { id: uid(), name: "Брокколи",            grams: 150, calories: 34,  protein: 2.8, fat: 0.4, carbs: 7 },
    ]},
  };
  return acc;
}, {});

export const DEFAULT_WORKOUTS = {
  "Понедельник": { name: "Грудь + Трицепс", notes: "", exercises: [{ id: uid(), name: "Жим лёжа", sets: 4, reps: 10 }, { id: uid(), name: "Наклонный жим", sets: 4, reps: 10 }, { id: uid(), name: "Разводка", sets: 3, reps: 12 }, { id: uid(), name: "Отжимания на брусьях", sets: 3, reps: 15 }, { id: uid(), name: "Трицепс на блоке", sets: 3, reps: 12 }] },
  "Среда": { name: "Спина + Бицепс", notes: "", exercises: [{ id: uid(), name: "Подтягивания", sets: 4, reps: 8 }, { id: uid(), name: "Тяга штанги", sets: 4, reps: 10 }, { id: uid(), name: "Тяга блока", sets: 3, reps: 12 }, { id: uid(), name: "Сгибания на бицепс", sets: 3, reps: 12 }] },
  "Пятница": { name: "Ноги + Плечи", notes: "", exercises: [{ id: uid(), name: "Приседания", sets: 4, reps: 10 }, { id: uid(), name: "Жим ногами", sets: 4, reps: 12 }, { id: uid(), name: "Жим гантелей вверх", sets: 3, reps: 12 }, { id: uid(), name: "Разводка плеч", sets: 3, reps: 15 }] },
  "Вторник": null, "Четверг": null, "Суббота": null, "Воскресенье": null,
};

export function calcMealCal(items) {
  return Math.round(items.reduce((s, i) => {
    if (i.calories !== undefined) return s + (i.grams * i.calories / 100);
    return s + (i.grams * (i.caloriesPer100g || 0) / 100);
  }, 0));
}

export function calcMealMacros(items) {
  const result = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  for (const i of items) {
    const k = i.grams / 100;
    result.calories += (i.calories ?? i.caloriesPer100g ?? 0) * k;
    result.protein  += (i.protein ?? 0) * k;
    result.fat      += (i.fat ?? 0) * k;
    result.carbs    += (i.carbs ?? 0) * k;
  }
  return {
    calories: Math.round(result.calories),
    protein:  Math.round(result.protein * 10) / 10,
    fat:      Math.round(result.fat * 10) / 10,
    carbs:    Math.round(result.carbs * 10) / 10,
  };
}
