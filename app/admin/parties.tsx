import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
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

export default function PartiesScreen() {
  const params = useLocalSearchParams();
  const kind = (params.kind as string) || 'customer';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const endpoint = kind === 'supplier' ? '/suppliers' : '/customers';
  const title = kind === 'supplier' ? 'الموردون' : 'العملاء';

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [kind]);

  const create = async () => {
    if (!name.trim()) return Alert.alert('تنبيه', 'الاسم مطلوب');
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        endpoint,
        { name, phone, vatNumber, kind },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName('');
      setPhone('');
      setVatNumber('');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل الإنشاء');
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
    <Screen scroll={false}>
      <PageHeader title={title} subtitle="إضافة وعرض السجلات" />

      <Surface style={styles.form}>
        <TextField label="الاسم" placeholder="الاسم" value={name} onChangeText={setName} />
        <TextField label="الجوال" placeholder="الجوال" value={phone} onChangeText={setPhone} />
        <TextField
          label="الرقم الضريبي"
          placeholder="الرقم الضريبي"
          value={vatNumber}
          onChangeText={setVatNumber}
        />
        <Button title="إضافة" onPress={create} />
      </Surface>

      {items.length === 0 ? (
        <EmptyState title="لا توجد سجلات" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Surface style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
              <Text style={styles.meta}>الرصيد: {Number(item.balance || 0).toFixed(2)}</Text>
              {item.vatNumber ? <Text style={styles.meta}>{item.vatNumber}</Text> : null}
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
  form: {
    marginBottom: space.xl,
  },
  list: {
    paddingBottom: space.xxl,
    gap: space.md,
  },
  card: {
    marginBottom: space.md,
  },
  cardTitle: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.xs,
  },
  meta: {
    ...textStyles.body,
    marginTop: space.xs,
  },
});
