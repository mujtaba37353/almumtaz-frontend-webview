// app/create-account.tsx

import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from './api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Screen,
  PageHeader,
  Surface,
  TextField,
  Button,
  EmptyState,
  colors,
  space,
  typography,
  textStyles,
} from '../components/ui';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { subscriptionId } = useLocalSearchParams();

  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    accountName: '',
  });

  useEffect(() => {
    if (subscriptionId) {
      axios.get(`/subscriptions/public/${subscriptionId}`)
        .then(res => setSubscription(res.data))
        .catch(err => Alert.alert('Error', 'Subscription not found'))
        .finally(() => setLoading(false));
    }
  }, [subscriptionId]);

  const handleRegister = async () => {
    const { name, email, password, accountName } = form;
    if (!name || !email || !password || !accountName) {
      return Alert.alert('Error', 'Please fill all fields');
    }

    try {
      const res = await axios.post('/auth/register-account', {
        name,
        email,
        password,
        accountName,
        subscriptionId,
      });

      // احفظ التوكن وسجل دخول المستخدم تلقائيًا
      const { token } = res.data;
      await AsyncStorage.setItem('token', token);

      // اختيارياً احفظ الدور
      await AsyncStorage.setItem('role', 'AccountOwner');

      Alert.alert('Success', 'Account created successfully');
      router.replace('/admin/main');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to create account');
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جارٍ التحميل...</Text>
      </Screen>
    );
  }

  if (!subscription) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <EmptyState title="الاشتراك غير موجود" subtitle="تحقق من الرابط وحاول مرة أخرى" />
        <Button title="رجوع" variant="ghost" onPress={() => router.back()} />
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
        title="إنشاء حساب منشأتك"
        subtitle={`الباقة المختارة: ${subscription.name}`}
      />

      <Surface style={styles.panel}>
        <TextField
          label="الاسم"
          placeholder="اسمك الكامل"
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />
        <TextField
          label="البريد الإلكتروني"
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(val) => setForm({ ...form, email: val })}
        />
        <TextField
          label="كلمة المرور"
          placeholder="••••••••"
          secureTextEntry
          value={form.password}
          onChangeText={(val) => setForm({ ...form, password: val })}
        />
        <TextField
          label="اسم المنشأة"
          placeholder="اسم الحساب / المنشأة"
          value={form.accountName}
          onChangeText={(val) => setForm({ ...form, accountName: val })}
        />

        <Button title="تسجيل والبدء" onPress={handleRegister} />
        <Button
          title="رجوع"
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: space.sm }}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.subtitle,
    marginTop: space.md,
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
  panel: {
    width: '100%',
  },
});
