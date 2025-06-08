// app/onboarding.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Onboarding() {
  const [name, setName] = useState("");
  const router = useRouter();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = {
    wrapperBg: isDark ? "#1F2937" : "#F9FAFB",
    titleColor: isDark ? "#F9FAFB" : "#111827",
    subtitleColor: isDark ? "#D1D5DB" : "#4B5563",
    inputBg: isDark ? "#374151" : "#FFFFFF",
    inputBorder: isDark ? "#4B5563" : "#D1D5DB",
    inputText: isDark ? "#F9FAFB" : "#111827",
    placeholder: isDark ? "#9CA3AF" : "#888",
    buttonBg: "#3B82F6",
    buttonText: "#FFFFFF",
  };

  const saveNameAndContinue = async () => {
    if (name.trim().length === 0) return;
    await AsyncStorage.setItem("user_name", name.trim());
    router.replace("/"); // Navigeer naar home (index)
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.flex}
    >
      <View style={[styles.wrapper, { backgroundColor: theme.wrapperBg }]}>
        {/* Korte Titel */}
        <Text style={[styles.title, { color: theme.titleColor }]}>
          Welkom Bij
        </Text>

        {/* Afbeelding met afgeronde hoeken */}
        <Image
          source={require("../assets/splash-icon.png")}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Instructietekst */}
        <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
          Vul hieronder je voornaam in om te beginnen
        </Text>

        {/* Invoerveld */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.inputText,
            },
          ]}
          placeholder="Bijv. Gökhan"
          placeholderTextColor={theme.placeholder}
          value={name}
          onChangeText={setName}
          returnKeyType="done"
          onSubmitEditing={saveNameAndContinue}
        />

        {/* Knop */}
        <TouchableOpacity
          style={[
            styles.button,
            { opacity: name.trim().length === 0 ? 0.6 : 1 },
          ]}
          onPress={saveNameAndContinue}
          disabled={name.trim().length === 0}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            Verder
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 24,
    borderRadius: 16, // Afgeronde hoeken
    overflow: "hidden", // Zorgt dat de afbeelding netjes rond wordt bijgesneden
    // optioneel: schaduw-effect
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
