import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePersonalization } from '@/context/PersonalizationContext';
import type { AppTheme } from '@/context/PersonalizationContext';

const TOAST_GREEN = '#16A34A';
const TOAST_BORDER = '#FFFFFF';

type ActivitySuccessToastProps = {
  visible: boolean;
  onDismiss: () => void;
  autoHideMs?: number;
};

export function ActivitySuccessToast({
  visible,
  onDismiss,
  autoHideMs = 4500,
}: ActivitySuccessToastProps) {
  const insets = useSafeAreaInsets();
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (!visible || autoHideMs <= 0) return;
    const t = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(t);
  }, [visible, autoHideMs, onDismiss]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { paddingTop: insets.top + theme.space(8) }]}>
      <View style={styles.toast}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onDismiss}
          hitSlop={12}
          accessibilityLabel="Fechar mensagem">
          <Ionicons name="close" size={theme.icon(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={theme.icon(22)} color={TOAST_GREEN} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>Sucesso!</Text>
            <Text style={styles.subtitle}>Atividade adicionada com sucesso!</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      paddingHorizontal: theme.space(16),
      zIndex: 9999,
      elevation: 9999,
    },
    toast: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: TOAST_GREEN,
      borderRadius: theme.space(14),
      borderWidth: 2,
      borderColor: TOAST_BORDER,
      paddingVertical: theme.space(16),
      paddingHorizontal: theme.space(18),
      paddingRight: theme.space(44),
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 4px 14px rgba(22,101,52,0.35)' }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }),
    },
    closeBtn: {
      position: 'absolute',
      top: theme.space(10),
      right: theme.space(10),
      zIndex: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(14),
    },
    iconCircle: {
      width: theme.space(44),
      height: theme.space(44),
      borderRadius: theme.space(22),
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: theme.font(17),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    subtitle: {
      marginTop: theme.space(4),
      fontSize: theme.font(14),
      fontWeight: '500',
      color: '#FFFFFF',
      lineHeight: theme.font(20),
    },
  });
}
