import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Task } from "../store/appStore";
import { RRule, Options as RRuleOptions } from "rrule";

export default function useTasks(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  listKey?: string,
  onHighlightTask?: (taskId: string) => void
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

  const scheduleNextOccurrence = useCallback(
    async (
      title: string,
      previousDate: Date,
      listKey?: string,
      recurrence?: Partial<RRuleOptions>
    ) => {
      if (!recurrence) return;
      const rule = new RRule({ dtstart: previousDate, ...recurrence });
      const nextDate = rule.after(previousDate);
      if (nextDate) {
        await scheduleReminder(title, nextDate, listKey);
      }
    },
    [scheduleReminder]
  );

  const addTask = useCallback(
    async (
      title: string,
      dueDate: Date | null,
      listKey?: string,
      recurrence?: Partial<RRuleOptions>
    ): Promise<Task | undefined> => {
      if (!title.trim()) return;

      let notificationId: string | undefined;
      if (dueDate) {
        notificationId = await scheduleReminder(title.trim(), dueDate, listKey);
      }

      const task: Task = {
        id: Crypto.randomUUID(),
        title: title.trim(),
        done: false,
        dueDate: dueDate || null,
        notificationId,
        titleEditable: true,
        recurrence,
        // highlight is optional on Task type, but set here for consistency
        ...(dueDate || recurrence ? { highlight: true } : {}),
      };
      console.log("🆔 Nieuwe taak-ID:", task.id);
      console.log("🔔 Gekoppelde notificatie-ID:", notificationId);
      setTasks((prev) => [...prev, task]);
      return task;
    },
    [setTasks, scheduleReminder, scheduleNextOccurrence]
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
            return {
              ...t,
              done: !t.done,
              titleEditable: t.done, // alleen weer bewerkbaar als je taak 'ontdaan' wordt
            };
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

  const pendingNotificationRef = useRef<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const highlightedTaskIds = useMemo(() => {
    if (!pendingNotificationRef.current) return [];

    const taskId = tasks.find(
      (task) =>
        task.notificationId === pendingNotificationRef.current &&
        (task.dueDate !== undefined || task.recurrence !== undefined)
    )?.id;

    return taskId ? [taskId] : [];
  }, [tasks, refreshTrigger]);

  useEffect(() => {
    if (highlightedTaskIds.length > 0 && onHighlightTask) {
      const taskId = highlightedTaskIds[0];

      // Wacht een korte periode om te zorgen dat FlatList is gerenderd
      requestAnimationFrame(() => {
        console.log("🎯 Scroll & highlight taak-ID na notificatie:", taskId);
        if (typeof onHighlightTask === "function") {
          try {
            onHighlightTask(taskId);
            console.log("✅ onHighlightTask aangeroepen met:", taskId);
          } catch (e) {
            console.error("❌ Fout bij onHighlightTask:", e);
          }
        } else {
          console.warn(
            "⚠️ onHighlightTask is geen functie:",
            typeof onHighlightTask
          );
        }
        pendingNotificationRef.current = null;
      });
    }
  }, [highlightedTaskIds, onHighlightTask]);

  return {
    addTask,
    toggleTask,
    deleteTask,
    highlightedTaskIds,
    pendingNotificationRef,
    setPendingNotificationId: (id: string) => {
      console.log("🔧 setPendingNotificationId aangeroepen met ID:", id);
      if (id) {
        pendingNotificationRef.current = id;
        setRefreshTrigger((r) => r + 1); // dwing herberekening af
      }
    },
  };
}
