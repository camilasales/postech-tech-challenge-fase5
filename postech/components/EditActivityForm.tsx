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
const STEP_INACTIVE_BG = '#E5E7EB';

const STEPS = [
  { id: 'details', title: 'Detalhes' },
  { id: 'schedule', title: 'Horario' },
  { id: 'review', title: 'Revisao' },
] as const;

type EditActivityFormProps = {
  visible: boolean;
  reminderId: string | null;
  onClose: () => void;
  onSaved?: () => void;
};

export function EditActivityForm({ visible, reminderId, onClose, onSaved }: EditActivityFormProps) {
  const insets = useSafeAreaInsets();
  const { theme } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!reminderId;

  const [currentStep, setCurrentStep] = useState(0);
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

  const scheduledAt = useMemo(() => combineDateTime(date, time), [date, time]);
  const detailStepValid = title.trim().length > 0;
  const scheduleStepValid = parseDate(date) !== null && parseTime(time) !== null && scheduledAt !== null;

  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setTitle('');
      setNotes('');
      setDate('');
      setTime('');
      setCompleted(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!reminderData || !visible) return;
    const { title: parsedTitle, subtitle } = parseActivityDescription(reminderData.description ?? '');
    setCurrentStep(0);
    setTitle(parsedTitle);
    setNotes(subtitle ?? '');
    setCompleted(Boolean(reminderData.completed));
    const raw = new Date(reminderData.scheduledAt);
    const day = String(raw.getDate()).padStart(2, '0');
    const month = String(raw.getMonth() + 1).padStart(2, '0');
    const year = raw.getFullYear();
    const hh = String(raw.getHours()).padStart(2, '0');
    const mm = String(raw.getMinutes()).padStart(2, '0');
    setDate(`${day}/${month}/${year}`);
    setTime(`${hh}:${mm}`);
  }, [reminderData, visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { description: string; scheduledAt: Date; completed: boolean }) => {
      if (!reminderId) throw new Error('Sem id.');
      await updateReminder(reminderId, {
        description: payload.description.trim(),
        scheduledAtIso: payload.scheduledAt.toISOString(),
        completed: payload.completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder'] });
      onSaved?.();
      handleClose();
    },
    onError: () => {
      Alert.alert('Erro', 'Nao foi possivel salvar a atividade.');
    },
  });

  const formValid = detailStepValid && scheduleStepValid && !saveMutation.isPending;
  const showLoading = isEditing && isLoadingData;

  const handleNext = useCallback(() => {
    if (currentStep === 0 && !detailStepValid) {
      Alert.alert('Erro', 'Informe o titulo da atividade para continuar.');
      return;
    }
    if (currentStep === 1 && !scheduleStepValid) {
      Alert.alert('Erro', 'Informe data e hora validas para continuar.');
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  }, [currentStep, detailStepValid, scheduleStepValid]);

  const handleBack = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }, []);

  const handleSave = useCallback(() => {
    if (!detailStepValid) {
      Alert.alert('Erro', 'Informe o titulo da atividade.');
      return;
    }
    if (!scheduleStepValid || !scheduledAt) {
      Alert.alert('Erro', 'Data ou hora invalida. Use DD/MM/AAAA e HH:MM (24h).');
      return;
    }
    const description = buildActivityDescription(title, notes);
    saveMutation.mutate({
      description,
      scheduledAt,
      completed,
    });
  }, [completed, detailStepValid, notes, saveMutation, scheduleStepValid, scheduledAt, title]);

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
              <ScrollView
                style={styles.modalBodyScroll}
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                  <Text style={styles.cardTitle}>Edicao guiada da atividade</Text>
                  <Text style={styles.cardSubtitle}>
                    Passo {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
                  </Text>

                  <View style={styles.stepRow}>
                    {STEPS.map((step, index) => {
                      const active = index === currentStep;
                      const done = index < currentStep;
                      return (
                        <View key={step.id} style={styles.stepItem}>
                          <View
                            style={[
                              styles.stepCircle,
                              active && styles.stepCircleActive,
                              done && styles.stepCircleDone,
                            ]}>
                            <Text style={styles.stepCircleText}>{done ? 'OK' : index + 1}</Text>
                          </View>
                          <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step.title}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {currentStep === 0 ? (
                    <View>
                      <Text style={styles.sectionTitle}>Passo 1: revise os detalhes</Text>
                      <Text style={styles.sectionText}>
                        Ajuste o titulo e a descricao para deixar a atividade clara e direta.
                      </Text>

                      <Text style={styles.label}>
                        Titulo da atividade <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.inputTitle, { borderColor: PRIMARY_ACTION_BLUE }]}
                        placeholder="Ex: Consulta medica"
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={120}
                        accessibilityLabel="Titulo da atividade"
                      />

                      <Text style={styles.label}>Descricao opcional</Text>
                      <TextInput
                        style={[styles.inputNotes, { borderColor: INPUT_MUTED_BORDER }]}
                        placeholder="Ex: Levar exames anteriores"
                        placeholderTextColor="#9CA3AF"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        textAlignVertical="top"
                        maxLength={400}
                        accessibilityLabel="Descricao opcional"
                      />
                    </View>
                  ) : null}

                  {currentStep === 1 ? (
                    <View>
                      <Text style={styles.sectionTitle}>Passo 2: confira data e hora</Text>
                      <Text style={styles.sectionText}>
                        Ajuste o horario para manter o lembrete no momento correto.
                      </Text>

                      <Text style={styles.label}>
                        Data <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.inputDateTime, { borderColor: INPUT_MUTED_BORDER }]}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#9CA3AF"
                        value={date}
                        onChangeText={(text) => setDate(formatDateInput(text))}
                        keyboardType="numeric"
                        maxLength={10}
                        accessibilityLabel="Data da atividade"
                      />

                      <Text style={styles.label}>
                        Hora <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.inputDateTime, { borderColor: INPUT_MUTED_BORDER }]}
                        placeholder="HH:MM"
                        placeholderTextColor="#9CA3AF"
                        value={time}
                        onChangeText={(text) => setTime(formatTimeInput(text))}
                        keyboardType="numeric"
                        maxLength={5}
                        accessibilityLabel="Hora da atividade"
                      />
                    </View>
                  ) : null}

                  {currentStep === 2 ? (
                    <View>
                      <Text style={styles.sectionTitle}>Passo 3: confirme a atualizacao</Text>
                      <Text style={styles.sectionText}>
                        Revise as informacoes e defina se a atividade continua pendente ou concluida.
                      </Text>

                      <View style={styles.reviewCard}>
                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewLabel}>Titulo</Text>
                          <Text style={styles.reviewValue}>{title.trim() || '-'}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewLabel}>Descricao</Text>
                          <Text style={styles.reviewValue}>{notes.trim() || 'Sem observacoes'}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewLabel}>Data</Text>
                          <Text style={styles.reviewValue}>{date}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewLabel}>Hora</Text>
                          <Text style={styles.reviewValue}>{time}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewLabel}>Status</Text>
                          <View style={styles.statusRow}>
                            <TouchableOpacity
                              style={[styles.statusChip, !completed && styles.statusChipActive]}
                              onPress={() => setCompleted(false)}
                              activeOpacity={0.88}>
                              <Text style={[styles.statusChipText, !completed && styles.statusChipTextActive]}>
                                Pendente
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.statusChip, completed && styles.statusChipActive]}
                              onPress={() => setCompleted(true)}
                              activeOpacity={0.88}>
                              <Text style={[styles.statusChipText, completed && styles.statusChipTextActive]}>
                                Concluida
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.actionsRow}>
                    {currentStep > 0 ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.backBtn]}
                        onPress={handleBack}
                        disabled={saveMutation.isPending}
                        activeOpacity={0.88}>
                        <Text style={styles.backBtnText}>Voltar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={handleClose}
                        disabled={saveMutation.isPending}
                        activeOpacity={0.88}>
                        <Text style={styles.cancelBtnText}>Fechar</Text>
                      </TouchableOpacity>
                    )}

                    {currentStep < STEPS.length - 1 ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn]}
                        onPress={handleNext}
                        disabled={saveMutation.isPending}
                        activeOpacity={0.88}>
                        <Text style={styles.primaryBtnText}>Continuar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          styles.primaryBtn,
                          !formValid && styles.btnDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={!formValid}
                        activeOpacity={0.88}>
                        {saveMutation.isPending ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <View style={styles.primaryBtnContent}>
                            <Ionicons name="save-outline" size={theme.icon(18)} color="#FFFFFF" />
                            <Text style={styles.primaryBtnText}>Salvar alteracoes</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </ScrollView>
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
    },
    cardSubtitle: {
      marginTop: theme.space(4),
      marginBottom: theme.space(18),
      fontSize: theme.font(13),
      color: LABEL_MUTED,
      lineHeight: theme.font(19),
    },
    stepRow: {
      flexDirection: 'row',
      gap: theme.space(10),
      marginBottom: theme.space(18),
    },
    stepItem: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
    },
    stepCircle: {
      width: theme.space(30),
      height: theme.space(30),
      borderRadius: theme.space(15),
      backgroundColor: STEP_INACTIVE_BG,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleActive: {
      backgroundColor: PRIMARY_ACTION_BLUE,
    },
    stepCircleDone: {
      backgroundColor: '#16A34A',
    },
    stepCircleText: {
      color: '#FFFFFF',
      fontSize: theme.font(12),
      fontWeight: '800',
    },
    stepLabel: {
      marginTop: theme.space(6),
      fontSize: theme.font(12),
      color: LABEL_MUTED,
      fontWeight: '600',
      textAlign: 'center',
    },
    stepLabelActive: {
      color: TITLE_TEXT,
    },
    sectionTitle: {
      fontSize: theme.font(16),
      fontWeight: '800',
      color: TITLE_TEXT,
      marginBottom: theme.space(6),
    },
    sectionText: {
      fontSize: theme.font(14),
      color: LABEL_MUTED,
      lineHeight: theme.font(20),
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
    reviewCard: {
      borderWidth: 1,
      borderColor: INPUT_MUTED_BORDER,
      borderRadius: theme.space(12),
      backgroundColor: '#F9FAFB',
      padding: theme.space(14),
      gap: theme.space(12),
    },
    reviewRow: {
      gap: theme.space(4),
    },
    reviewLabel: {
      fontSize: theme.font(12),
      fontWeight: '700',
      color: LABEL_MUTED,
      textTransform: 'uppercase',
    },
    reviewValue: {
      fontSize: theme.font(15),
      color: TITLE_TEXT,
      lineHeight: theme.font(21),
    },
    statusRow: {
      flexDirection: 'row',
      gap: theme.space(10),
      marginTop: theme.space(4),
    },
    statusChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: INPUT_MUTED_BORDER,
      borderRadius: theme.space(10),
      paddingVertical: theme.space(10),
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    statusChipActive: {
      backgroundColor: PRIMARY_ACTION_BLUE,
      borderColor: PRIMARY_ACTION_BLUE,
    },
    statusChipText: {
      color: TITLE_TEXT,
      fontSize: theme.font(14),
      fontWeight: '700',
    },
    statusChipTextActive: {
      color: '#FFFFFF',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.space(12),
      marginTop: theme.space(8),
    },
    actionBtn: {
      flex: 1,
      borderRadius: theme.space(12),
      paddingVertical: theme.space(15),
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtn: {
      backgroundColor: PRIMARY_ACTION_BLUE,
    },
    primaryBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(8),
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: theme.font(16),
      fontWeight: '800',
    },
    backBtn: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: INPUT_MUTED_BORDER,
    },
    backBtnText: {
      color: TITLE_TEXT,
      fontSize: theme.font(15),
      fontWeight: '700',
    },
    cancelBtn: {
      backgroundColor: CANCEL_GREY,
    },
    cancelBtnText: {
      color: '#FFFFFF',
      fontSize: theme.font(15),
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.5,
    },
  });
}
