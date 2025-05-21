import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';

export default function CreateUserScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    selectedRole: '',
  });

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    const loadUserRole = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);

      if (storedRole === 'AppOwner' || storedRole === 'AppAdmin') {
        setAvailableRoles(['AppAdmin', 'AccountOwner']);
        fetchSubscriptions();
      } else if (storedRole === 'AccountOwner') {
        setAvailableRoles(['GeneralAccountant', 'StoreAdmin', 'StoreAccountant', 'Cashier']);
        fetchStores();
      } else if (storedRole === 'GeneralAccountant') {
        setAvailableRoles(['StoreAdmin', 'StoreAccountant', 'Cashier']);
        fetchStores();
      } else if (storedRole === 'StoreAdmin') {
        setAvailableRoles(['StoreAccountant', 'Cashier']);
        fetchStores();
      }
    };

    const fetchSubscriptions = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('/subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubscriptions(res.data);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      }
    };

    const fetchStores = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('/stores', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStores(res.data);
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };

    loadUserRole();
    console.log('🧪 limitError:', limitError);
  }, [limitError]);

  const handleCreateUser = async () => {
    const { name, email, password, selectedRole } = form;

    if (!name || !email || !password || !selectedRole) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول');
      return;
    }

    if (selectedRole === 'AccountOwner' && !selectedSubscriptionId) {
      Alert.alert('تنبيه', 'يرجى اختيار اشتراك لهذا الحساب');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload: any = {
        name,
        email,
        password,
        role: selectedRole,
      };

      if (selectedRole === 'AccountOwner') {
        payload.subscription = selectedSubscriptionId;
      }

      if (['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(selectedRole)) {
        payload.store = selectedStoreId || null;
      }

      await axios.post('/users', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('تم', 'تم إنشاء المستخدم بنجاح');
      router.replace('/admin/users');
    } catch (error: any) {
      console.error('❌ createUser error:', error);

      // نحاول التقاط الرسالة من أكثر من مكان
      let raw =
        error?.response?.data?.error || // ← هنا الرسالة الفعلية
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'فشل إنشاء المستخدم';

      if (typeof raw !== 'string') raw = JSON.stringify(raw);

      const isLimitError = raw.includes('تجاوز الحد الأقصى');

      if (isLimitError) {
        setLimitError(
          'لقد تم تجاوز عدد المستخدمين المسموح بهم في الاشتراك الحالي، نرجو ترقية الباقة أو التواصل مع الدعم الفني.'
        );
      } else {
        Alert.alert('خطأ', raw);
      }
    }

  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      <Text style={styles.title}>Create New User</Text>

      {limitError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{limitError}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={form.name}
        onChangeText={(val) => setForm({ ...form, name: val })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(val) => setForm({ ...form, email: val })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(val) => setForm({ ...form, password: val })}
      />

      <Text style={styles.label}>Select Role</Text>
      {availableRoles.map((r) => (
        <TouchableOpacity
          key={r}
          style={[styles.roleButton, form.selectedRole === r && styles.selectedRole]}
          onPress={() => {
            setForm({ ...form, selectedRole: r });
            setSelectedStoreId(null);
            setSelectedSubscriptionId(null);
            setLimitError(null); // إعادة تعيين الخطأ عند اختيار دور جديد
          }}
        >
          <Text style={styles.roleText}>{r}</Text>
        </TouchableOpacity>
      ))}

      {form.selectedRole === 'AccountOwner' && (
        <>
          <Text style={styles.label}>Select Subscription</Text>
          {subscriptions.map((sub) => (
            <TouchableOpacity
              key={sub._id}
              style={[styles.roleButton, selectedSubscriptionId === sub._id && styles.selectedRole]}
              onPress={() => setSelectedSubscriptionId(sub._id)}
            >
              <Text style={styles.roleText}>{sub.name} ({sub.type})</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(form.selectedRole) && (
        <>
          <Text style={styles.label}>Select Store</Text>
          {stores.map((store) => (
            <TouchableOpacity
              key={store._id}
              style={[styles.roleButton, selectedStoreId === store._id && styles.selectedRole]}
              onPress={() => setSelectedStoreId(store._id)}
            >
              <Text style={styles.roleText}>{store.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleCreateUser}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#32a8c4',
    borderRadius: 8,
    width: '40%',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    paddingLeft: 20,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '40%',
  },
  selectedRole: {
    backgroundColor: '#32a8c4',
  },
  roleText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#32a8c4',
    padding: 12,
    borderRadius: 8,
    width: '40%',
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#cc4da0',
    padding: 12,
    borderRadius: 8,
    width: '40%',
    marginTop: 12,
  },
  cancelText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  errorBox: {
    backgroundColor: '#ffe0e0',
    borderColor: '#cc0000',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '80%',
  },
  errorText: {
    color: '#cc0000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
