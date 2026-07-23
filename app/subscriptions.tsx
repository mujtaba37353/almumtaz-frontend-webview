import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import axios from './api/axiosInstance';
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
} from '../components/ui';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/subscriptions/public/all')
      .then((res) => {
        const activeSubscriptions = res.data.filter((sub: any) => sub.active === true);
        setSubscriptions(activeSubscriptions);
      })
      .catch((err) => console.error('Error loading subscriptions', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جارٍ تحميل الاشتراكات...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.signInText}>
            لديك حساب؟ <Text style={styles.signInLink}>تسجيل الدخول</Text>
          </Text>
        </Pressable>
      </View>

      <PageHeader
        title="اختر باقة الاشتراك"
        subtitle="خطط مرنة لإدارة متاجرك والفوترة الإلكترونية"
      />

      {subscriptions.length === 0 ? (
        <EmptyState title="لا توجد باقات متاحة حالياً" />
      ) : (
        <View style={styles.grid}>
          {subscriptions.map((item) => (
            <Surface key={item._id} style={styles.card}>
              <Text style={styles.planName}>{item.name}</Text>
              <Text style={styles.price}>
                {item.monthlyPrice} ر.س
                <Text style={styles.period}> / شهرياً</Text>
              </Text>
              <Text style={styles.priceYear}>
                {item.yearlyPrice} ر.س
                <Text style={styles.period}> / سنوياً</Text>
              </Text>
              <Text style={styles.meta}>مستخدمون: {item.allowedUsers}</Text>
              <Text style={styles.meta}>متاجر: {item.allowedStores}</Text>
              <Text style={styles.meta}>منتجات: {item.allowedProducts}</Text>
              <Button
                title="التفاصيل"
                variant="secondary"
                onPress={() => router.push(`/subscription/${item._id}`)}
                style={{ marginTop: space.md }}
              />
              <Button
                title="الاشتراك الآن"
                onPress={() => router.push(`/create-account?subscriptionId=${item._id}`)}
                style={{ marginTop: space.sm }}
              />
            </Surface>
          ))}
        </View>
      )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
  },
  card: {
    minWidth: 260,
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 360,
  },
  planName: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeLg,
    color: colors.brandDeep,
    marginBottom: space.sm,
  },
  price: {
    fontFamily: typography.fontSansBold,
    fontSize: typography.sizeXl,
    color: colors.text,
  },
  priceYear: {
    fontFamily: typography.fontSansMd,
    fontSize: typography.sizeMd,
    color: colors.textMuted,
    marginBottom: space.md,
  },
  period: {
    fontFamily: typography.fontAr,
    fontSize: typography.sizeSm,
    color: colors.textMuted,
  },
  meta: {
    ...textStyles.body,
    marginTop: 2,
  },
});
