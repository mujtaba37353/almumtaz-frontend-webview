import React, { useEffect, useState } from 'react';
import {
  View,
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

export default function StoresScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(res.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRole = async () => {
    const savedRole = await AsyncStorage.getItem('role');
    setRole(savedRole);
  };

  useEffect(() => {
    loadRole();
    fetchStores();
  }, []);

  const renderStoreCard = ({ item }: any) => (
    <Surface style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      {item.location ? <Text style={styles.detail}>{item.location}</Text> : null}
      <StatusBadge active={item.status === 'active'} />

      <View style={styles.actions}>
        <Button
          title="التفاصيل"
          variant="secondary"
          onPress={() => router.push(`/admin/store/${item._id}`)}
          style={styles.actionBtn}
        />
        {(role === 'AccountOwner' || role === 'GeneralAccountant') && (
          <Button
            title="تعديل"
            onPress={() => router.push(`/admin/manage-store/${item._id}`)}
            style={styles.actionBtn}
          />
        )}
      </View>
    </Surface>
  );

  return (
    <Screen scroll={false}>
      <PageHeader
        title="المتاجر"
        subtitle="عرض وإدارة المتاجر"
        right={
          ['AccountOwner', 'GeneralAccountant'].includes(role || '') ? (
            <Button title="إضافة متجر" onPress={() => router.push('/admin/create-store')} />
          ) : undefined
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : stores.length === 0 ? (
        <EmptyState title="لا توجد متاجر" subtitle="لم يتم العثور على متاجر لعرضها" />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item._id}
          renderItem={renderStoreCard}
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
  card: {
    width: '32%',
    marginBottom: space.lg,
  },
  name: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.xs,
  },
  detail: {
    ...textStyles.subtitle,
    fontSize: typography.sizeSm,
    marginBottom: space.sm,
  },
  actions: {
    marginTop: space.md,
    gap: space.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
