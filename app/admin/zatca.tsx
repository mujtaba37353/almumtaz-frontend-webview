import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';

export default function ZatcaSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [binarySecurityToken, setBinarySecurityToken] = useState('');
  const [secret, setSecret] = useState('');
  const [environment, setEnvironment] = useState('sandbox');

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('/zatca/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(res.data);
      setEnvironment(res.data.environment || 'sandbox');
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'تعذر تحميل حالة ZATCA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        '/zatca/credentials',
        {
          environment,
          binarySecurityToken: binarySecurityToken || undefined,
          secret: secret || undefined,
          einvoicingEnabled: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('تم', 'تم حفظ بيانات الاعتماد');
      load();
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل الحفظ');
    }
  };

  const compliance = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        '/zatca/compliance-check',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        res.data.ok ? 'نجح' : 'فشل',
        res.data.ok ? 'اجتياز اختبار الامتثال' : JSON.stringify(res.data.data || {})
      );
      load();
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل الاختبار');
    }
  };

  const promote = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        '/zatca/promote-production',
        {
          binarySecurityToken: binarySecurityToken || undefined,
          secret: secret || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('تم', 'تم التبديل لبيئة الإنتاج');
      load();
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل الترقية');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c23a8c" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ربط ZATCA / Fatoora</Text>

      <View style={styles.card}>
        <Text>جاهزية البيانات: {status?.zatcaReady ? 'نعم' : 'لا'}</Text>
        <Text>الفوترة مفعّلة: {status?.einvoicingEnabled ? 'نعم' : 'لا'}</Text>
        <Text>البيئة: {status?.environment}</Text>
        <Text>حالة الربط: {status?.onboardingStatus}</Text>
        <Text>بيانات اعتماد: {status?.hasCredentials ? 'موجودة' : 'غير موجودة'}</Text>
        {status?.lastError ? <Text style={{ color: 'red' }}>{status.lastError}</Text> : null}
      </View>

      <Text style={styles.label}>البيئة</Text>
      <View style={styles.row}>
        {['sandbox', 'production'].map((env) => (
          <TouchableOpacity
            key={env}
            style={[styles.chip, environment === env && styles.chipActive]}
            onPress={() => setEnvironment(env)}
          >
            <Text style={{ color: environment === env ? '#fff' : '#333' }}>{env}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Binary Security Token (CSID)</Text>
      <TextInput
        style={styles.input}
        value={binarySecurityToken}
        onChangeText={setBinarySecurityToken}
        placeholder="الصق التوكن هنا"
      />

      <Text style={styles.label}>Secret</Text>
      <TextInput
        style={styles.input}
        value={secret}
        onChangeText={setSecret}
        placeholder="الصق السر هنا"
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>حفظ الاعتماد</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={compliance}>
        <Text style={styles.btnText}>تشغيل اختبار الامتثال</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={promote}>
        <Text style={styles.btnText}>الترقية للإنتاج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 16 },
  card: {
    backgroundColor: '#f5f9fb',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  label: { marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#00aacc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#00aacc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#50b3c9', borderColor: '#50b3c9' },
  btn: {
    backgroundColor: '#c23a8c',
    padding: 14,
    borderRadius: 8,
    marginTop: 14,
    alignItems: 'center',
  },
  secondary: { backgroundColor: '#50b3c9' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
