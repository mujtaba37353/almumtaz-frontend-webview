import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from '../../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  Button,
  PageHeader,
  EmptyState,
  colors,
  space,
  typography,
  textStyles,
} from '../../../components/ui';

export default function ViewSubscription() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const storedRole = await AsyncStorage.getItem('role');

      const endpoint =
        storedRole === 'AppOwner' || storedRole === 'AppAdmin'
          ? `/subscriptions/${id}`
          : `/subscriptions/public/${id}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubscription(res.data);
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحميل الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!subscription) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <EmptyState title="Subscription not found" />
        <Button title="رجوع" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const rows = [
    { label: 'الاسم', value: subscription.name },
    { label: 'السعر الشهري', value: String(subscription.monthlyPrice) },
    { label: 'السعر السنوي', value: String(subscription.yearlyPrice) },
    { label: 'أيام التجربة', value: String(subscription.freeTrialDays) },
    { label: 'المستخدمون', value: String(subscription.allowedUsers) },
    { label: 'المتاجر', value: String(subscription.allowedStores) },
    { label: 'المنتجات', value: String(subscription.allowedProducts) },
  ];

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader
        title={subscription.name}
        subtitle={subscription.type === 'public' ? 'عام (Public)' : 'خاص (Private)'}
      />

      <Surface>
        {rows.map((row) => (
          <React.Fragment key={row.label}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </React.Fragment>
        ))}
        <Text style={styles.note}>
          نوع الاشتراك: {subscription.type === 'public' ? 'عام (Public)' : 'خاص (Private)'}
        </Text>
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
  rowLabel: {
    ...textStyles.label,
    marginTop: space.md,
  },
  rowValue: {
    ...textStyles.body,
    marginTop: space.xs,
  },
  note: {
    ...textStyles.subtitle,
    marginTop: space.xl,
  },
});
