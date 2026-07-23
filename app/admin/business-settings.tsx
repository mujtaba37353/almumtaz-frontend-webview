import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

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
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const schemeLabels: Record<string, string> = {
    exclusive: 'خارج السعر',
    inclusive: 'شامل',
    none: 'بدون',
  };

  return (
    <Screen>
      <PageHeader
        title="بيانات المنشأة"
        subtitle="معلومات الحساب والعنوان والفوترة الإلكترونية"
      />

      <Surface>
        {(
          [
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
          ] as const
        ).map(([key, label]) => (
          <TextField
            key={key}
            label={label}
            value={(form as any)[key]}
            onChangeText={(t) => set(key, t)}
          />
        ))}

        <Text style={styles.label}>نظام الضريبة</Text>
        <View style={styles.row}>
          {(['exclusive', 'inclusive', 'none'] as const).map((s) => (
            <Pressable
              key={s}
              style={[styles.chip, form.vatScheme === s && styles.chipActive]}
              onPress={() => set('vatScheme', s)}
            >
              <Text style={[styles.chipText, form.vatScheme === s && styles.chipTextActive]}>
                {schemeLabels[s]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.chip, form.einvoicingEnabled && styles.chipActive, styles.toggle]}
          onPress={() => set('einvoicingEnabled', !form.einvoicingEnabled)}
        >
          <Text
            style={[styles.chipText, form.einvoicingEnabled && styles.chipTextActive]}
          >
            تفعيل الفوترة الإلكترونية
          </Text>
        </Pressable>

        <Button title={saving ? 'جاري الحفظ...' : 'حفظ'} onPress={save} loading={saving} />
        <Button
          title="إعدادات ربط فاتورة / هيئة الزكاة"
          variant="secondary"
          onPress={() => router.push('/admin/zatca')}
          style={{ marginTop: space.sm }}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { ...textStyles.label, marginBottom: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvasAlt,
    borderRadius: 8,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeSm,
    color: colors.text,
  },
  chipTextActive: { color: colors.textOnBrand },
  toggle: { marginBottom: space.xl, alignSelf: 'flex-start' },
});
