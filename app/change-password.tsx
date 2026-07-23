import React, { useState } from 'react';
import { Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!otp || !password || !confirmPassword) {
      Alert.alert('تنبيه', 'يرجى إدخال كل الحقول');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/auth/reset-password', {
        email,
        password,
        otp,
      });
      if (response.status === 200) {
        Alert.alert('تم', 'تم تعيين كلمة المرور بنجاح');
        router.replace('/login');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('خطأ', error?.response?.data?.message || 'فشل في تعيين كلمة المرور');
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

      <PageHeader title="تعيين كلمة مرور جديدة" subtitle={String(email || '')} />

      <Surface>
        <TextField
          label="رمز التحقق"
          placeholder="OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
        />
        <TextField
          label="كلمة المرور الجديدة"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextField
          label="تأكيد كلمة المرور"
          placeholder="••••••••"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Button title="تأكيد" onPress={handleConfirm} loading={loading} />
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
