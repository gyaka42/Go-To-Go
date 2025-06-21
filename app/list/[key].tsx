// app/list/[key].tsx

import React from "react";
import { useLocalSearchParams } from "expo-router";
import ListEditor from "../../components/ListEditor";

export default function ListDetail() {
  const { key } = useLocalSearchParams();
  const listKey = Array.isArray(key) ? key[0] : key;
  return <ListEditor mode="edit" listKey={listKey} />;
}
