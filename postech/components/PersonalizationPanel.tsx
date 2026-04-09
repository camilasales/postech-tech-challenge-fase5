import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  usePersonalization,
  type AppTheme,
  type ContrastPreset,
  type FontSizePreset,
  type SpacingPreset,
} from '@/context/PersonalizationContext';

const FONT_OPTIONS: { key: FontSizePreset; label: string }[] = [
  { key: 'small', label: 'Pequeno' },
  { key: 'medium', label: 'Médio' },
  { key: 'large', label: 'Grande' },
];

const CONTRAST_OPTIONS: { key: ContrastPreset; label: string; hint: string }[] = [
  { key: 'default', label: 'Padrão', hint: 'Cores suaves' },
  { key: 'high', label: 'Alto', hint: 'Mais contraste' },
];

const SPACING_OPTIONS: { key: SpacingPreset; label: string }[] = [
  { key: 'compact', label: 'Compacto' },
  { key: 'normal', label: 'Normal' },
  { key: 'relaxed', label: 'Amplo' },
];

/** Controles de personalização (fonte, contraste, espaçamento) para uso em página ou modal. */
export function PersonalizationForm() {
  const { settings, setFontSize, setContrast, setSpacing, resetToDefaults, theme } =
    usePersonalization();
  const formStyles = useMemo(() => createFormStyles(theme), [theme]);

  return (
    <>
      <Text style={formStyles.sectionLabel}>Tamanho da fonte</Text>
      <View style={formStyles.segmentRow}>
        {FONT_OPTIONS.map((opt) => {
          const active = settings.fontSize === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[formStyles.segment, active && formStyles.segmentActive]}
              onPress={() => setFontSize(opt.key)}
              activeOpacity={0.85}>
              <Text style={[formStyles.segmentText, active && formStyles.segmentTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[formStyles.sectionLabel, formStyles.sectionLabelSpaced]}>Contraste</Text>
      {CONTRAST_OPTIONS.map((opt) => {
        const active = settings.contrast === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[formStyles.optionCard, active && formStyles.optionCardActive]}
            onPress={() => setContrast(opt.key)}
            activeOpacity={0.85}>
            <View style={formStyles.optionCardInner}>
              <Text style={formStyles.optionTitle}>{opt.label}</Text>
              <Text style={formStyles.optionHint}>{opt.hint}</Text>
            </View>
            {active ? (
              <Ionicons name="checkmark-circle" size={theme.icon(22)} color={theme.colors.blue} />
            ) : (
              <View style={formStyles.radioOuter}>
                <View style={formStyles.radioInner} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={[formStyles.sectionLabel, formStyles.sectionLabelSpaced]}>
        Espaçamento entre elementos
      </Text>
      <View style={formStyles.segmentRow}>
        {SPACING_OPTIONS.map((opt) => {
          const active = settings.spacing === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[formStyles.segment, active && formStyles.segmentActive]}
              onPress={() => setSpacing(opt.key)}
              activeOpacity={0.85}>
              <Text style={[formStyles.segmentText, active && formStyles.segmentTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={formStyles.resetBtn} onPress={resetToDefaults}>
        <Text style={formStyles.resetBtnText}>Restaurar padrões</Text>
      </TouchableOpacity>
    </>
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
              <Text style={modalStyles.subtitle}>Ajuste texto, contraste e espaçamento</Text>
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
      backgroundColor: c.card,
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
  const c = theme.colors;
  return StyleSheet.create({
    sectionLabel: {
      fontSize: theme.font(13),
      fontWeight: '600',
      color: c.text,
      marginBottom: theme.space(10),
    },
    sectionLabelSpaced: {
      marginTop: theme.space(20),
    },
    segmentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space(8),
    },
    segment: {
      paddingVertical: theme.space(10),
      paddingHorizontal: theme.space(14),
      borderRadius: theme.space(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgPage,
    },
    segmentActive: {
      borderColor: c.blue,
      backgroundColor: c.chipActiveBg,
    },
    segmentText: {
      fontSize: theme.font(14),
      fontWeight: '600',
      color: c.muted,
    },
    segmentTextActive: {
      color: c.blue,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.space(14),
      borderRadius: theme.space(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgPage,
      marginBottom: theme.space(10),
    },
    optionCardActive: {
      borderColor: c.blue,
      backgroundColor: c.chipActiveBg,
    },
    optionCardInner: {
      flex: 1,
    },
    optionTitle: {
      fontSize: theme.font(15),
      fontWeight: '600',
      color: c.text,
    },
    optionHint: {
      fontSize: theme.font(12),
      color: c.muted,
      marginTop: theme.space(2),
    },
    radioOuter: {
      width: theme.icon(22),
      height: theme.icon(22),
      borderRadius: theme.icon(11),
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: theme.icon(10),
      height: theme.icon(10),
      borderRadius: theme.icon(5),
      backgroundColor: 'transparent',
    },
    resetBtn: {
      marginTop: theme.space(24),
      paddingVertical: theme.space(14),
      alignItems: 'center',
      borderRadius: theme.space(8),
      borderWidth: 1,
      borderColor: c.border,
    },
    resetBtnText: {
      fontSize: theme.font(14),
      fontWeight: '600',
      color: c.muted,
    },
  });
}
