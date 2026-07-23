import React, { useState } from 'react';
import { Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  colors,
  space,
  typography,
} from '../../components/ui';

export default function CreateStoreScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    location: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);

  const handleCreateStore = async () => {
    if (!form.name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المتجر');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post('/stores', form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('تم', 'تم إنشاء المتجر بنجاح');
      router.replace('/admin/stores');
    } catch (err: any) {
      console.error('❌ Store creation error:', err);
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إنشاء المتجر');
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

      <PageHeader title="إنشاء متجر جديد" subtitle="أدخل بيانات المتجر" />

      <Surface>
        <TextField
          label="اسم المتجر"
          placeholder="Store Name"
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />
        <TextField
          label="الموقع (اختياري)"
          placeholder="Location"
          value={form.location}
          onChangeText={(val) => setForm({ ...form, location: val })}
        />
        <Button title={loading ? 'جاري الحفظ...' : 'حفظ المتجر'} onPress={handleCreateStore} loading={loading} />
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
});
