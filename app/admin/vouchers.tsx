import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';

export default function VouchersScreen() {
  const [list, setList] = useState<any[]>([]);
  const [aging, setAging] = useState<any>(null);
  const [type, setType] = useState<'receipt' | 'payment'>('receipt');
  const [party, setParty] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [v, a] = await Promise.all([
        axios.get('/vouchers', { headers }),
        axios.get('/vouchers/aging?kind=customer', { headers }),
      ]);
      setList(v.data);
      setAging(a.data);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        '/vouchers',
        { type, party, amount: Number(amount), method: 'cash' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('تم', 'تم إنشاء السند');
      setAmount('');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#c23a8c" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>الذمم وسندات القبض/الصرف</Text>
      <View style={styles.row}>
        {(['receipt', 'payment'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, type === t && styles.active]} onPress={() => setType(t)}>
            <Text style={{ color: type === t ? '#fff' : '#333' }}>{t === 'receipt' ? 'قبض' : 'صرف'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="معرف الطرف" value={party} onChangeText={setParty} />
      <TextInput style={styles.input} placeholder="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TouchableOpacity style={styles.btn} onPress={create}><Text style={styles.btnText}>حفظ السند</Text></TouchableOpacity>

      <Text style={styles.subtitle}>أعمار الديون (عملاء)</Text>
      <Text>{JSON.stringify(aging?.buckets || {}, null, 2)}</Text>

      <Text style={styles.subtitle}>السندات</Text>
      {list.map((v) => (
        <View key={v._id} style={styles.card}>
          <Text>{v.number} — {v.type} — {v.amount}</Text>
          <Text>{v.party?.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#00aacc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  active: { backgroundColor: '#50b3c9' },
  input: { borderWidth: 1, borderColor: '#00aacc', borderRadius: 8, padding: 10, marginBottom: 8 },
  btn: { backgroundColor: '#c23a8c', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#f5f9fb', padding: 10, borderRadius: 8, marginBottom: 6 },
});
