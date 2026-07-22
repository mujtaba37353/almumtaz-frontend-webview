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
import { useRouter } from 'expo-router';
import axios from '../api/axiosInstance';

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [form, setForm] = useState({
    name: '',
    legalNameAr: '',
    legalNameEn: '',
    vatNumber: '',
    crNumber: '',
    vatRate: '15',
    vatScheme: 'exclusive',
    buildingNumber: '',
    streetName: '',
    district: '',
    city: '',
    postalCode: '',
    countryCode: 'SA',
    einvoicingEnabled: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('/accounts/me/current', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const a = res.data;
        setAccountId(a._id);
        setForm({
          name: a.name || '',
          legalNameAr: a.legalNameAr || '',
          legalNameEn: a.legalNameEn || '',
          vatNumber: a.vatNumber || '',
          crNumber: a.crNumber || '',
          vatRate: String(a.vatRate ?? 15),
          vatScheme: a.vatScheme || 'exclusive',
          buildingNumber: a.address?.buildingNumber || '',
          streetName: a.address?.streetName || '',
          district: a.address?.district || '',
          city: a.address?.city || '',
          postalCode: a.address?.postalCode || '',
          countryCode: a.address?.countryCode || 'SA',
          einvoicingEnabled: !!a.einvoicingEnabled,
        });
      } catch (err: any) {
        Alert.alert('خطأ', err?.response?.data?.message || 'تعذر تحميل بيانات الحساب');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `/accounts/${accountId}`,
        {
          name: form.name,
          legalNameAr: form.legalNameAr,
          legalNameEn: form.legalNameEn,
          vatNumber: form.vatNumber,
          crNumber: form.crNumber,
          vatRate: Number(form.vatRate),
          vatScheme: form.vatScheme,
          einvoicingEnabled: form.einvoicingEnabled,
          address: {
            buildingNumber: form.buildingNumber,
            streetName: form.streetName,
            district: form.district,
            city: form.city,
            postalCode: form.postalCode,
            countryCode: form.countryCode,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('تم', 'تم حفظ بيانات المنشأة');
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c23a8c" />
      </View>
    );
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>بيانات المنشأة (ZATCA)</Text>

      {[
        ['name', 'اسم الحساب'],
        ['legalNameAr', 'الاسم القانوني (عربي)'],
        ['legalNameEn', 'الاسم القانوني (إنجليزي)'],
        ['vatNumber', 'الرقم الضريبي (15 خانة)'],
        ['crNumber', 'السجل التجاري'],
        ['vatRate', 'نسبة الضريبة %'],
        ['buildingNumber', 'رقم المبنى'],
        ['streetName', 'اسم الشارع'],
        ['district', 'الحي'],
        ['city', 'المدينة'],
        ['postalCode', 'الرمز البريدي'],
      ].map(([key, label]) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={(form as any)[key]}
            onChangeText={(t) => set(key, t)}
          />
        </View>
      ))}

      <Text style={styles.label}>نظام الضريبة</Text>
      <View style={styles.row}>
        {(['exclusive', 'inclusive', 'none'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, form.vatScheme === s && styles.chipActive]}
            onPress={() => set('vatScheme', s)}
          >
            <Text style={{ color: form.vatScheme === s ? '#fff' : '#333' }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.chip, form.einvoicingEnabled && styles.chipActive, { marginTop: 12 }]}
        onPress={() => set('einvoicingEnabled', !form.einvoicingEnabled)}
      >
        <Text style={{ color: form.einvoicingEnabled ? '#fff' : '#333' }}>
          تفعيل الفوترة الإلكترونية
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={save} disabled={saving}>
        <Text style={styles.btnText}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => router.push('/admin/zatca')}>
        <Text style={styles.btnText}>إعدادات ربط Fatoora / ZATCA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 16 },
  label: { marginTop: 10, marginBottom: 4, color: '#444' },
  input: {
    borderWidth: 1,
    borderColor: '#00aacc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    marginTop: 20,
    alignItems: 'center',
  },
  secondary: { backgroundColor: '#50b3c9' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
