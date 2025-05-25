// components/TodoItem.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function TodoItem({ title, done, onToggle, onDelete }) {
  return (
    <View className="flex-row items-center justify-between p-2 border-b border-gray-200 bg-white">
      <TouchableOpacity onPress={onToggle} className="flex-1" hitSlop={8}>
        <Text className={done ? "line-through text-gray-500" : "text-gray-900"}>
          {title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Text className="text-red-500 font-bold">✕</Text>
      </TouchableOpacity>
    </View>
  );
}
