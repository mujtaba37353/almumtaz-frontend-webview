import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
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

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [name, setName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [freeTrialDays, setFreeTrialDays] = useState('');
  const [allowedUsers, setAllowedUsers] = useState('');
  const [allowedStores, setAllowedStores] = useState('');
  const [allowedProducts, setAllowedProducts] = useState('');

  useEffect(() => {
    const getRole = async () => {
      const savedRole = await AsyncStorage.getItem('role');
      setRole(savedRole);
      setChecking(false);
    };
    getRole();
  }, []);

  const handleCreate = async () => {
    if (!name || !monthlyPrice || !yearlyPrice || !allowedUsers || !allowedStores || !allowedProducts) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        '/subscriptions',
        {
          name,
          monthlyPrice: parseFloat(monthlyPrice),
          yearlyPrice: parseFloat(yearlyPrice),
          type,
          freeTrialDays: parseInt(freeTrialDays || '0'),
          allowedUsers: parseInt(allowedUsers),
          allowedStores: parseInt(allowedStores),
          allowedProducts: parseInt(allowedProducts),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('تم', 'تم إنشاء الاشتراك بنجاح');
      router.replace('/admin/subscriptions');
    } catch (err) {
      Alert.alert('خطأ', 'فشل إنشاء الاشتراك');
      console.error(err);
    }
  };

  if (checking) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (role !== 'AppOwner') {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <Text style={styles.restrictedText}>ليس لديك صلاحية الوصول إلى هذه الصفحة</Text>
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

      <PageHeader title="إنشاء اشتراك" subtitle="حدد الأسعار والحدود المسموحة" />

      <Surface>
        <TextField label="الاسم" placeholder="Name" value={name} onChangeText={setName} />
        <TextField
          label="السعر الشهري"
          placeholder="Monthly Price"
          value={monthlyPrice}
          onChangeText={setMonthlyPrice}
          keyboardType="numeric"
        />
        <TextField
          label="السعر السنوي"
          placeholder="Yearly Price"
          value={yearlyPrice}
          onChangeText={setYearlyPrice}
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            نوع الاشتراك: {type === 'public' ? 'عام (Public)' : 'خاص (Private)'}
          </Text>
          <Switch
            value={type === 'public'}
            onValueChange={(val) => setType(val ? 'public' : 'private')}
            thumbColor="#fff"
            trackColor={{ false: colors.border, true: colors.brand }}
          />
        </View>

        <TextField
          label="أيام التجربة المجانية"
          placeholder="Free Trial Days"
          value={freeTrialDays}
          onChangeText={setFreeTrialDays}
          keyboardType="numeric"
        />
        <TextField
          label="المستخدمون المسموحون"
          placeholder="Allowed Users"
          value={allowedUsers}
          onChangeText={setAllowedUsers}
          keyboardType="numeric"
        />
        <TextField
          label="المتاجر المسموحة"
          placeholder="Allowed Stores"
          value={allowedStores}
          onChangeText={setAllowedStores}
          keyboardType="numeric"
        />
        <TextField
          label="المنتجات المسموحة"
          placeholder="Allowed Products"
          value={allowedProducts}
          onChangeText={setAllowedProducts}
          keyboardType="numeric"
        />

        <Button title="حفظ" onPress={handleCreate} />
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
    gap: space.md,
  },
  switchLabel: {
    ...textStyles.body,
    flex: 1,
  },
  restrictedText: {
    ...textStyles.subtitle,
    color: colors.danger,
    marginBottom: space.lg,
    textAlign: 'center',
  },
});
