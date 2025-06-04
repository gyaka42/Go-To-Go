import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  onClose: () => void;
  onSortAlphabetical: () => void;
  onSortByDate: () => void;
  onCopy: () => void;
  onPrint: () => void;
  style?: any;
}

export default function OptionsSheet({
  onClose,
  onSortAlphabetical,
  onSortByDate,
  onCopy,
  onPrint,
  style,
}: Props) {
  return (
    <View style={[styles.sheet, style]}>
      <Text style={styles.modalTitle}>Opties</Text>
      <TouchableOpacity style={styles.row} onPress={onSortAlphabetical}>
        <Ionicons name="swap-vertical" size={24} color="#333" />
        <Text style={styles.rowText}>Sorteer alfabetisch</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onSortByDate}>
        <Ionicons name="calendar" size={24} color="#333" />
        <Text style={styles.rowText}>Sorteer op datum</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onCopy}>
        <Ionicons name="share-social-outline" size={24} color="#333" />
        <Text style={styles.rowText}>Kopie verzenden</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onPrint}>
        <Ionicons name="print-outline" size={24} color="#333" />
        <Text style={styles.rowText}>Lijst afdrukken</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowText: { marginLeft: 12, fontSize: 16, color: "#333" },
});
