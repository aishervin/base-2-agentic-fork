import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getShipmentDetails } from '../api/tripService';
import { executeAgentTool } from '../automation/toolRegistry';
import { DEMO_MODE } from '../config';
import { colors, font } from '../theme';
import { Notice, Panel, PrimaryButton } from '../components/Ui';

export default function ShipmentDetailsScreen({ document, mode, onTripChanged }) {
  const [detail, setDetail] = useState(document);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const carrying = document.status === 'carrying';

  useEffect(() => {
    if (mode === 'demo') return;
    getShipmentDetails(document.id).then(value => setDetail({ ...document, ...value })).catch(issue => setError(issue.message));
  }, [document.id, mode]);

  async function runAction(action) {
    setError('');
    setLoading(true);
    try {
      await executeAgentTool(action, { document, documentId: document.id });
      onTripChanged(action === 'startTrip' ? 'carrying' : 'issued');
    } catch (issue) {
      setError(issue.message || 'عملیات انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {mode === 'demo' ? <Notice tone="warning">حالت نمایشی؛ شروع و پایان حمل فقط روی داده نمونه اثر دارد.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Panel>
        <View style={styles.headingRow}>
          <Text style={styles.status}>{carrying ? 'در حال حمل' : 'صادر شده'}</Text>
          <Text style={styles.title}>جزئیات سند حمل</Text>
        </View>
        <Detail label="شماره سند" value={detail.docNo || '—'} />
        <Detail label="شناسه سند" value={document.id} />
        <Detail label="راننده" value={detail.driver || detail.driverName || '—'} />
        <Detail label="شماره پلاک" value={detail.plate || detail.carTag || '—'} />
        <Detail label="مبدأ" value={detail.origin || '—'} />
        <Detail label="مقصد" value={detail.destination || '—'} />
        <Detail label="نوع کالا" value={detail.cargo || detail.cargoName || '—'} />
      </Panel>
      <Panel style={styles.gpsPanel}>
        <Text style={styles.panelTitle}>ثبت مسیر GPS</Text>
        <Text style={styles.panelText}>موقعیت در شروع و پایان ثبت می‌شود؛ در زمان حمل نیز هر ۲۰ ثانیه یک نقطه ذخیره می‌شود.</Text>
      </Panel>
      <PrimaryButton
        title={carrying ? 'پایان حمل' : 'شروع حمل'}
        loading={loading}
        onPress={() => runAction(carrying ? 'finishTrip' : 'startTrip')}
        style={styles.actionButton}
      />
      <Text style={styles.safety}>این عملیات بدون تأیید جداگانه اجرا می‌شود؛ اجازه کلی اتوماسیون باید در تنظیمات فعال باشد.</Text>
    </ScrollView>
  );
}

function Detail({ label, value }) {
  return <View style={styles.detailRow}><Text style={styles.value}>{String(value)}</Text><Text style={styles.label}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 14, backgroundColor: colors.canvas },
  headingRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
  status: { color: colors.primaryDark, backgroundColor: colors.activeTrip, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, fontFamily: font, fontSize: 10 },
  detailRow: { minHeight: 38, borderBottomWidth: 1, borderBottomColor: '#edf0f0', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.muted, fontFamily: font, fontSize: 11, textAlign: 'right', writingDirection: 'rtl' },
  value: { color: colors.text, fontFamily: font, fontSize: 12, textAlign: 'left', writingDirection: 'rtl' },
  gpsPanel: { backgroundColor: '#edf8f8' },
  panelTitle: { color: colors.primaryDark, fontFamily: font, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  panelText: { color: colors.text, fontFamily: font, fontSize: 11, lineHeight: 20, marginTop: 5, textAlign: 'right', writingDirection: 'rtl' },
  actionButton: { marginTop: 5, backgroundColor: colors.primary },
  safety: { color: colors.muted, fontFamily: font, fontSize: 10, marginTop: 10, textAlign: 'center', writingDirection: 'rtl' },
});
