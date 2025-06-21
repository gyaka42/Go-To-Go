/* eslint-disable react-hooks/rules-of-hooks */
import { ListItem, useAppStore } from "../store/appStore";

export function useBaseMenu(): ListItem[] {
  const t = useAppStore((s) => s.t);

  return [
    { key: "mijnDag", icon: "person", label: t("myDay"), count: null },
    {
      key: "belangrijk",
      icon: "star-outline",
      label: t("important"),
      count: null,
    },
    {
      key: "gepland",
      icon: "event-available",
      label: t("planned"),
      count: null,
    },
    {
      key: "taken",
      icon: "check-circle-outline",
      label: t("tasks"),
      count: null,
    },
  ];
}
