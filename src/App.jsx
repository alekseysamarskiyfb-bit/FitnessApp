import { useState } from "react";
import {
  useLocalStorage, DEFAULT_ROUTINE, DEFAULT_NUTRITION, DEFAULT_WORKOUTS,
} from "./utils.js";
import { Icons } from "./ui.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import NutritionPage from "./pages/NutritionPage.jsx";
import WorkoutsPage from "./pages/WorkoutsPage.jsx";
import WeightPage from "./pages/WeightPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const NAV = [
  { id: "today", label: "Сегодня", Icon: Icons.Home, Page: TodayPage },
  { id: "nutrition", label: "Питание", Icon: Icons.Food, Page: NutritionPage },
  { id: "workouts", label: "Тренинг", Icon: Icons.Dumbbell, Page: WorkoutsPage },
  { id: "weight", label: "Вес", Icon: Icons.Scale, Page: WeightPage },
  { id: "settings", label: "Ещё", Icon: Icons.Sliders, Page: SettingsPage },
];

export default function App() {
  const [tab, setTab] = useState("today");
  const [routine, setRoutine] = useLocalStorage("fitness_routine", DEFAULT_ROUTINE);
  const [nutrition, setNutrition] = useLocalStorage("fitness_nutrition", DEFAULT_NUTRITION);
  const [workouts, setWorkouts] = useLocalStorage("fitness_workouts", DEFAULT_WORKOUTS);
  const [weightHistory, setWeightHistory] = useLocalStorage("fitness_weight", []);
  const [completions, setCompletions] = useLocalStorage("fitness_completions", {});
  const [goals, setGoals] = useLocalStorage("fitness_goals", { calories: 2000, protein: 150, fat: 70, carbs: 250 });
  const [waterData, setWaterData] = useLocalStorage("fitness_water", {});
  const [waterGoal, setWaterGoal] = useLocalStorage("fitness_water_goal", 2500);

  const activeIndex = NAV.findIndex((n) => n.id === tab);
  const { Page } = NAV[activeIndex];

  function go(id) {
    setTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app">
      {/* key перезапускает анимацию появления при смене вкладки */}
      <main key={tab}>
        <Page
          routine={routine} setRoutine={setRoutine}
          nutrition={nutrition} setNutrition={setNutrition}
          workouts={workouts} setWorkouts={setWorkouts}
          weightHistory={weightHistory} setWeightHistory={setWeightHistory}
          completions={completions} setCompletions={setCompletions}
          goals={goals} setGoals={setGoals}
          waterData={waterData} setWaterData={setWaterData}
          waterGoal={waterGoal} setWaterGoal={setWaterGoal}
          go={go}
        />
      </main>

      <nav className="nav" aria-label="Навигация">
        <div className="nav-inner">
          <span className="nav-pill" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-btn ${tab === id ? "on" : ""}`} onClick={() => go(id)} aria-current={tab === id ? "page" : undefined}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
