import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  EmptyState,
  StatusBadge,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptions(res.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async () => {
    const savedRole = await AsyncStorage.getItem('role');
    setRole(savedRole);
  };

  useEffect(() => {
    fetchSubscriptions();
    loadUserRole();
  }, []);

  if (role === null) {
    return (
      <Screen scroll={false} contentStyle={styles.notAllowed}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (role !== 'AppOwner' && role !== 'AppAdmin') {
    return (
      <Screen scroll={false} contentStyle={styles.notAllowed}>
        <EmptyState title="ليس لديك صلاحية للوصول إلى هذه الصفحة" />
      </Screen>
    );
  }

  const renderItem = ({ item }: any) => (
    <Pressable
      style={styles.cardWrap}
      onPress={() => router.push(`/admin/view-subscription/${item._id}`)}
    >
      <Surface style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>
        <StatusBadge active={item.active !== false} />
        <Text style={styles.type}>
          النوع: {item.type === 'public' ? 'عام' : 'خاص'}
        </Text>

        {role === 'AppOwner' && (
          <Button
            title="إدارة الاشتراك"
            variant="secondary"
            onPress={() => router.push(`/admin/edit-subscription/${item._id}`)}
            style={{ marginTop: space.md }}
          />
        )}
      </Surface>
    </Pressable>
  );

  return (
    <Screen scroll={false}>
      <PageHeader
        title="الاشتراكات"
        subtitle="باقات المنصة وإدارتها"
        right={
          role === 'AppOwner' ? (
            <Button title="إنشاء اشتراك" onPress={() => router.push('/admin/create-subscription')} />
          ) : undefined
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : subscriptions.length === 0 ? (
        <EmptyState title="لا توجد اشتراكات" />
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: space.xxl,
  },
  row: {
    justifyContent: 'space-between',
    gap: space.md,
  },
  cardWrap: {
    width: '32%',
    marginBottom: space.lg,
  },
  card: {
    width: '100%',
  },
  name: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.sm,
  },
  type: {
    ...textStyles.body,
    marginTop: space.sm,
  },
  notAllowed: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
