import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  Button,
  PageHeader,
  StatusBadge,
  EmptyState,
  colors,
  space,
  typography,
  textStyles,
} from '../../../components/ui';

export default function ViewAccountScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);

      const res = await axios.get(`/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAccount(res.data);
    } catch (err) {
      console.error('Error loading account:', err);
      Alert.alert('خطأ', 'فشل تحميل بيانات الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('تم الحذف', 'تم حذف الحساب بنجاح');
      router.replace('/admin/accounts');
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('خطأ', 'فشل حذف الحساب');
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

  if (!account) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <EmptyState title="Account not found" />
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
        title={account.name}
        subtitle={account.owner?.email || ''}
        right={<StatusBadge active={account.status === 'active'} />}
      />

      <Surface>
        <Text style={styles.rowLabel}>صاحب الحساب</Text>
        <Text style={styles.rowValue}>{account.owner?.email || '—'}</Text>

        <Text style={styles.rowLabel}>الاشتراك</Text>
        <Text style={styles.rowValue}>{account.subscription?.name || 'No subscription name'}</Text>

        <Text style={styles.rowLabel}>الحالة</Text>
        <StatusBadge active={account.status === 'active'} />

        {role === 'AccountOwner' && (
          <Button
            title="تعديل الحساب"
            onPress={() => router.push(`/admin/edit-account/${account._id}`)}
            style={{ marginTop: space.xl }}
          />
        )}

        <Button
          title="حذف الحساب"
          variant="danger"
          onPress={handleDelete}
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
  rowLabel: {
    ...textStyles.label,
    marginTop: space.md,
  },
  rowValue: {
    ...textStyles.body,
    marginTop: space.xs,
    marginBottom: space.sm,
  },
});
