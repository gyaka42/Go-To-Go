import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function MenuItem({ iconName, label, count, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-1 px-4"
    >
      <View className="flex-row items-center">
        <MaterialCommunityIcons
          name={iconName}
          size={20}
          color="#4B5563"
          className="mr-3"
          style={{ transform: [{ translateY: -4 }] }}
        />
        <Text
          className="text-base text-gray-800"
          style={{ transform: [{ translateY: -4 }] }}
        >
          {label}
        </Text>
      </View>
      {count != null && (
        <View
          className="bg-blue-500 rounded-full px-2 py-0.5"
          style={{ transform: [{ translateY: -4 }] }}
        >
          <Text className="text-xs font-semibold text-white">{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
