import * as MailComposer from "expo-mail-composer";
import React, { FC, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../store/appStore";

interface Props {
  listTitle: string;
  tasks: { id: string; title: string; done: boolean }[];
  onClose: () => void;
}

const ShareModal: FC<Props> = ({ listTitle, tasks, onClose }) => {
  const t = useAppStore((s) => s.t);
  const scheme = useAppStore((s) => s.scheme);
  const iconColor = scheme === "dark" ? "#FFF" : "#000";
  const styles = getStyles(scheme);
  const [email, setEmail] = useState("");

  const sendInvite = async () => {
    if (!email.trim()) return;
    // Construct deep-link URL for importing the list in-app
    const deepLinkUrl = `gotogo://import?title=${encodeURIComponent(
      listTitle
    )}&tasks=${encodeURIComponent(JSON.stringify(tasks))}`;
    const subject = t("shareListSubject", { listTitle });
    const htmlBody = `
      <h2>${t("shareList")} "${listTitle}"</h2>
      <p>${t("shareListIntro")}</p>
      <ul>
        ${tasks
          .map(
            (t, i) => `<li>${i + 1}. ${t.done ? "✅" : "🔲"} ${t.title}</li>`
          )
          .join("")}
      </ul>
      <p>
        <a href="${deepLinkUrl}">
          ${t("openInApp")}
        </a>
      </p>
    `;
    try {
      await MailComposer.composeAsync({
        subject,
        recipients: [email.trim()],
        body: htmlBody,
        isHtml: true,
      });
      onClose();
    } catch (err) {
      Alert.alert("Fout", t("shareError"));
      console.error(err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t("shareList")} {listTitle}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <TextInput
          placeholder="E-mail"
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
          <Text style={styles.buttonText}>{t("send")}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ShareModal;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: scheme === "dark" ? "#000" : "#FFF",
      paddingTop: 16,
      paddingBottom: 16,
      paddingHorizontal: 16,
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
