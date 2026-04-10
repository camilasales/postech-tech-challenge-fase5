import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { AppUser, ProfileEditablePayload } from '@/types/user';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';

const FORM_BORDER_BLUE = '#BFDBFE';
const INPUT_MUTED_BORDER = '#E5E7EB';
const LABEL_MUTED = '#6B7280';
const TITLE_TEXT = '#111827';
const CANCEL_GREY = '#6B7280';
const PRIMARY_ACTION_BLUE = '#2563EB';
const READONLY_BG = '#F3F4F6';

type EditProfileModalProps = {
  visible: boolean;
  user: AppUser;
  onClose: () => void;
  onSave: (payload: ProfileEditablePayload) => Promise<void>;
};

export function EditProfileModal({ visible, user, onClose, onSave }: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(user.name ?? '');
    setPhone(user.phone ?? '');
    setAddress(user.address ?? '');
  }, [visible, user]);

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Atenção', 'Informe o nome completo.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        phone: phone.trim(),
        address: address.trim(),
      });
      onClose();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }, [name, phone, address, onSave, onClose]);

  const formValid = name.trim().length > 0 && !saving;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, theme.space(16)) },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Editar perfil</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12} accessibilityLabel="Fechar">
                <Ionicons name="close" size={theme.icon(26)} color={TITLE_TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Dados pessoais</Text>

                <Text style={styles.label}>
                  Nome completo <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.inputPrimaryBorder]}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  maxLength={120}
                  accessibilityLabel="Nome completo"
                />

                <Text style={styles.label}>E-mail</Text>
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyEmail}>{user.email}</Text>
                </View>
                <Text style={styles.readOnlyHint}>O e-mail não pode ser alterado aqui.</Text>

                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={[styles.input, styles.inputMutedBorder]}
                  placeholder="Ex: (11) 98765-4321"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={40}
                  accessibilityLabel="Telefone"
                />

                <Text style={styles.label}>Endereço</Text>
                <TextInput
                  style={[styles.inputNotes, styles.inputMutedBorder]}
                  placeholder="Rua, número, bairro, cidade..."
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  textAlignVertical="top"
                  maxLength={300}
                  accessibilityLabel="Endereço"
                />

                <TouchableOpacity
                  style={[
                    styles.btnSave,
                    { backgroundColor: PRIMARY_ACTION_BLUE },
                    !formValid && styles.btnDisabled,
                  ]}
                  onPress={() => void handleSave()}
                  disabled={!formValid}
                  activeOpacity={0.88}>
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnSaveText}>Salvar alterações</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnCancel, { backgroundColor: CANCEL_GREY }]}
                  onPress={handleClose}
                  activeOpacity={0.88}
                  disabled={saving}>
                  <Text style={styles.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    keyboardRoot: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: '#F9FAFB',
      borderTopLeftRadius: theme.space(16),
      borderTopRightRadius: theme.space(16),
      maxHeight: '92%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.space(20),
      paddingTop: theme.space(18),
      paddingBottom: theme.space(12),
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: INPUT_MUTED_BORDER,
    },
    modalHeaderTitle: {
      fontSize: theme.font(18),
      fontWeight: '800',
      color: TITLE_TEXT,
    },
    modalBodyScroll: {
      maxHeight: 520,
    },
    modalBodyContent: {
      paddingHorizontal: theme.space(20),
      paddingTop: theme.space(16),
      paddingBottom: theme.space(24),
    },
    formCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.space(14),
      borderWidth: 1,
      borderColor: FORM_BORDER_BLUE,
      padding: theme.space(18),
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 3,
            elevation: 2,
          }),
    },
    cardTitle: {
      fontSize: theme.font(16),
      fontWeight: '800',
      color: TITLE_TEXT,
      marginBottom: theme.space(16),
    },
    label: {
      fontSize: theme.font(13),
      fontWeight: '600',
      color: LABEL_MUTED,
      marginBottom: theme.space(8),
    },
    required: {
      color: PRIMARY_ACTION_BLUE,
    },
    input: {
      borderWidth: 2,
      borderRadius: theme.space(10),
      paddingHorizontal: theme.space(14),
      paddingVertical: theme.space(12),
      fontSize: theme.font(16),
      color: TITLE_TEXT,
      backgroundColor: '#FFFFFF',
      marginBottom: theme.space(16),
    },
    inputPrimaryBorder: {
      borderColor: PRIMARY_ACTION_BLUE,
    },
    inputMutedBorder: {
      borderWidth: 1,
      borderColor: INPUT_MUTED_BORDER,
    },
    inputNotes: {
      borderRadius: theme.space(10),
      paddingHorizontal: theme.space(14),
      paddingVertical: theme.space(12),
      fontSize: theme.font(15),
      color: TITLE_TEXT,
      backgroundColor: '#FFFFFF',
      minHeight: theme.space(100),
      marginBottom: theme.space(16),
    },
    readOnlyBox: {
      borderWidth: 1,
      borderColor: INPUT_MUTED_BORDER,
      borderRadius: theme.space(10),
      paddingHorizontal: theme.space(14),
      paddingVertical: theme.space(12),
      backgroundColor: READONLY_BG,
      marginBottom: theme.space(6),
    },
    readOnlyEmail: {
      fontSize: theme.font(16),
      fontWeight: '600',
      color: '#4B5563',
    },
    readOnlyHint: {
      fontSize: theme.font(12),
      color: LABEL_MUTED,
      marginBottom: theme.space(16),
    },
    btnSave: {
      borderRadius: theme.space(12),
      paddingVertical: theme.space(15),
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnSaveText: {
      color: '#FFFFFF',
      fontSize: theme.font(16),
      fontWeight: '800',
    },
    btnCancel: {
      marginTop: theme.space(12),
      borderRadius: theme.space(12),
      paddingVertical: theme.space(15),
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnCancelText: {
      color: '#FFFFFF',
      fontSize: theme.font(16),
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.5,
    },
  });
}
