import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  EmptyState,
  StatusBadge,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

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
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="التقارير والفواتير" subtitle="ملخص المبيعات وآخر الفواتير" />

      <Surface style={styles.card}>
        <Text style={styles.cardTitle}>ملخص المبيعات</Text>
        <Text style={styles.body}>إجمالي المبيعات: {(summary?.totalSales ?? 0).toFixed(2)} ر.س</Text>
        <Text style={styles.body}>الضريبة: {(summary?.totalVat ?? 0).toFixed(2)} ر.س</Text>
        <Text style={styles.body}>الخصومات: {(summary?.totalDiscount ?? 0).toFixed(2)} ر.س</Text>
        <Text style={styles.body}>عدد العمليات: {summary?.numberOfSales ?? 0}</Text>
      </Surface>

      {(summary?.byStore || []).map((s: any) => (
        <Surface key={s.storeId} style={styles.card}>
          <Text style={styles.cardTitle}>{s.storeName}</Text>
          <Text style={styles.body}>المبيعات: {Number(s.total).toFixed(2)} ر.س</Text>
          <Text style={styles.body}>العمليات: {s.count}</Text>
        </Surface>
      ))}

      <Text style={styles.sectionTitle}>آخر الفواتير</Text>
      {invoices.length === 0 ? (
        <EmptyState title="لا توجد فواتير بعد" />
      ) : (
        invoices.map((inv) => (
          <Pressable key={inv._id} onPress={() => router.push(`/admin/invoice/${inv._id}`)}>
            <Surface style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{inv.invoiceNumber}</Text>
                <StatusBadge
                  active={inv.status === 'posted' || inv.status === 'cleared'}
                  label={inv.status}
                />
              </View>
              <Text style={styles.body}>
                النوع: {inv.invoiceType} / {inv.documentType}
              </Text>
              <Text style={styles.body}>الإجمالي: {Number(inv.totalAmount).toFixed(2)} ر.س</Text>
              <Text style={styles.body}>الضريبة: {Number(inv.vatAmount).toFixed(2)} ر.س</Text>
            </Surface>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: space.md },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
    gap: space.sm,
  },
  cardTitle: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.xs,
    flex: 1,
  },
  body: { ...textStyles.subtitle, marginTop: space.xs },
  sectionTitle: {
    ...textStyles.title,
    fontSize: 18,
    marginTop: space.lg,
    marginBottom: space.md,
  },
});
