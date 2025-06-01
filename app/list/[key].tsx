// app/list/[key].tsx

import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
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
  StyleSheet,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListsContext, Task } from "../../context/ListsContext";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ShareModal from "../new-list/share";
import OptionsModal from "../new-list/options";
import * as Print from "expo-print";
import * as Notifications from "expo-notifications";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ListDetail() {
  // --- ROUTER & CONTEXT ---
  const { key } = useLocalSearchParams(); // key uit URL
  const listKey = Array.isArray(key) ? key[0] : key;
  const router = useRouter();
  const navigation = useNavigation();
  const { lists, setLists, tasksMap, setTasksMap } = useContext(ListsContext);

  const isCustom = lists.some((l) => l.key === listKey);

  // --- STATE FOR TASKS & REMINDERS ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- STATE FOR EDITING & MODALS ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // --- LOAD TASKS ONCE (NO CIRCULAR UPDATES) ---
  useEffect(() => {
    if (isCustom) {
      // Custom lijst: laad uit context (tasksMap)
      const saved = tasksMap[listKey] || [];
      const parsed = saved.map((t) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      }));
      setTasks(parsed);
    } else {
      // Standaardlijst: laad uit AsyncStorage
      AsyncStorage.getItem(`todos_${listKey}`)
        .then((json) => {
          const savedTasks: (Task & { dueDate: string | null })[] = json
            ? JSON.parse(json)
            : [];
          const parsedList: Task[] = savedTasks.map((t) => ({
            id: t.id,
            title: t.title,
            done: t.done,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
          }));
          setTasks(parsedList);
        })
        .catch(() => setTasks([]));
    }
  }, [listKey, isCustom]);

  // --- SYNC TASKS BACK TO CONTEXT / STORAGE WHEN CHANGED ---
  useEffect(() => {
    if (isCustom) {
      setTasksMap((prev) => ({ ...prev, [listKey]: tasks }));
    } else {
      AsyncStorage.setItem(`todos_${listKey}`, JSON.stringify(tasks)).catch(
        () => {}
      );
      setTasksMap((prev) => ({ ...prev, [listKey]: tasks }));
    }
    // Update badge‐count in context‐lists
    setLists((prev) =>
      prev.map((l) => (l.key === listKey ? { ...l, count: tasks.length } : l))
    );
  }, [tasks]);

  // --- SCHEDULE NOTIFICATION HELPER ---
  async function scheduleReminder(title: string, date: Date) {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    if (seconds <= 0) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Taakherinnering",
          body: title,
          sound: "default",
        },
        trigger: {
          type: "timeInterval" as any,
          seconds,
          repeats: false,
        },
      });
    } catch (err) {
      console.error("Kon herinnering niet plannen:", err);
    }
  }

  // --- ADD TASK (INCL. DUE DATE & NOTIFICATIES) ---
  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.trim(),
      done: false,
      dueDate: dueDate || null,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask("");
    if (dueDate) {
      scheduleReminder(task.title, dueDate);
      setDueDate(null);
    }
  };

  // --- TOGGLE DONE ---
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // --- DELETE TASK ---
  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // --- COMMIT TASK EDIT ---
  const commitEdit = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title: editingText, dueDate: t.dueDate } : t
      )
    );
    setEditingId(null);
  };

  // --- PRINT FUNCTION ---
  const handlePrint = async () => {
    const htmlLines = [
      `<h1 style="font-family: sans-serif;">${
        lists.find((l) => l.key === listKey)?.label || "Lijst"
      }</h1>`,
      `<p style="font-family: sans-serif;">Taken:</p>`,
      `<ul style="font-family: sans-serif;">`,
      ...tasks.map(
        (t) =>
          `<li>${t.title} ${t.done ? " (✓ voltooid)" : " (✗ open)"}${
            t.dueDate
              ? ` (${new Date(t.dueDate).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })})`
              : ""
          }</li>`
      ),
      `</ul>`,
    ];
    const html = htmlLines.join("\n");
    try {
      await Print.printAsync({ html });
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("Printing did not complete")) return;
      console.error("Print-fout:", err);
    }
  };

  // --- SET UP HEADER (DEEL & OPTIES) ---
  useLayoutEffect(() => {
    navigation.setOptions({
      title: lists.find((l) => l.key === listKey)?.label || "Lijst",
      headerBackTitle: "Go-To-Go",
      headerRight: () => (
        <View style={{ flexDirection: "row", marginRight: 16 }}>
          <TouchableOpacity
            onPress={() => setShowShare(true)}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="share-social-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <Ionicons name="ellipsis-vertical-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, lists, listKey]);

  // --- RENDEREN PER TASK ---
  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.rowFront}>
      <Pressable
        onPress={() => toggleTask(item.id)}
        onLongPress={() => {
          setEditingId(item.id);
          setEditingText(item.title);
        }}
        delayLongPress={300}
        style={{ flex: 1, flexDirection: "column" }}
      >
        {editingId === item.id ? (
          <TextInput
            value={editingText}
            onChangeText={setEditingText}
            onSubmitEditing={() => commitEdit(item.id)}
            onBlur={() => commitEdit(item.id)}
            style={[styles.rowText, { flex: 1, marginLeft: 8, padding: 0 }]}
            autoFocus
          />
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
            </View>
            {item.dueDate && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  marginLeft: 32,
                  marginTop: 2,
                }}
              >
                {new Date(item.dueDate).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </Text>
            )}
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
      {/* Bovenste balk: lijstnaam of rename-input */}
      <View style={styles.header}>
        {isCustom ? (
          editingId === "rename" ? (
            <TextInput
              value={editingText}
              onChangeText={setEditingText}
              onSubmitEditing={() => {
                // commitRename indien je rename-functionaliteit hebt
              }}
              onBlur={() => {
                // commitRename
              }}
              autoFocus
              placeholder="Nieuwe lijstnaam"
              style={styles.renameInput}
            />
          ) : (
            <Pressable
              onPress={() => {
                setEditingText(
                  lists.find((l) => l.key === listKey)?.label || ""
                );
                setEditingId("rename");
              }}
              style={{ flex: 1 }}
            >
              <Text style={styles.headerTitle}>
                {lists.find((l) => l.key === listKey)?.label || "Lijst"}
              </Text>
            </Pressable>
          )
        ) : (
          <Text style={styles.headerTitle}>
            {lists.find((l) => l.key === listKey)?.label || "Lijst"}
          </Text>
        )}
      </View>

      {/* Invoerregel + kalendericoon */}
      <View style={styles.inputRow}>
        <TouchableOpacity style={{ marginRight: 8 }}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color="#2563EB"
            onPress={() => {
              Keyboard.dismiss();
              if (Platform.OS === "android") {
                DateTimePickerAndroid.open({
                  value: dueDate || new Date(),
                  mode: "date",
                  onChange: (event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                      DateTimePickerAndroid.open({
                        value: selectedDate,
                        mode: "time",
                        is24Hour: true,
                        onChange: (evt2, selectedTime) => {
                          if (evt2.type === "set" && selectedTime) {
                            const combined = new Date(selectedDate);
                            combined.setHours(
                              selectedTime.getHours(),
                              selectedTime.getMinutes()
                            );
                            setDueDate(combined);
                          }
                        },
                      });
                    }
                  },
                });
              } else {
                setShowDatePicker((prev) => !prev);
              }
            }}
          />
        </TouchableOpacity>
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

      {/* DatePicker onder de invoer */}
      {Platform.OS === "ios" && showDatePicker && (
        <View style={{ alignItems: "center", marginVertical: 8 }}>
          <DateTimePicker
            value={dueDate || new Date()}
            mode="datetime"
            display="inline"
            onChange={(_, selectedDate) => {
              if (selectedDate) setDueDate(selectedDate);
            }}
            style={{ width: "90%" }}
          />
        </View>
      )}

      {/* Takenlijst */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={renderTask}
      />

      {/* Opties-modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modal}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
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
              onPress={async () => {
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
              onPress={async () => {
                setShowOptions(false);
                await handlePrint();
              }}
            >
              <Ionicons name="print-outline" size={24} color="#333" />
              <Text style={styles.rowText}>Lijst afdrukken</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share-modal */}
      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modal}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowShare(false)}
          />
          <View style={styles.sheet}>
            <ShareModal
              listTitle={lists.find((l) => l.key === listKey)?.label || "Lijst"}
              tasks={tasks}
              onClose={() => setShowShare(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitle: { fontSize: 20, fontWeight: "600" },
  renameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 18,
    backgroundColor: "#FFF",
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
  rowFront: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowText: { marginLeft: 12, fontSize: 16, color: "#333" },
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
});
