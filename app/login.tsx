import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from './api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('تنبيه', 'يرجى إدخال البريد وكلمة المرور');
    }

    try {
      setLoading(true);

      const { data } = await axios.post('/auth/login', { email, password });

      const { token, role, ...user } = data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // التوجيه حسب الدور
      if (role === 'AppOwner' || role === 'AppAdmin' || role === 'AccountOwner' || role === 'GeneralAccountant' || role === 'StoreAdmin' || role === 'StoreAccountant' || role === 'Cashier') {
        router.replace('/admin/main');
      } else {
        router.replace('/home'); // أو حسب نوع المستخدم لاحقًا
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert('خطأ', error?.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={() => router.push('/forget-password')}>
        <Text style={styles.link}>Forget Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        <Text style={styles.loginText}>{loading ? 'Loading...' : 'Sign in'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signupBtn} onPress={() => router.push('/subscriptions')}>
        <Text style={styles.signupText}>Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 250,
    height: 120,
    marginBottom: 40,
  },
  input: {
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#00aacc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  loginBtn: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#32a8c4',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
  signupBtn: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#cc4da0',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
  loginText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    alignSelf: 'flex-end',
    marginRight: '10%',
    color: '#32a8c4',
    marginBottom: 10,
  },
});
