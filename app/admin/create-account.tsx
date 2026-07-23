import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
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
} from '../../components/ui';

export default function AdminCreateAccountScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    password: '',
    accountName: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedRole = await AsyncStorage.getItem('role');
        setRole(storedRole);

        if (storedRole !== 'AppOwner' && storedRole !== 'AppAdmin') {
          setLoading(false);
          return;
        }

        const res = await axios.get('/subscriptions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubscriptions(res.data || []);
        if (res.data?.length) {
          setSelectedSubscriptionId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('تعذر تحميل الاشتراكات');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    setErrorMessage('');
    const { ownerName, email, password, accountName } = form;

    if (!ownerName || !email || !password || !accountName || !selectedSubscriptionId) {
      const msg = 'يرجى تعبئة جميع الحقول واختيار اشتراك';
      setErrorMessage(msg);
      Alert.alert('تنبيه', msg);
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const { data: createdUser } = await axios.post(
        '/users',
        {
          name: ownerName,
          email,
          password,
          role: 'AccountOwner',
          subscription: selectedSubscriptionId,
        },
        { headers }
      );

      if (createdUser?.account && accountName) {
        await axios.put(
          `/accounts/${createdUser.account}`,
          { name: accountName },
          { headers }
        );
      }

      Alert.alert('تم', 'تم إنشاء الحساب وصاحب الحساب بنجاح');
      router.replace('/admin/accounts');
    } catch (error: any) {
      console.error(error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'فشل إنشاء الحساب';
      setErrorMessage(msg);
      Alert.alert('خطأ', msg);
    } finally {
      setSaving(false);
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

  if (role !== 'AppOwner' && role !== 'AppAdmin') {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <EmptyState title="ليس لديك صلاحية الوصول إلى هذه الصفحة" />
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
        title="إنشاء حساب جديد"
        subtitle="ينشئ صاحب حساب (AccountOwner) وحساباً مرتبطاً باشتراك"
      />

      <Surface style={styles.panel}>
        <TextField
          label="اسم صاحب الحساب"
          placeholder="الاسم الكامل"
          value={form.ownerName}
          onChangeText={(val) => setForm({ ...form, ownerName: val })}
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
          label="اسم المنشأة / الحساب"
          placeholder="اسم المنشأة"
          value={form.accountName}
          onChangeText={(val) => setForm({ ...form, accountName: val })}
        />

        <Text style={styles.sectionLabel}>الاشتراك</Text>
        {subscriptions.length === 0 ? (
          <EmptyState
            title="لا توجد اشتراكات"
            subtitle="أنشئ اشتراكاً أولاً من قائمة الاشتراكات"
          />
        ) : (
          subscriptions.map((sub) => {
            const selected = selectedSubscriptionId === sub._id;
            return (
              <TouchableOpacity
                key={sub._id}
                style={[styles.planCard, selected && styles.planCardSelected]}
                onPress={() => setSelectedSubscriptionId(sub._id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selected ? colors.primary : colors.textMuted}
                />
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{sub.name}</Text>
                  <Text style={styles.planMeta}>
                    {sub.monthlyPrice} / شهر · {sub.allowedStores} متاجر · {sub.allowedUsers} مستخدمين
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Button
          title={saving ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          onPress={handleCreate}
          loading={saving}
          disabled={saving}
          style={{ marginTop: space.md }}
        />
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
    maxWidth: 560,
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
  sectionLabel: {
    ...textStyles.label,
    color: colors.text,
    fontSize: typography.sizeMd,
    marginBottom: space.md,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.sm,
    gap: space.md,
    backgroundColor: colors.surface,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.canvasAlt,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: typography.fontArBold,
    color: colors.text,
    fontSize: typography.sizeMd,
  },
  planMeta: {
    fontFamily: typography.fontAr,
    color: colors.textMuted,
    fontSize: typography.sizeSm,
    marginTop: 2,
  },
  errorText: {
    fontFamily: typography.fontAr,
    color: colors.danger,
    textAlign: 'center',
    marginVertical: space.md,
  },
});
