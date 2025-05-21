import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function CreateStoreScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    location: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);

  const handleCreateStore = async () => {
    if (!form.name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المتجر');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post('/stores', form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('تم', 'تم إنشاء المتجر بنجاح');
      router.replace('/admin/stores');
    } catch (err: any) {
      console.error('❌ Store creation error:', err);
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إنشاء المتجر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      <Text style={styles.title}>Create New Store</Text>

      <TextInput
        style={styles.input}
        placeholder="Store Name"
        value={form.name}
        onChangeText={(val) => setForm({ ...form, name: val })}
      />

      <TextInput
        style={styles.input}
        placeholder="Location (optional)"
        value={form.location}
        onChangeText={(val) => setForm({ ...form, location: val })}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleCreateStore} disabled={loading}>
        <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save Store'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c23a8c',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '80%',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#c23a8c',
    paddingVertical: 12,
    borderRadius: 8,
    width: '60%',
    marginTop: 10,
  },
  saveText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});