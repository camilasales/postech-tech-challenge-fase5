import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  usePersonalization,
  type AppTheme,
  type ContrastPreset,
  type FontSizePreset,
  type InterfaceModePreset,
  type SpacingPreset,
} from '@/context/PersonalizationContext';

const BRAND_PURPLE = '#4B00E0';
const RESET_BTN_ORANGE = '#F97316';
const RESET_BTN_BORDER = '#C2410C';

const FONT_OPTIONS: { key: FontSizePreset; label: string }[] = [
  { key: 'small', label: 'Normal' },
  { key: 'medium', label: 'Grande' },
  { key: 'large', label: 'Extra Grande' },
];

const CONTRAST_OPTIONS: { key: ContrastPreset; label: string }[] = [
  { key: 'default', label: 'Normal' },
  { key: 'high', label: 'Alto' },
  { key: 'max', label: 'Maximo' },
];

const SPACING_OPTIONS: { key: SpacingPreset; label: string }[] = [
  { key: 'compact', label: 'Normal' },
  { key: 'normal', label: 'Confortavel' },
  { key: 'relaxed', label: 'Espacoso' },
];

const INTERFACE_MODE_OPTIONS: { key: InterfaceModePreset; label: string }[] = [
  { key: 'basic', label: 'Basico' },
  { key: 'advanced', label: 'Avancado' },
];

type SegmentOption<T extends string> = { key: T; label: string };

function SettingCard<T extends string>({
  icon,
  iconName,
  title,
  description,
  options,
  value,
  onChange,
  styles,
  theme,
}: {
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  styles: ReturnType<typeof createFormStyles>;
  theme: AppTheme;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        {iconName ? (
          <Ionicons name={iconName} size={theme.icon(26)} color={BRAND_PURPLE} />
        ) : (
          icon
        )}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardDescription}>{description}</Text>
      <View style={styles.segmentRow}>
        {options.map((option) => {
          const active = option.key === value;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => onChange(option.key)}
              activeOpacity={0.88}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ToggleCard({
  iconName,
  title,
  description,
  value,
  onChange,
  styles,
  theme,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  styles: ReturnType<typeof createFormStyles>;
  theme: AppTheme;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.toggleHeaderRow}>
        <View style={styles.toggleTextCol}>
          <View style={styles.cardTitleRow}>
            <Ionicons name={iconName} size={theme.icon(26)} color={BRAND_PURPLE} />
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
          thumbColor={value ? BRAND_PURPLE : '#FFFFFF'}
        />
      </View>
      <Text style={styles.toggleStateText}>{value ? 'Ativado' : 'Desativado'}</Text>
    </View>
  );
}

export function PersonalizationForm() {
  const {
    settings,
    setFontSize,
    setContrast,
    setSpacing,
    setInterfaceMode,
    setEnhancedFeedback,
    setExtraConfirmations,
    setReminderNotifications,
    resetToDefaults,
    theme,
  } = usePersonalization();
  const styles = useMemo(() => createFormStyles(theme), [theme]);

  return (
    <View>
      <SettingCard
        icon={
          <View style={styles.fontIconWrap}>
            <Text style={styles.fontIconT}>T</Text>
          </View>
        }
        title="Tamanho da Fonte"
        description="Escolha o tamanho de letra mais confortavel para a leitura."
        options={FONT_OPTIONS}
        value={settings.fontSize}
        onChange={setFontSize}
        styles={styles}
        theme={theme}
      />

      <SettingCard
        iconName="contrast-outline"
        title="Nivel de Contraste"
        description="Aumente o contraste para facilitar a leitura."
        options={CONTRAST_OPTIONS}
        value={settings.contrast}
        onChange={setContrast}
        styles={styles}
        theme={theme}
      />

      <SettingCard
        iconName="expand-outline"
        title="Espacamento"
        description="Ajuste o espaco entre os elementos da tela."
        options={SPACING_OPTIONS}
        value={settings.spacing}
        onChange={setSpacing}
        styles={styles}
        theme={theme}
      />

      <SettingCard
        iconName="layers-outline"
        title="Modo de Interface"
        description="Use o modo basico para reduzir informacoes e distracoes."
        options={INTERFACE_MODE_OPTIONS}
        value={settings.interfaceMode}
        onChange={setInterfaceMode}
        styles={styles}
        theme={theme}
      />

      <ToggleCard
        iconName="sparkles-outline"
        title="Feedback Visual Reforcado"
        description="Mostra confirmacoes visuais mais claras apos as suas acoes."
        value={settings.enhancedFeedback}
        onChange={setEnhancedFeedback}
        styles={styles}
        theme={theme}
      />

      <ToggleCard
        iconName="shield-checkmark-outline"
        title="Confirmacoes Extras"
        description="Pede confirmacao antes de acoes importantes."
        value={settings.extraConfirmations}
        onChange={setExtraConfirmations}
        styles={styles}
        theme={theme}
      />

      <ToggleCard
        iconName="notifications-outline"
        title="Lembretes e Notificacoes"
        description="Mantem avisos de lembrete ativos na sua experiencia."
        value={settings.reminderNotifications}
        onChange={setReminderNotifications}
        styles={styles}
        theme={theme}
      />

      <TouchableOpacity
        style={styles.resetBtn}
        onPress={resetToDefaults}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Restaurar configuracoes padrao">
        <View style={styles.resetBtnInner}>
          <Ionicons name="refresh-outline" size={theme.icon(22)} color="#FFFFFF" />
          <Text style={styles.resetBtnText}>Restaurar Configuracoes Padrao</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

type PersonalizationPanelProps = {
  visible: boolean;
  onClose: () => void;
};

export function PersonalizationPanel({ visible, onClose }: PersonalizationPanelProps) {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createModalStyles(theme), [theme]);
  const colors = theme.colors;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Personalizacao</Text>
              <Text style={styles.subtitle}>Ajuste a plataforma do seu jeito</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Fechar">
              <Ionicons name="close" size={theme.icon(26)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <PersonalizationForm />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createModalStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.bgPage,
      borderTopLeftRadius: theme.space(16),
      borderTopRightRadius: theme.space(16),
      maxHeight: '88%',
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomWidth: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: theme.space(20),
      paddingTop: theme.space(20),
      paddingBottom: theme.space(16),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: theme.font(18),
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: theme.font(13),
      color: colors.muted,
      marginTop: theme.space(4),
    },
    scroll: {
      maxHeight: 520,
    },
    scrollContent: {
      paddingHorizontal: theme.space(20),
      paddingTop: theme.space(16),
      paddingBottom: theme.space(28),
    },
  });
}

function createFormStyles(theme: AppTheme) {
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
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.space(14),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingVertical: theme.space(18),
      paddingHorizontal: theme.space(18),
      marginBottom: theme.space(16),
      ...cardShadow,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(12),
      marginBottom: theme.space(10),
    },
    cardTitle: {
      flex: 1,
      fontSize: theme.font(17),
      fontWeight: '700',
      color: '#111827',
    },
    cardDescription: {
      fontSize: theme.font(14),
      fontWeight: '400',
      color: '#4B5563',
      lineHeight: theme.font(21),
      marginBottom: theme.space(16),
    },
    fontIconWrap: {
      width: theme.space(32),
      height: theme.space(32),
      borderRadius: theme.space(8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    fontIconT: {
      fontSize: theme.font(22),
      fontWeight: '800',
      color: BRAND_PURPLE,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: theme.space(10),
    },
    segment: {
      flex: 1,
      minWidth: 0,
      paddingVertical: theme.space(12),
      paddingHorizontal: theme.space(6),
      borderRadius: theme.space(10),
      borderWidth: 1,
      borderColor: '#D1D5DB',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentActive: {
      borderColor: BRAND_PURPLE,
      backgroundColor: BRAND_PURPLE,
    },
    segmentText: {
      fontSize: theme.font(14),
      fontWeight: '600',
      color: '#111827',
      textAlign: 'center',
    },
    segmentTextActive: {
      color: '#FFFFFF',
    },
    toggleHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(12),
    },
    toggleTextCol: {
      flex: 1,
      minWidth: 0,
    },
    toggleStateText: {
      marginTop: theme.space(8),
      fontSize: theme.font(13),
      fontWeight: '700',
      color: BRAND_PURPLE,
    },
    resetBtn: {
      marginTop: theme.space(20),
      width: '100%',
      borderRadius: theme.space(12),
      borderWidth: 1,
      borderColor: RESET_BTN_BORDER,
      backgroundColor: RESET_BTN_ORANGE,
      overflow: 'hidden',
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 3px 10px rgba(249, 115, 22, 0.35)' }
        : {
            shadowColor: '#EA580C',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          }),
    },
    resetBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.space(10),
      paddingVertical: theme.space(16),
      paddingHorizontal: theme.space(18),
    },
    resetBtnText: {
      fontSize: theme.font(15),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
  });
}
