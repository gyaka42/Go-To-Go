import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Button,
  TextInput,
  StyleSheet,
  Switch,
} from "react-native";
import { RRule, Options as RRuleOptions, Frequency } from "rrule";
import { useAppStore } from "../store/appStore";
import useModalQueue from "../utils/useModalQueue";

type Props = {
  initial?: Partial<RRuleOptions>;
  onChange: (opts?: Partial<RRuleOptions>) => void;
  iconOnly?: boolean;
  style?: object;
};

export default function RecurrencePicker({
  initial,
  onChange,
  iconOnly,
  style,
}: Props) {
  const t = useAppStore((s) => s.t);
  const dayLabels = [
    t("mo"),
    t("tu"),
    t("we"),
    t("th"),
    t("fr"),
    t("sa"),
    t("su"),
  ];
  const [menuVisible, setMenuVisible] = useState(false);
  const [customVisible, setCustomVisible] = useState(false);

  const closeAllModals = () => {
    setMenuVisible(false);
    setCustomVisible(false);
  };

  const openWithQueue = useModalQueue(
    [() => menuVisible, () => customVisible],
    closeAllModals
  );

  const [interval, setInterval] = useState(String(initial?.interval ?? 1));
  const [freq, setFreq] = useState<Frequency>(
    initial?.freq ?? Frequency.WEEKLY
  );
  const [byweekday, setByweekday] = useState<number[]>(
    Array.isArray(initial?.byweekday) ? (initial!.byweekday as number[]) : []
  );

  const [optsState, setOptsState] = useState<Partial<RRuleOptions> | undefined>(
    initial
  );
  useEffect(() => {
    setOptsState(initial);
  }, [initial]);

  const scheme = useAppStore((s) => s.scheme);
  const setMode = useAppStore((s) => s.setMode);

  // Herleid label
  const deriveType = (
    opts?: Partial<RRuleOptions>
  ): "none" | "daily" | "weekly" | "monthly" | "custom" => {
    if (!opts || !opts.freq) {
      return "none";
    }
    const interval = opts.interval ?? 1;
    if (opts.freq === Frequency.DAILY && interval === 1) {
      return "daily";
    }
    if (opts.freq === Frequency.WEEKLY && interval === 1) {
      return "weekly";
    }
    if (opts.freq === Frequency.MONTHLY && interval === 1) {
      return "monthly";
    }
    return "custom";
  };
  const labels = {
    none: t("noRepeat"),
    daily: t("daily"),
    weekly: t("weekly"),
    monthly: t("monthly"),
    custom: t("custom"),
  };
  const type = deriveType(optsState);
  const label = labels[type];

  // Presets
  const handlePreset = (t: "none" | "daily" | "weekly" | "monthly") => {
    setMenuVisible(false);
    if (t === "none") {
      setOptsState(undefined);
      return onChange(undefined);
    }
    const opts: Partial<RRuleOptions> = {
      interval: 1,
      freq:
        t === "daily"
          ? Frequency.DAILY
          : t === "weekly"
          ? Frequency.WEEKLY
          : Frequency.MONTHLY,
    };
    setOptsState(opts);
    onChange(opts);
  };

  const toggleDay = (d: number) => {
    setByweekday((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    );
  };

  // Opslaan custom
  const saveCustom = () => {
    const customOpts = { freq, interval: Number(interval) || 1, byweekday };
    setOptsState(customOpts);
    onChange(customOpts);
    setCustomVisible(false);
    setMenuVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          {
            backgroundColor: scheme === "dark" ? "#1F2937" : "#fff",
            borderColor: iconOnly
              ? "#2563EB"
              : scheme === "dark"
              ? "#fff"
              : "#ccc",
          },
          style,
        ]}
        onPress={() => openWithQueue(() => setMenuVisible(true))}
      >
        {iconOnly ? (
          <Ionicons name="repeat" size={18} color="#2563EB" />
        ) : (
          <Text
            style={[
              styles.pickerButtonText,
              { color: scheme === "dark" ? "#fff" : "#333" },
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        presentationStyle="overFullScreen"
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.modal,
              { backgroundColor: scheme === "dark" ? "#222" : "#fff" },
            ]}
          >
            <Button
              title={t("noRepeat")}
              onPress={() => handlePreset("none")}
            />
            <Button title={t("daily")} onPress={() => handlePreset("daily")} />
            <Button
              title={t("weekly")}
              onPress={() => handlePreset("weekly")}
            />
            <Button
              title={t("monthly")}
              onPress={() => handlePreset("monthly")}
            />
            <Button
              title={t("custom")}
              onPress={() => openWithQueue(() => setCustomVisible(true))}
            />
            <Button title={t("close")} onPress={() => setMenuVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={customVisible}
        transparent
        presentationStyle="overFullScreen"
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.modal,
              { backgroundColor: scheme === "dark" ? "#222" : "#fff" },
            ]}
          >
            <Text
              style={{
                color: scheme === "dark" ? "#fff" : "#000",
                marginBottom: 8,
              }}
            >
              {t("interval")}
            </Text>
            <View style={styles.intervalRow}>
              <TouchableOpacity
                style={[
                  styles.intervalButton,
                  {
                    backgroundColor: scheme === "dark" ? "#333" : "#f2f2f2",
                    borderColor: scheme === "dark" ? "#444" : "#ccc",
                  },
                ]}
                onPress={() =>
                  setInterval((prev) => {
                    const val = Math.max(1, Number(prev) - 1);
                    return String(val);
                  })
                }
              >
                <Text
                  style={[
                    styles.intervalText,
                    { color: scheme === "dark" ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  -
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.intervalText,
                  { color: scheme === "dark" ? "#fff" : "#333" },
                ]}
              >
                {interval}
              </Text>
              <TouchableOpacity
                style={[
                  styles.intervalButton,
                  {
                    backgroundColor: scheme === "dark" ? "#333" : "#f2f2f2",
                    borderColor: scheme === "dark" ? "#444" : "#ccc",
                  },
                ]}
                onPress={() =>
                  setInterval((prev) => {
                    const val = Number(prev) + 1;
                    return String(val);
                  })
                }
              >
                <Text
                  style={[
                    styles.intervalText,
                    { color: scheme === "dark" ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.daysRow}>
              {dayLabels.map((l, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayButton,
                    byweekday.includes(i) && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(i)}
                >
                  <Text
                    style={[
                      byweekday.includes(i)
                        ? styles.dayButtonTextSelected
                        : { color: scheme === "dark" ? "#fff" : "#333" },
                    ]}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.row}>
              <Button
                title={t("cancel")}
                color="#2563EB"
                onPress={() => setCustomVisible(false)}
              />
              <Button title={t("save")} color="#2563EB" onPress={saveCustom} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    width: "80%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    width: 80,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    flexWrap: "wrap",
  },
  dayButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    alignItems: "center",
  },
  dayButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
    borderRadius: 12,
  },
  dayButtonText: {
    color: "#333",
  },
  dayButtonTextSelected: {
    color: "#fff",
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  intervalButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 8,
    backgroundColor: "#f2f2f2",
    minWidth: 32,
    alignItems: "center",
  },
  intervalText: {
    fontSize: 16,
    color: "#333",
    minWidth: 24,
    textAlign: "center",
  },
  pickerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
});
