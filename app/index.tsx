// app/index.tsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import * as Notifications from "expo-notifications";
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import BottomBar from "../components/BottomBar";
import Header from "../components/Header";
import { useFocusEffect } from "@react-navigation/native";
import { ListsContext, ListItem, Task } from "../context/ListsContext";
import { baseMenu } from "../utils/menuDefaults";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const router = useRouter();
  const { lists, setLists, tasksMap, setTasksMap } = useContext(ListsContext);
  const scheme = useColorScheme(); // 'light' or 'dark'

  // 1️⃣ Hooks die we altijd willen aanroepen – óók voordat we weten of we isReady zijn:
  const [isReady, setIsReady] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem("list_order").then((json) => {
      if (json) setOrder(JSON.parse(json));
    });
  }, []);

  // 2️⃣ Effect: eerst controleren of er een “user_name” in AsyncStorage staat
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const name = await AsyncStorage.getItem("user_name");
        if (!name) {
          router.replace("/onboarding");
          return;
        }
        setUserName(name);
      } catch (err) {
        console.error("Fout bij ophalen user_name:", err);
      } finally {
        setIsReady(true);
      }
    };
    checkOnboarding();
  }, [router]);

  // 3️⃣ Effect: avatar-URI ophalen (onafhankelijk van isReady)
  useEffect(() => {
    AsyncStorage.getItem("user_avatar").then((uri) => {
      if (uri) setAvatarUri(uri);
    });
  }, []);

  // 5️⃣ useFocusEffect: badge‐counts telkens als lijsten veranderen
  useFocusEffect(
    useCallback(() => {
      const allKeys = [
        ...baseMenu.map((m) => m.key),
        ...lists.map((l) => l.key),
      ];
      Promise.all(
        allKeys.map(async (k) => {
          const json = await AsyncStorage.getItem(`todos_${k}`);
          const arr = json ? JSON.parse(json) : [];
          return [k, arr.length] as [string, number];
        })
      ).then((entries) => setCounts(Object.fromEntries(entries)));
    }, [lists])
  );

  // 6️⃣ Hook voor verwijderen van een custom lijstje
  const deleteList = (key: string) => {
    // Cancel any scheduled notifications for tasks in this list
    const tasksInList: Task[] = tasksMap[key] || [];
    tasksInList.forEach((t) => {
      if (t.notificationId) {
        Notifications.cancelScheduledNotificationAsync(t.notificationId);
      }
    });
    // Remove the list and its tasks
    setLists((prev) => prev.filter((l) => l.key !== key));
    setTasksMap((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // 7️⃣ Bereken welke items getoond worden op de home‐pagina
  const combined = [...baseMenu, ...lists].map((item) => {
    const customTasks = tasksMap[item.key];
    return {
      ...item,
      count:
        customTasks !== undefined
          ? customTasks.length
          : counts[item.key] ?? null,
    };
  });

  // Apply saved order, then append any new items
  const orderedCombined = [
    ...order.map((key) => combined.find((i) => i.key === key)).filter(Boolean),
    ...combined.filter((i) => !order.includes(i.key)),
  ];

  // ──────────────────────────────────────────────────────
  // 8️⃣ Pas na alle “unconditional hooks”
  //     doen we de early return voor de loader:
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 9️⃣ Eindelijk, zodra isReady === true, renderen we de Home‐UI:
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[
        styles.container,
        { backgroundColor: scheme === "dark" ? "#000" : "#F3F4F6" },
      ]}
    >
      {/* Header met avatar en gebruikersnaam */}
      <Header
        username={userName || "Gebruiker"}
        avatarSource={
          avatarUri ? { uri: avatarUri } : require("../assets/avatar.png")
        }
        onSearch={() => router.push("/search")}
        onAvatarPress={async () => {
          try {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
              const chosenUri = result.assets[0].uri;
              setAvatarUri(chosenUri);
              await AsyncStorage.setItem("user_avatar", chosenUri);
            }
          } catch (err) {
            console.error("Fout bij openen galerij:", err);
          }
        }}
      />

      {/* Welkomsttekst onder header */}
      <View
        style={[
          styles.welcomeContainer,
          { backgroundColor: scheme === "dark" ? "#222" : "#FFF" },
        ]}
      >
        <Text
          style={[
            styles.welcomeText,
            { color: scheme === "dark" ? "#FFF" : "#111827" },
          ]}
        >
          Welkom terug{userName ? `, ${userName}` : ""}!
        </Text>
        <Text
          style={[
            styles.subtitleText,
            { color: scheme === "dark" ? "#CCC" : "#6B7280" },
          ]}
        >
          Hier zijn je to-do’s voor vandaag:
        </Text>
      </View>

      {/* DraggableFlatList met alle kaarten */}
      <DraggableFlatList
        data={orderedCombined}
        keyExtractor={(item) => item.key}
        onDragEnd={({ data }) => {
          const newOrder = data.map((i) => i.key);
          setOrder(newOrder);
          AsyncStorage.setItem("list_order", JSON.stringify(newOrder));
        }}
        renderItem={({ item, drag, isActive }: RenderItemParams<ListItem>) => {
          const isCustom = lists.some((l) => l.key === item.key);
          return (
            <TouchableOpacity
              style={[
                styles.card,
                isActive && { opacity: 0.8 },
                { backgroundColor: scheme === "dark" ? "#333" : "#FFF" },
              ]}
              onLongPress={drag}
              activeOpacity={0.8}
              onPress={() => router.push(`/list/${item.key}`)}
            >
              <View style={styles.cardContent}>
                <MaterialIcons
                  name={item.icon as any}
                  size={28}
                  color="#3B82F6"
                  style={styles.cardIcon}
                />
                <Text
                  style={[
                    styles.cardLabel,
                    { color: scheme === "dark" ? "#FFF" : "#111827" },
                  ]}
                >
                  {item.label}
                </Text>
                <View style={styles.spacer} />
                {item.count != null && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.count}</Text>
                  </View>
                )}
              </View>
              {isCustom && (
                <TouchableOpacity
                  onPress={() => deleteList(item.key)}
                  style={styles.deleteIcon}
                >
                  <MaterialIcons name="delete" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Onderbalk met “Nieuwe lijst” knop */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <View style={{ width: "90%" }}>
          <BottomBar onNewList={() => router.push("/new-list")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  welcomeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: "#6B7280",
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 4,
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardLabel: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
  },
  badge: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  deleteIcon: {
    padding: 8,
    marginRight: 4,
  },
});
