// app/import.tsx
import React, { useContext, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListsContext, ListItem, Task } from "../context/ListsContext";

export default function ImportScreen() {
  // title en tasks komen uit de URL: gotogo://import?title=...&tasks=...
  const { title, tasks } = useLocalSearchParams<{
    title?: string;
    tasks?: string;
  }>();
  const router = useRouter();
  const { lists, setLists, tasksMap, setTasksMap } = useContext(ListsContext);

  useEffect(() => {
    if (title && tasks) {
      try {
        // Parse de takenlijst vanuit de URL
        const parsedTasks: Task[] = JSON.parse(
          decodeURIComponent(tasks as string)
        );
        // Genereer een unieke key voor deze gedeelde lijst
        const key = `shared-${Date.now()}`;
        // Maak een nieuw ListItem voor de context
        const newList: ListItem = {
          key,
          icon: "list",
          label: title as string,
          count: parsedTasks.length,
        };
        // Voeg de nieuwe lijst toe aan de bestaande lijsten
        setLists((prev) => [...prev, newList]);
        // Voeg de parsedTasks toe aan de tasksMap onder de nieuwe key
        setTasksMap((prev) => ({ ...prev, [key]: parsedTasks }));
        // Navigeer naar de detailpagina van de nieuwe lijst
        router.replace(`/list/${key}`);
      } catch (error) {
        console.error("Import fout:", error);
      }
    }
  }, [title, tasks]);

  return null; // Geen UI nodig, alleen redirect
}
