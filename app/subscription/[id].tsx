// app/subscription/[id].tsx

import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  EmptyState,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

export default function SubscriptionDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`/subscriptions/public/${id}`)
        .then((res) => setSubscription(res.data))
        .catch((err) => console.error('Failed to fetch subscription:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جارٍ تحميل الباقة...</Text>
      </Screen>
    );
  }

  if (!subscription) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <EmptyState title="الاشتراك غير موجود" subtitle="تحقق من الرابط وحاول مرة أخرى" />
        <Button title="رجوع" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.signInText}>
            لديك حساب؟ <Text style={styles.signInLink}>تسجيل الدخول</Text>
          </Text>
        </Pressable>
      </View>

      <PageHeader
        title={subscription.name}
        subtitle="تفاصيل الباقة والحدود المتاحة"
      />

      <Surface style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.label}>شهرياً</Text>
          <Text style={styles.value}>{subscription.monthlyPrice} ر.س</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>سنوياً</Text>
          <Text style={styles.value}>{subscription.yearlyPrice} ر.س</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>تجربة مجانية</Text>
          <Text style={styles.value}>{subscription.freeTrialDays} يوم</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>المستخدمون</Text>
          <Text style={styles.value}>{subscription.allowedUsers}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>المتاجر</Text>
          <Text style={styles.value}>{subscription.allowedStores}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>المنتجات</Text>
          <Text style={styles.value}>{subscription.allowedProducts}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>النوع</Text>
          <Text style={styles.value}>{subscription.type}</Text>
        </View>

        <Button
          title="الاشتراك الآن"
          onPress={() => router.push(`/create-account?subscriptionId=${subscription._id}`)}
          style={{ marginTop: space.lg }}
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
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.subtitle,
    marginTop: space.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xl,
  },
  headerLogo: {
    width: 120,
    height: 48,
  },
  signInText: {
    fontFamily: typography.fontAr,
    color: colors.textMuted,
    fontSize: typography.sizeSm,
  },
  signInLink: {
    fontFamily: typography.fontArBold,
    color: colors.primary,
  },
  panel: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    ...textStyles.label,
    color: colors.text,
    fontSize: typography.sizeMd,
  },
  value: {
    fontFamily: typography.fontSansMd,
    fontSize: typography.sizeMd,
    color: colors.textMuted,
  },
});
