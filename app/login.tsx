import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import axios from './api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Screen,
  Surface,
  TextField,
  Button,
  colors,
  space,
  typography,
  textStyles,
} from '../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      const msg = 'يرجى إدخال البريد وكلمة المرور';
      setErrorMessage(msg);
      return Alert.alert('تنبيه', msg);
    }

    try {
      setLoading(true);
      const { data } = await axios.post('/auth/login', { email, password });
      const { token, role, ...user } = data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      if (
        role === 'AppOwner' ||
        role === 'AppAdmin' ||
        role === 'AccountOwner' ||
        role === 'GeneralAccountant' ||
        role === 'StoreAdmin' ||
        role === 'StoreAccountant' ||
        role === 'Cashier'
      ) {
        router.replace('/admin/main');
      } else {
        router.replace('/home');
      }
    } catch (error: any) {
      console.error(error);
      const apiBase = (axios as any)?.defaults?.baseURL || 'غير معروف';
      const msg =
        error?.response?.data?.message ||
        (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')
          ? `تعذر الاتصال بالخادم (${apiBase}). تأكد أن الـ API يعمل على المنفذ 5000`
          : 'فشل تسجيل الدخول');
      setErrorMessage(msg);
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.center}>
      <View style={styles.heroBrand}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandAr}>الممتاز</Text>
        <Text style={styles.tagline}>منصة إدارة المتاجر والفوترة الإلكترونية</Text>
      </View>

      <Surface style={styles.panel}>
        <Text style={styles.panelTitle}>تسجيل الدخول</Text>
        <TextField
          label="البريد الإلكتروني"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="كلمة المرور"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable onPress={() => router.push('/forget-password')} style={styles.linkWrap}>
          <Text style={styles.link}>نسيت كلمة المرور؟</Text>
        </Pressable>

        <Button title={loading ? 'جاري الدخول...' : 'دخول'} onPress={handleLogin} loading={loading} />
        <Button
          title="إنشاء حساب جديد"
          variant="secondary"
          onPress={() => router.push('/subscriptions')}
          style={{ marginTop: space.md }}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  heroBrand: {
    alignItems: 'center',
    marginBottom: space.xl,
  },
  logo: {
    width: 220,
    height: 100,
  },
  brandAr: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeHero,
    color: colors.brandDeep,
    marginTop: space.sm,
  },
  tagline: {
    ...textStyles.subtitle,
    textAlign: 'center',
    marginTop: space.xs,
  },
  panel: {
    width: '100%',
  },
  panelTitle: {
    ...textStyles.title,
    marginBottom: space.lg,
    textAlign: 'center',
  },
  linkWrap: {
    alignSelf: 'flex-end',
    marginBottom: space.lg,
  },
  link: {
    fontFamily: typography.fontArMd,
    color: colors.brand,
    fontSize: typography.sizeSm,
  },
  errorText: {
    fontFamily: typography.fontAr,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: space.md,
  },
});
