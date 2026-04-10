import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SidebarLayout } from '@/components/SidebarLayout';
import type { AppTheme } from '@/context/PersonalizationContext';
import type { ContrastPreset, FontSizePreset, SpacingPreset } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';
import { useAuth } from '@/context/AuthContext';

const GREETING_BANNER_BG = '#4b00e0';
const CARD_TASK = '#4F46E5';
const CARD_SETTINGS = '#A855F7';
const CARD_PROFILE = '#16A34A';
const TIP_BG = '#FFFBEB';
const TIP_BORDER = '#F97316';
const TIP_TITLE = '#EA580C';
const TIP_TEXT = '#9A3412';

function greetingPeriod(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function labelFontSize(s: FontSizePreset): string {
  const m = { small: 'Normal', medium: 'Grande', large: 'Extra Grande' };
  return m[s];
}

function labelContrast(s: ContrastPreset): string {
  const m = { default: 'Normal', high: 'Alto', max: 'Máximo' };
  return m[s];
}

function labelSpacing(s: SpacingPreset): string {
  const m = {
    compact: 'Normal',
    normal: 'Confortável',
    relaxed: 'Espaçoso',
  };
  return m[s];
}

function labelFeedback(contrast: ContrastPreset): string {
  return contrast === 'default' ? 'Padrão' : 'Ativado';
}

export function HomeScreen() {
  const { theme, settings } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const stackCards = width < 560;

  return (
    <SidebarLayout
      activeNavKey="home"
      mainVariant="flush"
      desktopTopBarLeft="empty"
      searchConfig={null}
      topBarRight={null}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.greetingWrap}>
          <View style={[styles.greetingGradientRow, { backgroundColor: GREETING_BANNER_BG }]} />
          <View style={styles.greetingOverlay}>
            <Ionicons name="sunny-outline" size={theme.icon(36)} color="#FFFFFF" />
            <View style={styles.greetingTextBlock}>
              <Text style={styles.greetingHi}>{greetingPeriod()}!</Text>
              <Text style={styles.greetingWelcome}>Bem-vindo ao SeniorEase</Text>
              <Text style={styles.greetingHint}>
                Sua plataforma foi personalizada para facilitar o seu dia a dia digital.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={[styles.quickRow, stackCards && styles.quickRowStack]}>
            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: CARD_TASK }]}
              onPress={() => router.push('/tasks')}
              activeOpacity={0.9}>
              <Ionicons name="checkbox-outline" size={theme.icon(32)} color="#FFFFFF" />
              <Text style={styles.quickCardTitle}>Minhas Atividades</Text>
              <Text style={styles.quickCardDesc}>Ver e organizar suas atividades do dia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: CARD_SETTINGS }]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.9}>
              <Ionicons name="settings-outline" size={theme.icon(32)} color="#FFFFFF" />
              <Text style={styles.quickCardTitle}>Personalizar</Text>
              <Text style={styles.quickCardDesc}>Ajustar tamanho de texto e cores</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: CARD_PROFILE }]}
              onPress={() => router.push('/profile')}
              activeOpacity={0.9}>
              <Ionicons name="person-outline" size={theme.icon(32)} color="#FFFFFF" />
              <Text style={styles.quickCardTitle}>Meu Perfil</Text>
              <Text style={styles.quickCardDesc}>Ver e editar suas informações</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipBox}>
            <Ionicons name="heart-outline" size={theme.icon(26)} color={TIP_TITLE} />
            <View style={styles.tipTextWrap}>
              <Text style={styles.tipTitle}>Dica do Dia</Text>
              <Text style={styles.tipBody}>
                Você pode ajustar o tamanho das letras e o contraste da tela na seção{' '}
                <Text style={styles.tipBold}>Personalização</Text>. Experimente até encontrar o que é
                mais confortável para você!
              </Text>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <Text style={styles.settingsCardTitle}>Suas Configurações Atuais</Text>
            <View style={styles.settingsGrid}>
              <View style={styles.settingsCell}>
                <Text style={styles.settingsLabel}>Tamanho da Fonte:</Text>
                <Text style={styles.settingsValue}>{labelFontSize(settings.fontSize)}</Text>
              </View>
              <View style={styles.settingsCell}>
                <Text style={styles.settingsLabel}>Contraste:</Text>
                <Text style={styles.settingsValue}>{labelContrast(settings.contrast)}</Text>
              </View>
              <View style={styles.settingsCell}>
                <Text style={styles.settingsLabel}>Modo de Interface:</Text>
                <Text style={styles.settingsValue}>{labelSpacing(settings.spacing)}</Text>
              </View>
              <View style={styles.settingsCell}>
                <Text style={styles.settingsLabel}>Feedback Visual:</Text>
                <Text style={styles.settingsValue}>{labelFeedback(settings.contrast)}</Text>
              </View>
            </View>
          </View>

          {user ? (
            <Text style={styles.signedHint}>Conectado como {user.email}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SidebarLayout>
  );
}

const GREETING_BANNER_HEIGHT = 152;

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  const shadow =
    Platform.OS === 'web'
      ? {
          boxShadow: '0px 4px 14px rgba(0,0,0,0.08)',
        }
      : {
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        };

  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: c.bgPage,
    },
    scrollContent: {
      paddingBottom: theme.space(24),
    },
    greetingWrap: {
      marginHorizontal: theme.space(20),
      marginTop: theme.space(16),
      borderRadius: theme.space(14),
      overflow: 'hidden',
      ...shadow,
    },
    greetingGradientRow: {
      height: GREETING_BANNER_HEIGHT,
    },
    greetingOverlay: {
      marginTop: -GREETING_BANNER_HEIGHT,
      minHeight: GREETING_BANNER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(14),
      paddingVertical: theme.space(18),
      paddingHorizontal: theme.space(18),
    },
    greetingTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    greetingHi: {
      fontSize: theme.font(20),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    greetingWelcome: {
      marginTop: theme.space(4),
      fontSize: theme.font(16),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    greetingHint: {
      marginTop: theme.space(8),
      fontSize: theme.font(14),
      color: 'rgba(255,255,255,0.95)',
      lineHeight: theme.font(20),
    },
    body: {
      paddingHorizontal: theme.space(20),
      marginTop: theme.space(24),
    },
    sectionTitle: {
      fontSize: theme.font(20),
      fontWeight: '800',
      color: c.text,
      marginBottom: theme.space(14),
    },
    quickRow: {
      flexDirection: 'row',
      gap: theme.space(12),
    },
    quickRowStack: {
      flexDirection: 'column',
    },
    quickCard: {
      flex: 1,
      minWidth: 0,
      borderRadius: theme.space(14),
      padding: theme.space(16),
      ...shadow,
    },
    quickCardTitle: {
      marginTop: theme.space(12),
      fontSize: theme.font(17),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    quickCardDesc: {
      marginTop: theme.space(8),
      fontSize: theme.font(14),
      color: 'rgba(255,255,255,0.92)',
      lineHeight: theme.font(20),
    },
    tipBox: {
      marginTop: theme.space(22),
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.space(12),
      backgroundColor: TIP_BG,
      borderWidth: 1,
      borderColor: TIP_BORDER,
      borderRadius: theme.space(14),
      padding: theme.space(16),
    },
    tipTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    tipTitle: {
      fontSize: theme.font(17),
      fontWeight: '800',
      color: TIP_TITLE,
      marginBottom: theme.space(6),
    },
    tipBody: {
      fontSize: theme.font(15),
      color: TIP_TEXT,
      lineHeight: theme.font(22),
    },
    tipBold: {
      fontWeight: '800',
    },
    settingsCard: {
      marginTop: theme.space(22),
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.space(14),
      padding: theme.space(18),
      ...shadow,
    },
    settingsCardTitle: {
      fontSize: theme.font(18),
      fontWeight: '800',
      color: c.text,
      marginBottom: theme.space(16),
    },
    settingsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space(12),
    },
    settingsCell: {
      width: '47%',
      flexGrow: 1,
      minWidth: theme.space(120),
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.space(10),
      padding: theme.space(14),
      backgroundColor: c.bgPage,
    },
    settingsLabel: {
      fontSize: theme.font(14),
      color: c.muted,
      marginBottom: theme.space(6),
    },
    settingsValue: {
      fontSize: theme.font(16),
      fontWeight: '800',
      color: c.text,
    },
    signedHint: {
      marginTop: theme.space(20),
      fontSize: theme.font(13),
      color: c.muted,
      textAlign: 'center',
    },
  });
}
