import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarLayout, APP_HEADER_PURPLE } from '@/components/SidebarLayout';
import { EditActivityForm } from '@/components/EditActivityForm';
import { AddActivityForm } from '@/components/AddActivityForm';
import { ActivitySuccessToast } from '@/components/ActivitySuccessToast';
import { useRemindersContext } from '@/context/RemindersContext';
import type { AppTheme } from '@/context/PersonalizationContext';
import { usePersonalization } from '@/context/PersonalizationContext';
import { ReminderStatusFilter, type TaskListRow } from '@/types/reminder';
import { patchReminderCompleted } from '@/services/api';
import { parseActivityDescription } from '@/utils/activityDescription';

const CHECKBOX_PENDING_RING = '#D1D5DB';
const STAT_PENDING_BG = '#FFFBEB';
const STAT_PENDING_BORDER = '#FDBA74';
const STAT_DONE_BG = '#F0FDF4';
const STAT_DONE_BORDER = '#BBF7D0';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function coerceDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

export function TaskListScreen() {
  const { theme, settings } = usePersonalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { reminders, summary, error: contextError, refetch } = useRemindersContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastSubtitle, setSuccessToastSubtitle] = useState('Atividade adicionada com sucesso!');
  const [statusFilter, setStatusFilter] = useState<ReminderStatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<{ id: string; completed: boolean } | null>(null);
  const searchSubject = useMemo(() => new Subject<string>(), []);

  useEffect(() => {
    const subscription = searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(setDebouncedSearch);
    return () => subscription.unsubscribe();
  }, [searchSubject]);

  useEffect(() => {
    if (!params.refresh) return;
    const timer = setTimeout(() => {
      refetch();
      router.setParams({ refresh: undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [params.refresh, refetch, router]);

  const openSuccessToast = useCallback(
    (subtitle: string) => {
      if (!settings.enhancedFeedback) return;
      setSuccessToastSubtitle(subtitle);
      setShowSuccessToast(true);
    },
    [settings.enhancedFeedback]
  );

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await patchReminderCompleted(id, completed);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      if (variables.completed) openSuccessToast('Atividade concluida com sucesso!');
    },
  });

  const requestToggle = useCallback(
    (id: string, completed: boolean) => {
      if (settings.extraConfirmations) {
        setPendingConfirmation({ id, completed });
        return;
      }
      toggleMutation.mutate({ id, completed });
    },
    [settings.extraConfirmations, toggleMutation]
  );

  const filtered = useMemo(() => {
    let list = reminders;
    if (statusFilter === 'pending') list = list.filter((item) => !item.completed);
    if (statusFilter === 'completed') list = list.filter((item) => item.completed);
    const query = debouncedSearch.trim().toLowerCase();
    if (query) list = list.filter((item) => item.description.toLowerCase().includes(query));
    return {
      pending: list.filter((item) => !item.completed),
      completed: list.filter((item) => item.completed),
    };
  }, [reminders, statusFilter, debouncedSearch]);

  const rows = useMemo((): TaskListRow[] => {
    const output: TaskListRow[] = [];
    if (statusFilter !== 'completed' && filtered.pending.length > 0) {
      output.push({ type: 'header', id: 'pending-header', variant: 'pending' });
      filtered.pending.forEach((reminder) => output.push({ type: 'item', id: reminder.id, reminder }));
    }
    if (statusFilter !== 'pending' && filtered.completed.length > 0) {
      output.push({ type: 'header', id: 'completed-header', variant: 'completed' });
      filtered.completed.forEach((reminder) => output.push({ type: 'item', id: reminder.id, reminder }));
    }
    return output;
  }, [filtered, statusFilter]);

  const searchConfig =
    settings.interfaceMode === 'advanced'
      ? {
          value: searchText,
          onChangeText: (text: string) => {
            setSearchText(text);
            searchSubject.next(text);
          },
          onClear: () => {
            setSearchText('');
            searchSubject.next('');
          },
          mobilePlaceholder: 'Buscar atividades...',
        }
      : null;

  const renderItem = useCallback(
    ({ item }: { item: TaskListRow }) => {
      if (item.type === 'header') {
        const done = item.variant === 'completed';
        return (
          <View style={styles.sectionHeader}>
            <Ionicons name={done ? 'checkmark-circle' : 'time-outline'} size={theme.icon(22)} color={done ? '#16A34A' : '#EA580C'} />
            <Text style={styles.sectionTitle}>{done ? 'Atividades Concluidas' : 'Atividades Pendentes'}</Text>
          </View>
        );
      }

      const reminder = item.reminder;
      const details = parseActivityDescription(reminder.description);
      const completedAt = coerceDate(reminder.updatedAt, reminder.scheduledAt);
      return (
        <View style={[styles.card, reminder.completed && styles.cardDone]}>
          <TouchableOpacity onPress={() => requestToggle(reminder.id, !reminder.completed)} style={styles.checkWrap}>
            <View style={[styles.check, reminder.completed && styles.checkDone]}>
              {reminder.completed ? <Ionicons name="checkmark" size={theme.icon(16)} color="#FFFFFF" /> : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardMain} onPress={() => setEditingReminderId(reminder.id)} activeOpacity={0.8}>
            <Text style={styles.cardTitle}>{details.title}</Text>
            {details.subtitle ? <Text style={styles.cardSubtitle}>{details.subtitle}</Text> : null}
            <Text style={styles.cardMeta}>
              {reminder.completed ? `Concluido em ${formatDate(completedAt)}` : formatDate(reminder.scheduledAt)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingReminderId(reminder.id)} style={styles.editBtn} accessibilityLabel="Editar atividade">
            <Ionicons name="create-outline" size={theme.icon(20)} color={colors.muted} />
          </TouchableOpacity>
        </View>
      );
    },
    [colors.muted, requestToggle, styles, theme]
  );

  return (
    <SidebarLayout
      activeNavKey="tasks"
      desktopTopBarLeft="empty"
      searchConfig={searchConfig}
      topBarRight={
        settings.interfaceMode === 'advanced' ? (
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.iconBtn}>
            <Ionicons name="funnel-outline" size={theme.icon(22)} color={colors.text} />
          </TouchableOpacity>
        ) : null
      }
      postContent={
        <>
          <ActivitySuccessToast visible={showSuccessToast} subtitle={successToastSubtitle} onDismiss={() => setShowSuccessToast(false)} />
          <EditActivityForm
            visible={editingReminderId !== null}
            reminderId={editingReminderId}
            onClose={() => setEditingReminderId(null)}
            onSaved={() => openSuccessToast('Atividade alterada com sucesso!')}
          />

          <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
            <View style={styles.sheetOverlay}>
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>Filtros</Text>
                <View style={styles.chips}>
                  {(['all', 'pending', 'completed'] as const).map((key) => (
                    <TouchableOpacity key={key} style={[styles.chip, statusFilter === key && styles.chipActive]} onPress={() => setStatusFilter(key)}>
                      <Text style={[styles.chipText, statusFilter === key && styles.chipTextActive]}>
                        {key === 'all' ? 'Todos' : key === 'pending' ? 'Pendentes' : 'Concluidas'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setStatusFilter('all'); setShowFilters(false); }}>
                    <Text style={styles.secondaryBtnText}>Limpar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowFilters(false)}>
                    <Text style={styles.primaryBtnText}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={pendingConfirmation !== null} animationType="fade" transparent onRequestClose={() => setPendingConfirmation(null)}>
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Confirmar acao</Text>
                <Text style={styles.confirmText}>
                  {pendingConfirmation?.completed ? 'Deseja marcar esta atividade como concluida?' : 'Deseja voltar esta atividade para pendente?'}
                </Text>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPendingConfirmation(null)}>
                    <Text style={styles.secondaryBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => {
                      if (pendingConfirmation) toggleMutation.mutate(pendingConfirmation);
                      setPendingConfirmation(null);
                    }}>
                    <Text style={styles.primaryBtnText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {toggleMutation.isPending ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="small" color={colors.blue} />
            </View>
          ) : null}
        </>
      }>
      <View style={styles.container}>
        <View style={[styles.hero, { backgroundColor: APP_HEADER_PURPLE }]}>
          <Ionicons name="checkmark" size={theme.icon(24)} color={APP_HEADER_PURPLE} style={styles.heroIcon} />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Minhas Atividades</Text>
            <Text style={styles.heroSubtitle}>Organize suas atividades do dia a dia</Text>
          </View>
        </View>

        {settings.interfaceMode === 'advanced' ? (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: STAT_PENDING_BG, borderColor: STAT_PENDING_BORDER }]}>
              <Text style={styles.statNumber}>{summary.pending}</Text>
              <Text style={styles.statLabel}>Pendentes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: STAT_DONE_BG, borderColor: STAT_DONE_BORDER }]}>
              <Text style={styles.statNumber}>{summary.completed}</Text>
              <Text style={styles.statLabel}>Concluidas</Text>
            </View>
          </View>
        ) : null}

        {contextError ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>{contextError}</Text>
          </View>
        ) : null}

        {!settings.reminderNotifications ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>Lembretes e notificacoes estao desativados nas configuracoes.</Text>
          </View>
        ) : null}

        {showAddForm ? (
          <AddActivityForm onCancel={() => setShowAddForm(false)} onSaved={() => openSuccessToast('Atividade adicionada com sucesso!')} />
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
            <Text style={styles.addBtnText}>+ Adicionar Nova Atividade</Text>
          </TouchableOpacity>
        )}

        <FlashList
          data={rows}
          renderItem={renderItem}
          keyExtractor={(row) => row.id}
          getItemType={(row) => row.type}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkbox-outline" size={theme.icon(48)} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>{reminders.length === 0 ? 'Nenhuma Atividade Cadastrada' : 'Nenhum resultado'}</Text>
              <Text style={styles.emptyText}>
                {reminders.length === 0 ? 'Crie sua primeira atividade para comecar.' : 'Tente ajustar os filtros ou a busca.'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          extraData={`${showAddForm}-${settings.interfaceMode}`}
        />
      </View>
    </SidebarLayout>
  );
}

function createStyles(theme: AppTheme) {
  const colors = theme.colors;
  const cardShadow =
    Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };
  return StyleSheet.create({
    container: { flex: 1 },
    iconBtn: { padding: theme.space(6) },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.space(14), padding: theme.space(18), marginBottom: theme.space(16) },
    heroIcon: { backgroundColor: '#FFFFFF', borderRadius: theme.space(10), padding: theme.space(10), overflow: 'hidden' },
    heroTextWrap: { flex: 1, marginLeft: theme.space(12) },
    heroTitle: { fontSize: theme.font(18), fontWeight: '800', color: '#FFFFFF' },
    heroSubtitle: { marginTop: theme.space(4), fontSize: theme.font(14), color: 'rgba(255,255,255,0.92)' },
    statsRow: { flexDirection: 'row', gap: theme.space(12), marginBottom: theme.space(16) },
    statCard: { flex: 1, borderWidth: 1, borderRadius: theme.space(12), padding: theme.space(14) },
    statNumber: { fontSize: theme.font(22), fontWeight: '800', color: colors.text },
    statLabel: { marginTop: theme.space(4), fontSize: theme.font(13), fontWeight: '700', color: colors.muted },
    warning: { backgroundColor: colors.errorBannerBg, borderWidth: 1, borderColor: colors.errorBannerBorder, borderRadius: theme.space(8), padding: theme.space(12), marginBottom: theme.space(12) },
    warningText: { color: colors.errorBannerText, fontSize: theme.font(13) },
    notice: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#7DD3FC', borderRadius: theme.space(8), padding: theme.space(12), marginBottom: theme.space(12) },
    noticeText: { color: colors.text, fontSize: theme.font(13) },
    addBtn: { backgroundColor: '#16A34A', borderRadius: theme.space(14), paddingVertical: theme.space(16), alignItems: 'center', marginBottom: theme.space(16) },
    addBtnText: { color: '#FFFFFF', fontSize: theme.font(16), fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.space(10), marginBottom: theme.space(12), marginTop: theme.space(8) },
    sectionTitle: { fontSize: theme.font(17), fontWeight: '800', color: colors.text },
    card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: theme.space(12), padding: theme.space(16), marginBottom: theme.space(12), ...cardShadow },
    cardDone: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
    checkWrap: { marginRight: theme.space(14), marginTop: theme.space(2) },
    check: { width: theme.space(28), height: theme.space(28), borderRadius: theme.space(14), borderWidth: 2.5, borderColor: CHECKBOX_PENDING_RING, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    checkDone: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
    cardMain: { flex: 1, minWidth: 0 },
    cardTitle: { fontSize: theme.font(16), fontWeight: '700', color: colors.text, lineHeight: theme.font(22) },
    cardSubtitle: { marginTop: theme.space(6), fontSize: theme.font(14), color: '#6B7280', lineHeight: theme.font(20) },
    cardMeta: { marginTop: theme.space(10), fontSize: theme.font(13), color: '#6B7280', fontWeight: '500' },
    editBtn: { padding: theme.space(6), marginLeft: theme.space(4) },
    empty: { alignItems: 'center', justifyContent: 'center', minHeight: theme.space(220), paddingVertical: theme.space(40), paddingHorizontal: theme.space(24), backgroundColor: '#FAFAFA', borderRadius: theme.space(14), borderWidth: 1, borderColor: '#E5E7EB' },
    emptyTitle: { marginTop: theme.space(16), fontSize: theme.font(17), fontWeight: '800', color: '#374151', textAlign: 'center' },
    emptyText: { marginTop: theme.space(10), fontSize: theme.font(14), color: '#6B7280', textAlign: 'center', lineHeight: theme.font(21) },
    listContent: { paddingBottom: theme.space(96) },
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: theme.space(16), borderTopRightRadius: theme.space(16), padding: theme.space(20), paddingBottom: theme.space(24) },
    sheetTitle: { fontSize: theme.font(18), fontWeight: '700', color: colors.text, marginBottom: theme.space(14) },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(10), marginBottom: theme.space(18) },
    chip: { paddingVertical: theme.space(10), paddingHorizontal: theme.space(16), borderRadius: theme.space(8), borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgPage },
    chipActive: { borderColor: colors.blue, backgroundColor: colors.chipActiveBg },
    chipText: { fontSize: theme.font(14), fontWeight: '600', color: colors.muted },
    chipTextActive: { color: colors.blue },
    sheetActions: { flexDirection: 'row', gap: theme.space(12) },
    secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: theme.space(8), paddingVertical: theme.space(14), alignItems: 'center' },
    secondaryBtnText: { fontSize: theme.font(15), fontWeight: '600', color: colors.muted },
    primaryBtn: { flex: 1, backgroundColor: colors.blue, borderRadius: theme.space(8), paddingVertical: theme.space(14), alignItems: 'center' },
    primaryBtnText: { fontSize: theme.font(15), fontWeight: '600', color: '#FFFFFF' },
    confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: theme.space(24) },
    confirmCard: { backgroundColor: colors.card, borderRadius: theme.space(16), borderWidth: 1, borderColor: colors.border, padding: theme.space(20) },
    confirmTitle: { fontSize: theme.font(18), fontWeight: '800', color: colors.text, marginBottom: theme.space(10) },
    confirmText: { fontSize: theme.font(14), color: colors.muted, lineHeight: theme.font(21), marginBottom: theme.space(18) },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlayLoading },
  });
}
