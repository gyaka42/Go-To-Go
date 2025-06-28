// components/DateTimePickerModal.tsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Pressable,
  Text,
  useColorScheme,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "../store/appStore";

type Props = {
  visible: boolean;
  date: Date;
  onChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};

export default function DateTimePickerModal({
  visible,
  date,
  onChange,
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
      setTempDate(date); // Reset naar originele datum bij openen
    }
  }, [visible, date]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          paddingTop: 24,
          paddingHorizontal: 24,
          paddingBottom: 48
        }}
        onPress={onCancel}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: background,
            borderRadius: 12,
            padding: 16,
            elevation: 5,
          }}
        >
          {date instanceof Date && !isNaN(date.getTime()) && (
            <View style={{ marginBottom: 8 }}>
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, selectedDate) => {
                  if (selectedDate) onChange(selectedDate);
                }}
                locale={langLocale}
                themeVariant={colorScheme === "dark" ? "dark" : "light"}
              />
            </View>
          )}
          <Pressable
            onPress={() => onConfirm(tempDate)}
            style={{ marginTop: 12, alignSelf: "flex-end" }}
          >
            <Text style={{ color: "#007aff", fontSize: 16 }}>{t("Done")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
