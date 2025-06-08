// context/ListsContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Type voor een losse taak
export interface Task {
  id: string;
  title: string;
  done: boolean;
  dueDate: Date | null;
}

// Type voor een lijst-item in de navigatie
export interface ListItem {
  key: string;
  icon: string;
  label: string;
  count: number | null;
}

// Context-type met nu ook tasksMap en setter daarvoor
export interface ListsContextType {
  lists: ListItem[];
  setLists: React.Dispatch<React.SetStateAction<ListItem[]>>;
  tasksMap: Record<string, Task[]>;
  setTasksMap: React.Dispatch<React.SetStateAction<Record<string, Task[]>>>;
}

export const ListsContext = createContext<ListsContextType>({
  lists: [],
  setLists: () => {},
  tasksMap: {},
  setTasksMap: () => {},
});

interface ListsProviderProps {
  children: ReactNode;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  dueDate: Date | null;
  notificationId?: string;
}

export function ListsProvider({ children }: ListsProviderProps) {
  const [lists, setLists] = useState<ListItem[]>([]);
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>({});

  // Laad opgeslagen lijsten
  useEffect(() => {
    AsyncStorage.getItem("user_lists")
      .then((json) => {
        const savedLists = json ? JSON.parse(json) : [];
        setLists(savedLists);
      })
      .catch(() => {});
  }, []);

  // Sla lijsten op
  useEffect(() => {
    AsyncStorage.setItem("user_lists", JSON.stringify(lists)).catch(() => {});
  }, [lists]);

  // **Laad per-lijst taken alleen als die key nog niet in tasksMap staat**
  useEffect(() => {
    lists.forEach((l) => {
      if (!(l.key in tasksMap)) {
        const storageKey = `todos_${l.key}`;
        AsyncStorage.getItem(storageKey)
          .then((json) => {
            const saved = json ? JSON.parse(json) : [];
            setTasksMap((prev) => ({ ...prev, [l.key]: saved }));
          })
          .catch(() => {});
      }
    });
  }, [lists, tasksMap]);

  // Sla per-lijst taken op wanneer tasksMap verandert
  useEffect(() => {
    Object.entries(tasksMap).forEach(([key, tasks]) => {
      AsyncStorage.setItem(`todos_${key}`, JSON.stringify(tasks)).catch(
        () => {}
      );
    });
  }, [tasksMap]);

  return (
    <ListsContext.Provider value={{ lists, setLists, tasksMap, setTasksMap }}>
      {children}
    </ListsContext.Provider>
  );
}
