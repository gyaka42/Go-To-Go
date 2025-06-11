// app/list/[key].tsx

import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import * as Notifications from "expo-notifications";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListsContext, Task } from "../../context/ListsContext";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ShareModal from "../new-list/share";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import useTasks from "../../hooks/useTasks";
import FilterBar from "../../components/FilterBar";
import OptionsSheet from "../../components/OptionsSheet";
import { useBaseMenu } from "../../utils/menuDefaults";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

export default function ListDetail() {
  const { scheme } = useContext(ThemeContext);
  const theme =
    scheme === "dark"
      ? {
          background: "#121212",
          cardBackground: "#1E1E1E",
          text: "#FFFFFF",
          secondaryText: "#9CA3AF",
        }
      : {
          background: "#F3F4F6",
          cardBackground: "#FFFFFF",
          text: "#111827",
          secondaryText: "#6B7280",
        };
  // --- ROUTER & CONTEXT ---
  const { key } = useLocalSearchParams();
  const listKey = Array.isArray(key) ? key[0] : key;
  const { lang, setLang, t } = useLanguage();
  const baseMenu = useBaseMenu();
  const router = useRouter();
  const navigation = useNavigation();
  const { lists, setLists, tasksMap, setTasksMap } = useContext(ListsContext);

  const isCustom = lists.some((l) => l.key === listKey);

  // Determine display label: custom if exists, otherwise standard, otherwise fallback translation
  const listLabel =
    lists.find((l) => l.key === listKey)?.label ||
    baseMenu.find((m) => m.key === listKey)?.label ||
    t("tasks");

  // --- STATE FOR TASKS & REMINDERS ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- STATE FOR EDITING & MODALS ---
  // editingId = "rename" or a task-id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // State to track which task's date picker is open
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);
  const [showInputDatePicker, setShowInputDatePicker] = useState(false);

  // --- NYE STATE: FILTER MODE ---
  // "all" = alle taken, "open" = alleen open, "done" = alleen voltooide
  const [filterMode, setFilterMode] = useState<"all" | "open" | "done">("all");

  // --- FUNCTIE OM LIJSTNAAM TE OPSLAAN ---
  const commitRename = () => {
    const trimmed = editingText.trim();
    if (trimmed) {
      setLists((prev) =>
        prev.map((l) => (l.key === listKey ? { ...l, label: trimmed } : l))
      );
    }
    setEditingId(null);
  };

  // --- LAAD TASKS ÉÉN KEER ---
  useEffect(() => {
    if (isCustom) {
      const saved = tasksMap[listKey] || [];
      const parsed = saved.map((t) => ({
        ...t,
        dueDate: (() => {
          if (!t.dueDate) return null;
          if (typeof t.dueDate === "string") return new Date(t.dueDate);
          try {
            return new Date(t.dueDate);
          } catch {
            return null;
          }
        })(),
      }));
      setTasks(parsed);
    } else {
      AsyncStorage.getItem(`todos_${listKey}`)
        .then((json) => {
          const savedTasks: (Task & {
            dueDate: string | null;
            notificationId?: string;
          })[] = json ? JSON.parse(json) : [];
          const parsedList: Task[] = savedTasks.map((t) => ({
            id: t.id,
            title: t.title,
            done: String(t.done) === "true",
            dueDate: (() => {
              if (!t.dueDate) return null;
              if (typeof t.dueDate === "string") return new Date(t.dueDate);
              try {
                return new Date(t.dueDate);
              } catch {
                return null;
              }
            })(),
            notificationId: t.notificationId,
            titleEditable: String(t.done) !== "true",
          }));
          setTasks(parsedList);
        })
        .catch(() => setTasks([]));
    }
  }, [listKey, isCustom]);

  // --- SYNC BACK NAAR CONTEXT/STORAGE ---
  useEffect(() => {
    if (isCustom) {
      setTasksMap((prev) => ({ ...prev, [listKey]: tasks }));
    } else {
      AsyncStorage.setItem(`todos_${listKey}`, JSON.stringify(tasks)).catch(
        () => {}
      );
      setTasksMap((prev) => ({ ...prev, [listKey]: tasks }));
    }
    setLists((prev) =>
      prev.map((l) => (l.key === listKey ? { ...l, count: tasks.length } : l))
    );
  }, [tasks]);

  const {
    addTask: hookAddTask,
    toggleTask,
    deleteTask,
  } = useTasks(tasks, setTasks, listKey);

  const addTask = async () => {
    await hookAddTask(newTask, dueDate, listKey);
    Keyboard.dismiss();
    setNewTask("");
    setDueDate(null);
    setShowDatePicker(false);
    setDatePickerFor(null);
    setShowInputDatePicker(false);
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

  // --- PRINT LIJST ---
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
      // Show native print dialog
      await Print.printAsync({ html });
    } catch (printError) {
      const errMsg = printError?.message ?? "";
      if (errMsg.includes("Printing did not complete")) {
        // User cancelled the print dialog; do nothing and return to options sheet
        return;
      }
      // Fallback for real errors: generate PDF and open share sheet
      try {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
        });
      } catch (shareError) {
        console.error("PDF delen mislukt:", shareError);
        alert("Kon de lijst niet afdrukken of delen.");
      }
    }
  };

  // --- NAVIGATION HEADER INSTELLEN ---
  useLayoutEffect(() => {
    navigation.setOptions({
      title: listLabel,
      headerBackTitle: "Go-To-Go",
      headerRight: () => (
        <View style={{ flexDirection: "row", marginRight: 16 }}>
          <TouchableOpacity
            onPress={() => setShowShare(true)}
            style={{ marginRight: 16 }}
          >
            <Ionicons
              name="share-social-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <Ionicons
              name="ellipsis-vertical-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, lists, listKey, listLabel]);

  // --- OPSLAAN WANNEER TERUG OF BUITEN GEBEURENIS ---
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      if (editingId === "rename") {
        commitRename();
      }
      // If the list is being deleted (could add a condition here if you have a flag)
      // Cancel notifications for all tasks in this list before removing them
      // (Assuming you add a delete-list action, or if you want to always cancel on unmount)
      // (notification cancel logic removed)
    });
    return unsubscribe;
  }, [navigation, editingId, commitRename]);

  // --- FILTER LOGICA TOEVOEGEN ---
  // filteredTasks houdt alleen de taken die bij filterMode passen
  const filteredTasks = tasks.filter((t) => {
    if (filterMode === "open") return !t.done;
    if (filterMode === "done") return t.done;
    return true; // "all"
  });

  // --- RENDEREN VAN ÉÉN TAKENREGEL ---
  const renderTask = ({ item, drag, isActive }: RenderItemParams<Task>) => (
    <View style={[styles.taskCard, { backgroundColor: theme.cardBackground }]}>
      <TouchableOpacity
        onLongPress={drag}
        delayLongPress={150}
        disabled={isActive}
        style={{ padding: 8, justifyContent: "center", alignItems: "center" }}
      >
        <MaterialCommunityIcons
          name="drag"
          size={24}
          color={scheme === "dark" ? "#FFF" : "#333"}
        />
      </TouchableOpacity>
      <Pressable
        onPress={() => toggleTask(item.id)}
        onLongPress={() => {
          if (item.titleEditable) {
            setEditingId(item.id);
            setEditingText(item.title);
          }
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
              { flex: 1, marginLeft: 8, padding: 0, color: theme.text },
            ]}
            autoFocus
            editable={item.titleEditable}
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
                  { marginLeft: 8 },
                  item.done
                    ? { ...styles.rowDone, color: theme.secondaryText }
                    : { color: theme.text },
                ]}
              >
                {item.title}
              </Text>
            </View>
            {Platform.OS === "android" ? (
              <TouchableOpacity
                onPress={() => {
                  setDatePickerFor(item.id);
                  const safeDueDate =
                    item.dueDate instanceof Date &&
                    !isNaN(item.dueDate.getTime())
                      ? item.dueDate
                      : new Date();

                  DateTimePickerAndroid.open({
                    value: safeDueDate,
                    mode: "date",
                    onChange: (event, selectedDate) => {
                      setDatePickerFor(null);
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
                              setTasks((prev) =>
                                prev.map((t) =>
                                  t.id === item.id
                                    ? { ...t, dueDate: combined }
                                    : t
                                )
                              );
                            }
                          },
                        });
                      }
                    },
                  });
                }}
                style={{ marginLeft: 32, marginTop: 2 }}
              >
                <Text style={{ fontSize: 12, color: theme.secondaryText }}>
                  {item.dueDate
                    ? new Date(item.dueDate).toLocaleString(lang, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : t("SetReminder")}
                </Text>
              </TouchableOpacity>
            ) : (
              // behoud bestaande iOS-rendering zoals die al staat in de code
              <>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowInputDatePicker(false);
                    setDatePickerFor(item.id);
                  }}
                  style={{ marginLeft: 32, marginTop: 2 }}
                >
                  <Text style={{ fontSize: 12, color: theme.secondaryText }}>
                    {item.dueDate
                      ? new Date(item.dueDate).toLocaleString(lang, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : t("SetReminder")}
                  </Text>
                </TouchableOpacity>
                {datePickerFor === item.id && (
                  <View style={styles.datePickerWrapper}>
                    <DateTimePicker
                      value={item.dueDate || new Date()}
                      mode="datetime"
                      display="inline"
                      themeVariant={scheme === "dark" ? "dark" : "light"}
                      locale={lang}
                      onChange={async (_, selectedDate) => {
                        if (selectedDate) {
                          const old = tasks.find((t) => t.id === item.id);
                          if (old?.notificationId) {
                            await Notifications.cancelScheduledNotificationAsync(
                              old.notificationId
                            );
                          }
                          const newId =
                            await Notifications.scheduleNotificationAsync({
                              content: {
                                title: "Taakherinnering",
                                body: item.title,
                                data: { listKey },
                              },
                              trigger: {
                                type: "date",
                                date: selectedDate,
                              } as Notifications.DateTriggerInput,
                            });
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === item.id
                                ? {
                                    ...t,
                                    dueDate: selectedDate,
                                    notificationId: newId,
                                  }
                                : t
                            )
                          );
                        }
                      }}
                      style={{ width: "90%" }}
                    />
                    <TouchableOpacity
                      onPress={() => setDatePickerFor(null)}
                      style={styles.dateDoneButton}
                    >
                      <Text style={styles.dateDoneText}>Gereed</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </Pressable>
      {datePickerFor !== item.id && (
        <TouchableOpacity
          onPress={() => deleteTask(item.id)}
          style={{ padding: 16 }}
        >
          <Text style={styles.deleteX}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Bovenste balk: lijstnaam of bewerk-input */}
      <View
        style={[styles.headerCard, { backgroundColor: theme.cardBackground }]}
      >
        {isCustom ? (
          editingId === "rename" ? (
            <TextInput
              value={editingText}
              onChangeText={setEditingText}
              onSubmitEditing={commitRename}
              onBlur={commitRename}
              autoFocus
              placeholder={t("NewList")}
              placeholderTextColor={theme.secondaryText}
              style={[
                styles.renameInput,
                { backgroundColor: theme.cardBackground, color: theme.text },
              ]}
            />
          ) : (
            <Pressable
              onPress={() => {
                setEditingText(listLabel);
                setEditingId("rename");
              }}
              style={{ flex: 1 }}
            >
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {listLabel}
              </Text>
            </Pressable>
          )
        ) : (
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {listLabel}
          </Text>
        )}
      </View>

      {/* Invoerveld + kalendericoon */}
      <View
        style={[styles.inputCard, { backgroundColor: theme.cardBackground }]}
      >
        <TouchableOpacity
          style={{ marginRight: 8 }}
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
              setDatePickerFor(null);
              setShowInputDatePicker((prev) => !prev);
            }
          }}
        >
          <Ionicons name="calendar-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          onFocus={() => {
            setShowDatePicker(false);
            setShowInputDatePicker(false);
            setDatePickerFor(null);
          }}
          placeholder={t("newTask")}
          placeholderTextColor={theme.secondaryText}
          style={[
            styles.input,
            { backgroundColor: theme.cardBackground, color: theme.text },
          ]}
        />
        <TouchableOpacity onPress={addTask} style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Inline DateTimePicker alleen op iOS */}
      {Platform.OS === "ios" && showInputDatePicker && (
        <View style={styles.datePickerWrapper}>
          <DateTimePicker
            value={dueDate || new Date()}
            mode="datetime"
            display="inline"
            themeVariant={scheme === "dark" ? "dark" : "light"}
            locale={lang}
            onChange={(_, selectedDate) => {
              if (selectedDate) setDueDate(selectedDate);
            }}
            style={{ width: "90%" }}
          />
          <TouchableOpacity
            onPress={() => setShowInputDatePicker(false)}
            style={styles.dateDoneButton}
          >
            <Text style={styles.dateDoneText}>{t("Done")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FilterBar
        mode={filterMode}
        onChange={setFilterMode}
        style={[styles.filterRow, { backgroundColor: theme.cardBackground }]}
      />
      {/* ------------------------------------------------------- */}

      {/* Takenlijst: gebruik nu filteredTasks i.p.v. tasks */}
      <View style={{ flex: 1 }}>
        <DraggableFlatList
          data={filteredTasks}
          onDragEnd={({ data }) => setTasks(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          activationDistance={10}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

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
          <OptionsSheet
            style={styles.sheet}
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
              setShowOptions(false);
              // Delay until modal is fully dismissed, then show print dialog
              setTimeout(() => {
                handlePrint();
              }, 500);
            }}
          />
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
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
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
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  renameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 18,
    backgroundColor: "#F9FAFB",
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
  iconButton: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "transparent",
  },
  addBtn: {
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 12,
    paddingVertical: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    // Android elevation
    elevation: 1,
  },
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
  rowText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  rowDone: {
    textDecorationLine: "line-through",
    color: "#6B7280", // iets donkerder grijs
    fontWeight: "500", // optioneel: iets vetter
  },
  deleteX: {
    color: "#EF4444",
    fontWeight: "700",
  },
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
