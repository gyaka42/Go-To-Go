import { Stack } from "expo-router";
import { ListsProvider } from "../context/ListsContext";

export default function Layout() {
  return (
    <ListsProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#FDA4AF" },
          headerTintColor: "#000",
          headerTitleStyle: { fontSize: 18, fontWeight: "600" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ title: "Go-To-Go" }} />
        <Stack.Screen name="new-list" options={{ title: "Nieuwe lijst" }} />
        <Stack.Screen name="search" options={{ title: "Zoeken" }} />
      </Stack>
    </ListsProvider>
  );
}
