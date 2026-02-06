import React, { useEffect, useState } from "react";
import {
  View,
  Pressable,
  Text,
  useColorScheme,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "../store/appStore";

interface Props {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function CustomDateTimePickerModal({
  visible,
  date,
  onConfirm,
  onCancel,
}: Props) {
  const colorScheme = useColorScheme();
  const background = colorScheme === "dark" ? "#1c1c1e" : "#fff";
  const [tempDate, setTempDate] = useState(date);

  const lang = useAppStore((s) => s.lang);
  const t = useAppStore((s) => s.t);

  const localeMap: Record<string, string> = {
    en: "en-US",
    nl: "nl-NL",
    tr: "tr-TR",
    de: "de-DE",
    es: "es-ES",
    fr: "fr-FR",
  };
  const langLocale = localeMap[lang] || "en-US";

  useEffect(() => {
    if (visible) {
      setTempDate(date);
    }
  }, [visible, date]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.center}>
        <Pressable
          onPress={() => {}}
          style={[styles.card, { backgroundColor: background }]}
        >
          <View style={{ marginBottom: 8 }}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  const newDate = new Date(tempDate);
                  newDate.setFullYear(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate()
                  );
                  setTempDate(newDate);
                }
              }}
              locale={langLocale}
              themeVariant={colorScheme === "dark" ? "dark" : "light"}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <Text style={{ marginRight: 12 }}>{t("Time")}</Text>
              <DateTimePicker
                value={tempDate}
                mode="time"
                display={Platform.OS === "ios" ? "default" : "spinner"}
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    const newDate = new Date(tempDate);
                    newDate.setHours(selectedTime.getHours());
                    newDate.setMinutes(selectedTime.getMinutes());
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);
                    setTempDate(newDate);
                  }
                }}
                locale={langLocale}
                themeVariant={colorScheme === "dark" ? "dark" : "light"}
              />
            </View>
          </View>
          <Pressable
            onPress={() => onConfirm(tempDate)}
            style={{ marginTop: 12, alignSelf: "flex-end" }}
          >
            <Text style={{ color: "#007aff", fontSize: 16 }}>{t("save")}</Text>
          </Pressable>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
});
