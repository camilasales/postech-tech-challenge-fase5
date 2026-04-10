import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useFormik } from "formik";
import * as Yup from "yup";
import { loginWithEmailPassword } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { authFlowErrorMessage } from "@/utils/authFlowErrors";

const BLUE = "#2563EB";
const BORDER = "#E5E7EB";
const BG_PAGE = "#F9FAFB";
const CARD = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BLUE_SOFT = "#EFF6FF";
const BLUE_MUTED = "#93C5FD";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user, initializing } = useAuth();

  useEffect(() => {
    if (!initializing && user) {
      router.replace("/");
    }
  }, [initializing, router, user]);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Digite um email valido")
      .required("Email e obrigatorio"),

    password: Yup.string().required("Senha e obrigatoria"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const email = values.email.trim();
        const user = await loginWithEmailPassword(email, values.password);
        await signIn(user);
        router.replace("/");
      } catch (error) {
        Alert.alert("Erro no login", authFlowErrorMessage(error));
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (initializing) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerBoot]}>
        <ActivityIndicator size="large" color={BLUE} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>SeniorEase</Text>

          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationCircle}>
              <Image
                source={require("../assets/images/illustration-login.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Entrar</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.email && formik.errors.email
                    ? styles.inputError
                    : null,
                ]}
                placeholder="Digite seu email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={formik.handleChange("email")}
                onBlur={formik.handleBlur("email")}
                value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && (
                <Text style={styles.errorText}>{formik.errors.email}</Text>
              )}

              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.password && formik.errors.password
                    ? styles.inputError
                    : null,
                ]}
                placeholder="Digite sua senha"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                onChangeText={formik.handleChange("password")}
                onBlur={formik.handleBlur("password")}
                value={formik.values.password}
              />
              {formik.touched.password && formik.errors.password && (
                <Text style={styles.errorText}>{formik.errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!formik.isValid || formik.isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={() => formik.handleSubmit()}
              disabled={formik.isSubmitting}
            >
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Ainda nao tem conta? </Text>
              <Link href="/signup" style={styles.footerLink}>
                Criar conta
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_PAGE,
  },
  centerBoot: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
    paddingBottom: 40,
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    color: BLUE,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  illustrationWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  illustrationCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: BLUE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  illustration: {
    width: "78%",
    height: "78%",
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
    marginBottom: 22,
    textAlign: "center",
    lineHeight: 22,
  },
  subtitleEm: {
    fontWeight: "600",
    color: TEXT,
  },
  apiHint: {
    marginTop: 16,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 5,
    fontSize: 16,
    backgroundColor: BG_PAGE,
    color: TEXT,
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 2,
  },
  button: {
    backgroundColor: BLUE,
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: BLUE_MUTED,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: {
    color: MUTED,
    fontSize: 15,
  },
  footerLink: {
    color: BLUE,
    fontWeight: "600",
    fontSize: 15,
  },
});
