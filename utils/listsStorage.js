// utils/listsStorage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const LISTS_KEY = "user_lists";

export async function loadLists() {
  const json = await AsyncStorage.getItem(LISTS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveLists(lists) {
  await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}
