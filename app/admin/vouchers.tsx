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
  EmptyState,
  StatusBadge,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

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
        title="الذمم وسندات القبض والصرف"
        subtitle="إدارة السندات وأعمار الديون"
      />

      <Surface style={styles.section}>
        <View style={styles.row}>
          {(['receipt', 'payment'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                {t === 'receipt' ? 'قبض' : 'صرف'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextField label="معرف الطرف" value={party} onChangeText={setParty} />
        <TextField
          label="المبلغ"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Button title="حفظ السند" onPress={create} />
      </Surface>

      <Text style={styles.sectionTitle}>أعمار الديون (عملاء)</Text>
      <Surface style={styles.section}>
        <Text style={styles.mono}>{JSON.stringify(aging?.buckets || {}, null, 2)}</Text>
      </Surface>

      <Text style={styles.sectionTitle}>السندات</Text>
      {list.length === 0 ? (
        <EmptyState title="لا توجد سندات" />
      ) : (
        list.map((v) => (
          <Surface key={v._id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{v.number}</Text>
              <StatusBadge
                active={v.type === 'receipt'}
                label={v.type === 'receipt' ? 'قبض' : 'صرف'}
              />
            </View>
            <Text style={styles.body}>المبلغ: {v.amount}</Text>
            <Text style={styles.body}>{v.party?.name}</Text>
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
  },
  row: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: space.lg,
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
  mono: {
    fontFamily: typography.fontSans,
    fontSize: typography.sizeXs,
    color: colors.text,
  },
});
