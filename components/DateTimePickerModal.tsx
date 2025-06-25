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
          padding: 24,
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
            <DateTimePicker
              value={tempDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) onChange(selectedDate);
              }}
              locale="nl-NL"
              themeVariant={colorScheme === "dark" ? "dark" : "light"}
            />
          )}
          <Pressable
            onPress={() => onConfirm(tempDate)}
            style={{ marginTop: 12, alignSelf: "flex-end" }}
          >
            <Text style={{ color: "#007aff", fontSize: 16 }}>Gereed</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
