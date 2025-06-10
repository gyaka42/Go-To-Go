// components/BottomBar.js
import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "..//context/LanguageContext";
import { ThemeContext } from "../context/ThemeContext";

const getStyles = (scheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: scheme === "dark" ? "#1F2937" : "#FFF",
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      // iOS shadow
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      // Android elevation
      elevation: 2,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
    },
    buttonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: "600",
      color: scheme === "dark" ? "#3B82F6" : "#3B82F6",
    },
  });

export default function BottomBar({ onNewList }) {
  const { lang, setLang, t } = useLanguage();
  const { scheme } = useContext(ThemeContext);
  const styles = getStyles(scheme);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onNewList} style={styles.button}>
        <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
        <Text style={styles.buttonText}>{t("NewList")}</Text>
      </TouchableOpacity>
    </View>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#FFF",
//     borderRadius: 12,
//     marginHorizontal: 16,
//     marginBottom: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     // iOS-schaduw
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//     // Android-elevation
//     elevation: 2,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   button: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   buttonText: {
//     marginLeft: 8,
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#3B82F6",
//   },
// });
