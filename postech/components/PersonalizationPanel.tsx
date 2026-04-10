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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  usePersonalization,
  type AppTheme,
  type ContrastPreset,
  type FontSizePreset,
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
  { key: 'max', label: 'Máximo' },
];

const SPACING_OPTIONS: { key: SpacingPreset; label: string }[] = [
  { key: 'compact', label: 'Normal' },
  { key: 'normal', label: 'Confortável' },
  { key: 'relaxed', label: 'Espaçoso' },
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
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => onChange(opt.key)}
              activeOpacity={0.88}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/** Controles de personalização (fonte, contraste, espaçamento) para uso em página ou modal. */
export function PersonalizationForm() {
  const { settings, setFontSize, setContrast, setSpacing, resetToDefaults, theme } =
    usePersonalization();
  const formStyles = useMemo(() => createFormStyles(theme), [theme]);

  return (
    <View>
      <SettingCard
        icon={
          <View style={formStyles.fontIconWrap}>
            <Text style={formStyles.fontIconT}>T</Text>
          </View>
        }
        title="Tamanho da Fonte"
        description="Escolha o tamanho de letra mais confortável para você ler:"
        options={FONT_OPTIONS}
        value={settings.fontSize}
        onChange={setFontSize}
        styles={formStyles}
        theme={theme}
      />

      <SettingCard
        iconName="contrast-outline"
        title="Nível de Contraste"
        description="Aumente o contraste para facilitar a leitura:"
        options={CONTRAST_OPTIONS}
        value={settings.contrast}
        onChange={setContrast}
        styles={formStyles}
        theme={theme}
      />

      <SettingCard
        iconName="expand-outline"
        title="Espaçamento"
        description="Ajuste o espaço entre os elementos da tela:"
        options={SPACING_OPTIONS}
        value={settings.spacing}
        onChange={setSpacing}
        styles={formStyles}
        theme={theme}
      />

      <TouchableOpacity
        style={formStyles.resetBtn}
        onPress={resetToDefaults}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Restaurar configurações padrão">
        <View style={formStyles.resetBtnInner}>
          <Ionicons name="refresh-outline" size={theme.icon(22)} color="#FFFFFF" />
          <Text style={formStyles.resetBtnText}>Restaurar Configurações Padrão</Text>
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
  const modalStyles = useMemo(() => createModalStyles(theme), [theme]);
  const c = theme.colors;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable style={modalStyles.scrim} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.title}>Personalização</Text>
              <Text style={modalStyles.subtitle}>Ajuste a plataforma do seu jeito</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Fechar">
              <Ionicons name="close" size={theme.icon(26)} color={c.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={modalStyles.scroll}
            contentContainerStyle={modalStyles.scrollContent}
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
  const c = theme.colors;
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
      backgroundColor: c.bgPage,
      borderTopLeftRadius: theme.space(16),
      borderTopRightRadius: theme.space(16),
      maxHeight: '88%',
      borderWidth: 1,
      borderColor: c.border,
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
      borderBottomColor: c.border,
    },
    title: {
      fontSize: theme.font(18),
      fontWeight: '700',
      color: c.text,
    },
    subtitle: {
      fontSize: theme.font(13),
      color: c.muted,
      marginTop: theme.space(4),
    },
    scroll: {
      maxHeight: 480,
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
