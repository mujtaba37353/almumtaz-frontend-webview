import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import RNPickerSelect from 'react-native-picker-select';
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

export default function SalesScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const token = await AsyncStorage.getItem('token');
      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = profileRes.data;
      setRole(user.role);
      setUserId(user._id);
      setStoreId(user.store?._id || null);

      // فقط مالك الحساب والمحاسب العام يمكنهم اختيار متجر
      if (['AccountOwner', 'GeneralAccountant'].includes(user.role)) {
        const storesRes = await axios.get('/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(storesRes.data);
      }

      // ✅ استخدام الراوت الموحد لجميع الأدوار
      const res = await axios.get('/sessions/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAllSessions(res.data);
      const filtered = applySessionFilter(res.data);
      setSessions(filtered);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setErrorMessage('فشل في تحميل الجلسات.');
    } finally {
      setLoading(false);
    }
  };

  const applySessionFilter = (sessionsList: any[]) => {
    const now = new Date().getTime();
    return sessionsList.filter((session) => {
      if (selectedStoreId && session.store?._id !== selectedStoreId) return false;

      if (sessionStatusFilter === 'open') return session.isOpen === true;

      if (sessionStatusFilter === 'closed') {
        if (!session.isOpen) {
          const closedAt = session.endTime || session.updatedAt || session.createdAt;
          const closedTime = new Date(closedAt).getTime();
          return (now - closedTime) / (1000 * 60 * 60) < 24;
        }
        return false;
      }

      // default: 'all'
      if (!session.isOpen) {
        const closedAt = session.endTime || session.updatedAt || session.createdAt;
        const closedTime = new Date(closedAt).getTime();
        return (now - closedTime) / (1000 * 60 * 60) < 24;
      }

      return true;
    });
  };

  const resetFilters = () => {
    setSessionStatusFilter('all');
    setSelectedStoreId(null);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const filtered = applySessionFilter(allSessions);
    setSessions(filtered);
  }, [sessionStatusFilter, selectedStoreId]);

  const handleCreateSession = () => {
    router.push(`/admin/create-session`);
  };

  const canCreate =
    (['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(role || '') && storeId) ||
    role === 'AccountOwner' ||
    role === 'GeneralAccountant';

  const renderCard = ({ item: session }: any) => {
    const isMySession = session.user?._id === userId;
    const canOpen =
      ['AccountOwner', 'GeneralAccountant', 'StoreAdmin', 'StoreAccountant'].includes(role || '') ||
      (role === 'Cashier' && isMySession);

    return (
      <Surface style={styles.card}>
        <Text style={styles.cardTitle}>جلسة #{session._id.slice(-5)}</Text>
        <StatusBadge
          active={!!session.isOpen}
          label={session.isOpen ? 'مفتوحة' : 'مغلقة'}
        />
        {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
          <Text style={styles.meta}>المتجر: {session.store?.name}</Text>
        )}
        <Text style={styles.meta}>
          المستخدم: {session.user.name ?? 'غير معروف (قد يكون محذوف)'}
        </Text>

        {canOpen && (
          <Button
            title="رؤية الجلسة"
            variant="secondary"
            onPress={() => router.push(`/manage-session/${session._id}`)}
            style={{ marginTop: space.md }}
          />
        )}
      </Surface>
    );
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <PageHeader
        title="الجلسات الحالية"
        subtitle="إدارة جلسات البيع والفلاتر"
        right={
          canCreate ? (
            <Button title="إنشاء جلسة" onPress={handleCreateSession} style={styles.createBtn} />
          ) : null
        }
      />

      <View style={styles.dropdownContainer}>
        {Platform.OS === 'web' ? (
          <select
            value={sessionStatusFilter}
            onChange={(e) => setSessionStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
            style={styles.select as any}
          >
            <option value="all">جميع الجلسات</option>
            <option value="open">الجلسات المفتوحة</option>
            <option value="closed">الجلسات المغلقة</option>
          </select>
        ) : (
          <RNPickerSelect
            onValueChange={(value) => setSessionStatusFilter(value)}
            value={sessionStatusFilter}
            placeholder={{ label: 'تصفية حسب الحالة', value: 'all' }}
            items={[
              { label: 'جميع الجلسات', value: 'all' },
              { label: 'الجلسات المفتوحة', value: 'open' },
              { label: 'الجلسات المغلقة', value: 'closed' },
            ]}
            style={pickerSelectStyles}
          />
        )}
      </View>

      {['AccountOwner', 'GeneralAccountant'].includes(role || '') && stores.length > 0 && (
        <View style={styles.dropdownContainer}>
          {Platform.OS === 'web' ? (
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value || null)}
              style={styles.select as any}
            >
              <option value="">فلترة حسب المتجر</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          ) : (
            <RNPickerSelect
              onValueChange={(value) => setSelectedStoreId(value)}
              value={selectedStoreId}
              placeholder={{ label: 'فلترة حسب المتجر', value: null }}
              items={stores.map((store) => ({
                label: store.name,
                value: store._id,
              }))}
              style={pickerSelectStyles}
            />
          )}
        </View>
      )}

      <Button
        title="إعادة تعيين الفلاتر"
        variant="ghost"
        onPress={resetFilters}
        style={styles.resetBtn}
      />

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xl }} />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="لا توجد جلسات"
          subtitle="لا توجد جلسات تطابق الفلاتر المحددة."
        />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          numColumns={4}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  createBtn: { minWidth: 120 },
  dropdownContainer: {
    marginBottom: space.md,
    width: '60%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  select: {
    padding: 10,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    width: '100%',
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: typography.fontAr,
    fontSize: typography.sizeMd,
  },
  resetBtn: {
    alignSelf: 'center',
    marginBottom: space.lg,
  },
  grid: { paddingBottom: space.xl },
  card: {
    width: '22%',
    marginBottom: space.lg,
  },
  cardTitle: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.sm,
  },
  meta: {
    ...textStyles.subtitle,
    marginTop: space.sm,
  },
  errorText: {
    fontFamily: typography.fontArMd,
    color: colors.danger,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
    padding: space.md,
    borderRadius: 8,
    marginBottom: space.md,
    textAlign: 'center',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
};
