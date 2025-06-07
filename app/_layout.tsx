import { ChatProvider } from "@/context/ChatContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import axios from "axios";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

const API_URL = "http://192.168.218.101:5001";
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signupData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } | null;
  setSignupData: (
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    } | null
  ) => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  finalizeSignUp: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    age: number;
    height: number;
    weight: number;
    conditions: { id: string; label: string; selected: boolean }[];
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  user: {
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [signupData, setSignupData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } | null>(null);
  const [user, setUser] = useState<{
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);

  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/profile`, {
          withCredentials: true,
        });
        if (response.status === 200) {
          setIsAuthenticated(true);
          setUser({
            email: "",
            name: "User",
          });
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const finalizeSignUp = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    age: number;
    height: number;
    weight: number;
    conditions: { id: string; label: string; selected: boolean }[];
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const {
        firstName,
        lastName,
        email,
        password,
        height,
        weight,
        age,
        conditions,
      } = data;
      const respiratory_illnesses = conditions
        .filter((c) => c.selected)
        .map((c) => c.label)
        .join(",");
      const response = await axios.post(
        `${API_URL}/signup`,
        {
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          height,
          weight,
          age,
          respiratory_illnesses,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (response.status === 201) {
        setIsAuthenticated(true);
        setUser({
          email,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
        });
        setSignupData(null);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Signup failed:", error);
      throw error; // Propagate error to caller
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_URL}/login`,
        { email, password },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setIsAuthenticated(true);
        setUser({ email, name: "User" });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Sign in failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      setIsAuthenticated(false);
      setUser(null);
      setSignupData(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signupData,
        setSignupData,
        signIn,
        finalizeSignUp,
        signOut,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ChatProvider>
        <RootLayoutNav />
      </ChatProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, signupData } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (!loaded || isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const isProfileForm = segments[1] === "profile-form";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (
      !isAuthenticated &&
      signupData &&
      !isProfileForm &&
      inAuthGroup
    ) {
      router.replace("/auth/profile-form");
    }
  }, [isAuthenticated, signupData, segments, loaded, isLoading]);

  if (!loaded || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#fff" : "#000"}
        />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen
          name="+not-found"
          options={{ headerShown: true, title: "Not Found" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
