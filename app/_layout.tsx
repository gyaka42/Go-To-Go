// app/_layout.tsx
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as ImagePicker from "expo-image-picker";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "../store/appStore";
import useInitializeApp from "../hooks/useInitializeApp";
import { View, Text, Image } from "react-native";
import { RRule } from "rrule";
import logoOutline from "../assets/logo-outline.png";

// Houd splash actief totdat we permissions geregeld hebben
SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  useInitializeApp();
  const scheme = useAppStore((s) => s.scheme);
  const t = useAppStore((s) => s.t);
  const router = useRouter();

  const activeListKey = useAppStore((s) => s.activeListKey);
  const tasksMap = useAppStore((s) => s.tasksMap);
  const tasks = tasksMap[activeListKey ?? ""] ?? [];
  const setTasksMap = useAppStore((s) => s.setTasksMap);

  useEffect(() => {
    if (!activeListKey) return;

    const hadHighlight = tasks.some((t) => t.highlight);
    if (hadHighlight) {
      const updated = tasks.map((t) =>
        t.highlight ? { ...t, highlight: false } : t
      );
      setTasksMap({
        ...useAppStore.getState().tasksMap,
        [activeListKey]: updated,
      });
    }
  }, [activeListKey, tasks]);

  useEffect(() => {
    const handledNotifIds = new Set<string>();
    (async () => {
      // Vraag eerst notificatie-permissies
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      // Stel handler in zodat lokale notificaties ook echt getoond worden
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Handle taps on scheduled notifications with robust logging
      Notifications.addNotificationResponseReceivedListener((response) => {
        const notifId = response.notification.request.identifier;
        if (handledNotifIds.has(notifId)) return;
        handledNotifIds.add(notifId);

        __DEV__ && console.log(
          "🔔 Notificatie response ontvangen:",
          JSON.stringify(response, null, 2)
        );

        const { notification } = response;
        const { title, body, data } = notification.request.content;

        __DEV__ && console.log("🔔 Titel:", title);
        __DEV__ && console.log("🔔 Body:", body);
        __DEV__ && console.log("🔔 Data:", data);

        const { listKey } = data;
        if (listKey) {
          // Replace current route instead of pushing a new one,
          // so you don't get duplicate list screens in the history.
          router.replace(`/list/${listKey}?notif=${notifId}`);
        }
      });

      // Plan volgende herhaling zodra een notificatie wordt ontvangen
      Notifications.addNotificationReceivedListener(async (notification) => {
        const notifId = notification.request.identifier;
        const listKeyData = notification.request.content.data?.listKey as
          | string
          | undefined;
        const { tasksMap, setTasksMap, findListLabel, t } =
          useAppStore.getState();

        for (const [key, tasks] of Object.entries(tasksMap)) {
          const idx = tasks.findIndex((t) => t.notificationId === notifId);
          if (idx !== -1) {
            const task = tasks[idx];
            if (!task.recurrence || !task.dueDate) break;

            // For simple repeating triggers (daily/weekly/monthly interval=1),
            // Expo handles repeats automatically; don't schedule extra.
            const freq = task.recurrence.freq;
            const interval = task.recurrence.interval ?? 1;
            const isSimpleDaily = freq === RRule.DAILY && interval === 1;
            const isSimpleWeekly =
              freq === RRule.WEEKLY &&
              interval === 1 &&
              Array.isArray(task.recurrence.byweekday) &&
              task.recurrence.byweekday.length === 1;
            const isSimpleMonthly = freq === RRule.MONTHLY && interval === 1;
            if (isSimpleDaily || isSimpleWeekly || isSimpleMonthly) break;

            const rule = new RRule({
              dtstart: new Date(task.dueDate),
              ...task.recurrence,
              count: 2,
            });
            const allDates = rule.all();
            if (allDates.length >= 2) {
              const nextDate = allDates[1];
              const listLabel =
                findListLabel?.(listKeyData || key) ?? "Unknown list";
              const newId = await Notifications.scheduleNotificationAsync({
                content: {
                  title: t("taskReminderTitle"),
                  body: t("taskReminderBody", {
                    task: task.title,
                    list: listLabel,
                  }),
                  sound: true,
                  data: { listKey: key },
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: nextDate,
                },
              });

              const updatedTask = {
                ...task,
                dueDate: nextDate,
                notificationId: newId,
              };
              const updatedTasks = tasks.map((t, i) =>
                i === idx ? updatedTask : t
              );
              setTasksMap({ ...tasksMap, [key]: updatedTasks });
            }
            break;
          }
        }
      });

      // Vraag permissie voor fotos (image picker)
      const { status: imageStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (imageStatus !== "granted") {
        alert(
          "Toestemming voor foto's is nodig om de avatar te kunnen wijzigen."
        );
      }

      // Én nu mogen we de splash verbergen
      // Wacht nog 1 seconde voordat we de splash verbergen
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await SplashScreen.hideAsync();
    })();
  }, []);

  return (
    <Stack
      screenOptions={{
        // dynamische header-kleur
        headerStyle: {
          backgroundColor:
            scheme === "dark"
              ? "#111" /* donker roze alternatief */
              : "#FDA4AF",
        },
        headerTintColor: scheme === "dark" ? "#FFF" : "#000",
        headerTitleStyle: { fontSize: 18, fontWeight: "600" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={logoOutline}
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: "transparent",
                  tintColor: scheme === "dark" ? "#FDA4AF" : "#000",
                  marginRight: 6,
                  resizeMode: "contain",
                }}
              />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: scheme === "dark" ? "#FFF" : "#000",
                  letterSpacing: 1.5,
                }}
              >
                {t("homeTitle")}
              </Text>
            </View>
          ),
          headerTitleAlign: "center",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="new-list"
        options={{ title: t("newListTitle"), headerBackVisible: false }}
      />
      <Stack.Screen
        name="search"
        options={{ title: t("searchTitle"), headerBackVisible: false }}
      />
      <Stack.Screen
        name="list/[key]"
        options={({ route }: any) => ({
          title: route.params.key,
          headerBackTitleVisible: true,
        })}
      />
    </Stack>
  );
}

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <InnerLayout />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
