// hooks/useInitializeApp.ts
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  useAppStore,
  ThemeMode,
  Lang,
  ListItem,
  Task,
} from "../store/appStore";

interface InitData {
  lists: ListItem[];
  tasksMap: Record<string, Task[]>;
  mode: string | null;
  lang: string | null;
}

export default function useInitializeApp() {
  const setLists = useAppStore((s) => s.setLists);
  const setTasksMap = useAppStore((s) => s.setTasksMap);
  const setMode = useAppStore((s) => s.setMode);
  const setLang = useAppStore((s) => s.setLang);

  const { data } = useQuery<InitData, Error>({
    queryKey: ["init"],
    queryFn: async (): Promise<InitData> => {
      const listsJson = await AsyncStorage.getItem("user_lists");
      const lists = listsJson ? JSON.parse(listsJson) : [];
      const tasksEntries = await Promise.all(
        lists.map(async (l: { key: string }) => {
          const json = await AsyncStorage.getItem(`todos_${l.key}`);
          return [l.key, json ? JSON.parse(json) : []] as [string, any[]];
        })
      );
      const mode = await AsyncStorage.getItem("@theme_mode");
      const lang = await AsyncStorage.getItem("lang");
      return { lists, tasksMap: Object.fromEntries(tasksEntries), mode, lang };
    },
  });

  useEffect(() => {
    if (!data) return;

    const { lists, tasksMap, mode, lang } = data;

    const currentLists = useAppStore.getState().lists;
    if (currentLists.length === 0 && Array.isArray(lists)) {
      setLists(lists);
    }

    const currentTasksMap = useAppStore.getState().tasksMap;
    if (Object.keys(currentTasksMap).length === 0 && tasksMap) {
      setTasksMap(tasksMap);
    }

    if (mode === "light" || mode === "dark" || mode === "system") {
      setMode(mode as ThemeMode);
    }

    if (
      lang === "en" ||
      lang === "nl" ||
      lang === "tr" ||
      lang === "de" ||
      lang === "es" ||
      lang === "fr"
    ) {
      setLang(lang as Lang);
    } else {
      const locale = Localization.locale || "";
      const langCode = locale.includes("-") ? locale.split("-")[0] : locale;
      // Fallback to 'en' if langCode is not supported
      const supported: Lang[] = ["en", "nl", "tr", "de", "es", "fr"];
      setLang(supported.includes(langCode as Lang) ? (langCode as Lang) : "en");
    }
  }, [data, setLists, setTasksMap, setMode, setLang]);

  const listsInStore = useAppStore((s) => s.lists);

  useEffect(() => {
    // Always persist, even when empty, so deleted custom lists don't come back.
    AsyncStorage.setItem("user_lists", JSON.stringify(listsInStore));
  }, [listsInStore]);

  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notification = response.notification;
        const listKey = notification.request.content.data?.listKey;
        const notifId = notification.request.identifier;
        if (listKey && notifId) {
          router.push({
            pathname: `/lists/${listKey}`,
            params: { notif: notifId },
          });
        }
      }
    );
    return () => {
      subscription.remove();
    };
  }, [router]);
}
