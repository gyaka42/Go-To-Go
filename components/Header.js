import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "../store/appStore";

export default function Header({
  username,
  avatarSource,
  onSearch,
  onAvatarPress,
}) {
  const scheme = useAppStore((s) => s.scheme);
  const isDark = scheme === "dark";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isDark ? "#000" : "#FFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Avatar nu aanklikbaar */}
        <TouchableOpacity onPress={onAvatarPress}>
          <Image
            source={avatarSource}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? "#FFF" : "#111827",
          }}
        >
          {username}
        </Text>
      </View>
      <TouchableOpacity onPress={onSearch} style={{ padding: 8 }}>
        <Ionicons name="search" size={24} color={isDark ? "#FFF" : "#333"} />
      </TouchableOpacity>
    </View>
  );
}
