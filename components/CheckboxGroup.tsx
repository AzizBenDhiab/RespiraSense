import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RespiratoryCondition } from "@/types/RespiratoryCondition";

interface Props {
  conditions: RespiratoryCondition[];
  onConditionChange: (conditionId: string, selected: boolean) => void;
}

export const CheckboxGroup: React.FC<Props> = ({
  conditions,
  onConditionChange,
}) => {
  return (
    <View style={styles.container}>
      {conditions.map((condition) => (
        <TouchableOpacity
          key={condition.id}
          style={[
            styles.checkboxContainer
          ]}
          onPress={() => onConditionChange(condition.id, !condition.selected)}
        >
          <View
            style={[
              styles.checkbox,
              condition.selected && styles.checkboxSelected,
            ]}
          >
            {condition.selected && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>{condition.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  otherSelected: {
    borderColor: "#2E86AB",
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2E86AB",
    borderColor: "#2E86AB",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
});
