// app/new-list/share.tsx
import React, { FC, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  listTitle: string;
  tasks: { id: string; title: string; done: boolean }[];
  onClose: () => void;
}

const ShareModal: FC<Props> = ({ listTitle, tasks, onClose }) => {
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
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lijst delen: {listTitle}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#111" />
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
      </SafeAreaView>
    </View>
  );
};

export default ShareModal;

const styles = StyleSheet.create({
  container: { backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111" },
  content: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "600" },
});
