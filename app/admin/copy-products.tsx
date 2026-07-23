import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import RNPickerSelect from 'react-native-picker-select';
import { useRouter } from 'expo-router';
import {
  Screen,
  Surface,
  Button,
  PageHeader,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

export default function CopyProductsScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [sourceStore, setSourceStore] = useState<string | null>(null);
  const [targetStore, setTargetStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStores = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userRole = profileRes.data.role;
      setRole(userRole);

      if (!['AccountOwner', 'GeneralAccountant'].includes(userRole)) {
        Alert.alert('غير مصرح', 'ليس لديك صلاحية الوصول لهذه الصفحة');
        router.replace('/admin/products');
        return;
      }

      const storesRes = await axios.get('/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStores(storesRes.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
      Alert.alert('خطأ', 'فشل تحميل المتاجر');
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCopy = async () => {
    if (!sourceStore || !targetStore) {
      Alert.alert('تنبيه', 'يرجى اختيار المتجرين');
      return;
    }

    if (sourceStore === targetStore) {
      Alert.alert('خطأ', 'المتجر المصدر والهدف لا يمكن أن يكونا نفس المتجر');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        '/products/copy',
        { sourceStoreId: sourceStore, targetStoreId: targetStore },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('تم', res.data.message || 'تم نسخ المنتجات بنجاح');
      router.back();
    } catch (err: any) {
      console.error('Copy error:', err);
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل نسخ المنتجات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader title="نسخ المنتجات" subtitle="من متجر إلى آخر" />

      <Surface>
        <Text style={styles.label}>المتجر المصدر</Text>
        <RNPickerSelect
          onValueChange={(value) => setSourceStore(value)}
          placeholder={{ label: 'اختر المتجر المصدر', value: null }}
          value={sourceStore}
          items={stores.map((store) => ({
            label: store.name,
            value: store._id,
          }))}
          style={pickerSelectStyles}
        />

        <Text style={styles.label}>المتجر الهدف</Text>
        <RNPickerSelect
          onValueChange={(value) => setTargetStore(value)}
          placeholder={{ label: 'اختر المتجر الهدف', value: null }}
          value={targetStore}
          items={stores.map((store) => ({
            label: store.name,
            value: store._id,
          }))}
          style={pickerSelectStyles}
        />

        <Button
          title={loading ? 'جاري النسخ...' : 'نسخ المنتجات'}
          onPress={handleCopy}
          loading={loading}
          style={{ marginTop: space.lg }}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xl,
  },
  backText: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeMd,
  },
  label: {
    ...textStyles.label,
    marginBottom: space.xs,
    marginTop: space.sm,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: space.md,
  },
  inputAndroid: {
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: space.md,
  },
};
