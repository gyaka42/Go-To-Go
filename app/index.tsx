// app/index.tsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import BottomBar from "../components/BottomBar";
import MenuItem from "../components/MenuItem";
import Header from "../components/Header";
import { useFocusEffect } from "@react-navigation/native";
import { ListsContext, ListItem } from "../context/ListsContext";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseMenu: ListItem[] = [
  { key: "mijnDag", icon: "weather-sunny", label: "Mijn dag", count: null },
  { key: "belangrijk", icon: "star-outline", label: "Belangrijk", count: null },
  {
    key: "gepland",
    icon: "calendar-blank-outline",
    label: "Gepland",
    count: null,
  },
  { key: "taken", icon: "check-circle-outline", label: "Taken", count: null },
];

export default function HomeScreen() {
  const router = useRouter();
  const { lists, setLists, tasksMap } = useContext(ListsContext);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Bij opstarten: laad eventueel eerder opgeslagen avatar‐URI uit AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("user_avatar").then((uri) => {
      if (uri) {
        setAvatarUri(uri);
      }
    });
  }, []);

  // Vraag permissie voor foto‐bibliotheek
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert(
          "Toestemming voor foto's is nodig om de avatar te kunnen wijzigen."
        );
      }
    })();
  }, []);

  // Functie: open galerij, laat gebruiker een foto kiezen, en sla URI op
  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // Gebruik hier “MediaTypeOptions” om met v16.1.4-typings te blijven werken:
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // De nieuwe API gebruikt 'canceled' i.p.v. 'cancelled',
      // en plaatst gekozen media in result.assets[0].uri
      if (!result.canceled && result.assets.length > 0) {
        const chosenUri = result.assets[0].uri;
        setAvatarUri(chosenUri);

        // Sla URI permanent op in AsyncStorage
        AsyncStorage.setItem("user_avatar", chosenUri).catch(() => {
          console.warn("Kon avatar-URI niet opslaan in AsyncStorage");
        });
      }
    } catch (err) {
      console.error("Fout bij openen galerij:", err);
    }
  };

  // Bereken badge‐counts (aantal taken per lijst) elke keer dat "lists" verandert
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

  const deleteList = (key: string) => {
    setLists((prev) => prev.filter((l) => l.key !== key));
  };

  // Combineer standaard‐ en eigen lijsten, met de “count” uit tasksMap of AsyncStorage
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

  return (
    <SafeAreaView
      // Zet hier expliciet alle veilige randen aan, inclusief 'top'
      edges={["left", "right"]}
      style={styles.container}
    >
      {/* Header met klikbare avatar */}
      <Header
        username="Gökhan Yaka"
        avatarSource={
          avatarUri ? { uri: avatarUri } : require("../assets/avatar.png")
        }
        onSearch={() => router.push("/search")}
        onAvatarPress={pickAvatar}
      />

      {/* Overzicht van alle lijsten */}
      <FlatList
        data={combined}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const isCustom = lists.some((l) => l.key === item.key);
          return (
            <View style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <MenuItem
                  iconName={item.icon}
                  label={item.label}
                  onPress={() => router.push(`/list/${item.key}`)}
                  count={undefined}
                />
              </View>
              {isCustom && (
                <TouchableOpacity
                  onPress={() => deleteList(item.key)}
                  style={styles.deleteIcon}
                >
                  <MaterialIcons name="delete" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              {item.count != null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.count}</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      <BottomBar onNewList={() => router.push("/new-list")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  deleteIcon: { padding: 8, marginLeft: 8 },
  badge: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
});
