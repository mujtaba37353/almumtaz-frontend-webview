// app/create-account.tsx

import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from './api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} color="#812732" />;
  }

  if (!subscription) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Subscription not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅️ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Your Business Account</Text>

      <Text style={styles.subtitle}>Selected Plan: {subscription.name}</Text>

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={form.name}
        onChangeText={(val) => setForm({ ...form, name: val })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(val) => setForm({ ...form, email: val })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(val) => setForm({ ...form, password: val })}
      />
      <TextInput
        style={styles.input}
        placeholder="Business Name (Account)"
        value={form.accountName}
        onChangeText={(val) => setForm({ ...form, accountName: val })}
      />

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerText}>Register and Start</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅️ Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c23a8c',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  registerButton: {
    backgroundColor: '#c23a8c',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
  },
  registerText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    padding: 10,
  },
  backText: {
    fontSize: 16,
    color: '#888',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});
