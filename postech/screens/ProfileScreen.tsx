import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SidebarLayout, APP_HEADER_PURPLE } from '@/components/SidebarLayout';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';
import { useAuth } from '@/context/AuthContext';

const PROFILE_HERO_GREEN = '#16A34A';
const FIELD_ICON_GREEN = '#16A34A';
const FIELD_BOX_BG = '#F9FAFB';
const FIELD_BOX_BORDER = '#E5E7EB';

function displayOrDash(value: string | undefined | null): string {
  const t = value?.trim() ?? '';
  return t.length > 0 ? t : 'Não informado';
}

type InfoFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
};

function InfoField({ icon, label, value, theme, styles }: InfoFieldProps) {
  return (
    <View style={styles.fieldBox}>
      <Ionicons name={icon} size={theme.icon(22)} color={FIELD_ICON_GREEN} />
      <View style={styles.fieldTextCol}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    router.replace('/login');
  }, [router, signOutUser]);

  const onPressEdit = useCallback(() => {
    Alert.alert('Editar perfil', 'Esta função estará disponível em breve.');
  }, []);

  if (!user) {
    return null;
  }

  const fullName = displayOrDash(user.name);
  const email = displayOrDash(user.email);

  return (
    <SidebarLayout activeNavKey="profile" desktopTopBarLeft="empty" searchConfig={null} topBarRight={null}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.heroGreen, { backgroundColor: PROFILE_HERO_GREEN }]}>
          <Ionicons name="person-outline" size={theme.icon(36)} color="#FFFFFF" />
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Meu Perfil</Text>
            <Text style={styles.heroSubtitle}>Suas informações pessoais</Text>
          </View>
        </View>

        <View style={styles.avatarCard}>
          <View style={[styles.avatarCircle, { backgroundColor: PROFILE_HERO_GREEN }]}>
            <Ionicons name="person" size={theme.icon(40)} color="#FFFFFF" />
          </View>
          <Text style={styles.avatarLabel}>Usuário</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoCardTitle}>Informações Pessoais</Text>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: APP_HEADER_PURPLE }]}
              onPress={onPressEdit}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Editar informações pessoais">
              <Ionicons name="create-outline" size={theme.icon(18)} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <InfoField
            icon="person-outline"
            label="Nome Completo"
            value={fullName}
            theme={theme}
            styles={styles}
          />
          <InfoField
            icon="mail-outline"
            label="E-mail"
            value={email}
            theme={theme}
            styles={styles}
          />
          <InfoField
            icon="call-outline"
            label="Telefone"
            value="Não informado"
            theme={theme}
            styles={styles}
          />
          <InfoField
            icon="location-outline"
            label="Endereço"
            value="Não informado"
            theme={theme}
            styles={styles}
          />
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => void handleSignOut()}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta">
          <Ionicons name="log-out-outline" size={theme.icon(22)} color="#B91C1C" />
          <Text style={styles.signOutBtnText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SidebarLayout>
  );
}

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  const cardShadow =
    Platform.OS === 'web'
      ? { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        };

  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: c.bgPage,
    },
    scrollContent: {
      paddingHorizontal: theme.space(16),
      paddingBottom: theme.space(32),
    },
    heroGreen: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(14),
      borderRadius: theme.space(14),
      paddingVertical: theme.space(20),
      paddingHorizontal: theme.space(18),
      marginBottom: theme.space(20),
      marginTop: theme.space(4),
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }
        : {
            shadowColor: '#15803d',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
          }),
    },
    heroTextCol: {
      flex: 1,
      minWidth: 0,
    },
    heroTitle: {
      fontSize: theme.font(22),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    heroSubtitle: {
      marginTop: theme.space(6),
      fontSize: theme.font(14),
      color: 'rgba(255,255,255,0.95)',
      lineHeight: theme.font(20),
    },
    avatarCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.space(14),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingVertical: theme.space(24),
      paddingHorizontal: theme.space(20),
      marginBottom: theme.space(16),
      alignItems: 'center',
      ...cardShadow,
    },
    avatarCircle: {
      width: theme.space(88),
      height: theme.space(88),
      borderRadius: theme.space(44),
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLabel: {
      marginTop: theme.space(14),
      fontSize: theme.font(17),
      fontWeight: '700',
      color: '#111827',
    },
    infoCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.space(14),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingVertical: theme.space(18),
      paddingHorizontal: theme.space(16),
      ...cardShadow,
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.space(18),
      gap: theme.space(12),
    },
    infoCardTitle: {
      flex: 1,
      fontSize: theme.font(17),
      fontWeight: '800',
      color: '#111827',
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(6),
      paddingVertical: theme.space(10),
      paddingHorizontal: theme.space(14),
      borderRadius: theme.space(10),
    },
    editBtnText: {
      fontSize: theme.font(14),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    fieldBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(14),
      paddingVertical: theme.space(14),
      paddingHorizontal: theme.space(14),
      marginBottom: theme.space(12),
      borderRadius: theme.space(12),
      borderWidth: 1,
      borderColor: FIELD_BOX_BORDER,
      backgroundColor: FIELD_BOX_BG,
    },
    fieldTextCol: {
      flex: 1,
      minWidth: 0,
    },
    fieldLabel: {
      fontSize: theme.font(12),
      fontWeight: '600',
      color: '#6B7280',
      marginBottom: theme.space(4),
    },
    fieldValue: {
      fontSize: theme.font(16),
      fontWeight: '700',
      color: '#111827',
    },
    signOutBtn: {
      marginTop: theme.space(24),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.space(10),
      paddingVertical: theme.space(16),
      paddingHorizontal: theme.space(20),
      borderRadius: theme.space(12),
      borderWidth: 1,
      borderColor: '#FECACA',
      backgroundColor: '#FEF2F2',
    },
    signOutBtnText: {
      fontSize: theme.font(16),
      fontWeight: '700',
      color: '#B91C1C',
    },
  });
}
