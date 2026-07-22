import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import RNPickerSelect from 'react-native-picker-select';
import { useRouter } from 'expo-router';

export default function CopyProductsScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [sourceStore, setSourceStore] = useState<string | null>(null);
  const [targetStore, setTargetStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStores = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userRole = profileRes.data.role;
      setRole(userRole);

      if (!['AccountOwner', 'GeneralAccountant'].includes(userRole)) {
        Alert.alert('غير مصرح', 'ليس لديك صلاحية الوصول لهذه الصفحة');
        router.replace('/admin/products');
        return;
      }

      const storesRes = await axios.get('/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStores(storesRes.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
      Alert.alert('خطأ', 'فشل تحميل المتاجر');
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCopy = async () => {
    if (!sourceStore || !targetStore) {
      Alert.alert('تنبيه', 'يرجى اختيار المتجرين');
      return;
    }

    if (sourceStore === targetStore) {
      Alert.alert('خطأ', 'المتجر المصدر والهدف لا يمكن أن يكونا نفس المتجر');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        '/products/copy',
        { sourceStoreId: sourceStore, targetStoreId: targetStore },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('تم', res.data.message || 'تم نسخ المنتجات بنجاح');
      router.back();
    } catch (err: any) {
      console.error('Copy error:', err);
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل نسخ المنتجات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#812732" />
      </TouchableOpacity>
      <Text style={styles.title}>نسخ المنتجات من متجر إلى آخر</Text>

      <Text style={styles.label}>المتجر المصدر</Text>
      <RNPickerSelect
        onValueChange={(value) => setSourceStore(value)}
        placeholder={{ label: 'اختر المتجر المصدر', value: null }}
        value={sourceStore}
        items={stores.map((store) => ({
          label: store.name,
          value: store._id,
        }))}
        style={pickerSelectStyles}
      />

      <Text style={styles.label}>المتجر الهدف</Text>
      <RNPickerSelect
        onValueChange={(value) => setTargetStore(value)}
        placeholder={{ label: 'اختر المتجر الهدف', value: null }}
        value={targetStore}
        items={stores.map((store) => ({
          label: store.name,
          value: store._id,
        }))}
        style={pickerSelectStyles}
      />

      <TouchableOpacity style={styles.copyButton} onPress={handleCopy} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="copy" size={18} color="#fff" />
            <Text style={styles.copyText}>Copy Products</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#812732',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  copyButton: {
    backgroundColor: '#812732',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 30,
  },
  copyText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
};
