import React, { useState } from "react";
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LoginHeader } from "../../components/LoginHeader";
import { LoginInput } from "../../components/LoginInput";
import { LoginButton } from "../../components/LoginButton";
import { LoginLink } from "../../components/LoginLink";
import { useAuth } from "../_layout";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const success = await signIn(email, password);
      if (!success) {
        Alert.alert("Login Failed", "Invalid email or password");
        return;
      }
      // Navigation handled by AuthContext
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "An unexpected error occurred"
      );
      console.error("Login error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <LoginHeader />
          <LoginInput
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <LoginInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <LoginButton onPress={handleLogin} loading={isLoading} />
          <LoginLink
            onPress={() => router.push({ pathname: "/auth/signup" })}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoid: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 20 },
});
