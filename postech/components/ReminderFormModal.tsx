import React, { useState, useEffect } from 'react';
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
import { createReminder, fetchReminderById, updateReminder } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const BLUE = '#2563EB';
const BORDER = '#E5E7EB';
const BG_PAGE = '#F9FAFB';
const CARD = '#FFFFFF';
const TEXT = '#111827';
const MUTED = '#6B7280';

const formatDateInput = (text: string): string => {
  const numbers = text.replace(/\D/g, '');
  if (numbers === '') return '';
  const limited = numbers.slice(0, 8);
  if (limited.length <= 2) return limited;
  if (limited.length <= 4) return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
};

const formatTimeInput = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const parseDate = (dateString: string): Date | null => {
  if (!dateString || dateString.length < 10) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  const d = new Date(year, month, day);
  if (d.getDate() !== day || d.getMonth() !== month || d.getFullYear() !== year) return null;
  return d;
};

const parseTime = (timeString: string): { h: number; m: number } | null => {
  if (!timeString || timeString.length < 5) return null;
  const [a, b] = timeString.split(':');
  const h = parseInt(a, 10);
  const m = parseInt(b, 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
};

const combineDateTime = (dateStr: string, timeStr: string): Date | null => {
  const d = parseDate(dateStr);
  const t = parseTime(timeStr);
  if (!d || !t) return null;
  d.setHours(t.h, t.m, 0, 0);
  return d;
};

type ReminderFormModalProps = {
  visible: boolean;
  reminderId: string | null;
  onClose: () => void;
};

export function ReminderFormModal({ visible, reminderId, onClose }: ReminderFormModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!reminderId;

  const [description, setDescription] = useState('');
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
      setDescription('');
      setDate('');
      setTime('');
      setCompleted(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!reminderData || !visible) return;
    setDescription(reminderData.description ?? '');
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

  const handleClose = () => {
    onClose();
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      description: string;
      scheduledAt: Date;
      completed: boolean;
    }) => {
      if (!user?.id) throw new Error('Usuario nao autenticado.');
      const scheduledAtIso = payload.scheduledAt.toISOString();
      if (isEditing && reminderId) {
        await updateReminder(reminderId, {
          description: payload.description.trim(),
          scheduledAtIso,
          completed: payload.completed,
        });
      } else {
        await createReminder({
          userId: user.id,
          description: payload.description.trim(),
          scheduledAtIso,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder'] });
      handleClose();
    },
    onError: () => {
      Alert.alert('Erro', 'Nao foi possivel salvar o lembrete.');
    },
  });

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Informe a descricao.');
      return;
    }
    const scheduledAt = combineDateTime(date, time);
    if (!scheduledAt) {
      Alert.alert('Erro', 'Data ou hora invalida. Use DD/MM/AAAA e HH:MM (24h).');
      return;
    }
    saveMutation.mutate({
      description,
      scheduledAt,
      completed: isEditing ? completed : false,
    });
  };

  const formValid =
    description.trim().length > 0 && parseDate(date) !== null && parseTime(time) !== null;

  const showLoading = isEditing && isLoadingData;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={26} color={TEXT} />
              </TouchableOpacity>
            </View>

            {showLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={BLUE} />
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.modalBodyScroll}
                  contentContainerStyle={styles.modalBodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <Text style={styles.hint}>Descricao, data e hora do lembrete</Text>

                  <Text style={styles.label}>Descricao</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="O que voce precisa lembrar?"
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={200}
                    multiline
                  />

                  <Text style={styles.label}>Data</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9CA3AF"
                    value={date}
                    onChangeText={(t) => setDate(formatDateInput(t))}
                    keyboardType="numeric"
                    maxLength={10}
                  />

                  <Text style={styles.label}>Hora</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM (24 horas)"
                    placeholderTextColor="#9CA3AF"
                    value={time}
                    onChangeText={(t) => setTime(formatTimeInput(t))}
                    keyboardType="numeric"
                    maxLength={5}
                  />

                  {isEditing ? (
                    <View style={styles.switchRow}>
                      <Text style={styles.label}>Concluido</Text>
                      <Switch
                        value={completed}
                        onValueChange={setCompleted}
                        trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                        thumbColor={completed ? BLUE : '#f4f3f4'}
                      />
                    </View>
                  ) : null}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.modalBtnGhost} onPress={handleClose}>
                    <Text style={styles.modalBtnGhostText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtnPrimary,
                      (!formValid || saveMutation.isPending) && styles.modalBtnPrimaryDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={!formValid || saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalBtnPrimaryText}>
                        {isEditing ? 'Atualizar' : 'Salvar'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CARD,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBodyScroll: {
    maxHeight: 420,
  },
  modalBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: CARD,
    color: TEXT,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  modalBtnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    backgroundColor: BG_PAGE,
  },
  modalBtnGhostText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryDisabled: {
    opacity: 0.55,
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
