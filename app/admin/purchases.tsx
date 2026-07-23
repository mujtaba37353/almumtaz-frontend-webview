import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  EmptyState,
  StatusBadge,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

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

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title="المشتريات والإمدادات"
        subtitle="أوامر الشراء وفواتير الموردين"
      />

      <Surface style={styles.section}>
        <Text style={styles.meta}>
          المورد: {suppliers.find((s) => s._id === supplier)?.name || supplier}
        </Text>
        <TextField label="معرف المورد" value={supplier} onChangeText={setSupplier} />
        <TextField label="معرف المستودع" value={warehouse} onChangeText={setWarehouse} />
        <TextField label="معرف المنتج" value={product} onChangeText={setProduct} />
        <TextField
          label="الكمية"
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
        />
        <TextField
          label="التكلفة"
          value={unitCost}
          onChangeText={setUnitCost}
          keyboardType="numeric"
        />
        <Button title="إنشاء أمر شراء" onPress={createPO} />
        <Button
          title="فاتورة مشتريات + ترحيل"
          variant="secondary"
          onPress={createAndPostInvoice}
          style={{ marginTop: space.sm }}
        />
      </Surface>

      <Text style={styles.sectionTitle}>أوامر الشراء</Text>
      {orders.length === 0 ? (
        <EmptyState title="لا توجد أوامر شراء" />
      ) : (
        orders.map((o) => (
          <Surface key={o._id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{o.number}</Text>
              <StatusBadge
                active={['approved', 'partial', 'received'].includes(o.status)}
                label={o.status}
              />
            </View>
            <Text style={styles.body}>الإجمالي: {o.total}</Text>
            <Text style={styles.body}>{o.supplier?.name}</Text>
            {['approved', 'partial'].includes(o.status) && (
              <Button
                title="استلام"
                variant="ghost"
                onPress={() => receive(o._id)}
                style={{ marginTop: space.sm, alignSelf: 'flex-start' }}
              />
            )}
          </Surface>
        ))
      )}

      <Text style={styles.sectionTitle}>فواتير المشتريات</Text>
      {invoices.length === 0 ? (
        <EmptyState title="لا توجد فواتير مشتريات" />
      ) : (
        invoices.map((inv) => (
          <Surface key={inv._id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{inv.number}</Text>
              <StatusBadge active={inv.status === 'posted'} label={inv.status} />
            </View>
            <Text style={styles.body}>الإجمالي: {inv.total}</Text>
            <Text style={styles.body}>المتبقي: {inv.balance}</Text>
          </Surface>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: space.xl },
  sectionTitle: {
    ...textStyles.title,
    fontSize: 18,
    marginBottom: space.md,
    marginTop: space.sm,
  },
  meta: { ...textStyles.body, marginBottom: space.md },
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
    flex: 1,
  },
  body: { ...textStyles.subtitle, marginTop: space.xs },
});
