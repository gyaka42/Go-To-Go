// app/new-list.tsx
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ListsContext } from "../context/ListsContext";

export default function NewListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { setLists, setTasksMap } = useContext(ListsContext);

  const [title, setTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState<
    { id: string; title: string; done: boolean }[]
  >([]);

  // Long-press edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Save list & tasks before leaving
  useEffect(() => {
    return navigation.addListener("beforeRemove", () => {
      const label = title.trim() || "Naamloze lijst";
      const newKey = Date.now().toString();
      setLists((prev) => [
        ...prev,
        {
          key: newKey,
          icon: "format-list-bulleted",
          label,
          count: tasks.length,
        },
      ]);
      setTasksMap((prev) => ({ ...prev, [newKey]: tasks }));
    });
  }, [navigation, setLists, setTasksMap, title, tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newTask.trim(), done: false },
    ]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const commitEdit = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: editingText } : t))
    );
    setEditingId(null);
  };

  const renderTask = ({
    item,
  }: {
    item: { id: string; title: string; done: boolean };
  }) => (
    <View style={styles.rowFront}>
      <Pressable
        onPress={() => toggleTask(item.id)}
        onLongPress={() => {
          setEditingId(item.id);
          setEditingText(item.title);
        }}
        delayLongPress={300}
        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
      >
        {editingId === item.id ? (
          <TextInput
            value={editingText}
            onChangeText={setEditingText}
            onSubmitEditing={() => commitEdit(item.id)}
            onBlur={() => setEditingId(null)}
            style={[styles.rowText, { flex: 1, marginLeft: 8, padding: 0 }]}
            autoFocus
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
                styles.rowText,
                item.done && styles.rowDone,
                { marginLeft: 8 },
              ]}
            >
              {item.title}
            </Text>
          </>
        )}
      </Pressable>

      {/* delete-knop blijft buiten de Pressable */}
      <TouchableOpacity
        onPress={() => deleteTask(item.id)}
        style={{ padding: 16 }}
      >
        <Text style={styles.deleteX}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Naamloze lijst"
          placeholderTextColor="#444"
          style={[styles.titleInput, { marginLeft: 16 }]}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Nieuwe taak"
          placeholderTextColor="#666"
          style={styles.input}
        />
        <TouchableOpacity onPress={addTask} style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={renderTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: { padding: 16, backgroundColor: "#F3F4F6" },
  titleInput: { fontSize: 24, fontWeight: "700", color: "#111" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  rowFront: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowText: { color: "#111" },
  rowDone: { textDecorationLine: "line-through", color: "#9CA3AF" },
  deleteX: { color: "#EF4444", fontWeight: "700", marginLeft: 8 },
});
