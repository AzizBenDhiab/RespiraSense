import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CheckboxGroup } from "../../components/CheckboxGroup";
import { RespiratoryCondition } from "@/types/RespiratoryCondition";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuth } from "../_layout";

const API_URL = "https://b06d-102-158-147-215.ngrok-free.app"; 

const AccountScreen: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [conditions, setConditions] = useState<RespiratoryCondition[]>([
    { id: "healthy", label: "Healthy", selected: false },
    {
      id: "urti",
      label: "URTI (Upper Respiratory Tract Infection)",
      selected: false,
    },
    { id: "asthma", label: "Asthma", selected: false },
    {
      id: "copd",
      label: "COPD (Chronic Obstructive Pulmonary Disease)",
      selected: false,
    },
    { id: "bronchiectasis", label: "Bronchiectasis", selected: false },
    { id: "pneumonia", label: "Pneumonia", selected: false },
  ]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert("Error", "Please log in to access your account");
      router.push("/auth/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log(`Fetching profile from: ${API_URL}/profile`);
        const response = await axios.get(`${API_URL}/profile`, {
          withCredentials: true,
        });
        console.log("Profile fetch response:", response.status, response.data);
        if (response.status === 200) {
          const { height, weight,age, respiratory_illnesses } = response.data;
          setHeight(height?.toString() || "");
          setWeight(weight?.toString() || "");
          setAge(age?.toString() || "");
          if (respiratory_illnesses) {
            const selectedConditions = respiratory_illnesses.split(",");
            setConditions((prev) =>
              prev.map((condition) => ({
                ...condition,
                selected: selectedConditions.includes(condition.label),
              }))
            );
          }
        }
      } catch (error: any) {
        console.error(
          "Profile fetch error:",
          error.message,
          error.response?.status
        );
        Alert.alert("Error", "Failed to load profile data");
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  const handleUpdateProfile = async () => {
    if (!height || !weight || !age) {
      Alert.alert("Error", "Please fill in your age, height and weight");
      return;
    }

    const selectedConditions = conditions.filter((c) => c.selected);
    if (selectedConditions.length === 0) {
      Alert.alert("Error", "Please select at least one respiratory condition");
      return;
    }

    try {
      setIsUpdating(true);
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);
      const ageNum = parseInt(age, 10);
      if (isNaN(heightNum) || isNaN(weightNum) || isNaN(ageNum)) {
        Alert.alert("Error", "Height and weight must be valid numbers");
        return;
      }

      const respiratory_illnesses = selectedConditions
        .map((c) => c.label)
        .join(",");
      console.log(`Sending profile update to: ${API_URL}/profile`, {
        height: heightNum,
        weight: weightNum,
        age: ageNum,
        respiratory_illnesses,
      });
      const response = await axios.post(
        `${API_URL}/profile`,
        { height: heightNum, weight: weightNum, age: ageNum, respiratory_illnesses },
        { withCredentials: true }
      );
      console.log("Profile update response:", response.status, response.data);
      if (response.status === 200) {
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error: any) {
      console.error(
        "Profile update error:",
        error.message,
        error.response?.status
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "An unexpected error occurred"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log(`Sending logout request to: ${API_URL}/logout`);
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      signOut();

    } catch (error: any) {
      console.error("Logout error:", error.message);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  const handleConditionChange = (conditionId: string, selected: boolean) => {
    setConditions((prev) =>
      prev.map((condition) =>
        condition.id === conditionId ? { ...condition, selected } : condition
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="person-circle-outline" size={60} color="#2E86AB" />
            <Text style={styles.title}>Manage Your Account</Text>
            <Text style={styles.subtitle}>
              Update your health profile or log out
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Physical Information</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Age (years)"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons
                name="resize-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Height (cm)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="barbell-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.sectionTitle}>Respiratory Health Status</Text>
            <Text style={styles.sectionSubtitle}>
              Select all conditions that apply to you:
            </Text>

            <CheckboxGroup
              conditions={conditions}
              onConditionChange={handleConditionChange}
            />

            <TouchableOpacity
              style={[styles.button, isUpdating && styles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={isUpdating}
            >
              <Text style={styles.buttonText}>
                {isUpdating ? "Updating..." : "Update Profile"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={[styles.buttonText, styles.logoutButtonText]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafb",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E86AB",
    marginTop: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E86AB",
    marginBottom: 5,
    marginTop: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#2E86AB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#2E86AB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#94c5d9",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e53e3e",
  },
  logoutButtonText: {
    color: "#e53e3e",
  },
});
