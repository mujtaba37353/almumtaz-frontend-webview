import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';

export default function WarehousesScreen() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [fromWh, setFromWh] = useState('');
  const [toWh, setToWh] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(true);

  const headers = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const load = async () => {
    try {
      const h = await headers();
      const [w, b] = await Promise.all([
        axios.get('/warehouses', { headers: h }),
        axios.get('/warehouses/stock/balances', { headers: h }),
      ]);
      setWarehouses(w.data);
      setBalances(b.data);
      if (w.data[0]) setFromWh(w.data[0]._id);
      if (w.data[1]) setToWh(w.data[1]._id);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const h = await headers();
      await axios.post('/warehouses', { name }, { headers: h });
      setName('');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل');
    }
  };

  const transfer = async () => {
    try {
      const h = await headers();
      await axios.post(
        '/warehouses/stock/transfer',
        { fromWarehouse: fromWh, toWarehouse: toWh, lines: [{ product: productId, qty: Number(qty) }] },
        { headers: h }
      );
      Alert.alert('تم', 'تم التحويل');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل التحويل');
    }
  };

  const adjust = async () => {
    try {
      const h = await headers();
      await axios.post(
        '/warehouses/stock/adjust',
        { warehouse: fromWh, product: productId, newQty: Number(qty) },
        { headers: h }
      );
      Alert.alert('تم', 'تم الجرد');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل الجرد');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#c23a8c" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>المستودعات والمخزون</Text>
      <TextInput style={styles.input} placeholder="اسم مستودع جديد" value={name} onChangeText={setName} />
      <TouchableOpacity style={styles.btn} onPress={create}><Text style={styles.btnText}>إنشاء مستودع</Text></TouchableOpacity>

      <Text style={styles.subtitle}>المستودعات</Text>
      {warehouses.map((w) => (
        <Text key={w._id} style={styles.row}>{w.name} {w.isDefault ? '(افتراضي)' : ''} — {w.store?.name || 'عام'}</Text>
      ))}

      <Text style={styles.subtitle}>تحويل / جرد</Text>
      <TextInput style={styles.input} placeholder="من مستودع (ID)" value={fromWh} onChangeText={setFromWh} />
      <TextInput style={styles.input} placeholder="إلى مستودع (ID)" value={toWh} onChangeText={setToWh} />
      <TextInput style={styles.input} placeholder="معرف المنتج" value={productId} onChangeText={setProductId} />
      <TextInput style={styles.input} placeholder="الكمية / الرصيد الجديد" value={qty} onChangeText={setQty} keyboardType="numeric" />
      <TouchableOpacity style={styles.btn} onPress={transfer}><Text style={styles.btnText}>تحويل</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={adjust}><Text style={styles.btnText}>تسوية جرد</Text></TouchableOpacity>

      <Text style={styles.subtitle}>الأرصدة</Text>
      <FlatList
        data={balances}
        keyExtractor={(i) => i._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.product?.name} @ {item.warehouse?.name}</Text>
            <Text>الكمية: {item.qty} | التكلفة: {item.avgCost}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#00aacc', borderRadius: 8, padding: 10, marginBottom: 8 },
  btn: { backgroundColor: '#c23a8c', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  secondary: { backgroundColor: '#50b3c9' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  row: { marginBottom: 4 },
  card: { backgroundColor: '#f5f9fb', padding: 10, borderRadius: 8, marginBottom: 6 },
});
