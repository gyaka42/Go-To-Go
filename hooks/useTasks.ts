import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Task } from "../context/ListsContext";

export default function useTasks(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  listKey?: string
) {
  const scheduleReminder = useCallback(
    async (
      title: string,
      date: Date,
      listKey?: string
    ): Promise<string | undefined> => {
      const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
      if (seconds <= 0) return;
      try {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Taakherinnering",
            body: title,
            sound: "default",
            data: { listKey },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
          },
        });
        return identifier;
      } catch (err) {
        console.error("Kon herinnering niet plannen:", err);
      }
    },
    []
  );

  const addTask = useCallback(
    async (title: string, dueDate: Date | null, listKey?: string) => {
      if (!title.trim()) return;
      let notificationId: string | undefined;
      if (dueDate) {
        notificationId = await scheduleReminder(title.trim(), dueDate, listKey);
      }
      const task: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        done: false,
        dueDate: dueDate || null,
        notificationId,
      };
      setTasks((prev) => [...prev, task]);
    },
    [setTasks, scheduleReminder]
  );

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            // if marking done, cancel its scheduled notification
            if (!t.done && t.notificationId) {
              Notifications.cancelScheduledNotificationAsync(t.notificationId);
            }
            return { ...t, done: !t.done };
          }
          return t;
        })
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        prev.forEach((t) => {
          if (t.id === id && t.notificationId) {
            Notifications.cancelScheduledNotificationAsync(t.notificationId);
          }
        });
        return prev.filter((t) => t.id !== id);
      });
    },
    [setTasks]
  );

  return { addTask, toggleTask, deleteTask };
}
