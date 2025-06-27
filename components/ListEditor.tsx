import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
} from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  InteractionManager,
  Share,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import DateTimePicker from "@react-native-community/datetimepicker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Notifications from "expo-notifications";
// Set global notification handler
Notifications.setNotificationHandler({
  handleNotification:
    async (): Promise<Notifications.NotificationBehavior> => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Task, useAppStore } from '../store/appStore';

// Random color generator for new lists
const randomColor = () => {
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  return colors[Math.floor(Math.random() * colors.length)];
};
// Wait for a list key to appear in Zustand store
function waitForListKey(key: string, timeout = 200): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const exists = useAppStore.getState().lists.some((l) => l.key === key);
      if (exists) {
        resolve();
      } else {
        setTimeout(check, timeout);
      }
    };
    check();
  });
}
import * as Haptics from "expo-haptics";
import Animated, {
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import * as Print from "expo-print";
import useTasks from "../hooks/useTasks";
import FilterBar from "../components/FilterBar";
import OptionsSheet from "../components/OptionsSheet";
import ShareModal from "../app/new-list/share";
import RecurrencePicker from "../components/RecurrencePicker";
import { Options as RRuleOptions, Frequency } from "rrule";
import { useBaseMenu } from "../utils/menuDefaults";

function getRecurrenceLabel(
  recurrence?: Partial<RRuleOptions>,
  t?: (key: string) => string
) {
  if (!recurrence || !t) return "";

  const { freq, byweekday } = recurrence;

  if (
    freq === Frequency.WEEKLY &&
    Array.isArray(byweekday) &&
    byweekday.length > 1
  ) {
    return t("custom"); // Meerdere dagen gekozen → aangepast
  }

  switch (freq) {
    case Frequency.DAILY:
      return t("daily");
    case Frequency.WEEKLY:
      return t("weekly");
    case Frequency.MONTHLY:
      return t("monthly");
    case Frequency.YEARLY:
      return t("custom");
    default:
      return "";
  }
}

interface Props {
  mode: "edit" | "create";
  listKey?: string;
  titleLabel?: string;
}

export default function ListEditor({ mode, listKey, titleLabel }: Props) {
  // Get setActiveListKey from store
  const setActiveListKey = useAppStore((s) => s.setActiveListKey);
  // --- Custom states for DateTimePickerModal (for editing existing tasks) ---
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  // State for new task due date when creating new task
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);

  // Function to update the dueDate of a task by id
  const updateTaskDueDate = (taskId: string, date: Date) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              dueDate: date,
            }
          : t
      )
    );
    // Also update selectedTask if it matches
    setSelectedTask((prev) =>
      prev && prev.id === taskId ? { ...prev, dueDate: date } : prev
    );
  };
  
  const [draftTask, setDraftTask] = useState<{ dueDate?: Date } | null>(null);
  const handleConfirm = (date: Date) => {
    setDueDate(date); // laat deze staan als je wil dat het huidige inputveld visueel update
    setShowDatePickerModal(false);

    if (selectedTask) {
      const updatedTasks = tasks.map((t) =>
        t.id === selectedTask.id ? { ...t, dueDate: date } : t
      );
      setTasks(updatedTasks);
    }
  };
  // Highlight/scroll feature: flatListRef and highlight state
  const flatListRef = useRef<any>(null);
  // Ref to track if a task edit is active (used for keyboard scroll restore logic)
  const editingTaskRef = useRef<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null
  );
  // Ref to ensure highlight/scroll for notif only triggers once per mount
  const hasHighlightedRef = useRef(false);
  // 🆕 State voor pending notificationId uit push
  const [pendingNotificationId, setPendingNotificationId] = useState<
    string | null
  >(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollOffsetRef = useRef<number>(0);
  const editScrollPositionRef = useRef<number>(0);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      console.log(
        "[keyboardDidShow] keyboardHeight set to",
        e.endCoordinates.height
      );
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        console.log(
          "[keyboardWillHide] restoring scroll to",
          editScrollPositionRef.current
        );
        InteractionManager.runAfterInteractions(() => {
          if (flatListRef.current && editingTaskRef.current) {
            flatListRef.current.scrollToOffset({
              offset: editScrollPositionRef.current,
              animated: true,
            });
          }
        });
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const scheme = useAppStore((s) => s.scheme);
  const lang = useAppStore((s) => s.lang);
  const t = useAppStore((s) => s.t);
  const localeMap: Record<string, string> = {
    en: "en-US",
    nl: "nl-NL",
    tr: "tr-TR",
    de: "de-DE",
    es: "es-ES",
    fr: "fr-FR",
  };
  const langLocale = localeMap[lang] || "en-US";
  const theme =
    scheme === "dark"
      ? {
          background: "#121212",
          cardBackground: "#1E1E1E",
          text: "#FFF",
          secondaryText: "#9CA3AF",
          placeholder: "#888",
        }
      : {
          background: "#F3F4F6",
          cardBackground: "#FFF",
          text: "#111827",
          secondaryText: "#6B7280",
          placeholder: "#666",
        };

  const router = useRouter();
  const navigation = useNavigation();

  const baseMenu = useBaseMenu();

  // Shared state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [recurrence, setRecurrence] = useState<
    Partial<RRuleOptions> | undefined
  >(undefined);
  // Pending trigger state for notification
  const [pendingTrigger, setPendingTrigger] = useState(0);

  const lists = useAppStore((s) => s.lists);
  const setLists = useAppStore((s) => s.setLists);
  const tasksMap = useAppStore((s) => s.tasksMap);
  const setTasksMap = useAppStore((s) => s.setTasksMap);

  // Title (for create mode)
  const [title, setTitle] = useState(titleLabel || "");
  const newListKeyRef = useRef<string>(Date.now().toString());
  // Track if list is already saved in create mode
  const listSavedRef = useRef(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // DatePicker state
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);
  // react-native-modal-datetime-picker state for new task
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  // iOS Date/Time temporary states (used only for legacy inline picker, can be removed if fully migrated)
  const [iosDate, setIosDate] = useState<Date | null>(null);
  const [iosTime, setIosTime] = useState<Date | null>(null);
  // Show/hide for iOS inline picker and task edit date
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Modal Date Picker Handlers for new task
  const hideDatePicker = () => setShowDatePickerModal(false);

  // Options sheet / share modal
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Handler voor kalenderknop bij nieuwe taak
  const handleNewTaskCalendarPress = () => {
    setSelectedTask(null);
    setNewTaskDueDate(new Date());
    setShowDatePickerModal(true);
  };

  // For edit mode, get list key from params if not provided
  const { key, notif } = useLocalSearchParams<{
    key?: string;
    notif?: string;
  }>();
  const listParam = Array.isArray(key) ? key[0] : key;
  const activeListKey = mode === "edit" ? listParam || listKey : listKey;

  // Load tasks
  useEffect(() => {
    if (mode === "edit" && activeListKey) {
      const saved = tasksMap[activeListKey] || [];
      const parsed = saved.map((t) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        notificationId: t.notificationId || null,
      }));
      setTasks(parsed);
    }
  }, [mode, activeListKey]);

  // Scroll & highlight when arriving via notification (only once per notif)
  useEffect(() => {
    if (!notif || tasks.length === 0 || hasHighlightedRef.current) return;
    // Debug: log alle notificationId's
    console.log(
      "[notif-handler] alle task.notificationId’s:",
      tasks.map((t) => t.notificationId)
    );
    // wacht event loop om zeker te zijn dat FlatList gerenderd is
    setTimeout(() => {
      const index = tasks.findIndex((t) => t.notificationId === notif);
      // Debug: log gevonden index
      console.log(
        "[notif-handler] gevonden index:",
        index,
        "van",
        tasks.length,
        "taken"
      );
      if (index >= 0 && flatListRef.current) {
        const ITEM_HEIGHT = 76;
        if (index === tasks.length - 1) {
          // Scroll so the last item is fully visible
          flatListRef.current.scrollToOffset({
            offset: ITEM_HEIGHT * index,
            animated: true,
          });
        } else {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }
        // highlight de taak
        setHighlightedTaskId(notif);
        hasHighlightedRef.current = true;
        // na 3s weghighlighten (notif-param blijft in URL)
        setTimeout(() => {
          setHighlightedTaskId(null);
        }, 3000);
      }
    }, 100);
  }, [notif, tasks, listHeight]);

  // Sync back
  useEffect(() => {
    if (mode === "edit" && activeListKey) {
      setTasksMap({ ...tasksMap, [activeListKey]: tasks });
      setLists(
        lists.map((l) =>
          l.key === activeListKey ? { ...l, count: tasks.length } : l
        )
      );
    }
  }, [tasks]);

  // Listen for notification taps and schedule next recurrence
  const pendingNotificationRef: React.MutableRefObject<Notifications.NotificationResponse | null> =
    useRef<Notifications.NotificationResponse | null>(null);
  useEffect(() => {
    console.log(
      "🔁 useEffect voor notificaties her-rendered met taken:",
      tasks.length
    );
    if (!activeListKey) return;

    console.log(
      "🔄 useEffect triggered voor notification response listener met activeListKey:",
      activeListKey
    );

    const listener = async (
      notification: Notifications.NotificationResponse
    ) => {
      console.log(
        "🔔 Notificatie response ontvangen:",
        JSON.stringify(notification, null, 2)
      );
      // --- BEGIN Debugging output for notificationId existence in tasks ---
      const tappedNotifId = notification.notification.request.identifier;
      // 🆕 Sla notificationId op in state
      console.log("🔔 Notificatie-ID ontvangen:", tappedNotifId);
      setPendingNotificationId(tappedNotifId);
      // --- END Nieuw toegevoegd ---
      const taskExists = tasks.some((t) => t.notificationId === tappedNotifId);
      console.log("🔎 Bestaat de taak met dit notificationId?", taskExists);
      if (!taskExists) {
        console.log("❌ Geen bijpassende taak gevonden voor deze notificatie.");
      } else {
        console.log("✅ Taak gevonden voor deze notificatie.");
      }
      // --- END Debugging output ---

      // Altijd pendingNotificationRef zetten zodra notificatie ontvangen wordt
      if (notification?.notification?.request?.identifier) {
        pendingNotificationRef.current = notification;
      } else {
        console.log(
          "⚠️ Notificatie zonder geldige identifier ontvangen:",
          notification
        );
      }
      // --- [ScrollTest] Add logging after setting pendingNotificationRef.current ---
      console.log(
        "📦 [ScrollTest] Geregistreerde notificatie-ID:",
        tappedNotifId
      );
      console.log(
        "📦 [ScrollTest] Takenlijst op dat moment:",
        tasks.map((t) => ({ id: t.id, notifId: t.notificationId }))
      );
      // --- [End ScrollTest] ---
      console.log("📦 pendingNotificationRef gezet op:", tappedNotifId);

      // Extract and guard the notification's listKey value
      const listKeyParam =
        notification.notification.request.content.data?.listKey;
      if (typeof listKeyParam === "string" && listKeyParam !== activeListKey) {
        router.replace(`/list/${listKeyParam}?notif=${tappedNotifId}`);
        return; // stop further handling on the old list
      }

      if (tasks.length === 0 || !taskExists) {
        console.log(
          "⚠️ Tasks nog niet geladen of taak onbekend. Sla response tijdelijk op."
        );
        setPendingTrigger((prev) => prev + 1);
        return;
      }

      handleNotificationResponse(notification);
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(listener);
    console.log("📣 Notification response listener geregistreerd (eenmalig).");

    return () => {
      subscription.remove();
      console.log("📴 Notification response listener verwijderd.");
    };
  }, [activeListKey, tasks]);

  // Fallback: check initial notification on mount
  useEffect(() => {
    const checkInitialNotification = async () => {
      const initialResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (initialResponse) {
        console.log(
          "📲 Fallback: laatste notificatie opgehaald bij start:",
          initialResponse.notification.request.identifier
        );
        // ❗️Altijd opslaan, ook als taken nog niet geladen zijn
        if (!pendingNotificationRef.current) {
          pendingNotificationRef.current = initialResponse;
          setPendingTrigger((prev) => prev + 1);
        }
      }
    };
    checkInitialNotification();
  }, []);

  useEffect(() => {
    const pending = pendingNotificationRef.current;
    console.log("🔁 [pendingTrigger useEffect] Triggered");
    console.log("📦 Aantal taken:", tasks.length);
    const taskIds = tasks.map((t) => t.notificationId);
    console.log("📦 taskIds:", taskIds);
    console.log("📦 pendingNotificationRef:", pending);

    // 🆕 Nieuw: check pendingNotificationId
    if (pendingNotificationId && taskIds.includes(pendingNotificationId)) {
      console.log("📍 Scroll naar taak-ID:", pendingNotificationId);
      scrollToTask(pendingNotificationId);
      highlightTask(pendingNotificationId);
      setPendingNotificationId(null);
    }

    if (
      tasks.length > 0 &&
      pending &&
      !handledNotificationIds.current.has(
        pending.notification.request.identifier
      )
    ) {
      const pushNotifId = pending.notification.request.identifier;
      const taskExists = tasks.some((t) => t.notificationId === pushNotifId);
      if (taskExists) {
        console.log("✅ Verwerk opgeslagen notificatie:", pushNotifId);
        pendingNotificationRef.current = null;
        handleNotificationResponse(pending);
      } else {
        console.log("⚠️ Notificatie gevonden, maar geen match in tasks.");
      }
    }
  }, [tasks, pendingTrigger, pendingNotificationId]);

  // 🆕 Functies scrollToTask en highlightTask (placeholder als niet aanwezig)
  const scrollToTask = (taskId: string) => {
    console.log("🧭 Scroll functie aangeroepen voor:", taskId);
    // Implementeer de daadwerkelijke scroll logica hier
    // Je kunt flatListRef.current.scrollToIndex({ ... }) gebruiken
    const index = tasks.findIndex((t) => t.notificationId === taskId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const highlightTask = (taskId: string) => {
    console.log("🌟 Highlight functie aangeroepen voor:", taskId);
    setHighlightedTaskId(taskId);
    setTimeout(() => {
      setHighlightedTaskId(null);
    }, 3000);
  };

  // Ref to track handled notification IDs
  const handledNotificationIds = useRef<Set<string>>(new Set());

  const handleNotificationResponse = async (
    response: Notifications.NotificationResponse
  ) => {
    const visibleTasks = tasks.filter((t) => {
      if (filterMode === "open") return !t.done;
      if (filterMode === "done") return t.done;
      return true;
    });
    // Prevent duplicate handling of the same notification
    const taskId = response.notification.request.identifier;
    if (handledNotificationIds.current.has(taskId)) {
      console.log("⏩ Notificatie al verwerkt:", taskId);
      return;
    }
    handledNotificationIds.current.add(taskId);
    // 👇 De hele bestaande logica uit je originele listener komt hierheen.
    console.log(
      "📥 Listener actief! Response ontvangen:",
      JSON.stringify(response, null, 2)
    );
    console.log("🔧 DEBUG: Notification listener is actief.");
    console.log(
      "📲 App geopend via notificatie. Navigatie stack:",
      navigation.getState()
    );
    console.log("🔎 navigation object:", JSON.stringify(navigation, null, 2));
    console.log("🧠 Aantal taken op moment van notificatie:", tasks.length);
    if (tasks.length === 0) {
      console.log(
        "⚠️ Takenlijst is leeg tijdens notificatie response. Mogelijk nog niet geladen."
      );
    }

    console.log(
      "🪪 Notificatie response ontvangen voor taskId:",
      response.notification.request.identifier
    );
    console.log("🔍 Alle taak IDs met notificationId:");
    tasks.forEach((task, index) => {
      console.log(
        `🔢 ${index + 1}. Taak "${task.title}" met ID: ${
          task.id
        } en notificationId: ${task.notificationId}`
      );
    });
    console.log("🆔 Notificatie-ID ontvangen:", taskId);
    console.log(
      "🧾 Bekende notificationId's in takenlijst:",
      tasks.map((t) => t.notificationId)
    );
    console.log("🔍 Alle taak IDs met notificationId:");
    tasks.forEach((task, index) => {
      console.log(
        `🔢 ${index + 1}. Taak "${task.title}" met ID: ${
          task.id
        } en notificationId: ${task.notificationId}`
      );
    });
    console.log("🆔 Notificatie-ID ontvangen:", taskId);
    console.log(
      "🧾 Bekende notificationId's in takenlijst:",
      tasks.map((t) => t.notificationId)
    );
    // Log all notificationIds just before searching for the task
    console.log(
      "📋 Alle taken met notificationId:",
      tasks.map((t) => t.notificationId)
    );
    console.log("📦 Volledige task state:", JSON.stringify(tasks, null, 2));
    const allNotifIds = tasks.map((t) => t.notificationId);
    console.log(
      "🧾 Vergelijken met bekende IDs:",
      JSON.stringify(allNotifIds, null, 2)
    );
    // Fallback navigatie: check of de notificatie bij een andere lijst hoort
    const listKeyFromNotification =
      response.notification.request.content.data?.listKey;
    if (listKeyFromNotification && listKeyFromNotification !== activeListKey) {
      console.log(
        "🧭 Navigatie fallback: push naar lijst",
        listKeyFromNotification
      );
      router.replace(
        `/list/${listKeyFromNotification}?notif=${response.notification.request.identifier}`
      );
      return;
    }
    console.log("🔍 Op zoek naar taak met notificationId:", taskId);
    console.log(
      "📋 Alle notificationId's in taken:",
      tasks.map((t) => t.notificationId)
    );
    const task = tasks.find((t) => t.notificationId === taskId);
    console.log("✅ task gevonden?", !!task);
    // --- [ScrollTest] Add logging before visibleTasks findIndex ---
    if (task) {
      console.log(
        "📦 [ScrollTest] Geselecteerde taak in handleNotificationResponse:",
        task
      );
      console.log("📦 [ScrollTest] Filtermode:", filterMode);
      console.log(
        "📦 [ScrollTest] Aantal zichtbare taken:",
        visibleTasks.length
      );
      console.log(
        "📦 [ScrollTest] Zichtbare taken:",
        visibleTasks.map((t) => ({ id: t.id, title: t.title }))
      );
      
      const index = visibleTasks.findIndex((t) => t.id === task.id);
      console.log("📍 Index van taak om naartoe te scrollen:", index);
      if (index !== -1 && flatListRef.current) {
        console.log("📦 flatListRef.current:", flatListRef.current);
        console.log(
          "📏 Scroll naar index:",
          index,
          "van",
          visibleTasks.length,
          "taken."
        );
        console.log("🔧 Scroll direct naar index zonder delay:", index);
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
        setHighlightedTaskId(task.id);
        console.log("✅ Scroll & highlight gestart voor taak:", task.id);
        setTimeout(() => {
          setHighlightedTaskId(null);
          console.log("🎨 Highlight weer verwijderd voor taak:", task.id);
        }, 3000);
      }
    }

    if (!task) {
      console.log(
        "🧪 DEBUG: Takenlijst bevat op dit moment:",
        tasks.map((t) => ({ id: t.id, notifId: t.notificationId }))
      );
    }

    console.log(
      "🧪 Huidige notificationIds in tasks:",
      tasks.map((t) => t.notificationId)
    );

    if (!task) {
      console.log(
        "⛔️ Geen taak gevonden die overeenkomt met de notificatie-ID:",
        taskId
      );
      return;
    }

    if (!task.recurrence || !task.dueDate) {
      console.log("⛔️ Taak heeft geen recurrence of dueDate, stoppen.");
      return;
    }

    console.log("✅ Herhalende taak gevonden:", task.title);
    console.log(
      "🔁 Recurrence object:",
      JSON.stringify(task.recurrence, null, 2)
    );

    const { RRule } = await import("rrule");
    const rule = new RRule({
      dtstart: task.dueDate,
      ...task.recurrence,
      count: 2,
    });

    const allDates = rule.all();
    if (allDates.length < 2) {
      console.log(
        "⛔️ Minder dan 2 datums gevonden, geen nieuwe notificatie ingepland."
      );
      return;
    }

    const nextDate = allDates[1];
    console.log(
      "⏰ Nieuwe herhalingsnotificatie gepland op:",
      nextDate.toISOString()
    );

    const listLabel =
      useAppStore.getState().findListLabel?.(activeListKey || "") ??
      "Unknown list";

    const newNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: `Reminder for "${task.title}" in list "${listLabel}"`,
        sound: true,
        data: {
          listKey: activeListKey,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextDate,
      },
    });

    console.log("✅ Nieuwe notificatie gepland met ID:", newNotificationId);

    const updatedTask = {
      ...task,
      dueDate: nextDate,
      notificationId: newNotificationId,
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
  };

  // Persist new list and its tasks when leaving in create mode
  useEffect(() => {
    if (mode === "create") {
      const unsubscribe = navigation.addListener("beforeRemove", async () => {
        const label = title.trim() || t("NamelesList");
        const key = newListKeyRef.current;
        // Add the new list item
        setLists([
          ...lists,
          { key, icon: "format-list-bulleted", label, count: tasks.length },
        ]);
        // Store its tasks
        setTasksMap({ ...tasksMap, [key]: tasks });
        // Wait for Zustand to have the list available
        await waitForListKey(key);
      });
      return unsubscribe;
    }
  }, [mode, title, tasks, navigation, lists, tasksMap]);

  const { addTask, toggleTask, deleteTask } = useTasks(
    tasks,
    setTasks,
    mode === "create" ? newListKeyRef.current : activeListKey || ""
  );

  const hookAddTask = async () => {
    if (newTask.trim() === "") return;

    if (recurrence && !dueDate && !newTaskDueDate) {
      Alert.alert(t("error"), t("recurrenceNeedsDate"));
      return;
    }

    // --- Toegevoegd: addTaskSafely met delay indien nieuwe lijst ---
    const isNewlyCreatedList = !useAppStore.getState().findListLabel?.(activeListKey || "");

    const addTaskSafely = async () => {
      // Als het een net aangemaakte lijst is, wacht tot deze beschikbaar is in Zustand
      if (isNewlyCreatedList && mode === "create") {
        await waitForListKey(newListKeyRef.current);
      }
      const listKeyToUse = mode === "create" ? newListKeyRef.current : (activeListKey || "");
      const createdTask = await addTask(
        newTask,
        selectedTask && selectedTask.dueDate !== undefined
          ? selectedTask.dueDate
          : dueDate ?? newTaskDueDate ?? null,
        listKeyToUse,
        recurrence
      );
      setDueDate(null); // resetten na aanmaken is goed
      setNewTaskDueDate(null);

      if (createdTask && !("notificationId" in createdTask)) {
        createdTask.notificationId = null;
      }

      Keyboard.dismiss();
      setNewTask("");
      setDueDate(null);
      setRecurrence(undefined);
      setDraftTask(null);
      setNewTaskDueDate(null);
      if (
        createdTask &&
        (createdTask.dueDate ||
          (createdTask.recurrence &&
            Object.keys(createdTask.recurrence).length > 0))
      ) {
        const index = tasks.length;
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
        setHighlightedTaskId(createdTask.id);
        console.log(
          "🆕 Nieuw toegevoegde taak scrollen en highlighten:",
          createdTask.id
        );
        setTimeout(() => {
          setHighlightedTaskId(null);
        }, 3000);
      }
    };

    if (isNewlyCreatedList) {
      // De wachtlogica zit nu in addTaskSafely
      await addTaskSafely();
    } else {
      await addTaskSafely();
    }
  };

  // Header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === "edit" ? "" : "",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (notif) {
              // Als we via notificatie gekomen zijn, altijd terug naar home
              router.push("/");
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          style={{ marginLeft: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      ),
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
  }, [navigation, theme.text, router, notif]);

  // Determine the active list, falling back to default lists if necessary
  const activeList =
    baseMenu.find((m) => m.key === activeListKey) ||
    lists.find((l) => l.key === activeListKey);
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState(activeList?.label || "");

  useEffect(() => {
    if (activeList) {
      setRenameText(activeList.label);
    }
  }, [activeList]);

  // Compute a flag for default lists
  const isDefaultList = baseMenu.some((m) => m.key === activeListKey);

  const saveRename = () => {
    if (isDefaultList) return; // Do not allow renaming default lists
    if (!renameText.trim()) return;
    const updatedLists = lists.map((l) =>
      l.key === activeListKey ? { ...l, label: renameText } : l
    );
    setLists(updatedLists);
    setRenaming(false);
  };

  // --- List title change handler for create mode ---
  const handleListTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // Only in create mode, for new lists
    if (mode === "create" && !listSavedRef.current && newTitle.trim() !== "") {
      const id = Date.now().toString();
      const newList = {
        key: id,
        label: newTitle.trim(),
        color: randomColor(),
        icon: "format-list-bulleted",
        count: 0,
        createdAt: Date.now(),
      };
      setLists([...lists, newList]);
      setActiveListKey(newList.key);
      newListKeyRef.current = id;
      listSavedRef.current = true;
    }
  };

  // Date picker handler for editing a selected task's due date (iOS inline picker)
  const onChangeDate = async (event: any, selectedDate?: Date) => {
    if (event.type !== "set" || !selectedDate) {
      // Picker geannuleerd
      setDatePickerFor(null);
      if (Platform.OS === "android") setShowDatePicker(false);
      return;
    }

    if (datePickerFor === "new") {
      setDueDate(selectedDate);
      if (Platform.OS === "android") setShowDatePicker(false);
      return;
    }

    if (!selectedTask) return;

    const oldDate = selectedTask.dueDate || new Date();
    const newDate = new Date(oldDate);

    if (Platform.OS === "ios") {
      if (showDatePicker) {
        // Als de mode "date" is: vervang jaar/maand/dag
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
      } else {
        // Als de mode "time" is: vervang uren/minuten
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
      }
    } else {
      // Android combineert beide via 2 aparte pickers
      if (mode === "edit") {
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
      }
    }

    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    // Verwijder oude notificatie indien aanwezig
    if (selectedTask.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        selectedTask.notificationId
      );
    }

    // Plan nieuwe notificatie
    const listLabel =
      useAppStore.getState().findListLabel?.(selectedTask.listKey) ??
      "Unknown list";

    const newNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: selectedTask.title,
        body: `Reminder for "${selectedTask.title}" in list "${listLabel}"`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: newDate,
      },
    });

    const updatedTask = {
      ...selectedTask,
      dueDate: newDate,
      notificationId: newNotificationId,
    };

    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === selectedTask.id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
    setDatePickerFor(null);
    if (Platform.OS === "android") setShowDatePicker(false);
  };

  // --- BEGIN Scroll-to-task on notification: pendingNotificationRef + listRef ---
  useEffect(() => {
    // Check: alleen scrollen als scherm actief is, pendingNotificationRef en flatListRef bestaan
    if (
      !navigation.isFocused?.() ||
      !pendingNotificationRef.current ||
      !flatListRef.current
    )
      return;
    // Verzamel alle notificationIds van de taken
    const taskIds = tasks.map((t) => t.notificationId);
    // Zoek het index van de taak die overeenkomt met de notificationId uit de pendingNotificationRef
    const pendingNotifId =
      pendingNotificationRef.current.notification?.request?.identifier;
    const index = taskIds.findIndex((id) => id === pendingNotifId);
    if (index !== -1 && flatListRef.current?.scrollToIndex) {
      console.log("📍 Scrollen naar index:", index);
      flatListRef.current.scrollToIndex({ index, animated: true });
      setHighlightedTaskId(pendingNotifId);
      // Na scrollen: clear de ref zodat deze niet opnieuw triggert
      pendingNotificationRef.current = null;
    }
  }, [tasks, pendingTrigger]);
  // --- END Scroll-to-task on notification ---

  // Render task
  const renderTask = (params: RenderItemParams<Task>) => {
    const { item, drag, isActive } = params;
    // --- All hooks called at the top, unconditionally and in the same order ---
    const checkboxScale = useSharedValue(1);
    const animatedCheckboxStyle = useAnimatedStyle(() => ({
      transform: [{ scale: checkboxScale.value }],
    }));

    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
      opacity.value = withTiming(item.done ? 0.5 : 1, { duration: 300 });
      scale.value = withTiming(item.done ? 0.95 : 1, { duration: 300 });
    }, [item.done]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));
    // --- End hooks ---

    const idx = tasks.findIndex((t) => t.id === item.id);
    // Highlight only if task has dueDate or recurrence
    const hasDateOrRecurrence =
      item.dueDate ||
      (item.recurrence && Object.keys(item.recurrence).length > 0);
    const isHighlighted =
      hasDateOrRecurrence &&
      (highlightedTaskId === item.id ||
        highlightedTaskId === item.notificationId);
    if (isHighlighted) {
      console.log("🎨 Highlight actief voor taak ID:", item.id);
    }
    const dueDateLabel = item.dueDate
      ? new Date(item.dueDate).toLocaleDateString(lang || "en-US", {
          month: "short",
          day: "numeric",
        })
      : "";
    const recurrenceLabel = getRecurrenceLabel(item.recurrence, t);

    const onToggle = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      checkboxScale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      toggleTask(item.id);
    };

    const notify = async () => {
      const listLabel =
        useAppStore.getState().findListLabel?.(item.listKey) ?? "Unknown list";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: `Reminder for "${item.title}" in list "${listLabel}"`,
          sound: true,
        },
        trigger: item.dueDate
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: item.dueDate!,
            }
          : undefined,
      });
    };

    return (
      <Animated.View
        layout={Layout.springify()}
        exiting={FadeOut.duration(300)}
      >
        <View>
          <Animated.View
            style={[
              styles.taskCard,
              {
                backgroundColor: isHighlighted
                  ? "#FEF3C7"
                  : theme.cardBackground,
              },
              animatedStyle, // animatedStyle bevat opacity en scale, alleen hier toepassen
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 1,
                marginLeft: -8,
                marginRight: 4,
              }}
            >
              <Pressable onLongPress={drag} style={{ padding: 4 }} hitSlop={8}>
                <MaterialCommunityIcons
                  name="drag"
                  size={20}
                  color={theme.secondaryText}
                />
              </Pressable>
              <Pressable onPress={onToggle} style={{ padding: 4 }} hitSlop={8}>
                <Animated.View>
                  <Animated.View style={animatedCheckboxStyle}>
                    <MaterialCommunityIcons
                      name={
                        item.done
                          ? "checkbox-marked-circle"
                          : "checkbox-blank-circle-outline"
                      }
                      size={24}
                      color={item.done ? "#10B981" : theme.secondaryText}
                    />
                  </Animated.View>
                </Animated.View>
              </Pressable>
            </View>
            {editingId === item.id ? (
              <TextInput
                value={editingText}
                onChangeText={setEditingText}
                onBlur={() => {
                  // Persist edited title
                  setTasks((old) =>
                    old.map((t) =>
                      t.id === editingId ? { ...t, title: editingText } : t
                    )
                  );
                  // Exit edit mode
                  setEditingId(null);
                  // Scroll back to edited item
                  setTimeout(() => {
                    if (flatListRef.current) {
                      flatListRef.current.scrollToIndex({
                        index: idx,
                        animated: true,
                        viewPosition: 0.5,
                      });
                    }
                    editingTaskRef.current = null;
                  }, 100);
                }}
                onFocus={() => {
                  console.log(
                    "[TextInput onFocus] current scrollOffsetRef:",
                    scrollOffsetRef.current,
                    "keyboardHeight:",
                    keyboardHeight,
                    "editing item index:",
                    idx
                  );
                  setShowDatePicker(false);
                  setDatePickerFor(null);
                  // Save scroll position before editing
                  editScrollPositionRef.current = scrollOffsetRef.current;
                  // scroll this item up above the keyboard with extra margin
                  const extraOffset = keyboardHeight + 20; // add small margin above keyboard
                  if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({
                      index: idx,
                      animated: true,
                      viewPosition: 0,
                      viewOffset: extraOffset,
                    });
                  }
                  // Mark editingTaskRef as editing this task
                  editingTaskRef.current = item.id;
                  setEditingId(item.id);
                  setEditingText(item.title);
                }}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.placeholder,
                    marginRight: 8,
                  },
                ]}
                autoFocus
              />
            ) : (
              <Pressable
                onPress={() => {
                  setShowDatePicker(false);
                  setDatePickerFor(null);
                  // Mark editingTaskRef as editing this task
                  editingTaskRef.current = item.id;
                  setEditingId(item.id);
                  setEditingText(item.title);
                }}
                style={{ flex: 1 }}
              >
                <Text
                  style={[
                    styles.rowText,
                    item.done ? styles.rowDone : {},
                    { color: theme.text },
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            )}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {(dueDateLabel || recurrenceLabel) && (
                <TouchableOpacity
                  onPress={() => {
                    // Open the new DateTimePickerModal for editing this task's date
                    setSelectedTask(item);
                    setShowDatePickerModal(true);
                  }}
                  style={{ marginRight: 8 }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                  <Text style={{ color: theme.secondaryText, fontSize: 12 }}>
                    {dueDateLabel}{" "}
                    {recurrenceLabel ? `· ${recurrenceLabel}` : ""}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Text style={styles.deleteX}>×</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  // filterMode state
  const [filterMode, setFilterMode] = useState<"all" | "open" | "done">("all");

  const visibleTasks = tasks.filter((t) => {
    if (filterMode === "open") return !t.done;
    if (filterMode === "done") return t.done;
    return true; // all
  });

  // Memoized datePickerValue for iOS DateTimePicker
  const datePickerValue = useMemo(() => {
    if (datePickerFor === "new") {
      return dueDate ? new Date(dueDate) : new Date();
    } else if (selectedTask?.dueDate) {
      return new Date(selectedTask.dueDate);
    }
    return new Date();
  }, [datePickerFor, dueDate, selectedTask?.dueDate]);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {mode === "edit" && activeListKey ? (
          <View
            style={[
              styles.headerCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {isDefaultList ? (
              // Static title for default lists
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {activeList?.label || ""}
                </Text>
              </View>
            ) : renaming ? (
              <TextInput
                value={renameText}
                onChangeText={setRenameText}
                onBlur={saveRename}
                onSubmitEditing={saveRename}
                style={[styles.renameInput, { color: theme.text }]}
                autoFocus
              />
            ) : (
              <Pressable onPress={() => setRenaming(true)} style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {activeList?.label || ""}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.headerCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <TextInput
              placeholder={t("NamelesList")}
              value={title}
              onChangeText={handleListTitleChange}
              style={[styles.renameInput, { color: theme.text }]}
              placeholderTextColor={theme.placeholder}
            />
          </View>
        )}

        <View
          style={[styles.inputCard, { backgroundColor: theme.cardBackground }]}
        >
          {/* Kalenderknop voor nieuwe taak aanmaken met aangepaste handler */}
          <TouchableOpacity
            onPress={handleNewTaskCalendarPress}
            style={styles.iconButton}
          >
            <Ionicons name="calendar-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
          <TextInput
            placeholder={t("newTask")}
            value={newTask}
            onChangeText={setNewTask}
            onFocus={() => {
              setShowDatePicker(false);
              setDatePickerFor(null);
            }}
            style={[styles.input, { color: theme.text }]}
            placeholderTextColor={theme.placeholder}
            onSubmitEditing={hookAddTask}
            returnKeyType="done"
          />
          <RecurrencePicker
            initial={recurrence}
            onChange={setRecurrence}
            iconOnly
            style={{
              marginLeft: 8,
              justifyContent: "center",
              alignItems: "center",
              width: 24,
              height: 24,
            }}
          />
          <TouchableOpacity onPress={hookAddTask} style={styles.addBtn}>
            <Ionicons name="add-circle" size={32} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {showDatePicker && Platform.OS === "ios" && (
          <View style={styles.datePickerWrapper}>
            <DateTimePicker
              value={iosDate || datePickerValue}
              mode="date"
              display="inline"
              locale={lang || "en-US"}
              onChange={(event, selectedDate) => {
                if (selectedDate) setIosDate(selectedDate);
              }}
              style={{ width: "100%", marginBottom: -16 }}
            />
            <DateTimePicker
              value={iosTime || datePickerValue}
              mode="time"
              display="compact"
              locale={lang || "en-US"}
              onChange={(event, selectedTime) => {
                if (selectedTime) setIosTime(selectedTime);
              }}
              style={{
                alignSelf: "flex-end",
                marginRight: 20,
                marginTop: -16,
                marginBottom: -16,
              }}
            />
            <TouchableOpacity
              onPress={async () => {
                const finalDate = new Date(iosDate || datePickerValue);
                const finalTime = new Date(iosTime || datePickerValue);
                finalDate.setHours(finalTime.getHours());
                finalDate.setMinutes(finalTime.getMinutes());
                finalDate.setSeconds(0);
                finalDate.setMilliseconds(0);

                if (datePickerFor === "new") {
                  setDueDate(finalDate);
                } else if (selectedTask) {
                  const updatedTask = {
                    ...selectedTask,
                    dueDate: finalDate,
                  };

                  // --- BEGIN Notification handling for iOS date picker ---
                  if (selectedTask.notificationId) {
                    await Notifications.cancelScheduledNotificationAsync(
                      selectedTask.notificationId
                    );
                  }

                  const listLabel =
                    useAppStore
                      .getState()
                      .findListLabel?.(selectedTask.listKey) ?? "Unknown list";

                  const newNotificationId =
                    await Notifications.scheduleNotificationAsync({
                      content: {
                        title: selectedTask.title,
                        body: `Reminder for "${selectedTask.title}" in list "${listLabel}"`,
                        sound: true,
                      },
                      trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: finalDate,
                      },
                    });

                  const updatedTaskWithNotif = {
                    ...updatedTask,
                    notificationId: newNotificationId,
                  };

                  setTasks((prevTasks) =>
                    prevTasks.map((t) =>
                      t.id === selectedTask.id ? updatedTaskWithNotif : t
                    )
                  );
                  setSelectedTask(updatedTaskWithNotif);
                  // --- END Notification handling for iOS date picker ---
                }

                setIosDate(null);
                setIosTime(null);
                setShowDatePicker(false);
                setDatePickerFor(null);
              }}
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

        <View
          style={{ flex: 1 }}
          onLayout={({ nativeEvent }) =>
            setListHeight(nativeEvent.layout.height)
          }
        >
          <DraggableFlatList
            ref={flatListRef}
            data={visibleTasks}
            extraData={highlightedTaskId}
            renderItem={renderTask}
            keyExtractor={(item) => item.id.toString()}
            onDragEnd={({ data }) => setTasks(data)}
            autoscrollThreshold={80}
            autoscrollSpeed={50}
            activationDistance={0}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onScroll={({ nativeEvent }) => {
              const y = nativeEvent.contentOffset.y;
              scrollOffsetRef.current = y;
              console.log("[onScroll] huidige offset:", y);
            }}
            contentContainerStyle={{
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 50 : 0,
            }}
            getItemLayout={(_, index) => ({
              length: 76,
              offset: 76 * index,
              index,
            })}
            initialNumToRender={20}
            onScrollToIndexFailed={(info) => {
              // Debug logs before fallback
              console.warn("❗️Scroll to index failed. Info:", info);
              console.warn("📦 Fallback scroll naar offset 0.");
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
            }}
          />
        </View>

        <Modal visible={showOptions} transparent animationType="slide">
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
              onCopy={async () => {
                setShowOptions(false);
                // Build the share content: title plus task list
                const listTitle =
                  mode === "edit" ? activeList?.label || "" : title;
                const taskLines = tasks
                  .map(
                    (task, i) =>
                      `${i + 1}. ${task.done ? "✅" : "🔲"} ${task.title}`
                  )
                  .join("\n");
                const message = `${listTitle}\n\n${taskLines}`;
                try {
                  if (Platform.OS === "android") {
                    await Share.share({ message });
                  } else {
                    // iOS/modal fallback
                    setShowShareModal(true);
                  }
                } catch (e) {
                  console.error("Share failed:", e);
                }
              }}
              onPrint={async () => {
                const listTitle =
                  mode === "edit" ? activeList?.label || "" : title;
                const taskLines = tasks.map(
                  (task, i) =>
                    `<li>${i + 1}. ${task.done ? "✅" : "🔲"} ${
                      task.title
                    }</li>`
                );

                const html = `
                <html>
                  <body>
                    <h1>${listTitle}</h1>
                    <ul>
                      ${taskLines.join("")}
                    </ul>
                  </body>
                </html>
              `;

                try {
                  await Print.printAsync({ html });
                } catch (error) {
                  console.error("Print failed:", error);
                }

                setShowOptions(false);
              }}
            />
          </View>
        </Modal>

        <Modal visible={showShare} animationType="slide" transparent={false}>
          <ShareModal
            onClose={() => setShowShare(false)}
            listTitle={mode === "edit" ? activeList?.label || "" : title}
            tasks={tasks}
          />
        </Modal>

        <Modal visible={showShareModal} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View style={styles.modal}>
              <TouchableWithoutFeedback
                onPress={() => setShowShareModal(false)}
              >
                <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
              <View style={styles.sheet}>
                <ShareModal
                  listTitle={mode === "edit" ? activeList?.label || "" : title}
                  tasks={tasks}
                  onClose={() => setShowShareModal(false)}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      {/* iOS DateTimePickerModal for editing or creating a task's due date */}
      {Platform.OS === 'ios' && showDatePickerModal && (
        <DateTimePickerModal
          isVisible={showDatePickerModal}
          mode="datetime"
          date={
            selectedTask?.dueDate
              ? new Date(selectedTask.dueDate)
              : newTaskDueDate ?? new Date()
          }
          display="inline"
          onConfirm={handleConfirm}
          onCancel={() => setShowDatePickerModal(false)}
          is24Hour={true}
          locale={langLocale}
          confirmTextIOS={t("save")}
          cancelTextIOS={t("cancel")}
        />
      )}
    </SafeAreaView>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
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
    backgroundColor: "transparent",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
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
    fontSize: 24,
    padding: 8,
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
    marginTop: -10,
    marginBottom: -6,
    width: "100%",
    paddingHorizontal: 16,
  },
  dateDoneButton: {
    marginTop: -10,
    marginBottom: 10,
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

