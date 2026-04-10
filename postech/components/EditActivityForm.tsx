import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { fetchReminderById, updateReminder } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  combineDateTime,
  formatDateInput,
  formatTimeInput,
  parseDate,
  parseTime,
} from '@/utils/reminderDateTime';
import { buildActivityDescription, parseActivityDescription } from '@/utils/activityDescription';
import { usePersonalization } from '@/context/PersonalizationContext';
import type { AppTheme } from '@/context/PersonalizationContext';

const FORM_BORDER_BLUE = '#BFDBFE';
const INPUT_MUTED_BORDER = '#E5E7EB';
const LABEL_MUTED = '#6B7280';
const TITLE_TEXT = '#111827';
const CANCEL_GREY = '#6B7280';
const PRIMARY_ACTION_BLUE = '#2563EB';

type EditActivityFormProps = {
  visible: boolean;
  reminderId: string | null;
  onClose: () => void;
};

export function EditActivityForm({ visible, reminderId, onClose }: EditActivityFormProps) {
  const insets = useSafeAreaInsets();
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!reminderId;

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [completed, setCompleted] = useState(false);

  const { data: reminderData, isLoading: isLoadingData } = useQuery({
    queryKey: ['reminder', reminderId],
    queryFn: async () => {
      if (!reminderId || !user?.id) return null;
      const row = await fetchReminderById(reminderId);
      if (!row) throw new Error('Lembrete nao encontrado.');
      if (String(row.userId) !== user.id) throw new Error('Acesso negado.');
      return row;
    },
    enabled: visible && isEditing && !!user?.id,
  });

  useEffect(() => {
    if (!visible) {
      setTitle('');
      setNotes('');
      setDate('');
      setTime('');
      setCompleted(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!reminderData || !visible) return;
    const { title: t, subtitle } = parseActivityDescription(reminderData.description ?? '');
    setTitle(t);
    setNotes(subtitle ?? '');
    setCompleted(Boolean(reminderData.completed));
    const raw = new Date(reminderData.scheduledAt);
    const day = String(raw.getDate()).padStart(2, '0');
    const month = String(raw.getMonth() + 1).padStart(2, '0');
    const year = raw.getFullYear();
    setDate(`${day}/${month}/${year}`);
    const hh = String(raw.getHours()).padStart(2, '0');
    const mm = String(raw.getMinutes()).padStart(2, '0');
    setTime(`${hh}:${mm}`);
  }, [reminderData, visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { description: string; scheduledAt: Date; completed: boolean }) => {
      if (!reminderId) throw new Error('Sem id.');
      const scheduledAtIso = payload.scheduledAt.toISOString();
      await updateReminder(reminderId, {
        description: payload.description.trim(),
        scheduledAtIso,
        completed: payload.completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder'] });
      handleClose();
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível salvar a atividade.');
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Informe o título da atividade.');
      return;
    }
    const scheduledAt = combineDateTime(date, time);
    if (!scheduledAt) {
      Alert.alert('Erro', 'Data ou hora inválida. Use DD/MM/AAAA e HH:MM (24h).');
      return;
    }
    const description = buildActivityDescription(title, notes);
    saveMutation.mutate({
      description,
      scheduledAt,
      completed,
    });
  };

  const formValid =
    title.trim().length > 0 && parseDate(date) !== null && parseTime(time) !== null && !saveMutation.isPending;

  const showLoading = isEditing && isLoadingData;

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
              <Text style={styles.modalHeaderTitle}>Editar atividade</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12} accessibilityLabel="Fechar">
                <Ionicons name="close" size={theme.icon(26)} color={TITLE_TEXT} />
              </TouchableOpacity>
            </View>

            {showLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={PRIMARY_ACTION_BLUE} />
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.modalBodyScroll}
                  contentContainerStyle={styles.modalBodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Dados da atividade</Text>

                    <Text style={styles.label}>
                      Título da Atividade <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.inputTitle, { borderColor: PRIMARY_ACTION_BLUE }]}
                      placeholder="Ex: Consulta médica"
                      placeholderTextColor="#9CA3AF"
                      value={title}
                      onChangeText={setTitle}
                      maxLength={120}
                      accessibilityLabel="Título da atividade"
                    />

                    <Text style={styles.label}>
                      Data <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.inputDateTime, { borderColor: INPUT_MUTED_BORDER }]}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#9CA3AF"
                      value={date}
                      onChangeText={(t) => setDate(formatDateInput(t))}
                      keyboardType="numeric"
                      maxLength={10}
                    />

                    <Text style={styles.label}>
                      Hora <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.inputDateTime, { borderColor: INPUT_MUTED_BORDER }]}
                      placeholder="HH:MM (24 horas)"
                      placeholderTextColor="#9CA3AF"
                      value={time}
                      onChangeText={(t) => setTime(formatTimeInput(t))}
                      keyboardType="numeric"
                      maxLength={5}
                    />

 <Text style={styles.label}>Descrição (Opcional)</Text>
                    <TextInput
                      style={[styles.inputNotes, { borderColor: INPUT_MUTED_BORDER }]}
                      placeholder="Ex: Levar exames anteriores"
                      placeholderTextColor="#9CA3AF"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      textAlignVertical="top"
                      maxLength={400}
                      accessibilityLabel="Descrição opcional"
                    />

                    <TouchableOpacity
                      style={[
                        styles.btnSave,
                        { backgroundColor: PRIMARY_ACTION_BLUE },
                        !formValid && styles.btnDisabled,
                      ]}
                      onPress={handleSave}
                      disabled={!formValid}
                      activeOpacity={0.88}>
                      {saveMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnSaveText}>Salvar alterações</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnCancel, { backgroundColor: CANCEL_GREY }]}
                      onPress={handleClose}
                      activeOpacity={0.88}
                      disabled={saveMutation.isPending}>
                      <Text style={styles.btnCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
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
    loadingBox: {
      paddingVertical: theme.space(48),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
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
    inputTitle: {
      borderWidth: 2,
      borderRadius: theme.space(10),
      paddingHorizontal: theme.space(14),
      paddingVertical: theme.space(12),
      fontSize: theme.font(16),
      color: TITLE_TEXT,
      backgroundColor: '#FFFFFF',
      marginBottom: theme.space(16),
    },
    inputNotes: {
      borderWidth: 1,
      borderRadius: theme.space(10),
      paddingHorizontal: theme.space(14),
      paddingVertical: theme.space(12),
      fontSize: theme.font(15),
      color: TITLE_TEXT,
      backgroundColor: '#FFFFFF',
      minHeight: theme.space(100),
      marginBottom: theme.space(16),
    },
    inputDateTime: {
      borderWidth: 1,
      borderRadius: theme.space(10),
      paddingHorizontal: theme.space(14),
      paddingVertical: theme.space(12),
      fontSize: theme.font(16),
      color: TITLE_TEXT,
      backgroundColor: '#FFFFFF',
      marginBottom: theme.space(16),
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.space(20),
      paddingVertical: theme.space(4),
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
