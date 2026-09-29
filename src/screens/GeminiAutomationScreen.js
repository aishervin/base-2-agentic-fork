import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { hasGeminiApiKey } from '../api/geminiKeyStore';
import { cancelScheduledTask, listScheduledTasks } from '../automation/scheduleStore';
import { isAutomationEnabled } from '../automation/automationPolicy';
import { runGeminiTurn } from '../automation/geminiService';
import { Notice, Panel, PrimaryButton } from '../components/Ui';
import { colors, font } from '../theme';

const toolLabels = {
  list_shipments: 'خواندن فهرست اسناد',
  get_shipment_details: 'خواندن جزئیات سند',
  start_trip: 'ثبت شروع حمل',
  finish_trip: 'ثبت پایان حمل',
  schedule_task: 'ذخیره زمان‌بندی',
  cancel_scheduled_task: 'لغو زمان‌بندی',
  open_app_section: 'بازکردن بخش برنامه',
};

const statusLabels = {
  scheduled: 'در انتظار',
  running: 'در حال اجرا',
  completed: 'انجام شد',
  failed: 'ناموفق',
};

export default function GeminiAutomationScreen({ onOpenSettings, onNavigate, onScheduleChanged }) {
  const [messages, setMessages] = useState([{
    id: 'welcome', role: 'assistant',
    text: 'سلام. من دستیار برنامه هستم. می‌توانم درباره اسناد پیاده‌سازی‌شده پاسخ بدهم، عملیات مجاز را انجام بدهم و کارهای درخواستی را بر اساس ساعت گوشی زمان‌بندی کنم.',
  }]);
  const [draft, setDraft] = useState('');
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [policyReady, setPolicyReady] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const conversation = useRef([]);
  const chatScroll = useRef(null);

  async function refreshStatus() {
    try {
      const [key, enabled, tasks] = await Promise.all([hasGeminiApiKey(), isAutomationEnabled(), listScheduledTasks()]);
      setApiKeyReady(key);
      setPolicyReady(enabled);
      setScheduledTasks(tasks);
    } catch (issue) {
      setError(issue.message || 'خواندن تنظیمات اتوماسیون انجام نشد.');
    } finally {
      setStatusLoaded(true);
    }
  }

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  async function send() {
    const text = draft.trim();
    if (!text || busy || !apiKeyReady) return;
    setDraft('');
    setError('');
    setBusy(true);
    setMessages(current => [...current, { id: `u-${Date.now()}`, role: 'user', text }]);
    const requestContents = [...conversation.current, { role: 'user', parts: [{ text }] }];
    let requestedSection;

    try {
      const result = await runGeminiTurn(requestContents, {
        onToolCall: name => setMessages(current => [...current, { id: `t-${Date.now()}-${name}`, role: 'activity', text: toolLabels[name] || name }]),
        onScheduleChanged: () => {
          refreshStatus();
          onScheduleChanged?.().catch(() => {});
        },
        onNavigate: section => { requestedSection = section; },
      });
      conversation.current = result.contents;
      setMessages(current => [...current, { id: `a-${Date.now()}`, role: 'assistant', text: result.text }]);
      refreshStatus();
      if (requestedSection && requestedSection !== 'automation') setTimeout(() => onNavigate?.(requestedSection), 350);
    } catch (issue) {
      conversation.current = requestContents;
      setError(issue.message || 'پاسخ از Gemini دریافت نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function cancelTask(id) {
    try {
      await cancelScheduledTask(id);
      await refreshStatus();
      await onScheduleChanged?.();
    } catch (issue) {
      setError(issue.message || 'لغو زمان‌بندی انجام نشد.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topStatus}>
        {!statusLoaded ? <Text style={styles.smallText}>در حال بررسی تنظیمات…</Text> : null}
        {!apiKeyReady ? (
          <Notice tone="warning">برای گفتگو، کلید Gemini را در تنظیمات دستگاه ذخیره کنید.</Notice>
        ) : null}
        {!policyReady ? (
          <Notice tone="warning">برای دسترسی به اسناد، GPS، زمان‌بندی و عملیات برنامه، اجازه کلی اتوماسیون را یک‌بار در تنظیمات روشن کنید.</Notice>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {!apiKeyReady || !policyReady ? (
          <PrimaryButton title="رفتن به تنظیمات Gemini و دسترسی‌ها" onPress={onOpenSettings} />
        ) : null}
      </View>

      <ScrollView
        ref={chatScroll}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => chatScroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(message => (
          <View key={message.id} style={[styles.message, message.role === 'user' ? styles.userMessage : message.role === 'activity' ? styles.activityMessage : styles.assistantMessage]}>
            <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText, message.role === 'activity' && styles.activityText]}>{message.text}</Text>
          </View>
        ))}
        {busy ? <Text style={styles.thinking}>در حال بررسی و اجرای ابزار مجاز…</Text> : null}

        {scheduledTasks.length ? (
          <Panel style={styles.schedulePanel}>
            <Text style={styles.sectionTitle}>کارهای زمان‌بندی‌شده</Text>
            <Text style={styles.scheduleNote}>زمان بر اساس ساعت محلی گوشی است. Android ممکن است اجرای پس‌زمینه را عقب بیندازد؛ رأس دقیقه تضمین‌شده نیست.</Text>
            {scheduledTasks.slice(0, 8).map(task => (
              <View key={task.id} style={styles.scheduleRow}>
                <View style={styles.scheduleCopy}>
                  <Text style={styles.scheduleTime}>{task.localDateTime.replace('T', ' ')} · {statusLabels[task.status] || task.status}</Text>
                  <Text style={styles.scheduleInstruction}>{task.instruction}</Text>
                  <Text style={styles.scheduleMeta}>{task.timeZone} · {task.recurrence}</Text>
                  {task.lastResult ? <Text style={styles.scheduleMeta}>نتیجه: {task.lastResult}</Text> : null}
                  {task.lastError ? <Text style={styles.scheduleError}>{task.lastError}</Text> : null}
                </View>
                {task.status === 'scheduled' ? <Pressable onPress={() => cancelTask(task.id)} accessibilityRole="button" style={styles.cancel}><Text style={styles.cancelText}>لغو</Text></Pressable> : null}
              </View>
            ))}
          </Panel>
        ) : null}
      </ScrollView>

      <View style={styles.composer}>
        <Pressable accessibilityRole="button" disabled={busy || !draft.trim() || !apiKeyReady} onPress={send} style={[styles.sendButton, (busy || !draft.trim() || !apiKeyReady) && styles.sendDisabled]}>
          <Text style={styles.sendText}>{busy ? '…' : 'ارسال'}</Text>
        </Pressable>
        <TextInput
          accessibilityLabel="پیام به دستیار Gemini"
          editable={!busy && apiKeyReady}
          multiline
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder={apiKeyReady ? 'درخواست خود را بنویسید…' : 'ابتدا کلید Gemini را ذخیره کنید'}
          placeholderTextColor="#879395"
          returnKeyType="send"
          style={styles.input}
          textAlign="right"
          value={draft}
        />
      </View>
      <Text style={styles.privacy}>پیام‌ها و خلاصه اطلاعات درخواستی سند برای پاسخ‌گویی به Google Gemini ارسال می‌شوند؛ رمز ورود و token برنامه ارسال نمی‌شوند.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  topStatus: { paddingHorizontal: 12, paddingTop: 10 },
  smallText: { color: colors.muted, fontFamily: font, fontSize: 11, textAlign: 'right', marginBottom: 5, writingDirection: 'rtl' },
  chat: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 16 },
  message: { maxWidth: '88%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, marginBottom: 8 },
  userMessage: { alignSelf: 'flex-start', backgroundColor: colors.primary },
  assistantMessage: { alignSelf: 'flex-end', backgroundColor: colors.white, borderWidth: 1, borderColor: '#d7e1e2' },
  activityMessage: { alignSelf: 'flex-end', backgroundColor: colors.primarySoft, paddingVertical: 6 },
  messageText: { color: colors.text, fontFamily: font, fontSize: 12, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  userMessageText: { color: colors.white },
  activityText: { color: colors.primaryDark, fontSize: 10 },
  thinking: { color: colors.muted, fontFamily: font, fontSize: 11, textAlign: 'right', marginVertical: 5, writingDirection: 'rtl' },
  schedulePanel: { marginTop: 10 },
  sectionTitle: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
  scheduleNote: { color: colors.muted, fontFamily: font, fontSize: 10, lineHeight: 17, textAlign: 'right', marginVertical: 7, writingDirection: 'rtl' },
  scheduleRow: { flexDirection: 'row-reverse', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#edf0f0', paddingVertical: 8, gap: 10 },
  scheduleCopy: { flex: 1 },
  scheduleTime: { color: colors.primaryDark, fontFamily: font, fontWeight: '700', fontSize: 10, textAlign: 'right', writingDirection: 'rtl' },
  scheduleInstruction: { color: colors.text, fontFamily: font, fontSize: 11, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },
  scheduleMeta: { color: colors.muted, fontFamily: font, fontSize: 9, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },
  scheduleError: { color: colors.danger, fontFamily: font, fontSize: 9, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },
  cancel: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fff0f0' },
  cancelText: { color: colors.danger, fontFamily: font, fontSize: 10 },
  composer: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#d7e1e2' },
  input: { flex: 1, maxHeight: 112, minHeight: 46, borderWidth: 1, borderColor: '#b9c9cb', borderRadius: 9, paddingHorizontal: 10, paddingTop: 10, color: colors.text, fontFamily: font, fontSize: 12, writingDirection: 'rtl' },
  sendButton: { minWidth: 58, height: 44, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: colors.white, fontFamily: font, fontWeight: '700', fontSize: 11 },
  privacy: { color: colors.muted, fontFamily: font, fontSize: 9, lineHeight: 14, paddingHorizontal: 10, paddingBottom: 5, textAlign: 'center', writingDirection: 'rtl' },
});
