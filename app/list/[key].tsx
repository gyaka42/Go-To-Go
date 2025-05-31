// app/list/[key].tsx
import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet as RNStyleSheet,
  View as RNView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListsContext } from "../../context/ListsContext";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import OptionsModal from "../new-list/options";
import ShareModal from "../new-list/share";

export default function ListDetail() {
  const { key } = useLocalSearchParams();
  const listKey = Array.isArray(key) ? key[0] : key;
  const router = useRouter();
  const navigation = useNavigation();
  const { lists, setLists, tasksMap, setTasksMap } = useContext(ListsContext);

  const isCustom = lists.some((l) => l.key === listKey);

  // Load tasks for custom lists if not present
  useEffect(() => {
    if (isCustom && !(listKey in tasksMap)) {
      setTasksMap((prev) => ({ ...prev, [listKey]: [] }));
    }
  }, [isCustom, listKey, tasksMap, setTasksMap]);

  // Metadata
  const baseMenu = [
    { key: "mijnDag", icon: "weather-sunny", label: "Mijn dag", count: null },
    {
      key: "belangrijk",
      icon: "star-outline",
      label: "Belangrijk",
      count: null,
    },
    {
      key: "gepland",
      icon: "calendar-blank-outline",
      label: "Gepland",
      count: null,
    },
    { key: "taken", icon: "check-circle-outline", label: "Taken", count: null },
  ];
  const listMeta = lists.find((l) => l.key === listKey) ||
    baseMenu.find((l) => l.key === listKey) || { label: "Onbekende lijst" };
  const listLabel = listMeta.label;

  // State
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState(tasksMap[listKey] || []);
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Header buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      title: listLabel,
      headerBackTitle: "Go-To-Go",
      headerRight: () => (
        <RNView style={{ flexDirection: "row", marginRight: 16 }}>
          <TouchableOpacity
            onPress={() => setShowShare(true)}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="share-social-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <Ionicons name="ellipsis-vertical-outline" size={24} color="#000" />
          </TouchableOpacity>
        </RNView>
      ),
    });
  }, [navigation, listLabel]);

  // Sync tasksMap for custom lists; for standard, load/save AsyncStorage
  useEffect(() => {
    if (!isCustom) {
      AsyncStorage.getItem(`todos_${listKey}`)
        .then((json) => setTasks(json ? JSON.parse(json) : []))
        .catch(() => setTasks([]));
    } else {
      setTasks(tasksMap[listKey] || []);
    }
  }, [listKey, isCustom, tasksMap]);

  useEffect(() => {
    if (isCustom) {
      setTasksMap((prev) => ({ ...prev, [listKey]: tasks }));
    } else {
      AsyncStorage.setItem(`todos_${listKey}`, JSON.stringify(tasks)).catch(
        () => {}
      );
    }
    // update badge count
    setLists((prev) =>
      prev.map((l) => (l.key === listKey ? { ...l, count: tasks.length } : l))
    );
  }, [tasks]);

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

  const renderTask = ({ item }) => (
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
        <Text style={styles.headerTitle}>{listLabel}</Text>
      </View>
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
      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={renderTask}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      {/* Options bottom sheet */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modal}>
          <TouchableOpacity
            style={RNStyleSheet.absoluteFill}
            onPress={() => setShowOptions(false)}
          />
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Opties</Text>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setTasks((t) =>
                  [...t].sort((a, b) => a.title.localeCompare(b.title))
                );
                setShowOptions(false);
              }}
            >
              <Ionicons name="swap-vertical" size={24} color="#333" />
              <Text style={styles.rowText}>Sorteer alfabetisch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setTasks((t) =>
                  [...t].sort((a, b) => Number(a.id) - Number(b.id))
                );
                setShowOptions(false);
              }}
            >
              <Ionicons name="calendar" size={24} color="#333" />
              <Text style={styles.rowText}>Sorteer op datum</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setShowOptions(false);
                setShowShare(true);
              }}
            >
              <Ionicons name="share-social-outline" size={24} color="#333" />
              <Text style={styles.rowText}>Kopie verzenden</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setShowOptions(false)}
            >
              <Ionicons name="print-outline" size={24} color="#333" />
              <Text style={styles.rowText}>Lijst afdrukken</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share bottom sheet */}
      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity
            style={RNStyleSheet.absoluteFill}
            onPress={() => setShowShare(false)}
          />
          <RNView style={styles.sheet}>
            <ShareModal
              listTitle={listLabel}
              tasks={tasks}
              onClose={() => setShowShare(false)}
            />
          </RNView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = RNStyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
  },
  headerTitle: { fontSize: 20, fontWeight: "600" },
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
  rowFront: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  //rowText: { marginLeft: 8, color: "#111" },
  rowDone: { textDecorationLine: "line-through", color: "#9CA3AF" },
  deleteX: { color: "#EF4444", fontWeight: "700" },
  modal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: "50%",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  rowText: { marginLeft: 12, fontSize: 16, color: "#333" },
});
