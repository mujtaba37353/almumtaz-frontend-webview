import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
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

export default function AccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const roleVal = await AsyncStorage.getItem('role');
        setRole(roleVal);

        if (roleVal === 'AppOwner' || roleVal === 'AppAdmin') {
          const res = await axios.get('/accounts', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAccounts(res.data);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const renderAccount = ({ item }: any) => (
    <Surface style={styles.card}>
      <Text style={styles.accountName}>{item.name}</Text>
      <StatusBadge active={item.status === 'active'} />
      <Text style={styles.userCount}>مستخدمون نشطون: {item.activeUsers ?? 0}</Text>
      <Button
        title="معلومات الحساب"
        variant="secondary"
        onPress={() => router.push(`/admin/view-account/${item._id}`)}
        style={styles.cardBtn}
      />
    </Surface>
  );

  return (
    <Screen scroll={false}>
      <PageHeader
        title="الحسابات"
        subtitle="إدارة حسابات المنصة"
        right={
          role === 'AppOwner' ? (
            <Button title="إنشاء حساب" onPress={() => router.push('/admin/create-account')} />
          ) : undefined
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : accounts.length === 0 ? (
        <EmptyState title="لا توجد حسابات" subtitle="لم يتم العثور على حسابات لعرضها" />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item._id}
          renderItem={renderAccount}
          numColumns={3}
          style={{ flex: 1 }}
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
    gap: 0,
  },
  row: {
    justifyContent: 'space-between',
    gap: space.md,
  },
  card: {
    width: '32%',
    marginBottom: space.lg,
  },
  accountName: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.sm,
  },
  userCount: {
    ...textStyles.body,
    marginTop: space.sm,
    marginBottom: space.md,
  },
  cardBtn: {
    marginTop: space.xs,
  },
});
