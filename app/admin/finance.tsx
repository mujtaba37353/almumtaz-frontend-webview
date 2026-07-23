import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

export default function FinanceScreen() {
  const [tab, setTab] = useState<'tb' | 'pl' | 'bs' | 'vat' | 'inv' | 'je'>('tb');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [debitCode, setDebitCode] = useState('5100');
  const [creditCode, setCreditCode] = useState('1100');
  const [amount, setAmount] = useState('100');
  const [memo, setMemo] = useState('قيد يدوي');

  const load = async (whichtab = tab) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const params: any = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const map: any = {
        tb: '/reports/finance/trial-balance',
        pl: '/reports/finance/profit-loss',
        bs: '/reports/finance/balance-sheet',
        vat: '/reports/finance/vat-return',
        inv: '/reports/finance/inventory-valuation',
        je: '/ledger/journals',
      };
      const res = await axios.get(map[whichtab], { headers, params });
      setData(res.data);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const postManual = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const amt = Number(amount);
      await axios.post(
        '/ledger/journals',
        {
          memo,
          lines: [
            { code: debitCode, debit: amt, credit: 0 },
            { code: creditCode, debit: 0, credit: amt },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('تم', 'تم ترحيل القيد');
      setTab('je');
      load('je');
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل القيد');
    }
  };

  const tabs: [typeof tab, string][] = [
    ['tb', 'ميزان'],
    ['pl', 'دخل'],
    ['bs', 'ميزانية'],
    ['vat', 'ضريبة'],
    ['inv', 'مخزون'],
    ['je', 'قيود'],
  ];

  return (
    <Screen>
      <PageHeader
        title="المحاسبة والتقارير المالية"
        subtitle="ميزان المراجعة والقوائم والقيود"
      />

      <View style={styles.filters}>
        <TextField
          placeholder="من"
          value={from}
          onChangeText={setFrom}
          containerStyle={styles.filterField}
        />
        <TextField
          placeholder="إلى"
          value={to}
          onChangeText={setTo}
          containerStyle={styles.filterField}
        />
        <Button title="تطبيق" onPress={() => load()} style={styles.filterBtn} />
      </View>

      <View style={styles.tabs}>
        {tabs.map(([k, label]) => (
          <Pressable
            key={k}
            style={[styles.chip, tab === k && styles.chipActive]}
            onPress={() => setTab(k)}
          >
            <Text style={[styles.chipText, tab === k && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Surface style={styles.section}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.mono}>{JSON.stringify(data, null, 2)}</Text>
        )}
      </Surface>

      <Text style={styles.sectionTitle}>قيد يدوي</Text>
      <Surface>
        <TextField label="مدين" value={debitCode} onChangeText={setDebitCode} />
        <TextField label="دائن" value={creditCode} onChangeText={setCreditCode} />
        <TextField
          label="المبلغ"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TextField label="البيان" value={memo} onChangeText={setMemo} />
        <Button title="ترحيل" onPress={postManual} />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.md,
  },
  filterField: {
    flexGrow: 1,
    minWidth: 120,
    maxWidth: 200,
    marginBottom: 0,
  },
  filterBtn: { minWidth: 100 },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.lg,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeSm,
    color: colors.text,
  },
  chipTextActive: { color: colors.textOnBrand },
  section: { marginBottom: space.xl },
  sectionTitle: {
    ...textStyles.title,
    fontSize: 18,
    marginBottom: space.md,
  },
  mono: {
    fontFamily: typography.fontSans,
    fontSize: typography.sizeXs,
    color: colors.text,
  },
});
