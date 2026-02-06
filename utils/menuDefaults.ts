/* eslint-disable react-hooks/rules-of-hooks */
import { ListItem, useAppStore } from "../store/appStore";

export function useBaseMenu(): ListItem[] {
  const t = useAppStore((s) => s.t);
  const lists = useAppStore((s) => s.lists);

  const withReminders = (key: string) =>
    lists.find((l) => l.key === key)?.reminders;

  return [
    {
      key: "mijnDag",
      icon: "person",
      label: t("myDay"),
      count: null,
      reminders: withReminders("mijnDag"),
    },
    {
      key: "belangrijk",
      icon: "star-outline",
      label: t("important"),
      count: null,
      reminders: withReminders("belangrijk"),
    },
    {
      key: "gepland",
      icon: "event-available",
      label: t("planned"),
      count: null,
      reminders: withReminders("gepland"),
    },
    {
      key: "taken",
      icon: "check-circle-outline",
      label: t("tasks"),
      count: null,
      reminders: withReminders("taken"),
    },
  ];
}
