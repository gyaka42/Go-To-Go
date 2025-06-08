import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  useColorScheme,
  StyleProp,
} from "react-native";

type Mode = "all" | "open" | "done";

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
  style?: StyleProp<ViewStyle>;
}

export default function FilterBar({ mode, onChange, style }: Props) {
  const scheme = useColorScheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: scheme === "dark" ? "#1F2937" : "#FFF" },
        style,
      ]}
    >
      {[
        { key: "all", label: "Alles" },
        { key: "open", label: "Open" },
        { key: "done", label: "Voltooid" },
      ].map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[
            styles.button,
            mode === f.key && {
              backgroundColor: scheme === "dark" ? "#2563EB" : "#3B82F6",
            },
          ]}
          onPress={() => onChange(f.key as Mode)}
        >
          <Text
            style={[
              styles.text,
              { color: scheme === "dark" ? "#D1D5DB" : "#333" },
              mode === f.key && { color: "#FFF", fontWeight: "600" },
            ]}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonActive: {
    backgroundColor: "#3B82F6",
  },
  text: {
    fontSize: 14,
    color: "#333",
  },
  textActive: {
    color: "#FFF",
    fontWeight: "600",
  },
});
