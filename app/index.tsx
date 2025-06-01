// app/index.tsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
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
  { key: "mijnDag", icon: "person", label: "Mijn dag", count: null },
  { key: "belangrijk", icon: "star-outline", label: "Belangrijk", count: null },
  {
    key: "gepland",
    icon: "event-available",
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

  // Laad avatar-URI bij opstarten
  useEffect(() => {
    AsyncStorage.getItem("user_avatar").then((uri) => {
      if (uri) setAvatarUri(uri);
    });
  }, []);

  // Vraag permissie voor fotobibliotheek
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

  // Functie om avatar te kiezen
  const pickAvatar = async () => {
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
  };

  // Bereken badge-counts telkens als lijsten veranderen
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

  // Combineer baseMenu + custom lijsten
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
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      {/* Header met avatar en gebruikerstitel */}
      <Header
        username="Gökhan Yaka"
        avatarSource={
          avatarUri ? { uri: avatarUri } : require("../assets/avatar.png")
        }
        onSearch={() => router.push("/search")}
        onAvatarPress={pickAvatar}
      />

      {/* "Welkom" of korte intro onder de header */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welkom terug, Gökhan!</Text>
        <Text style={styles.subtitleText}>
          Hier zijn je to-do’s voor vandaag:
        </Text>
      </View>

      {/* Overzicht van alle lijsten, met cardstijl */}
      <FlatList
        data={combined}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const isCustom = lists.some((l) => l.key === item.key);
          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardContent}
                activeOpacity={0.7}
                onPress={() => router.push(`/list/${item.key}`)}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={28}
                  color="#3B82F6"
                  style={styles.cardIcon}
                />
                <Text style={styles.cardLabel}>{item.label}</Text>
                <View style={styles.spacer} />
                {item.count != null && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.count}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {isCustom && (
                <TouchableOpacity
                  onPress={() => deleteList(item.key)}
                  style={styles.deleteIcon}
                >
                  <MaterialIcons name="delete" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
      {/* Onderbalk met "Nieuwe lijst" knop */}
      <View
        style={{
          position: "absolute",
          bottom: 16, // zorgt dat de balk zweeft, 16pt vanaf onderkant
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
    // verwijderen van borderBottom
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
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    // Android elevation
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

  // BottomBar en header styling blijven gelijk
});
