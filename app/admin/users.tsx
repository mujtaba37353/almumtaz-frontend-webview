import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
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
  radius,
  typography,
  textStyles,
} from '../../components/ui';

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [availableRoleFilters, setAvailableRoleFilters] = useState<string[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentUser = profileRes.data;
      setRole(currentUser.role);
      setCurrentUser(currentUser);
      await AsyncStorage.setItem('user', JSON.stringify(currentUser));

      if (['AppOwner', 'AppAdmin'].includes(currentUser.role)) {
        setAvailableRoleFilters(['AppAdmin', 'AccountOwner']);
      } else if (['AccountOwner', 'GeneralAccountant'].includes(currentUser.role)) {
        setAvailableRoleFilters(['GeneralAccountant', 'StoreAdmin', 'StoreAccountant', 'Cashier']);
      } else if (currentUser.role === 'StoreAdmin') {
        setAvailableRoleFilters(['StoreAccountant', 'Cashier']);
      }

      let fetchedUsers = [];
      if (
        ['AppOwner', 'AppAdmin', 'AccountOwner', 'GeneralAccountant', 'StoreAdmin'].includes(currentUser.role)
      ) {
        const usersRes = await axios.get('/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchedUsers = usersRes.data;
      }

      const currentUserId = currentUser._id || currentUser.id;
      const filteredUsers = fetchedUsers.filter((user: any) => user._id !== currentUserId);

      setAllUsers(filteredUsers);
      setUsers(filteredUsers);

      if (['AccountOwner', 'GeneralAccountant'].includes(currentUser.role)) {
        const storesRes = await axios.get('/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(storesRes.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...allUsers];
    if (selectedStore) {
      filtered = filtered.filter((user) => user.store?._id === selectedStore);
    }
    if (selectedRole) {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }
    setUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedStore, selectedRole]);

  const canManageUser = (targetUser: any) => {
    if (!role || !targetUser || !currentUser) return false;

    if (role === 'AppOwner' && targetUser.role === 'AppAdmin') return true;
    if (role === 'AppAdmin') return false;
    if (role === 'AccountOwner') return true;
    if (
      role === 'GeneralAccountant' &&
      targetUser.account?.toString?.() === currentUser.account?.toString?.()
    )
      return true;

    if (
      role === 'StoreAdmin' &&
      targetUser.store?.toString?.() === currentUser.store?.toString?.() &&
      ['StoreAccountant', 'Cashier'].includes(targetUser.role)
    )
      return true;

    return false;
  };

  const renderUserCard = ({ item }: any) => (
    <Surface style={styles.card}>
      {item.profileImage ? (
        <Image
          source={{ uri: `${axios.defaults.baseURL?.replace('/api', '')}${item.profileImage}` }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{(item.name || '?').charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.name}>{item.name}</Text>
      <StatusBadge active={item.status === 'active' || item.active} />
      <Text style={styles.meta}>{item.role}</Text>
      {item.store?.name ? <Text style={styles.storeText}>{item.store.name}</Text> : null}

      <View style={styles.actions}>
        {canManageUser(item) && (
          <Button
            title="إدارة"
            onPress={() => router.push(`/admin/manage-user/${item._id}`)}
            style={styles.actionBtn}
          />
        )}
        <Button
          title="التفاصيل"
          variant="secondary"
          onPress={() => router.push(`/admin/user-info/${item._id}`)}
          style={styles.actionBtn}
        />
      </View>
    </Surface>
  );

  return (
    <Screen scroll={false}>
      <PageHeader
        title="المستخدمون"
        subtitle="عرض وإدارة مستخدمي النظام"
        right={
          ['AppOwner', 'AppAdmin', 'AccountOwner', 'GeneralAccountant', 'StoreAdmin'].includes(role || '') ? (
            <Button title="إنشاء مستخدم" onPress={() => router.push('/admin/create-user')} />
          ) : undefined
        }
      />

      {(availableRoleFilters.length > 0 || stores.length > 0) && (
        <View style={styles.filtersRow}>
          {availableRoleFilters.length > 0 && (
            <View style={styles.dropdownContainer}>
              {Platform.OS === 'web' ? (
                <select
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(e.target.value || null)}
                  style={{
                    padding: 12,
                    borderRadius: radius.md,
                    borderColor: colors.border,
                    borderWidth: 1,
                    marginBottom: 10,
                    width: '100%',
                    backgroundColor: colors.surface,
                    color: colors.text,
                    fontFamily: typography.fontAr,
                  }}
                >
                  <option value="">فلترة حسب الدور</option>
                  {availableRoleFilters.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <RNPickerSelect
                  onValueChange={(value) => setSelectedRole(value)}
                  placeholder={{ label: 'فلترة حسب الدور', value: null }}
                  value={selectedRole}
                  items={availableRoleFilters.map((r) => ({
                    label: r,
                    value: r,
                  }))}
                  style={pickerSelectStyles}
                />
              )}
            </View>
          )}
          {stores.length > 0 && (
            <View style={styles.dropdownContainer}>
              {Platform.OS === 'web' ? (
                <select
                  value={selectedStore || ''}
                  onChange={(e) => setSelectedStore(e.target.value || null)}
                  style={{
                    padding: 12,
                    borderRadius: radius.md,
                    borderColor: colors.border,
                    borderWidth: 1,
                    marginBottom: 10,
                    width: '100%',
                    backgroundColor: colors.surface,
                    color: colors.text,
                    fontFamily: typography.fontAr,
                  }}
                >
                  <option value="">فلترة حسب المتجر</option>
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <RNPickerSelect
                  onValueChange={(value) => setSelectedStore(value)}
                  placeholder={{ label: 'فلترة حسب المتجر', value: null }}
                  value={selectedStore}
                  items={stores.map((s) => ({
                    label: s.name,
                    value: s._id,
                  }))}
                  style={pickerSelectStyles}
                />
              )}
            </View>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : users.length === 0 ? (
        <EmptyState title="لا يوجد مستخدمون" subtitle="لا يوجد مستخدمون يطابقون الفلاتر الحالية." />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserCard}
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
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginBottom: space.lg,
    justifyContent: 'center',
  },
  dropdownContainer: {
    width: '45%',
    minWidth: 200,
    maxWidth: 320,
  },
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
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasAlt,
  },
  avatarInitial: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeLg,
    color: colors.brandDeep,
  },
  name: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeMd,
    color: colors.text,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  meta: {
    ...textStyles.label,
    marginTop: space.sm,
    textAlign: 'center',
  },
  storeText: {
    ...textStyles.subtitle,
    fontSize: typography.sizeSm,
    marginTop: space.xs,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.md,
    width: '100%',
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: 90,
    paddingHorizontal: space.md,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
};
