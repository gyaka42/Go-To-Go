import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "../store/appStore";

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
  const scheme = useAppStore((s) => s.scheme);

  const isDark = scheme === "dark";
  const bgColor = isDark ? "#000" : "#FFF";
  const textColor = isDark ? "#FFF" : "#333";
  const iconColor = isDark ? "#FFF" : "#333";

  const t = useAppStore((s) => s.t);

  return (
    <View style={[styles.sheet, style, { backgroundColor: bgColor }]}>
      <Text style={[styles.modalTitle, { color: textColor }]}>
        {t("options")}
      </Text>
      <TouchableOpacity style={styles.row} onPress={onSortAlphabetical}>
        <Ionicons name="swap-vertical" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>
          {t("sortAlfa")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onSortByDate}>
        <Ionicons name="calendar" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>
          {t("sortDate")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onCopy}>
        <Ionicons name="share-social-outline" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>
          {t("copySend")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onPrint}>
        <Ionicons name="print-outline" size={24} color={iconColor} />
        <Text style={[styles.rowText, { color: textColor }]}>{t("print")}</Text>
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
