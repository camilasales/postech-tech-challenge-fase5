import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createReminder } from '@/services/api';
import { usePersonalization } from '@/context/PersonalizationContext';
import type { AppTheme } from '@/context/PersonalizationContext';
import {
  combineDateTime,
  defaultScheduleDateTimeStrings,
  formatDateInput,
  formatTimeInput,
  parseDate,
  parseTime,
} from '@/utils/reminderDateTime';
import { buildActivityDescription } from '@/utils/activityDescription';

const FORM_BORDER_BLUE = '#BFDBFE';
const INPUT_MUTED_BORDER = '#E5E7EB';
const LABEL_MUTED = '#6B7280';
const TITLE_TEXT = '#111827';
const CANCEL_GREY = '#6B7280';
const PRIMARY_ACTION_BLUE = '#2563EB';

type AddActivityFormProps = {
  onCancel: () => void;
  onSaved?: () => void;
};

export function AddActivityForm({ onCancel, onSaved }: AddActivityFormProps) {
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const initialSchedule = useMemo(() => defaultScheduleDateTimeStrings(), []);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(initialSchedule.date);
  const [time, setTime] = useState(initialSchedule.time);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuario nao autenticado.');
      const scheduledAt = combineDateTime(date, time);
      if (!scheduledAt) throw new Error('Data ou hora invalida.');
      const description = buildActivityDescription(title, notes);
      await createReminder({
        userId: user.id,
        description,
        scheduledAtIso: scheduledAt.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setTitle('');
      setNotes('');
      const next = defaultScheduleDateTimeStrings();
      setDate(next.date);
      setTime(next.time);
      onSaved?.();
      onCancel();
    },
    onError: () => {
      Alert.alert('Erro', 'Nao foi possivel salvar a atividade.');
    },
  });

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Informe o titulo da atividade.');
      return;
    }
    if (!combineDateTime(date, time)) {
      Alert.alert('Erro', 'Data ou hora invalida. Use DD/MM/AAAA e HH:MM (24h).');
      return;
    }
    saveMutation.mutate();
  }, [title, date, time, saveMutation]);

  const canSave =
    title.trim().length > 0 &&
    parseDate(date) !== null &&
    parseTime(time) !== null &&
    !saveMutation.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardWrap}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nova Atividade</Text>

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
          accessibilityLabel="Data da atividade"
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
          accessibilityLabel="Hora da atividade"
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
            (!canSave || saveMutation.isPending) && styles.btnDisabled,
          ]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.88}>
          {saveMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnSaveText}>Salvar Atividade</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnCancel, { backgroundColor: CANCEL_GREY }]}
          onPress={onCancel}
          activeOpacity={0.88}
          disabled={saveMutation.isPending}>
          <Text style={styles.btnCancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    keyboardWrap: {
      marginBottom: theme.space(20),
    },
    card: {
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
      fontSize: theme.font(18),
      fontWeight: '800',
      color: TITLE_TEXT,
      marginBottom: theme.space(18),
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
