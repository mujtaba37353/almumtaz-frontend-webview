import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function StoreDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const [storeRes, usersRes, productsRes] = await Promise.all([
        axios.get(`/stores/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/products`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setStore(storeRes.data);
      setUsers(usersRes.data.filter((u: any) => u.store?._id === id));
      setProducts(productsRes.data.data.filter((p: any) => p.store === id));
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#812732" style={{ marginTop: 50 }} />;
  }

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text>Store not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>⬅️ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>
      <Text style={styles.title}>{store.name}</Text>
      {store.location && <Text style={styles.subtitle}>📍 {store.location}</Text>}
      <Text style={styles.subtitle}>🔧 Status: {store.status === 'active' ? '🟢 Active' : '🔴 Inactive'}</Text>

      <Text style={styles.sectionTitle}>Users</Text>
      {users.length > 0 ? users.map((user) => (
        <Text key={user._id} style={styles.itemText}>👤 {user.name} ({user.role})</Text>
      )) : <Text style={styles.emptyText}>No users found.</Text>}

      <Text style={styles.sectionTitle}>Products</Text>
      {products.length > 0 ? products.map((product) => (
        <Text key={product._id} style={styles.itemText}>🍽️ {product.name} - {product.price} SAR</Text>
      )) : <Text style={styles.emptyText}>No products found.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#812732',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#812732',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c23a8c',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
});