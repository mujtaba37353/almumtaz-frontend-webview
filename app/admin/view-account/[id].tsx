import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

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
    return <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />;
  }

  if (!account) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Account not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      <Image source={require('../../../assets/images/logo.png')} style={styles.avatar} />

      <Text style={styles.item}>👤 {account.name}</Text>
      <Text style={styles.item}>📧 {account.owner?.email}</Text>
      <Text style={styles.item}>📦 {account.subscription?.name || 'No subscription name'}</Text>
      <Text style={styles.item}>
        {account.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
      </Text>

      {role === 'AccountOwner' && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/admin/edit-account/${account._id}`)}
        >
          <Text style={styles.buttonText}>Edit Account</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.buttonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 100,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  item: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#32a8c4',
    padding: 12,
    borderRadius: 8,
    width: '40%',
    marginTop: 20,
    alignItems: 'center'
  },
  deleteButton: {
    backgroundColor: '#cc4da0',
    padding: 12,
    borderRadius: 8,
    width: '40%',
    marginTop: 12,
    alignItems: 'center'
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  buttonText: {
    alignItems: 'center'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});
