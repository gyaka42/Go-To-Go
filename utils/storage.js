import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "todos";

export async function loadTodos() {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveTodos(todos) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
