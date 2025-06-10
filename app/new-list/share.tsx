import React, { FC, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../context/ThemeContext";

interface Props {
  listTitle: string;
  tasks: { id: string; title: string; done: boolean }[];
  onClose: () => void;
}

const ShareModal: FC<Props> = ({ listTitle, tasks, onClose }) => {
  const { scheme } = useContext(ThemeContext);
  const iconColor = scheme === "dark" ? "#FFF" : "#000";
  const styles = getStyles(scheme);
  const [email, setEmail] = useState("");

  const sendInvite = async () => {
    if (!email.trim()) return;
    // Bouw de body: lijstnaam + alle taken
    const bodyLines = [
      `Je bent uitgenodigd voor de takenlijst: "${listTitle}".`,
      ``,
      `Taken:`,
      ...tasks.map((t, i) => `${i + 1}. ${t.title} [${t.done ? "✓" : "✗"}]`),
    ];
    const subject = `Uitnodiging: ${listTitle}`;
    const body = encodeURIComponent(bodyLines.join("\n"));
    const mailto = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;

    // Probeer de mailto-link te openen
    try {
      const supported = await Linking.canOpenURL(mailto);
      if (!supported) {
        Alert.alert("Fout", "Kan de mail-app niet openen op dit apparaat.");
        return;
      }
      await Linking.openURL(mailto);
      onClose();
    } catch (err) {
      Alert.alert("Fout", "Er is iets misgegaan bij het openen van mail.");
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lijst delen: {listTitle}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <TextInput
          placeholder="E-mailadres"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.button, !email.trim() && { opacity: 0.5 }]}
          onPress={sendInvite}
          disabled={!email.trim()}
        >
          <Text style={styles.buttonText}>Verstuur uitnodiging</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShareModal;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      backgroundColor: scheme === "dark" ? "#000" : "#FFF",
      paddingTop: 16,
      paddingBottom: 16,
      paddingHorizontal: 16,
      margin: -16,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderColor: scheme === "dark" ? "#000" : "#FFF",
      borderWidth: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: scheme === "dark" ? "#333" : "#E5E7EB",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: scheme === "dark" ? "#FFF" : "#111",
    },
    content: {
      padding: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: scheme === "dark" ? "#555" : "#E5E7EB",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: scheme === "dark" ? "#FFF" : "#000",
      backgroundColor: scheme === "dark" ? "#222" : "#FFF",
    },
    button: {
      backgroundColor: "#2563EB",
      padding: 12,
      borderRadius: 6,
      alignItems: "center",
    },
    buttonText: {
      color: "#FFF",
      fontWeight: "600",
    },
  });
