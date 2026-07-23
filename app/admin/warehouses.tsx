import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  EmptyState,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

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

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="المستودعات والمخزون" subtitle="إنشاء مستودعات وتحويل الأرصدة" />

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>مستودع جديد</Text>
        <TextField
          label="اسم المستودع"
          placeholder="اسم مستودع جديد"
          value={name}
          onChangeText={setName}
        />
        <Button title="إنشاء مستودع" onPress={create} />
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>المستودعات</Text>
        {warehouses.length === 0 ? (
          <EmptyState title="لا توجد مستودعات" />
        ) : (
          warehouses.map((w) => (
            <View key={w._id} style={styles.whRow}>
              <Text style={styles.whName}>{w.name}</Text>
              <Text style={styles.whMeta}>
                {w.isDefault ? 'افتراضي · ' : ''}
                {w.store?.name || 'عام'}
              </Text>
            </View>
          ))
        )}
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>تحويل / جرد</Text>
        <TextField
          label="من مستودع"
          placeholder="من مستودع (ID)"
          value={fromWh}
          onChangeText={setFromWh}
        />
        <TextField
          label="إلى مستودع"
          placeholder="إلى مستودع (ID)"
          value={toWh}
          onChangeText={setToWh}
        />
        <TextField
          label="معرف المنتج"
          placeholder="معرف المنتج"
          value={productId}
          onChangeText={setProductId}
        />
        <TextField
          label="الكمية / الرصيد الجديد"
          placeholder="الكمية / الرصيد الجديد"
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
        />
        <Button title="تحويل" onPress={transfer} />
        <Button title="تسوية جرد" variant="secondary" onPress={adjust} style={{ marginTop: space.sm }} />
      </Surface>

      <Text style={styles.balancesTitle}>الأرصدة</Text>
      {balances.length === 0 ? (
        <EmptyState title="لا توجد أرصدة" />
      ) : (
        <FlatList
          data={balances}
          keyExtractor={(i) => i._id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Surface style={styles.card}>
              <Text style={styles.cardTitle}>
                {item.product?.name} @ {item.warehouse?.name}
              </Text>
              <Text style={styles.meta}>
                الكمية: {item.qty} | التكلفة: {item.avgCost}
              </Text>
            </Surface>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: space.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeLg,
    color: colors.brandDeep,
    marginBottom: space.md,
  },
  whRow: {
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  whName: {
    ...textStyles.body,
    fontFamily: typography.fontArMd,
  },
  whMeta: {
    ...textStyles.label,
    marginTop: space.xs,
  },
  balancesTitle: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeLg,
    color: colors.text,
    marginBottom: space.md,
    marginTop: space.sm,
  },
  card: {
    marginBottom: space.md,
  },
  cardTitle: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.xs,
  },
  meta: {
    ...textStyles.subtitle,
  },
});
