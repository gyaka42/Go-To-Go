/* eslint-disable react-hooks/rules-of-hooks */
import { ListItem } from "../context/ListsContext";
import { useLanguage } from "../context/LanguageContext";

export function useBaseMenu(): ListItem[] {
  const { t } = useLanguage();

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
