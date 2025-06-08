// app/new-list.tsx
import React, {
  useState,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
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
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  useColorScheme,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ListsContext } from "../context/ListsContext";
import { Task } from "../context/ListsContext";
import * as Print from "expo-print";
import * as Notifications from "expo-notifications";
import useTasks from "../hooks/useTasks";
import OptionsSheet from "../components/OptionsSheet";

export default function NewListScreen() {
  // Generate a stable key for this new list, to pass to notifications
  const newListKeyRef = useRef<string>(Date.now().toString());
  const scheme = useColorScheme();
  const theme =
    scheme === "dark"
      ? {
          background: "#121212",
          cardBackground: "#1E1E1E",
          text: "#FFFFFF",
          placeholder: "#888888",
        }
      : {
          background: "#F3F4F6",
          cardBackground: "#FFFFFF",
          text: "#111111",
          placeholder: "#666666",
        };

  const router = useRouter();
  const navigation = useNavigation();
  const { setLists, setTasksMap } = useContext(ListsContext);

  const [title, setTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Prevent concurrent print requests
  const [isPrinting, setIsPrinting] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);

  // Voeg de opties-knop toe aan de header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={{ marginRight: 16 }}
        >
          <Ionicons
            name="ellipsis-vertical-outline"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme.text]);

  // Long-press edit state voor taken
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  // Date editing state for due dates
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  // Sla lijst & taken op bij verlaten
  useEffect(() => {
    return navigation.addListener("beforeRemove", () => {
      // Cancel any scheduled notifications for tasks being discarded
      tasks.forEach((t) => {
        if (t.notificationId) {
          Notifications.cancelScheduledNotificationAsync(t.notificationId);
        }
      });
      const label = title.trim() || "Naamloze lijst";
      const newKey = newListKeyRef.current;
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

  const {
    addTask: hookAddTask,
    toggleTask,
    deleteTask,
  } = useTasks(tasks, setTasks, newListKeyRef.current);

  const addTask = async () => {
    await hookAddTask(newTask, dueDate, newListKeyRef.current);
    setNewTask("");
    setDueDate(null);
    setShowDatePicker(false);
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
    <>
      <View
        style={[
          styles.taskCard,
          { backgroundColor: scheme === "dark" ? "#333333" : "#FFFFFF" },
        ]}
      >
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
              style={[
                styles.rowText,
                {
                  flex: 1,
                  marginLeft: 8,
                  padding: 0,
                  color: scheme === "dark" ? "#FFF" : "#000",
                },
              ]}
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
                    {
                      marginLeft: 8,
                      color: scheme === "dark" ? "#FFF" : "#333",
                    },
                    item.done && styles.rowDone,
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              {item.dueDate && (
                <Pressable
                  onPress={() => {
                    if (Platform.OS === "android") {
                      DateTimePickerAndroid.open({
                        value: item.dueDate || new Date(),
                        mode: "date",
                        onChange: (e, date) => {
                          if (e.type === "set" && date) {
                            DateTimePickerAndroid.open({
                              value: date,
                              mode: "time",
                              onChange: (e2, time) => {
                                if (e2.type === "set" && time) {
                                  const dt = new Date(date);
                                  dt.setHours(
                                    time.getHours(),
                                    time.getMinutes()
                                  );
                                  setTasks((prev) =>
                                    prev.map((t) =>
                                      t.id === item.id
                                        ? { ...t, dueDate: dt }
                                        : t
                                    )
                                  );
                                }
                              },
                            });
                          }
                        },
                      });
                    } else {
                      setShowDatePicker(false);
                      setEditingDateId(item.id);
                    }
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: scheme === "dark" ? "#DDD" : "#6B7280",
                      marginLeft: 32,
                      marginTop: 2,
                    }}
                  >
                    {new Date(item.dueDate).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </Text>
                </Pressable>
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
      {editingDateId === item.id && (
        <View style={styles.datePickerWrapper}>
          <DateTimePicker
            value={
              tasks.find((t) => t.id === editingDateId)?.dueDate || new Date()
            }
            mode="datetime"
            display="inline"
            onChange={async (_, selected) => {
              if (selected) {
                try {
                  // Cancel old notification if present
                  const old = tasks.find((t) => t.id === editingDateId);
                  if (old?.notificationId) {
                    await Notifications.cancelScheduledNotificationAsync(
                      old.notificationId
                    );
                  }
                  // Schedule new notification
                  const newId = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Taakherinnering",
                      body: selected.toString(),
                      data: { listKey: newListKeyRef.current },
                    },
                    trigger: {
                      type: Notifications.SchedulableTriggerInputTypes.DATE,
                      date: selected,
                    },
                  });
                  // Update task with new dueDate and notificationId
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === editingDateId
                        ? { ...t, dueDate: selected, notificationId: newId }
                        : t
                    )
                  );
                } catch (e) {
                  // Silently ignore errors
                }
              }
            }}
            style={{ width: "90%" }}
          />
          <TouchableOpacity
            onPress={() => setEditingDateId(null)}
            style={styles.dateDoneButton}
          >
            <Text style={styles.dateDoneText}>Gereed</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  /** Functie om de lijst (met titel & taken) als HTML naar de print-API te sturen */
  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
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
      const msg = err?.message ?? "";
      if (
        msg.includes("Printing did not complete") ||
        msg.includes("No printers are available")
      ) {
        // gebruiker annuleerde afdruk of er zijn geen printers; stil negeren
        return;
      }
      console.error("Print-fout:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[styles.headerCard, { backgroundColor: theme.cardBackground }]}
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Naamloze lijst"
          placeholderTextColor={theme.placeholder}
          style={[
            styles.titleInput,
            { backgroundColor: theme.cardBackground, color: theme.text },
          ]}
        />
      </View>

      <View
        style={[styles.inputCard, { backgroundColor: theme.cardBackground }]}
      >
        <TouchableOpacity
          style={styles.iconButton}
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
              setEditingDateId(null);
              setShowDatePicker((prev) => !prev);
            }
          }}
        >
          <Ionicons name="calendar-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          onFocus={() => setShowDatePicker(false)}
          placeholder="Nieuwe taak"
          placeholderTextColor={theme.placeholder}
          style={[
            styles.input,
            { backgroundColor: theme.cardBackground, color: theme.text },
          ]}
        />
        <TouchableOpacity onPress={addTask} style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>
      {Platform.OS === "ios" && showDatePicker && (
        <View style={styles.datePickerWrapper}>
          <DateTimePicker
            value={dueDate || new Date()}
            mode="datetime"
            display="inline"
            onChange={(_, selectedDate) => {
              if (selectedDate) setDueDate(selectedDate);
            }}
            style={{ width: "90%" }}
          />
          <TouchableOpacity
            onPress={() => setShowDatePicker(false)}
            style={styles.dateDoneButton}
          >
            <Text style={styles.dateDoneText}>Gereed</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={renderTask}
      />

      {/* Options Bottom Sheet */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
        onDismiss={() => {
          if (pendingPrint) {
            setPendingPrint(false);
            handlePrint();
          }
        }}
      >
        <View style={styles.modal}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowOptions(false)}
          />
          <OptionsSheet
            style={[
              styles.sheet,
              { backgroundColor: scheme === "dark" ? "#333333" : "#FFFFFF" },
            ]}
            onClose={() => setShowOptions(false)}
            onSortAlphabetical={() => {
              setTasks((t) =>
                [...t].sort((a, b) => a.title.localeCompare(b.title))
              );
              setShowOptions(false);
            }}
            onSortByDate={() => {
              setTasks((t) =>
                [...t].sort((a, b) => Number(a.id) - Number(b.id))
              );
              setShowOptions(false);
            }}
            onCopy={() => {
              setShowOptions(false);
              setShowShare(true);
            }}
            onPrint={() => {
              setPendingPrint(true);
              setShowOptions(false);
            }}
          />
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
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    // Android elevation
    elevation: 2,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    // Android elevation
    elevation: 1,
  },
  iconButton: { marginRight: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
  },
  addBtn: { marginLeft: 8 },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 12,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    // Android elevation
    elevation: 1,
  },
  rowText: { marginLeft: 12, fontSize: 16 },
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
  datePickerContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  datePickerWrapper: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 8,
  },
  dateDoneButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  dateDoneText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
