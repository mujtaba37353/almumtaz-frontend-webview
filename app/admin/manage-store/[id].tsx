import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  StatusBadge,
  colors,
  space,
  typography,
  textStyles,
} from '../../../components/ui';

export default function EditStoreScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    location: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);

  const fetchStore = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({
        name: res.data.name,
        location: res.data.location || '',
        status: res.data.status || 'active',
      });
    } catch (err) {
      Alert.alert('خطأ', 'فشل تحميل بيانات المتجر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStore();
  }, [id]);

  const handleUpdateStore = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`/stores/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('تم', 'تم تحديث المتجر بنجاح');
      router.replace('/admin/stores');
    } catch (err) {
      console.error('❌ Update store error:', err);
      Alert.alert('خطأ', 'فشل تحديث بيانات المتجر');
    }
  };

  const handleDeleteStore = async () => {
    Alert.alert('تأكيد', 'هل أنت متأكد أنك تريد حذف هذا المتجر؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`/stores/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('تم', 'تم حذف المتجر بنجاح');
            router.replace('/admin/stores');
          } catch (err) {
            console.error('❌ Delete store error:', err);
            Alert.alert('خطأ', 'فشل حذف المتجر');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader
        title="تعديل المتجر"
        subtitle={form.name}
        right={<StatusBadge active={form.status === 'active'} />}
      />

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

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>الحالة النشطة</Text>
          <Switch
            value={form.status === 'active'}
            onValueChange={(val) => setForm({ ...form, status: val ? 'active' : 'inactive' })}
            thumbColor="#fff"
            trackColor={{ false: colors.border, true: colors.brand }}
          />
        </View>

        <Button title="تحديث المتجر" onPress={handleUpdateStore} />
        <Button
          title="حذف المتجر"
          variant="danger"
          onPress={handleDeleteStore}
          style={{ marginTop: space.md }}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  switchLabel: {
    ...textStyles.body,
  },
});
