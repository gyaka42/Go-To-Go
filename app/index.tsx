import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "../components/BottomBar";
import MenuItem from "../components/MenuItem";
import Header from "../components/Header";
import { useContext } from "react";
import { ListsContext, ListItem } from "../context/ListsContext";

const baseMenu: ListItem[] = [
  { key: "mijnDag", icon: "weather-sunny", label: "Mijn dag", count: null },
  { key: "belangrijk", icon: "star-outline", label: "Belangrijk", count: 66 },
  {
    key: "gepland",
    icon: "calendar-blank-outline",
    label: "Gepland",
    count: null,
  },
  { key: "taken", icon: "check-circle-outline", label: "Taken", count: null },
];

export default function HomeScreen() {
  const router = useRouter();

  const handlePress = (item) => {
    // navigeer naar detail of screen
    router.push(`/task/${item.key}`);
  };

  const { lists } = useContext(ListsContext);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-gray-50">
      <Header
        username="Gökhan Yaka"
        avatarSource={require("../assets/avatar.png")}
        onSearch={() => console.log("Search pressed")}
      />

      <FlatList
        data={[...baseMenu, ...lists]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <MenuItem
            iconName={item.icon}
            label={item.label}
            count={item.count}
            onPress={() => handlePress(item)}
          />
        )}
      />

      <BottomBar onNewList={() => router.push("/new-list")} />
    </SafeAreaView>
  );
}
