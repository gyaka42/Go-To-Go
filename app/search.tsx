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
import {} from "react-native";
import { ListsContext } from "../context/ListsContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBaseMenu } from "../utils/menuDefaults";
import FilterBar from "../components/FilterBar";
import { ThemeContext } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

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

  const { scheme } = useContext(ThemeContext);
  const baseMenu = useBaseMenu();
  const styles = getStyles(scheme);

  const { t } = useLanguage();

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
        placeholder={t("searchPlaceholder")}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <FilterBar
        mode={filterMode}
        onChange={setFilterMode}
        style={styles.filterBar}
      />

      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id + "@" + item.listKey}
        ListEmptyComponent={() =>
          query.trim() ? (
            <Text style={styles.empty}>{t("noResult")}</Text>
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

function getStyles(scheme: "light" | "dark" | null) {
  const isDark = scheme === "dark";
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#000" : "#FFF" },
    input: {
      borderWidth: 1,
      borderColor: isDark ? "#555" : "#DDD",
      borderRadius: 8,
      padding: 12,
      margin: 16,
      color: isDark ? "#FFF" : "#000",
    },
    filterBar: {
      marginHorizontal: 16,
      marginBottom: 12,
      alignItems: "center",
      paddingVertical: 4,
    },
    row: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: isDark ? "#333" : "#EEE",
    },
    title: { fontSize: 16, color: isDark ? "#FFF" : "#111" },
    sub: { fontSize: 12, color: isDark ? "#AAA" : "#666" },
    empty: {
      textAlign: "center",
      marginTop: 32,
      color: isDark ? "#AAA" : "#666",
    },
  });
}
