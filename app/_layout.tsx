import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import "../global.css";
import { ListsProvider } from "../context/ListsContext";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FDA4AF",
    elevation: 0,
  },
});

export default function Layout() {
  useEffect(() => {
    // Zodra dit layout-component mount, hide de splash
    SplashScreen.hideAsync();
  }, []);

  return (
    <ListsProvider>
      <Stack
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: "#000",
          headerTitleStyle: { fontSize: 18, fontWeight: "600" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: "Go-To-Go" }} />
        <Stack.Screen name="new-list" options={{ title: "Nieuwe lijst" }} />
        <Stack.Screen name="search" options={{ title: "Zoeken" }} />
      </Stack>
    </ListsProvider>
  );
}
