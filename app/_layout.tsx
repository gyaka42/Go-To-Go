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
        console.log(
          "🔔 Notificatie response ontvangen:",
          JSON.stringify(response, null, 2)
        );

        const { notification } = response;
        const { title, body, data } = notification.request.content;

        console.log("🔔 Titel:", title);
        console.log("🔔 Body:", body);
        console.log("🔔 Data:", data);

        const { listKey } = data;
        if (listKey) {
          const notifId = notification.request.identifier;
          // Replace current route instead of pushing a new one,
          // so you don't get duplicate list screens in the history.
          router.replace(`/list/${listKey}?notif=${notifId}`);
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
