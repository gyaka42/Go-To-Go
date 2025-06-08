import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#000" : "#FFF";
  const textColor = isDark ? "#FFF" : "#333";
  const iconColor = isDark ? "#FFF" : "#333";

  return (
    <View style={[styles.sheet, style, { backgroundColor: bgColor }]}>
      <Text style={[styles.modalTitle, { color: textColor }]}>Opties</Text>
      <TouchableOpacity style={styles.row} onPress={onSortAlphabetical}>
        <Ionicons name="swap-vertical" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>
          Sorteer alfabetisch
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onSortByDate}>
        <Ionicons name="calendar" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>
          Sorteer op datum
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onCopy}>
        <Ionicons name="share-social-outline" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>
          Kopie verzenden
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onPrint}>
        <Ionicons name="print-outline" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>
          Lijst afdrukken
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
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
  rowText: { marginLeft: 12, fontSize: 16 },
});
