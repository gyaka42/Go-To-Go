// app/search.tsx
import React, { useState, useContext, useEffect } from "react";
import {
  SafeAreaView,
  TextInput,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ListsContext } from "../context/ListsContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseMenu = [
  { key: "mijnDag", icon: "weather-sunny", label: "Mijn dag" },
  { key: "belangrijk", icon: "star-outline", label: "Belangrijk" },
  { key: "gepland", icon: "calendar-blank-outline", label: "Gepland" },
  { key: "taken", icon: "check-circle-outline", label: "Taken" },
];

interface SearchResult {
  id: string;
  title: string;
  done: boolean;
  listKey: string;
  listLabel: string;
}

export default function SearchScreen() {
  const { lists, tasksMap } = useContext(ListsContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();

    (async () => {
      const allLists = [...baseMenu, ...lists];
      const matches: SearchResult[] = [];
      for (const lst of allLists) {
        // custom-lijsten in context, anders uit AsyncStorage
        let tasks = tasksMap[lst.key];
        if (tasks === undefined) {
          const json = await AsyncStorage.getItem(`todos_${lst.key}`);
          tasks = json ? JSON.parse(json) : [];
        }
        tasks.forEach((t) => {
          if (t.title.toLowerCase().includes(q)) {
            matches.push({
              id: t.id,
              title: t.title,
              done: t.done,
              listKey: lst.key,
              listLabel: lst.label,
            });
          }
        });
      }
      setResults(matches);
    })();
  }, [query, lists, tasksMap]);

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Zoek in al je taken…"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id + "@" + item.listKey}
        ListEmptyComponent={() =>
          query.trim() ? (
            <Text style={styles.empty}>Geen resultaten</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.replace(`/list/${item.listKey}`)}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.listLabel}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  title: { fontSize: 16, color: "#111" },
  sub: { fontSize: 12, color: "#666" },
  empty: { textAlign: "center", marginTop: 32, color: "#666" },
});
