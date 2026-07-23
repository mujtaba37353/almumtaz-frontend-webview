import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';

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

  const load = async ( whichtab = tab) => {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>المحاسبة والتقارير المالية</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="من" value={from} onChangeText={setFrom} />
        <TextInput style={styles.input} placeholder="إلى" value={to} onChangeText={setTo} />
        <TouchableOpacity style={styles.chip} onPress={() => load()}><Text>تطبيق</Text></TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        {[
          ['tb', 'ميزان'],
          ['pl', 'دخل'],
          ['bs', 'ميزانية'],
          ['vat', 'ضريبة'],
          ['inv', 'مخزون'],
          ['je', 'قيود'],
        ].map(([k, label]) => (
          <TouchableOpacity key={k} style={[styles.chip, tab === k && styles.active]} onPress={() => setTab(k as any)}>
            <Text style={{ color: tab === k ? '#fff' : '#333' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#c23a8c" /> : (
        <Text style={styles.mono}>{JSON.stringify(data, null, 2)}</Text>
      )}

      <Text style={styles.subtitle}>قيد يدوي</Text>
      <TextInput style={styles.input} value={debitCode} onChangeText={setDebitCode} placeholder="مدين" />
      <TextInput style={styles.input} value={creditCode} onChangeText={setCreditCode} placeholder="دائن" />
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="المبلغ" keyboardType="numeric" />
      <TextInput style={styles.input} value={memo} onChangeText={setMemo} placeholder="البيان" />
      <TouchableOpacity style={styles.btn} onPress={postManual}><Text style={styles.btnText}>ترحيل</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#00aacc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  active: { backgroundColor: '#50b3c9', borderColor: '#50b3c9' },
  input: { borderWidth: 1, borderColor: '#00aacc', borderRadius: 8, padding: 10, marginBottom: 8, minWidth: 100 },
  mono: { fontSize: 11, backgroundColor: '#f5f5f5', padding: 8 },
  btn: { backgroundColor: '#c23a8c', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
