import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BottomBar({ onNewList }) {
  return (
    <View className="flex-row justify-between items-center px-8 py-4 bg-white border-t border-gray-200 mb-4">
      <TouchableOpacity onPress={onNewList} className="flex-row items-center">
        <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
        <Text className="ml-2 text-blue-600 font-semibold">Nieuwe lijst</Text>
      </TouchableOpacity>
    </View>
  );
}
