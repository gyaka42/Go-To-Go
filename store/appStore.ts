import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import en from "../locales/en.json";
import nl from "../locales/nl.json";
import tr from "../locales/tr.json";
import de from "../locales/de.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import { Options as RRuleOptions } from "rrule";

export type Lang = "en" | "nl" | "tr" | "de" | "es" | "fr";

export interface Task {
  highlight?: boolean;
  id: string;
  title: string;
  done: boolean;
  dueDate: Date | null;
  notificationId?: string;
  titleEditable: boolean;
  recurrence?: Partial<RRuleOptions>;
  listKey: string;
}

export interface ListItem {
  key: string;
  icon: string;
  label: string;
  count: number | null;
}

const translations: Record<Lang, any> = { en, nl, tr, de, es, fr };

export type ThemeMode = ColorSchemeName | "light" | "dark" | "system";

interface AppState {
  lists: ListItem[];
  tasksMap: Record<string, Task[]>;
  mode: ThemeMode;
  scheme: ColorSchemeName;
  lang: Lang;
  pendingNotificationId: string | null;
  activeListKey: string | null;
  setActiveListKey: (key: string | null) => void;
  setLists: (lists: ListItem[]) => void;
  setTasksMap: (map: Record<string, Task[]>) => void;
  setMode: (mode: ThemeMode) => void;
  setLang: (lang: Lang) => void;
  setPendingNotificationId: (id: string | null) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  findListLabel: (key: string) => string;
  removeList: (key: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lists: [],
      tasksMap: {},
      mode: "system",
      scheme: Appearance.getColorScheme() || "light",
      lang: "nl",
      pendingNotificationId: null,
      activeListKey: null,
      setActiveListKey: (key) => set({ activeListKey: key }),
      setLists: (newLists) => {
        const current = get().lists;
        const combined = [...current, ...newLists];
        const unique = [...new Map(combined.map((l) => [l.key, l])).values()];
        set({ lists: unique });
      },
      setTasksMap: (map) => {
        // Verwijder highlight van alle taken bij het laden
        const cleanedMap: Record<string, Task[]> = {};

        for (const [listKey, tasks] of Object.entries(map)) {
          cleanedMap[listKey] = tasks.map((task) => ({
            ...task,
            highlight: false,
          }));
        }

        set({ tasksMap: cleanedMap });
        console.log("🧼 highlight reset uitgevoerd bij setTasksMap");
      },
      setMode: (mode) => {
        set({
          mode,
          scheme:
            mode === "system" ? Appearance.getColorScheme() || "light" : mode,
        });
      },
      setLang: (lang) => {
        set({ lang });
      },
      setPendingNotificationId: (id) => set({ pendingNotificationId: id }),
      t: (key, vars) => {
        let str = translations[get().lang][key] ?? key;
        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(`{{${k}}}`, v);
          });
        }
        return str;
      },
      findListLabel: (key: string) => {
        const list = get().lists.find((l) => l.key === key);
        return list?.label ?? "Unknown list";
      },
      removeList: (key) => {
        const currentLists = get().lists;
        const updatedLists = currentLists.filter((l) => l.key !== key);
        const currentTasksMap = get().tasksMap;
        const { [key]: removedTasks, ...restTasksMap } = currentTasksMap;
        set({ lists: updatedLists, tasksMap: restTasksMap });
      },
    }),
    {
      name: "app_store", // naam in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lists: state.lists,
        tasksMap: state.tasksMap,
        mode: state.mode,
        lang: state.lang,
        activeListKey: state.activeListKey,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setPendingNotificationId(null);
      },
    }
  )
);

// React to system color-scheme changes when user mode is 'system'
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode, setMode } = useAppStore.getState();
  if (mode === "system") {
    setMode("system");
  }
});
