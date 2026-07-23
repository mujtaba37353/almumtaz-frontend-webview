import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

export default function CreateSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const preselectedStoreId = params.storeId as string;

  const [role, setRole] = useState('');
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState('');
  const [token, setToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      setToken(token);

      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = profileRes.data;
      setRole(user.role);

      if (user.store?._id) {
        setStoreId(user.store._id);
        setStores([user.store]);
      } else if (preselectedStoreId) {
        setStoreId(preselectedStoreId);
      }

      if (['AccountOwner', 'GeneralAccountant'].includes(user.role)) {
        const storesRes = await axios.get('/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(storesRes.data);
      }
    };

    fetchData();
  }, []);

  const handleCreateSession = async () => {
    if (!openingBalance || isNaN(Number(openingBalance))) {
      setErrorMessage('يرجى إدخال رصيد افتتاحي صحيح');
      return;
    }

    if (['AccountOwner', 'GeneralAccountant'].includes(role) && !storeId) {
      setErrorMessage('يرجى اختيار المتجر');
      return;
    }

    try {
      const payload: any = {
        openingBalance: Number(openingBalance),
      };

      if (['AccountOwner', 'GeneralAccountant'].includes(role)) {
        payload.store = storeId;
      }

      const res = await axios.post('/sessions', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const session = res.data;
      setErrorMessage('');
      router.replace(`/manage-session/${session._id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'فشل في إنشاء الجلسة';
      setErrorMessage(message);
    }
  };

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>عودة</Text>
      </Pressable>

      <PageHeader title="إنشاء جلسة جديدة" subtitle="حدد المتجر والرصيد الافتتاحي" />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Surface>
        {['AccountOwner', 'GeneralAccountant'].includes(role) ? (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>اختر المتجر</Text>
            {Platform.OS === 'web' ? (
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                style={styles.webSelect as any}
              >
                <option value="">اختر المتجر</option>
                {stores.map((store) => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setStoreId(value)}
                placeholder={{ label: 'اختر المتجر', value: '' }}
                value={storeId}
                items={stores.map((store) => ({
                  label: store.name,
                  value: store._id,
                }))}
                style={pickerSelectStyles}
              />
            )}
          </View>
        ) : (
          <Text style={styles.storeText}>متجر مرتبط: {stores[0]?.name || 'لا يوجد'}</Text>
        )}

        <TextField
          label="الرصيد الافتتاحي"
          placeholder="أدخل الرصيد"
          value={openingBalance}
          onChangeText={setOpeningBalance}
          keyboardType="numeric"
        />

        <Button title="إنشاء الجلسة" onPress={handleCreateSession} />
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
  label: {
    ...textStyles.label,
    marginBottom: space.xs,
  },
  fieldBlock: {
    marginBottom: space.lg,
  },
  webSelect: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  storeText: {
    ...textStyles.subtitle,
    marginBottom: space.lg,
  },
  errorText: {
    fontFamily: typography.fontArMd,
    color: colors.danger,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
    padding: space.md,
    borderRadius: 12,
    marginBottom: space.lg,
    textAlign: 'center',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 0,
  },
  inputAndroid: {
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 0,
  },
};
