import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function UserInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    };

    if (id) fetchUser();
  }, [id]);

  if (!user) return <Text style={{ textAlign: 'center', marginTop: 30 }}>جاري التحميل...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* زر الرجوع */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>رجوع</Text>
      </TouchableOpacity>

      <Image
        source={
          user.profileImage
            ? { uri: `${axios.defaults.baseURL?.replace('/api', '')}${user.profileImage}` }
            : require('../../../assets/images/logo.png')
        }
        style={styles.avatar}
      />

      <Text style={styles.name}>اسم الموظف:{user.name}</Text>
      <Text style={styles.detail}>📧 البريد الالكتروني: {user.email}</Text>
      <Text style={styles.detail}>🎯 الوظيفة: {user.role}</Text>
      {user.store?.name && (
        <Text style={styles.detail}>🏬 المتجر: {user.store.name}</Text>
        )}
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
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#812732',
    padding: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  backText: {
    color: '#fff',
    marginLeft: 6,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 16,
    marginBottom: 4,
  },
});
