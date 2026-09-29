import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { listShipments } from '../api/tripService';
import { colors, font } from '../theme';
import { EmptyState, Notice, Panel, PrimaryButton } from '../components/Ui';

function normalizeDocument(row, index, status) {
  return {
    id: String(row?.id ?? row?.docId ?? row?.DocId ?? row?.documentId ?? row?.ID ?? index),
    docNo: String(row?.docNo ?? row?.DocNo ?? row?.documentNo ?? row?.trackingCode ?? '—'),
    driver: row?.driverName ?? row?.DriverName ?? row?.driver ?? '—',
    plate: row?.carTag ?? row?.CarTag ?? row?.plate ?? row?.nCarTag ?? '—',
    origin: row?.origin ?? row?.Origin ?? row?.senderCity ?? '—',
    destination: row?.destination ?? row?.Destination ?? row?.receiverCity ?? '—',
    cargo: row?.cargoName ?? row?.CargoName ?? row?.goodsName ?? '—',
    status,
    raw: row,
  };
}

export default function ShipmentsScreen({ initialStatus = 'issued', mode, onSelect }) {
  const [status, setStatus] = useState(initialStatus);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const rows = await listShipments(status);
      setItems(rows.map((row, index) => normalizeDocument(row, index, status === 'issued' ? 'issued' : 'carrying')));
    } catch (issue) {
      setError(issue.message || 'دریافت فهرست اسناد انجام نشد.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [status]);

  const filtered = items.filter(item => `${item.docNo} ${item.plate} ${item.driver}`.includes(search.trim()));

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.primary]} />}
      keyboardShouldPersistTaps="handled"
    >
      {mode === 'demo' ? <Notice tone="warning">فهرست نمونه است؛ اسناد واقعی خوانده نمی‌شوند.</Notice> : null}
      <View style={styles.tabs}>
        <Pressable onPress={() => setStatus('issued')} style={[styles.tab, status === 'issued' && styles.tabSelected]}>
          <Text style={[styles.tabText, status === 'issued' && styles.tabTextSelected]}>اسناد صادر شده</Text>
        </Pressable>
        <Pressable onPress={() => setStatus('carrying')} style={[styles.tab, status === 'carrying' && styles.tabSelected]}>
          <Text style={[styles.tabText, status === 'carrying' && styles.tabTextSelected]}>اسناد در حال حمل</Text>
        </Pressable>
      </View>
      <TextInput
        accessibilityLabel="جستجو در اسناد"
        onChangeText={setSearch}
        placeholder="جستجو بر اساس شماره سند، پلاک یا راننده"
        placeholderTextColor="#9aa5a8"
        style={styles.search}
        textAlign="right"
        value={search}
      />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!loading && filtered.length === 0 ? (
        <EmptyState title={error ? 'دریافت اسناد ممکن نشد' : 'سندی برای نمایش وجود ندارد'} detail={error ? 'اتصال و پیکربندی API را بررسی کنید.' : undefined} />
      ) : filtered.map(item => (
        <Pressable key={`${item.id}-${item.status}`} onPress={() => onSelect(item)}>
          <Panel style={[styles.document, item.status === 'carrying' && styles.carrying]}>
            <View style={styles.row}>
              <Text style={styles.badge}>{item.status === 'carrying' ? 'در حال حمل' : 'صادر شده'}</Text>
              <Text style={styles.docNo}>شماره سند: {item.docNo}</Text>
            </View>
            <View style={styles.separator} />
            <Text style={styles.line}>خودرو: {item.plate}</Text>
            <Text style={styles.line}>راننده: {item.driver}</Text>
            <Text style={styles.route}>{item.origin} ← {item.destination}</Text>
            <Text style={styles.details}>نمایش جزئیات  ‹</Text>
          </Panel>
        </Pressable>
      ))}
      {loading && items.length === 0 ? <PrimaryButton title="در حال دریافت…" disabled /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 14, backgroundColor: colors.canvas },
  tabs: { flexDirection: 'row-reverse', backgroundColor: '#e4eff0', borderRadius: 8, padding: 3, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: 6 },
  tabSelected: { backgroundColor: colors.primary, elevation: 1 },
  tabText: { color: colors.primaryDark, fontFamily: font, fontSize: 12, textAlign: 'center', writingDirection: 'rtl' },
  tabTextSelected: { color: colors.white, fontWeight: '700' },
  search: { minHeight: 46, backgroundColor: colors.white, borderWidth: 1, borderColor: '#b9c9cb', borderRadius: 7, paddingHorizontal: 12, color: colors.text, fontFamily: font, fontSize: 12, marginBottom: 12, writingDirection: 'rtl' },
  document: { marginBottom: 10, borderRightWidth: 4, borderRightColor: colors.issued },
  carrying: { borderRightColor: colors.primary, backgroundColor: colors.activeTrip },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  badge: { color: colors.primaryDark, fontFamily: font, fontSize: 10, backgroundColor: '#e7f3f4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  docNo: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
  separator: { height: 1, backgroundColor: '#e8eded', marginVertical: 9 },
  line: { color: colors.muted, fontFamily: font, fontSize: 11, marginBottom: 4, textAlign: 'right', writingDirection: 'rtl' },
  route: { color: colors.text, fontFamily: font, fontSize: 13, fontWeight: '600', marginTop: 7, textAlign: 'right', writingDirection: 'rtl' },
  details: { color: colors.primary, fontFamily: font, fontSize: 11, marginTop: 10, textAlign: 'left', writingDirection: 'rtl' },
});
