import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import axios from '../../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  EmptyState,
  colors,
  space,
  typography,
  textStyles,
} from '../../../components/ui';

export default function ManageUserScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', role: '', store: '', image: null as string | null });
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);

          if (parsed.role === 'AppOwner') {
            setRoleOptions(['AppAdmin']);
          } else if (parsed.role === 'AccountOwner') {
            setRoleOptions(['GeneralAccountant', 'StoreAdmin', 'StoreAccountant', 'Cashier']);
          } else if (parsed.role === 'GeneralAccountant') {
            setRoleOptions(['StoreAdmin', 'StoreAccountant', 'Cashier']);
          } else if (parsed.role === 'StoreAdmin') {
            setRoleOptions(['StoreAccountant', 'Cashier']);
          }

          if (['AccountOwner', 'GeneralAccountant'].includes(parsed.role)) {
            const storesRes = await axios.get('/stores', {
              headers: { Authorization: `Bearer ${token}` },
            });
            setStores(storesRes.data);
          }
        }

        const res = await axios.get(`/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        setForm({
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          store: typeof res.data.store === 'object' ? res.data.store._id : res.data.store,
          image: res.data.profileImage
            ? `${axios.defaults.baseURL?.replace('/api', '')}${res.data.profileImage}`
            : null,
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        Alert.alert('Error', 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedData: any = {
        name: form.name,
        email: form.email,
        role: form.role,
      };

      if (currentUser.role === 'StoreAdmin') {
        updatedData.store = currentUser.store;
      }

      await axios.put(`/users/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(form.role) && form.store) {
        await axios.patch(
          `/users/${id}/assign-store`,
          {
            storeId: form.store,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      Alert.alert('تم التحديث بنجاح');
      router.back();
    } catch (err: any) {
      console.error('❌ Update error:', err.response?.data || err.message);
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحديث المستخدم');
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Deleted', 'User has been removed');
      router.replace('/admin/users');
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  const isSelf = currentUser?._id?.toString() === user?._id?.toString();

  let sameStore = false;
  if (user?.store && currentUser?.store) {
    const userStoreId =
      typeof user.store === 'object' ? user.store._id?.toString?.() : user.store?.toString?.();

    const currentStoreId = currentUser.store?.toString?.();

    sameStore = userStoreId === currentStoreId;
  }

  const canEdit = (() => {
    if (!currentUser || !user) return false;

    const currentRole = currentUser.role;
    const targetRole = user.role;

    if (isSelf) return true;
    if (currentRole === 'AppOwner' && targetRole === 'AppAdmin') return true;
    if (currentRole === 'AccountOwner' && currentUser.account === user.account) return true;
    if (
      currentRole === 'GeneralAccountant' &&
      currentUser.account === user.account &&
      targetRole !== 'AccountOwner'
    )
      return true;
    if (
      currentRole === 'StoreAdmin' &&
      sameStore &&
      ['StoreAccountant', 'Cashier'].includes(targetRole)
    )
      return true;

    return false;
  })();

  const canDelete = (() => {
    if (!currentUser || !user) return false;

    const currentRole = currentUser.role;
    const targetRole = user.role;

    if (isSelf) return true;
    if (currentRole === 'AppOwner' && targetRole === 'AppAdmin') return true;
    if (currentRole === 'AccountOwner' && currentUser.account === user.account) return true;
    if (
      currentRole === 'GeneralAccountant' &&
      currentUser.account === user.account &&
      targetRole !== 'AccountOwner'
    )
      return true;

    return false;
  })();

  const isStoreRole = ['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(form.role);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <EmptyState title="User not found" />
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

      <PageHeader title="إدارة المستخدم" subtitle={form.email} />

      <Surface>
        {form.image ? <Image source={{ uri: form.image }} style={styles.avatar} /> : null}

        <TextField
          label="الاسم"
          placeholder="Name"
          value={form.name}
          editable={canEdit}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />

        <TextField
          label="البريد الإلكتروني"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          editable={canEdit}
          onChangeText={(val) => setForm({ ...form, email: val })}
        />

        {canEdit && (
          <>
            <Pressable onPress={() => setShowRoleOptions(!showRoleOptions)} style={styles.dropdownToggle}>
              <Text style={styles.dropdownText}>الدور: {form.role}</Text>
            </Pressable>

            {showRoleOptions && (
              <View style={styles.dropdown}>
                {roleOptions.map((role) => (
                  <Pressable
                    key={role}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setForm({ ...form, role, store: currentUser.store });
                      setShowRoleOptions(false);
                    }}
                  >
                    <Text style={styles.optionText}>{role}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        {canEdit && isStoreRole && currentUser.role !== 'StoreAdmin' && (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>اختر المتجر</Text>
            {stores.map((store) => {
              const selected = form.store === store._id;
              return (
                <Pressable
                  key={store._id}
                  onPress={() => setForm({ ...form, store: store._id })}
                  style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                >
                  <Text style={styles.optionText}>{store.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {canEdit && <Button title="حفظ التغييرات" onPress={handleUpdate} />}
        {canDelete && (
          <Button title="حذف المستخدم" variant="danger" onPress={handleDelete} style={{ marginTop: space.md }} />
        )}
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: space.lg,
    alignSelf: 'center',
    backgroundColor: colors.border,
  },
  label: {
    ...textStyles.label,
    marginBottom: space.sm,
  },
  fieldBlock: {
    marginBottom: space.lg,
  },
  dropdownToggle: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.md,
    backgroundColor: colors.canvasAlt,
  },
  dropdownText: {
    ...textStyles.body,
    textAlign: 'center',
    fontFamily: typography.fontArMd,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: space.lg,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(42, 155, 176, 0.1)',
  },
  optionText: {
    ...textStyles.body,
  },
});
