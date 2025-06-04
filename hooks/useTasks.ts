import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Task } from "../context/ListsContext";

export default function useTasks(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) {
  const scheduleReminder = useCallback(async (title: string, date: Date) => {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    if (seconds <= 0) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: "Taakherinnering", body: title, sound: "default" },
        trigger: { type: "timeInterval" as any, seconds, repeats: false },
      });
    } catch (err) {
      console.error("Kon herinnering niet plannen:", err);
    }
  }, []);

  const addTask = useCallback(
    async (title: string, dueDate: Date | null) => {
      if (!title.trim()) return;
      const task: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        done: false,
        dueDate: dueDate || null,
      };
      setTasks((prev) => [...prev, task]);
      if (dueDate) await scheduleReminder(task.title, dueDate);
    },
    [setTasks, scheduleReminder]
  );

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [setTasks]
  );

  return { addTask, toggleTask, deleteTask };
}
