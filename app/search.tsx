// app/search.tsx
import React, { useState, useContext, useEffect } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ListsContext } from "../context/ListsContext";
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
  const router = useRouter();
  const { lists, tasksMap } = useContext(ListsContext);
  const baseMenu = useBaseMenu();
  const { scheme } = useContext(ThemeContext);
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "open" | "done">("all");

  // Search logic
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

  // Filter logic
  const filteredResults = results.filter((item) => {
    if (filterMode === "open") return !item.done;
    if (filterMode === "done") return item.done;
    return true;
  });

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: scheme === "dark" ? "#000" : "#F3F4F6" },
      ]}
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: scheme === "dark" ? "#222" : "#FFF",
              color: scheme === "dark" ? "#FFF" : "#000",
            },
          ]}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={scheme === "dark" ? "#888" : "#999"}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.filterContainer}>
        <FilterBar mode={filterMode} onChange={setFilterMode} />
      </View>

      <FlatList
        data={filteredResults}
        keyExtractor={(item) => `${item.id}@${item.listKey}`}
        contentContainerStyle={
          filteredResults.length
            ? { paddingBottom: 16 }
            : { flex: 1, justifyContent: "center" }
        }
        ListEmptyComponent={() =>
          query.trim() ? (
            <Text
              style={[
                styles.emptyText,
                { color: scheme === "dark" ? "#AAA" : "#666" },
              ]}
            >
              {t("noResult")}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: scheme === "dark" ? "#333" : "#FFF" },
            ]}
            onPress={() => router.replace(`/list/${item.listKey}`)}
          >
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: scheme === "dark" ? "#FFF" : "#111827" },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: scheme === "dark" ? "#CCC" : "#6B7280" },
                ]}
              >
                {item.listLabel}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: item.done ? "#10B981" : "#EF4444",
                },
              ]}
            >
              <Text style={styles.badgeText}>
                {item.done ? t("filterDone") : t("filterOpen")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
  },
});
