import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';

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

  // للأدوار العليا فقط يجب التأكد من اختيار متجر
  if (['AccountOwner', 'GeneralAccountant'].includes(role) && !storeId) {
    setErrorMessage('يرجى اختيار المتجر');
    return;
  }

  try {
    const payload: any = {
      openingBalance: Number(openingBalance),
    };

    // فقط الأدوار العليا تحتاج تمرير المتجر يدويًا
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
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#C63F8F" />
        <Text style={styles.backText}>عودة</Text>
      </TouchableOpacity>

      {errorMessage !== '' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <Text style={styles.title}>إنشاء جلسة جديدة</Text>

      {/* اختيار المتجر */}
      {['AccountOwner', 'GeneralAccountant'].includes(role) ? (
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>اختر المتجر:</Text>
          {Platform.OS === 'web' ? (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              style={styles.webSelect}
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
        <Text style={styles.storeText}>
          🛒 متجر مرتبط: {stores[0]?.name || 'لا يوجد'}
        </Text>


      )}

      {/* الرصيد الافتتاحي */}
      <Text style={styles.label}>الرصيد الافتتاحي:</Text>
      <TextInput
        style={styles.input}
        placeholder="أدخل الرصيد"
        value={openingBalance}
        onChangeText={setOpeningBalance}
        keyboardType="numeric"
      />

      <TouchableOpacity onPress={handleCreateSession} style={styles.button}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>إنشاء الجلسة</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 6, color: '#444' },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    padding: 10, borderRadius: 8, marginBottom: 20,
  },
  errorText: {
    color: 'red',
    backgroundColor: '#ffe5e5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dropdownContainer: { marginBottom: 16 },
  webSelect: {
    padding: 10, borderRadius: 8, borderWidth: 1,
    borderColor: '#ccc', width: '100%', marginBottom: 10,
  },
  storeText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#C63F8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backText: {
    marginLeft: 6,
    color: '#C63F8F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
};
