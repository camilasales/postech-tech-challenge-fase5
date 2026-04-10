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
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Link } from "expo-router";
import { useFormik } from "formik";
import * as Yup from "yup";
import { registerUser } from "@/services/api";
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

export default function SignupScreen() {
  const router = useRouter();
  const { signIn, user, initializing } = useAuth();

  useEffect(() => {
    if (!initializing && user) {
      router.replace("/");
    }
  }, [initializing, router, user]);

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, "O nome deve ter pelo menos 3 letras")
      .required("Nome é obrigatório"),

    email: Yup.string()
      .email("Dado incorreto. Revise e digite novamente")
      .required("Email é obrigatório"),

    password: Yup.string()
      .min(6, "A senha deve ter no mínimo 6 caracteres")
      .required("Senha é obrigatória"),

    agreeTerms: Yup.boolean().oneOf(
      [true],
      "Você precisa aceitar os termos para continuar"
    ),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      agreeTerms: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const email = values.email.trim();
        const name = values.name.trim();
        const user = await registerUser(name, email, values.password);
        await signIn(user);
        router.replace("/");
      } catch (error) {
        Alert.alert("Erro no cadastro", authFlowErrorMessage(error));
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
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              hitSlop={12}
              style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={TEXT} />
            </TouchableOpacity>
            <Text style={styles.brand}>SeniorEase</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationCircle}>
              <Image
                source={require("../assets/images/illustration-signinup.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>
              Novos usuarios sao gravados no json-server (recurso <Text style={styles.subtitleEm}>users</Text> em{' '}
              <Text style={styles.subtitleEm}>db.json</Text>) com <Text style={styles.subtitleEm}>POST /users</Text>.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.name && formik.errors.name
                    ? styles.inputError
                    : null,
                ]}
                placeholder="Digite seu nome completo"
                placeholderTextColor="#9CA3AF"
                onChangeText={formik.handleChange("name")}
                onBlur={formik.handleBlur("name")}
                value={formik.values.name}
              />
              {formik.touched.name && formik.errors.name && (
                <Text style={styles.errorText}>{formik.errors.name}</Text>
              )}

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

            <View style={styles.checkboxWrapper}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    formik.values.agreeTerms && styles.checkboxChecked,
                    formik.touched.agreeTerms && formik.errors.agreeTerms
                      ? styles.checkboxError
                      : null,
                  ]}
                  onPress={() =>
                    formik.setFieldValue("agreeTerms", !formik.values.agreeTerms)
                  }>
                  {formik.values.agreeTerms && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  Li e estou ciente quanto ao tratamento dos meus dados conforme a Política de
                  Privacidade do aplicativo.
                </Text>
              </View>

              {formik.touched.agreeTerms && formik.errors.agreeTerms && (
                <Text style={styles.errorText}>{formik.errors.agreeTerms}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!formik.isValid || formik.isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={() => formik.handleSubmit()}
              disabled={formik.isSubmitting}>
              <Text style={styles.buttonText}>Criar conta</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Ja tem conta? </Text>
              <Link href="/login" style={styles.footerLink}>
                Entrar
              </Link>
            </View>

            <Text style={styles.apiHint} selectable>
              API json-server: {API_BASE_URL}
            </Text>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: BLUE,
    letterSpacing: -0.3,
  },
  topBarSpacer: {
    width: 40,
  },
  illustrationWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  illustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
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
  inputContainer: {
    marginBottom: 4,
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
  checkboxWrapper: {
    marginBottom: 20,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 6,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    backgroundColor: CARD,
  },
  checkboxChecked: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  checkboxError: {
    borderColor: "#DC2626",
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: MUTED,
    lineHeight: 20,
  },
  button: {
    backgroundColor: BLUE,
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
