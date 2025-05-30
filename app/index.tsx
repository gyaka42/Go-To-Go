import { FlatList, View, Text } from "react-native";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "../components/BottomBar";
import MenuItem from "../components/MenuItem";
import Header from "../components/Header";
import { useFocusEffect } from "@react-navigation/native";
import { useContext, useState, useCallback } from "react";
import { ListsContext, ListItem } from "../context/ListsContext";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseMenu: ListItem[] = [
  { key: "mijnDag", icon: "weather-sunny", label: "Mijn dag", count: null },
  { key: "belangrijk", icon: "star-outline", label: "Belangrijk", count: 66 },
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

  const handlePress = (item) => {
    // navigeer naar detail of screen
    router.push(`/task/${item.key}`);
  };

  const { lists, setLists, tasksMap } = useContext(ListsContext);

  const [counts, setCounts] = useState<Record<string, number>>({});

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
          return [k, arr.length];
        })
      ).then((entries) => setCounts(Object.fromEntries(entries)));
    }, [lists])
  );

  const deleteList = (key: string) => {
    setLists((prev) => prev.filter((l) => l.key !== key));
  };

  const combined = [...baseMenu, ...lists].map((item) => {
    const customTasks = tasksMap[item.key];
    return {
      ...item,
      count:
        customTasks !== undefined
          ? customTasks.length // direct uit context voor custom lijsten
          : counts[item.key] ?? null, // fallback naar AsyncStorage voor built‐ins
    };
  });

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-gray-50">
      <Header
        username="Gökhan Yaka"
        avatarSource={require("../assets/avatar.png")}
        onSearch={() => router.push("/search")}
      />

      <FlatList
        data={combined}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          // Only allow delete for user-created lists (not baseMenu)
          const isCustom = lists.find((l) => l.key === item.key) != null;
          return (
            <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
              {/* Icon + label only */}
              <View className="flex-1">
                <MenuItem
                  iconName={item.icon}
                  label={item.label}
                  onPress={() => router.push(`/list/${item.key}`)}
                  count={undefined}
                />
              </View>
              {/* Delete icon for custom lists */}
              {isCustom && (
                <TouchableOpacity
                  onPress={() => deleteList(item.key)}
                  className="p-2 ml-2"
                >
                  <MaterialIcons name="delete" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              {/* Manual badge, swapped to right of delete icon */}
              {item.count != null && (
                <View className="bg-blue-500 rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-xs font-semibold text-white">
                    {item.count}
                  </Text>
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
