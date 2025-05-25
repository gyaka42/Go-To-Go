import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import "../global.css";
import { ListsProvider } from "../context/ListsContext";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";

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
        <Stack.Screen
          name="new-list"
          options={{
            title: "Nieuwe lijst",
            headerRight: () => (
              <View className="flex-row space-x-4 mr-4">
                <TouchableOpacity onPress={() => router.push("/new-list")}>
                  <Ionicons name="person-add-outline" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => console.log("Options")}>
                  <Ionicons
                    name="ellipsis-vertical-outline"
                    size={24}
                    color="#000"
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
      </Stack>
    </ListsProvider>
  );
}
