import { useLocalSearchParams } from "expo-router";
import { View, Text, Button } from "react-native";
import { loadTodos, saveTodos } from "../../utils/storage";
import { useEffect, useState } from "react";

export default function TaskDetail() {
  const { id } = useLocalSearchParams();
  const [todo, setTodo] = useState(null);

  useEffect(() => {
    loadTodos().then((list) => {
      const found = list.find((t) => t.id === id);
      setTodo(found || { id, title: "Niet gevonden", done: false });
    });
  }, [id]);

  if (!todo) return null;

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">{todo.title}</Text>
      <Text>Status: {todo.done ? "✓ voltooid" : "❌ open"}</Text>
      {/* evt. hier bewerken, verwijderen, etc. */}
      <Button title="Terug" onPress={() => history.back()} />
    </View>
  );
}
