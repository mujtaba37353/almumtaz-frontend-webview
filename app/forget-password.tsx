import React, { useState } from 'react';
import { Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from './api/axiosInstance';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  colors,
  space,
  typography,
} from '../components/ui';

export default function ForgetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/auth/forgot-password', { email });

      if (response.status === 200) {
        const msg = response.data?.devOtp
          ? `رمز التطوير: ${response.data.devOtp}`
          : 'تم إرسال رمز التحقق إلى بريدك';
        Alert.alert('تم', msg);
        router.push({ pathname: '/change-password', params: { email } });
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('خطأ', error?.response?.data?.message || 'فشل في إرسال الطلب');
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

      <PageHeader title="استعادة كلمة المرور" subtitle="أدخل بريدك لإرسال رمز التحقق" />

      <Surface>
        <TextField
          label="البريد الإلكتروني"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button title="إرسال رمز التحقق" onPress={handleResetPassword} loading={loading} />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
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
