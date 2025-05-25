import { useState, useRef } from "react";
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useContext, useEffect } from "react";
import TodoItem from "../components/TodoItem";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ListsContext } from "../context/ListsContext";
import { SwipeListView } from "react-native-swipe-list-view";

export default function NewListScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const inputRef = useRef(null);

  const { setLists } = useContext(ListsContext);
  const navigation = useNavigation();

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newTask, done: false },
    ]);
    setNewTask("");
  };

  // Toggle task completion
  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      if (title.trim()) {
        setLists((prev) => [
          ...prev,
          {
            key: Date.now().toString(),
            icon: "format-list-bulleted",
            label: title,
            count: null,
          },
        ]);
      }
    });
    return unsubscribe;
  }, [navigation, title, setLists]);

  return (
    <SafeAreaView
      edges={["left", "right", "top"]}
      className="flex-1 bg-neutral-200"
    >
      {/* Header TextInput for list name */}
      <View className="px-4 py-2">
        <TextInput
          ref={inputRef}
          value={title}
          onChangeText={setTitle}
          placeholder="Naamloze lijst"
          placeholderTextColor="#000000"
          className="text-black text-3xl font-bold"
        />
      </View>

      {/* Task list (with swipe-to-delete) */}
      <View style={{ flex: 1 }}>
        <SwipeListView
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItem
              title={item.title}
              done={item.done}
              onToggle={() => toggleTask(item.id)}
              onDelete={() => deleteTask(item.id)}
            />
          )}
          renderHiddenItem={({ item }) => (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "flex-end",
                backgroundColor: "#ef4444",
              }}
            >
              <TouchableOpacity
                style={{ padding: 16 }}
                onPress={() => deleteTask(item.id)}
              >
                <MaterialIcons name="delete" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
          disableRightSwipe={true}
          rightOpenValue={-75}
          previewRowKey={tasks.length ? tasks[0].id : null}
          previewOpenValue={-40}
          previewOpenDelay={3000}
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      {/* Add task bar at bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView
          edges={["bottom"]}
          className=" bg-rose-300 rounded-s px-8 pb-2 items-center"
        >
          <TouchableOpacity
            onPress={addTask}
            className="mt-6 flex-row items-center px-24 py-3 bg-gray-200 rounded-lg"
          >
            <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
            <Text className="ml-2 text-blue-600 font-semibold">
              Taak toevoegen
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
