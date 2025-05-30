// app/new-list/options.tsx
import React, { FC } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Props interface voor OptionsModal
interface Props {
  onClose: () => void;
  onSortAlphabetical: () => void;
  onSortByDate: () => void;
  onCopy: () => void;
  onPrint: () => void;
}

const OptionsModal: FC<Props> = ({
  onClose,
  onSortAlphabetical,
  onSortByDate,
  onCopy,
  onPrint,
}) => {
  return (
    <View>
      <View style={styles.content}>
        <Text style={styles.title}>Opties</Text>

        <TouchableOpacity style={styles.row} onPress={onSortAlphabetical}>
          <Ionicons name="swap-vertical" size={24} color="#333" />
          <Text style={styles.rowText}>Sorteer alfabetisch</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={onSortByDate}>
          <Ionicons name="calendar" size={24} color="#333" />
          <Text style={styles.rowText}>Sorteer op datum</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={onCopy}>
          <Ionicons name="copy-outline" size={24} color="#333" />
          <Text style={styles.rowText}>Kopie verzenden</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={onPrint}>
          <Ionicons name="print-outline" size={24} color="#333" />
          <Text style={styles.rowText}>Lijst afdrukken</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OptionsModal;

const styles = StyleSheet.create({
  content: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
});
