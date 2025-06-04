import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

type Mode = "all" | "open" | "done";

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
  style?: ViewStyle;
}

export default function FilterBar({ mode, onChange, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      {[
        { key: "all", label: "Alles" },
        { key: "open", label: "Open" },
        { key: "done", label: "Voltooid" },
      ].map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.button, mode === f.key && styles.buttonActive]}
          onPress={() => onChange(f.key as Mode)}
        >
          <Text style={[styles.text, mode === f.key && styles.textActive]}>
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
    paddingHorizontal: 16,
    paddingBottom: 8,
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
