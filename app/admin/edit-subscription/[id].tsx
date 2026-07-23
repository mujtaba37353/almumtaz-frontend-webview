import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
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
} from '../../../components/ui';

export default function EditSubscriptionPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [freeTrialDays, setFreeTrialDays] = useState('');
  const [allowedUsers, setAllowedUsers] = useState('');
  const [allowedStores, setAllowedStores] = useState('');
  const [allowedProducts, setAllowedProducts] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const savedRole = await AsyncStorage.getItem('role');
      setRole(savedRole);

      const token = await AsyncStorage.getItem('token');
      try {
        const res = await axios.get(`/subscriptions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sub = res.data;

        setName(sub.name);
        setMonthlyPrice(sub.monthlyPrice.toString());
        setYearlyPrice(sub.yearlyPrice.toString());
        setType(sub.type);
        setFreeTrialDays(sub.freeTrialDays?.toString() || '0');
        setAllowedUsers(sub.allowedUsers.toString());
        setAllowedStores(sub.allowedStores.toString());
        setAllowedProducts(sub.allowedProducts.toString());
        setActive(sub.active !== false);
      } catch (err) {
        Alert.alert('خطأ', 'فشل تحميل البيانات');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdate = async () => {
    if (!name || !monthlyPrice || !yearlyPrice || !allowedUsers || !allowedStores || !allowedProducts) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    try {
      await axios.put(
        `/subscriptions/${id}`,
        {
          name,
          monthlyPrice: parseFloat(monthlyPrice),
          yearlyPrice: parseFloat(yearlyPrice),
          type,
          freeTrialDays: parseInt(freeTrialDays || '0'),
          allowedUsers: parseInt(allowedUsers),
          allowedStores: parseInt(allowedStores),
          allowedProducts: parseInt(allowedProducts),
          active,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('تم التحديث', 'تم حفظ التعديلات بنجاح');
      router.replace('/admin/subscriptions');
    } catch (err) {
      Alert.alert('خطأ', 'فشل تعديل الاشتراك');
      console.error(err);
    }
  };

  const handleInactivate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `/subscriptions/${id}`,
        { active: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('تم', 'تم إلغاء تفعيل الاشتراك بنجاح');
      router.back();
    } catch (error: any) {
      console.error('Error inactivating subscription:', error);
      Alert.alert('خطأ', error.response?.data?.message || 'فشل إلغاء التفعيل');
    }
  };

  if (role !== 'AppOwner' && !loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <Text style={styles.restrictedText}>ليس لديك صلاحية للوصول إلى هذه الصفحة</Text>
        <Button title="رجوع" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader title="تعديل الاشتراك" subtitle={name} />

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

        <Button title="حفظ" onPress={handleUpdate} />
        <Button
          title="إلغاء التفعيل"
          variant="danger"
          onPress={handleInactivate}
          style={{ marginTop: space.md }}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
