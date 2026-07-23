import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';

export default function PurchasesScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [supplier, setSupplier] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [product, setProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('0');
  const [loading, setLoading] = useState(true);

  const h = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const load = async () => {
    try {
      const headers = await h();
      const [o, i, s, w] = await Promise.all([
        axios.get('/purchases/orders', { headers }),
        axios.get('/purchases/invoices', { headers }),
        axios.get('/suppliers', { headers }),
        axios.get('/warehouses', { headers }),
      ]);
      setOrders(o.data);
      setInvoices(i.data);
      setSuppliers(s.data);
      setWarehouses(w.data);
      if (s.data[0]) setSupplier(s.data[0]._id);
      if (w.data[0]) setWarehouse(w.data[0]._id);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createPO = async () => {
    try {
      const headers = await h();
      const { data } = await axios.post(
        '/purchases/orders',
        {
          supplier,
          warehouse,
          status: 'approved',
          lines: [{ product, quantity: Number(qty), unitCost: Number(unitCost) }],
        },
        { headers }
      );
      await axios.post(`/purchases/orders/${data._id}/approve`, {}, { headers }).catch(() => null);
      Alert.alert('تم', `أمر شراء ${data.number}`);
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل');
    }
  };

  const receive = async (id: string) => {
    try {
      const headers = await h();
      await axios.post(`/purchases/orders/${id}/receive`, {}, { headers });
      Alert.alert('تم', 'تم الاستلام');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل الاستلام');
    }
  };

  const createAndPostInvoice = async () => {
    try {
      const headers = await h();
      const { data } = await axios.post(
        '/purchases/invoices',
        {
          supplier,
          warehouse,
          lines: [{ product, quantity: Number(qty), unitCost: Number(unitCost) }],
        },
        { headers }
      );
      await axios.post(`/purchases/invoices/${data._id}/post`, {}, { headers });
      Alert.alert('تم', `فاتورة مشتريات ${data.number}`);
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#c23a8c" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>المشتريات والإمدادات</Text>
      <Text>مورد: {suppliers.find((s) => s._id === supplier)?.name || supplier}</Text>
      <TextInput style={styles.input} value={supplier} onChangeText={setSupplier} placeholder="معرف المورد" />
      <TextInput style={styles.input} value={warehouse} onChangeText={setWarehouse} placeholder="معرف المستودع" />
      <TextInput style={styles.input} value={product} onChangeText={setProduct} placeholder="معرف المنتج" />
      <TextInput style={styles.input} value={qty} onChangeText={setQty} placeholder="الكمية" keyboardType="numeric" />
      <TextInput style={styles.input} value={unitCost} onChangeText={setUnitCost} placeholder="التكلفة" keyboardType="numeric" />

      <TouchableOpacity style={styles.btn} onPress={createPO}><Text style={styles.btnText}>إنشاء أمر شراء</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={createAndPostInvoice}>
        <Text style={styles.btnText}>فاتورة مشتريات + ترحيل</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>أوامر الشراء</Text>
      {orders.map((o) => (
        <View key={o._id} style={styles.card}>
          <Text>{o.number} — {o.status} — {o.total}</Text>
          <Text>{o.supplier?.name}</Text>
          {['approved', 'partial'].includes(o.status) && (
            <TouchableOpacity onPress={() => receive(o._id)}>
              <Text style={{ color: '#c23a8c', fontWeight: 'bold' }}>استلام</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <Text style={styles.subtitle}>فواتير المشتريات</Text>
      {invoices.map((inv) => (
        <View key={inv._id} style={styles.card}>
          <Text>{inv.number} — {inv.status} — {inv.total}</Text>
          <Text>المتبقي: {inv.balance}</Text>
        </View>
      ))}
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
  card: { backgroundColor: '#f5f9fb', padding: 10, borderRadius: 8, marginBottom: 6 },
});
