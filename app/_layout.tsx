// app/_layout.tsx
import React, { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import { ListsProvider } from "../context/ListsContext";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as ImagePicker from "expo-image-picker";

// Houd splash actief totdat we permissions geregeld hebben
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const scheme = useColorScheme();
  const router = useRouter();

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

      // Handle taps on scheduled notifications
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { listKey } = response.notification.request.content.data;
        if (listKey) {
          router.push(`/list/${listKey}`);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ListsProvider>
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
            options={{ title: "Go-To-Go", headerTitleAlign: "center" }}
          />
          <Stack.Screen name="new-list" options={{ title: "Nieuwe lijst" }} />
          <Stack.Screen name="search" options={{ title: "Zoeken" }} />
        </Stack>
      </ListsProvider>
    </GestureHandlerRootView>
  );
}
