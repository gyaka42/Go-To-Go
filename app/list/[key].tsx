// app/list/[key].tsx
import React, { useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListsContext } from "../../context/ListsContext";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { ListItem } from "../../context/ListsContext";
import { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";

const baseMenu: Array<ListItem> = [
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

export default function ListDetail() {
  const { key } = useLocalSearchParams();
  const listKey = Array.isArray(key) ? key[0] : key; // de lijst-key uit de URL
  const router = useRouter();
  const { lists, setLists, tasksMap, setTasksMap } = useContext(ListsContext);

  const isCustom = lists.some((l) => l.key === listKey);

  useEffect(() => {
    if (isCustom && !(listKey in tasksMap)) {
      setTasksMap((prev) => ({
        ...prev,
        [listKey]: [],
      }));
    }
  }, [isCustom, listKey, tasksMap, setTasksMap]);

  // Vind de metadata van deze lijst
  const listMeta = lists.find((l) => l.key === listKey) ||
    baseMenu.find((l) => l.key === listKey) || {
      label: "Onbekende lijst",
    };

  const [newTask, setNewTask] = useState("");

  type Task = { id: string; title: string; done: boolean };
  const [tasksState, setTasksState] = useState<Task[]>([]);

  useEffect(() => {
    if (!isCustom) {
      AsyncStorage.getItem(`todos_${listKey}`)
        .then((json) => {
          const saved = json ? JSON.parse(json) : [];
          setTasksState(saved);
          // Update context count for this list immediately
          setLists((prev) =>
            prev.map((l) =>
              l.key === listKey ? { ...l, count: saved.length } : l
            )
          );
        })
        .catch(() => {
          setTasksState([]);
          // On error, set count to zero
          setLists((prev) =>
            prev.map((l) => (l.key === listKey ? { ...l, count: 0 } : l))
          );
        });
    }
  }, [listKey]);

  useEffect(() => {
    if (!isCustom) {
      AsyncStorage.setItem(
        `todos_${listKey}`,
        JSON.stringify(tasksState)
      ).catch(() => {});
    }
  }, [listKey, tasksState]);

  const tasks = isCustom ? tasksMap[listKey] || [] : tasksState;

  const toggleTask = (id: string) => {
    if (isCustom) {
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      );
      setTasksMap((prev) => ({ ...prev, [listKey]: updated }));
      setLists((prev) =>
        prev.map((l) =>
          l.key === listKey ? { ...l, count: updated.length } : l
        )
      );
    } else {
      setTasksState((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    }
  };

  const deleteTask = (id: string) => {
    if (isCustom) {
      const updated = tasks.filter((t) => t.id !== id);
      setTasksMap((prev) => ({ ...prev, [listKey]: updated }));
      setLists((prev) =>
        prev.map((l) =>
          l.key === listKey ? { ...l, count: updated.length } : l
        )
      );
    } else {
      setTasksState((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        setLists((lists) =>
          lists.map((l) =>
            l.key === listKey ? { ...l, count: updated.length } : l
          )
        );
        return updated;
      });
    }
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const newList = { id: Date.now().toString(), title: newTask, done: false };
    if (isCustom) {
      const updated = [...tasks, newList];
      setTasksMap((prev) => ({ ...prev, [listKey]: updated }));
      setLists((lists) =>
        lists.map((l) =>
          l.key === listKey ? { ...l, count: updated.length } : l
        )
      );
    } else {
      setTasksState((prev) => {
        const updated = [...prev, newList];
        // én meteen badge count updaten:
        setLists((lists) =>
          lists.map((l) =>
            l.key === listKey ? { ...l, count: updated.length } : l
          )
        );
        return updated;
      });
    }
    setNewTask("");
  };

  const navigation = useNavigation();
  const listLabel = listMeta.label;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const commitEdit = (id: string) => {
    const updater = isCustom ? setTasksMap : setTasksState;
    const prevTasks = isCustom ? tasksMap[listKey] : tasksState;
    const updated = prevTasks.map((t) =>
      t.id === id ? { ...t, title: editingText } : t
    );
    updater((prev) => (isCustom ? { ...prev, [listKey]: updated } : updated));
    if (isCustom) {
      setLists((lists) =>
        lists.map((l) =>
          l.key === listKey ? { ...l, count: updated.length } : l
        )
      );
    }
    setEditingId(null);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: listLabel, // of title: '' om helemaal niets te tonen
      headerBackTitle: "Go-To-Go", // zodat je nog steeds "< Go-To-Go" ziet
    });
  }, [navigation, listLabel]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header met terug-knop */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{listMeta.label}</Text>
      </View>

      {/* Invoerveld voor nieuwe taak */}
      <View style={styles.inputRow}>
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Nieuwe taak"
          style={styles.input}
        />
        <TouchableOpacity onPress={addTask} style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Takenlijst */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              onPress={() => toggleTask(item.id)}
              onLongPress={() => {
                setEditingId(item.id);
                setEditingText(item.title);
              }}
              style={[
                styles.rowFront,
                { flex: 1, flexDirection: "row", alignItems: "center" },
              ]}
              delayLongPress={300}
            >
              {editingId === item.id ? (
                <TextInput
                  value={editingText}
                  onChangeText={setEditingText}
                  onSubmitEditing={() => commitEdit(item.id)}
                  onBlur={() => setEditingId(null)}
                  autoFocus
                  style={[styles.text, { flex: 1, marginLeft: 8, padding: 0 }]}
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={
                      item.done
                        ? "checkbox-marked-circle"
                        : "checkbox-blank-circle-outline"
                    }
                    size={24}
                    color={item.done ? "#10B981" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.text,
                      item.done && styles.doneText,
                      { marginLeft: 8 },
                    ]}
                  >
                    {item.title}
                  </Text>
                </>
              )}
            </Pressable>
            <TouchableOpacity
              onPress={() => deleteTask(item.id)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteX}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
  },
  addBtn: { marginLeft: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowFront: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  text: {
    marginLeft: 8,
    color: "#111",
  },
  doneText: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  deleteBtn: { padding: 8 },
  deleteX: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 18,
  },
});
