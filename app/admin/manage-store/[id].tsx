import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function EditStoreScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    location: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);

  const fetchStore = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({
        name: res.data.name,
        location: res.data.location || '',
        status: res.data.status || 'active',
      });
    } catch (err) {
      Alert.alert('خطأ', 'فشل تحميل بيانات المتجر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStore();
  }, [id]);

  const handleUpdateStore = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`/stores/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('تم', 'تم تحديث المتجر بنجاح');
      router.replace('/admin/stores');
    } catch (err) {
      console.error('❌ Update store error:', err);
      Alert.alert('خطأ', 'فشل تحديث بيانات المتجر');
    }
  };

  const handleDeleteStore = async () => {
    Alert.alert('تأكيد', 'هل أنت متأكد أنك تريد حذف هذا المتجر؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`/stores/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('تم', 'تم حذف المتجر بنجاح');
            router.replace('/admin/stores');
          } catch (err) {
            console.error('❌ Delete store error:', err);
            Alert.alert('خطأ', 'فشل حذف المتجر');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      <Text style={styles.title}>Edit Store</Text>

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

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Active Status</Text>
        <Switch
          value={form.status === 'active'}
          onValueChange={(val) => setForm({ ...form, status: val ? 'active' : 'inactive' })}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdateStore} disabled={loading}>
        <Text style={styles.saveText}>{loading ? 'Saving...' : 'Update Store'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteStore}>
        <Text style={styles.deleteText}>🗑️ Delete Store</Text>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
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
  deleteButton: {
    backgroundColor: '#812732',
    paddingVertical: 12,
    borderRadius: 8,
    width: '60%',
    marginTop: 12,
  },
  deleteText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});