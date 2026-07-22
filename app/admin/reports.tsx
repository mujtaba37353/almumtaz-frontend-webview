import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from '../api/axiosInstance';

export default function ReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [sumRes, invRes] = await Promise.all([
          axios.get('/reports/summary', { headers }),
          axios.get('/invoices?limit=30', { headers }),
        ]);
        setSummary(sumRes.data);
        setInvoices(invRes.data);
      } catch (err: any) {
        console.error(err);
        Alert.alert('خطأ', err?.response?.data?.message || 'فشل تحميل التقارير');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c23a8c" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>التقارير والفواتير</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ملخص المبيعات</Text>
        <Text>إجمالي المبيعات: {(summary?.totalSales ?? 0).toFixed(2)} ر.س</Text>
        <Text>الضريبة: {(summary?.totalVat ?? 0).toFixed(2)} ر.س</Text>
        <Text>الخصومات: {(summary?.totalDiscount ?? 0).toFixed(2)} ر.س</Text>
        <Text>عدد العمليات: {summary?.numberOfSales ?? 0}</Text>
      </View>

      {(summary?.byStore || []).map((s: any) => (
        <View key={s.storeId} style={styles.card}>
          <Text style={styles.cardTitle}>{s.storeName}</Text>
          <Text>المبيعات: {Number(s.total).toFixed(2)} ر.س</Text>
          <Text>العمليات: {s.count}</Text>
        </View>
      ))}

      <Text style={[styles.title, { marginTop: 20 }]}>آخر الفواتير</Text>
      {invoices.length === 0 && <Text>لا توجد فواتير بعد</Text>}
      {invoices.map((inv) => (
        <TouchableOpacity
          key={inv._id}
          style={styles.card}
          onPress={() => router.push(`/admin/invoice/${inv._id}`)}
        >
          <Text style={styles.cardTitle}>{inv.invoiceNumber}</Text>
          <Text>النوع: {inv.invoiceType} / {inv.documentType}</Text>
          <Text>الحالة: {inv.status}</Text>
          <Text>الإجمالي: {Number(inv.totalAmount).toFixed(2)} ر.س</Text>
          <Text>الضريبة: {Number(inv.vatAmount).toFixed(2)} ر.س</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 12 },
  card: {
    backgroundColor: '#f5f9fb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d7eef3',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#333' },
});
