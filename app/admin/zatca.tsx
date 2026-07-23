import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  StatusBadge,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

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
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  const envLabels: Record<string, string> = {
    sandbox: 'تجريبي',
    production: 'إنتاج',
  };

  return (
    <Screen>
      <PageHeader
        title="ربط هيئة الزكاة والضريبة"
        subtitle="اعتماد فاتورة الإلكترونية وبيئة الربط"
      />

      <Surface style={styles.statusCard}>
        <View style={styles.badgeRow}>
          <StatusBadge
            active={!!status?.zatcaReady}
            label={status?.zatcaReady ? 'جاهز' : 'غير جاهز'}
          />
          <StatusBadge
            active={!!status?.einvoicingEnabled}
            label={status?.einvoicingEnabled ? 'الفوترة مفعّلة' : 'الفوترة متوقفة'}
          />
        </View>
        <Text style={styles.body}>البيئة: {envLabels[status?.environment] || status?.environment}</Text>
        <Text style={styles.body}>حالة الربط: {status?.onboardingStatus}</Text>
        <Text style={styles.body}>
          بيانات الاعتماد: {status?.hasCredentials ? 'موجودة' : 'غير موجودة'}
        </Text>
        {status?.lastError ? (
          <Text style={styles.error}>{status.lastError}</Text>
        ) : null}
      </Surface>

      <Surface>
        <Text style={styles.label}>البيئة</Text>
        <View style={styles.row}>
          {['sandbox', 'production'].map((env) => (
            <Pressable
              key={env}
              style={[styles.chip, environment === env && styles.chipActive]}
              onPress={() => setEnvironment(env)}
            >
              <Text style={[styles.chipText, environment === env && styles.chipTextActive]}>
                {envLabels[env]}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="رمز الأمان الثنائي (CSID)"
          value={binarySecurityToken}
          onChangeText={setBinarySecurityToken}
          placeholder="الصق التوكن هنا"
        />
        <TextField
          label="السر"
          value={secret}
          onChangeText={setSecret}
          placeholder="الصق السر هنا"
          secureTextEntry
        />

        <Button title="حفظ الاعتماد" onPress={save} />
        <Button
          title="توليد CSR"
          variant="secondary"
          style={{ marginTop: space.sm }}
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.post(
                '/zatca/generate-csr',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('CSR', res.data.csrPem?.slice(0, 180) + '...');
              load();
            } catch (err: any) {
              Alert.alert('خطأ', err?.response?.data?.message || 'فشل توليد CSR');
            }
          }}
        />
        <Button
          title="تشغيل اختبار الامتثال"
          variant="secondary"
          onPress={compliance}
          style={{ marginTop: space.sm }}
        />
        <Button
          title="الترقية للإنتاج"
          variant="secondary"
          onPress={promote}
          style={{ marginTop: space.sm }}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusCard: { marginBottom: space.xl, gap: space.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  body: { ...textStyles.subtitle },
  error: {
    ...textStyles.subtitle,
    color: colors.danger,
    marginTop: space.sm,
  },
  label: { ...textStyles.label, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
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
});
