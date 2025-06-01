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
  // toegevoegde filterMode state
  const [filterMode, setFilterMode] = useState<"all" | "open" | "done">("all");
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

  // Filter resultaten op basis van filterMode
  const filteredResults = results.filter((t) => {
    if (filterMode === "open") return !t.done;
    if (filterMode === "done") return t.done;
    return true;
  });

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
      {/* Filter knoppenrij */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode("all")}
        >
          <Text
            style={[
              styles.filterText,
              filterMode === "all" && styles.filterTextActive,
            ]}
          >
            Alles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === "open" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode("open")}
        >
          <Text
            style={[
              styles.filterText,
              filterMode === "open" && styles.filterTextActive,
            ]}
          >
            Open
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === "done" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode("done")}
        >
          <Text
            style={[
              styles.filterText,
              filterMode === "done" && styles.filterTextActive,
            ]}
          >
            Voltooid
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredResults}
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
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
  filterTextActive: {
    color: "#FFF",
    fontWeight: "600",
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
