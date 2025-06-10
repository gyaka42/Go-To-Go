// app/_layout.tsx
import React, { useEffect, useContext } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as ImagePicker from "expo-image-picker";
import { ThemeProvider, ThemeContext } from "../context/ThemeContext";
import { ListsProvider } from "../context/ListsContext";
import { LanguageProvider } from "../context/LanguageContext";
import { useLanguage } from "../context/LanguageContext";

// Houd splash actief totdat we permissions geregeld hebben
SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { scheme } = useContext(ThemeContext);
  const { t } = useLanguage();
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
          // Pop all the way back to the root screen
          while (router.canGoBack()) {
            router.back();
          }
          // Then navigate to the specific list
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
        options={{ title: t("homeTitle"), headerTitleAlign: "center" }}
      />
      <Stack.Screen name="new-list" options={{ title: t("newListTitle") }} />
      <Stack.Screen name="search" options={{ title: t("searchTitle") }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <ListsProvider>
            <InnerLayout />
          </ListsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
