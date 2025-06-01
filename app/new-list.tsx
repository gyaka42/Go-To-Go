// app/new-list.tsx
import React, { useState, useContext, useEffect, useLayoutEffect } from "react";
import * as Notifications from "expo-notifications";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import ShareModal from "./new-list/share";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ListsContext } from "../context/ListsContext";
import * as Print from "expo-print";

export default function NewListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { setLists, setTasksMap } = useContext(ListsContext);

  const [title, setTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState<
    { id: string; title: string; done: boolean; dueDate: Date | null }[]
  >([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Voeg de opties-knop toe aan de header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="ellipsis-vertical-outline" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Long-press edit state voor taken
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Sla lijst & taken op bij verlaten
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

  async function scheduleReminder(title: string, date: Date) {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    if (seconds <= 0) return; // voorkom directe melding bij verleden datum

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Taakherinnering",
          body: title,
          sound: "default",
        },
        trigger: {
          type: "timeInterval" as any, // ⛑️ forceer correct type
          seconds: Math.floor((date.getTime() - Date.now()) / 1000),
          repeats: false,
        },
      });
    } catch (err) {
      console.error("Kon herinnering niet plannen:", err);
    }
  }

  const addTask = async () => {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now().toString(),
      title: newTask.trim(),
      done: false,
      dueDate: dueDate || null,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask("");

    if (dueDate) {
      await scheduleReminder(task.title, dueDate);
      setDueDate(null);
    }
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
    item: { id: string; title: string; done: boolean; dueDate: Date | null };
  }) => (
    <View style={styles.rowFront}>
      <TouchableOpacity
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
      </TouchableOpacity>

      {/* delete-knop blijft buiten de TouchableOpacity */}
      <TouchableOpacity
        onPress={() => deleteTask(item.id)}
        style={{ padding: 16 }}
      >
        <Text style={styles.deleteX}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  /** Functie om de lijst (met titel & taken) als HTML naar de print-API te sturen */
  const handlePrint = async () => {
    // Bouw een eenvoudige HTML-representatie
    const label = title.trim() || "Naamloze lijst";
    const htmlLines = [
      `<h1 style="font-family: sans-serif;">${label}</h1>`,
      `<p style="font-family: sans-serif;">Taken:</p>`,
      `<ul style="font-family: sans-serif;">`,
      ...tasks.map(
        (t) => `<li>${t.title} ${t.done ? " (✓ voltooid)" : " (✗ open)"}</li>`
      ),
      `</ul>`,
    ];
    const html = htmlLines.join("\n");

    try {
      await Print.printAsync({ html });
    } catch (err: any) {
      // Foutmeldingen bij annuleren negeren, log andere fouten
      const message = err?.message ?? "";
      if (message.includes("Printing did not complete")) {
        return;
      }
      console.error("Print-fout:", err);
    }
  };

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
        <TouchableOpacity style={{ marginRight: 8 }}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color="#2563EB"
            onPress={() => {
              Keyboard.dismiss();
              if (Platform.OS === "android") {
                // Two-step picker: first date, then time
                DateTimePickerAndroid.open({
                  value: dueDate || new Date(),
                  mode: "date",
                  onChange: (event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                      // After picking date, open time picker
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
          placeholderTextColor="#666"
          style={[styles.input, { flex: 1 }]}
        />
        <TouchableOpacity onPress={addTask} style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>
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

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={renderTask}
      />

      {/* Options Bottom Sheet */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modal}>
          {/* backdrop om te sluiten */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowOptions(false)}
          />
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Opties</Text>

            {/* Sorteren alfabetisch */}
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

            {/* Sorteren op datum (ID-volgorde) */}
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

            {/* Kopie verzenden (ShareModal) */}
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

            {/* Lijst afdrukken (expo-print) */}
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

      {/* Share Bottom Sheet */}
      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={styles.modal}
        >
          {/* backdrop */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowShare(false)}
          />
          <View style={styles.sheet}>
            <ShareModal
              listTitle={title.trim() || "Naamloze lijst"}
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
  header: { padding: 16, backgroundColor: "#FFF" },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    backgroundColor: "#FFF",
  },
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
  rowText: { marginLeft: 12, fontSize: 16, color: "#333" },
  rowDone: { textDecorationLine: "line-through", color: "#9CA3AF" },
  deleteX: { color: "#EF4444", fontWeight: "700", marginLeft: 8 },
  modal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
});
