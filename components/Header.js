// components/Header.js
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header({
  username,
  avatarSource,
  onSearch,
  onAvatarPress,
}) {
  return (
    <View className="flex-row items-center justify-between p-4 bg-white">
      <View className="flex-row items-center">
        {/* Avatar nu aanklikbaar */}
        <TouchableOpacity onPress={onAvatarPress}>
          <Image source={avatarSource} className="w-8 h-8 rounded-full mr-3" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">{username}</Text>
      </View>
      <TouchableOpacity onPress={onSearch} className="p-2">
        <Ionicons name="search" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}
