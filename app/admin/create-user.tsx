import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

export default function CreateUserScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    selectedRole: '',
  });

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    const loadUserRole = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);

      if (storedRole === 'AppOwner' || storedRole === 'AppAdmin') {
        setAvailableRoles(['AppAdmin', 'AccountOwner']);
        fetchSubscriptions();
      } else if (storedRole === 'AccountOwner') {
        setAvailableRoles(['GeneralAccountant', 'StoreAdmin', 'StoreAccountant', 'Cashier']);
        fetchStores();
      } else if (storedRole === 'GeneralAccountant') {
        setAvailableRoles(['StoreAdmin', 'StoreAccountant', 'Cashier']);
        fetchStores();
      } else if (storedRole === 'StoreAdmin') {
        setAvailableRoles(['StoreAccountant', 'Cashier']);
        fetchStores();
      }
    };

    const fetchSubscriptions = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('/subscriptions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubscriptions(res.data);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      }
    };

    const fetchStores = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(res.data);
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };

    loadUserRole();
    console.log('🧪 limitError:', limitError);
  }, [limitError]);

  const handleCreateUser = async () => {
    const { name, email, password, selectedRole } = form;

    if (!name || !email || !password || !selectedRole) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول');
      return;
    }

    if (selectedRole === 'AccountOwner' && !selectedSubscriptionId) {
      Alert.alert('تنبيه', 'يرجى اختيار اشتراك لهذا الحساب');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload: any = {
        name,
        email,
        password,
        role: selectedRole,
      };

      if (selectedRole === 'AccountOwner') {
        payload.subscription = selectedSubscriptionId;
      }

      if (['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(selectedRole)) {
        payload.store = selectedStoreId || null;
      }

      await axios.post('/users', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('تم', 'تم إنشاء المستخدم بنجاح');
      router.replace('/admin/users');
    } catch (error: any) {
      console.error('❌ createUser error:', error);

      let raw =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'فشل إنشاء المستخدم';

      if (typeof raw !== 'string') raw = JSON.stringify(raw);

      const isLimitError = raw.includes('تجاوز الحد الأقصى');

      if (isLimitError) {
        setLimitError(
          'لقد تم تجاوز عدد المستخدمين المسموح بهم في الاشتراك الحالي، نرجو ترقية الباقة أو التواصل مع الدعم الفني.'
        );
      } else {
        Alert.alert('خطأ', raw);
      }
    }
  };

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader title="إنشاء مستخدم جديد" subtitle="تعبئة البيانات واختيار الدور" />

      {limitError ? (
        <Surface style={styles.errorBox}>
          <Text style={styles.errorText}>{limitError}</Text>
        </Surface>
      ) : null}

      <Surface>
        <TextField
          label="الاسم"
          placeholder="Name"
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />
        <TextField
          label="البريد الإلكتروني"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(val) => setForm({ ...form, email: val })}
        />
        <TextField
          label="كلمة المرور"
          placeholder="Password"
          secureTextEntry
          value={form.password}
          onChangeText={(val) => setForm({ ...form, password: val })}
        />

        <Text style={styles.sectionLabel}>اختر الدور</Text>
        {availableRoles.map((r) => {
          const selected = form.selectedRole === r;
          return (
            <Pressable
              key={r}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => {
                setForm({ ...form, selectedRole: r });
                setSelectedStoreId(null);
                setSelectedSubscriptionId(null);
                setLimitError(null);
              }}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{r}</Text>
            </Pressable>
          );
        })}

        {form.selectedRole === 'AccountOwner' && (
          <>
            <Text style={styles.sectionLabel}>اختر الاشتراك</Text>
            {subscriptions.map((sub) => {
              const selected = selectedSubscriptionId === sub._id;
              return (
                <Pressable
                  key={sub._id}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setSelectedSubscriptionId(sub._id)}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {sub.name} ({sub.type})
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}

        {['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(form.selectedRole) && (
          <>
            <Text style={styles.sectionLabel}>اختر المتجر</Text>
            {stores.map((store) => {
              const selected = selectedStoreId === store._id;
              return (
                <Pressable
                  key={store._id}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setSelectedStoreId(store._id)}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {store.name}
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}

        <Button title="حفظ" onPress={handleCreateUser} />
        <Button title="إلغاء" variant="secondary" onPress={() => router.back()} style={{ marginTop: space.md }} />
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
  sectionLabel: {
    ...textStyles.label,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(42, 155, 176, 0.1)',
  },
  optionText: {
    ...textStyles.body,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.brandDeep,
    fontFamily: typography.fontArMd,
  },
  errorBox: {
    marginBottom: space.lg,
    borderColor: colors.danger,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
  },
  errorText: {
    fontFamily: typography.fontArMd,
    color: colors.danger,
    textAlign: 'center',
  },
});
