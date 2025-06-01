import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LoginHeader } from "@/components/LoginHeader";
import { useAuth } from "../_layout";

const SignUpScreen = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { setSignupData, isLoading } = useAuth();
  const router = useRouter();

  const handleContinue = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setSignupData({ firstName, lastName, email, password });
      router.push("/auth/profile-form");
    } catch (error: any) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Signup error:", error);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <LoginHeader />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join RespiraSense for better respiratory health
              </Text>
            </View>

            <View style={styles.form}>
              {[
                {
                  placeholder: "First Name",
                  icon: "person-outline",
                  key: "firstName",
                },
                {
                  placeholder: "Last Name",
                  icon: "person-outline",
                  key: "lastName",
                },
                {
                  placeholder: "Email",
                  icon: "mail-outline",
                  key: "email",
                  keyboardType: "email-address",
                },
                {
                  placeholder: "Password",
                  icon: "lock-closed-outline",
                  key: "password",
                  secureTextEntry: true,
                },
                {
                  placeholder: "Confirm Password",
                  icon: "lock-closed-outline",
                  key: "confirmPassword",
                  secureTextEntry: true,
                },
              ].map((field) => (
                <View key={field.key} style={styles.inputContainer}>
                  <Ionicons
                    name={field.icon as any}
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    value={formData[field.key as keyof typeof formData]}
                    onChangeText={(value) => updateFormData(field.key, value)}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    secureTextEntry={field.secureTextEntry}
                    keyboardType={field.keyboardType as any}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Processing..." : "Continue"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push("/auth/login")}
              >
                <Text style={styles.linkText}>
                  Already have an account?{" "}
                  <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoid: { flex: 1 },
  scrollView: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", paddingTop: 40 },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  form: { gap: 15 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 50, fontSize: 16, color: "#333" },
  button: {
    backgroundColor: "#2E86AB",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#aaa" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linkButton: { marginTop: 12, alignItems: "center" },
  linkText: { fontSize: 14, color: "#666" },
  linkTextBold: { color: "#2E86AB", fontWeight: "600" },
});
