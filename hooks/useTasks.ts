import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Task, useAppStore } from "../store/appStore";
import { RRule, Options as RRuleOptions, Weekday } from "rrule";

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
      listKey?: string,
      recurrence?: Partial<RRuleOptions>
    ): Promise<string | undefined> => {
      const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
      if (seconds <= 0) return;

      // ✅ Get list name for body text
      const { findListLabel, t } = useAppStore.getState();
      const listLabel = findListLabel?.(listKey) ?? "Unknown list";

      try {
        let trigger: Notifications.NotificationTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        };

        if (recurrence) {
          const freq = recurrence.freq;
          const interval = recurrence.interval ?? 1;
          if (freq === RRule.DAILY && interval === 1) {
            trigger = {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour: date.getHours(),
              minute: date.getMinutes(),
              repeats: true,
            };
          } else if (
            freq === RRule.WEEKLY &&
            interval === 1 &&
            Array.isArray(recurrence.byweekday) &&
            recurrence.byweekday.length === 1
          ) {
            const rruleDay = recurrence.byweekday[0];
            let weekdayIdx: number;
            if (typeof rruleDay === "number") {
              weekdayIdx = rruleDay;
            } else if (typeof rruleDay === "string") {
              const wk = (RRule as any)[rruleDay.toUpperCase()] as Weekday;
              weekdayIdx = wk.weekday;
            } else {
              weekdayIdx = (rruleDay as Weekday).weekday;
            }
            const weekday = ((weekdayIdx + 1) % 7) + 1; // rrule 0=Mon
            trigger = {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              weekday,
              hour: date.getHours(),
              minute: date.getMinutes(),
              repeats: true,
            };
          } else if (freq === RRule.MONTHLY && interval === 1) {
            trigger = {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              day: date.getDate(),
              hour: date.getHours(),
              minute: date.getMinutes(),
              repeats: true,
            };
          }
        }
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: t("taskReminderTitle"),
            body: t("taskReminderBody", {
              task: title,
              list: listLabel,
            }),
            sound: "default",
            data: { listKey },
          },
          trigger,
        });
        return identifier;
      } catch (err) {
        console.error("Kon herinnering niet plannen:", err);
      }
    },
    []
  );

  const addTask = useCallback(
    async (
      title: string,
      dueDate: Date | null,
      tag: string | null,
      listKey?: string,
      recurrence?: Partial<RRuleOptions>
    ): Promise<Task | undefined> => {
      if (!title.trim()) return;

      let notificationId: string | undefined;
      if (dueDate) {
        notificationId = await scheduleReminder(
          title.trim(),
          dueDate,
          listKey,
          recurrence
        );
      }

      const task: Task = {
        id: Crypto.randomUUID(),
        title: title.trim(),
        done: false,
        dueDate: dueDate || null,
        notificationId,
        titleEditable: true,
        recurrence,
        listKey: listKey ?? "", // fallback to empty string if undefined
        tag: tag ?? null,
        ...(dueDate || recurrence ? { highlight: true } : {}),
      };
      __DEV__ && console.log("🆔 Nieuwe taak-ID:", task.id);
      __DEV__ && console.log("🔔 Gekoppelde notificatie-ID:", notificationId);
      setTasks((prev) => [...prev, task]);
      return task;
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
        __DEV__ && console.log("🎯 Scroll & highlight taak-ID na notificatie:", taskId);
        if (typeof onHighlightTask === "function") {
          try {
            onHighlightTask(taskId);
            __DEV__ && console.log("✅ onHighlightTask aangeroepen met:", taskId);
          } catch (e) {
            console.error("❌ Fout bij onHighlightTask:", e);
          }
        } else {
          __DEV__ && console.warn(
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
      __DEV__ && console.log("🔧 setPendingNotificationId aangeroepen met ID:", id);
      if (id) {
        pendingNotificationRef.current = id;
        setRefreshTrigger((r) => r + 1); // dwing herberekening af
      }
    },
  };
}
