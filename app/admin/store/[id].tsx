// ✅ نسخة محسنة من صفحة المتجر: عرض المنتجات بشكل كروت (6 في الصف) + دعم التصفح والفلترة بأزرار واضحة

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  Image, FlatList, TextInput, Platform
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
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const PRODUCTS_PER_PAGE = 18;

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const [storeRes, usersRes, productsRes] = await Promise.all([
        axios.get(`/stores/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/products?limit=10000`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setStore(storeRes.data);

      const relatedUsers = usersRes.data.filter((u: any) => {
        const storeId = typeof u.store === 'object' ? u.store?._id : u.store;
        return storeId?.toString() === id?.toString();
      });

      const relatedProducts = productsRes.data.data.filter((p: any) => {
        return p.store?.toString?.() === id?.toString();
      });

      setUsers(relatedUsers);
      setProducts(relatedProducts);
      setFilteredProducts(relatedProducts);
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = products.filter(p => p.name?.toLowerCase().includes(lowerSearch));
    setFilteredProducts(filtered);
    setPage(1);
  }, [searchTerm, products]);

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const renderProduct = ({ item }: any) => {
    const imageUrl = item.image?.startsWith('/')
      ? `${axios.defaults.baseURL?.replace('/api', '')}${item.image}`
      : item.image;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/admin/manage-product/${item._id}`)}
      >
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../../assets/images/logo.png')}
          style={styles.image}
        />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>💵 {item.price} SAR</Text>
      </TouchableOpacity>
    );
  };

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

      <Text style={styles.sectionTitle}>Users in this Store</Text>
      {users.length > 0 ? users.map((user) => (
        <View key={user._id} style={styles.userBox}>
          <Text style={styles.itemText}>👤 {user.name} ({user.role})</Text>
          <TouchableOpacity onPress={() => router.push(`/admin/user-info/${user._id}`)}>
            <Text style={styles.viewButton}>عرض التفاصيل</Text>
          </TouchableOpacity>
        </View>
      )) : (
        <Text style={styles.emptyText}>No users found.</Text>
      )}

      <TextInput
        placeholder="بحث عن منتج..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.searchInput}
      />

      <Text style={styles.sectionTitle}>Products in this Store</Text>
      {paginatedProducts.length > 0 ? (
        <FlatList
          data={paginatedProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={6}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      ) : (
        <Text style={styles.emptyText}>No products found.</Text>
      )}

      {filteredProducts.length > PRODUCTS_PER_PAGE && (
        <View style={styles.pagination}>
          <TouchableOpacity disabled={page === 1} onPress={() => setPage(page - 1)}>
            <Text style={[styles.pageButton, page === 1 && styles.disabledButton]}>⬅ السابق</Text>
          </TouchableOpacity>
          <Text style={styles.pageText}>الصفحة {page} من {totalPages}</Text>
          <TouchableOpacity disabled={page === totalPages} onPress={() => setPage(page + 1)}>
            <Text style={[styles.pageButton, page === totalPages && styles.disabledButton]}>التالي ➡</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backButton: { alignSelf: 'flex-start' },
  backText: { color: '#812732', marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#812732', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#333', marginBottom: 6, textAlign: 'center' },
  sectionTitle: { marginTop: 24, fontSize: 18, fontWeight: 'bold', color: '#c23a8c', marginBottom: 12, textAlign: 'center' },
  itemText: { fontSize: 15, color: '#444', marginBottom: 4, textAlign: 'center' },
  emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center' },
  viewButton: { color: '#32a8c4', fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  userBox: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  productBox: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginVertical: 16 },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: '#32a8c4', padding: 10, borderRadius: 10,
    width: '15.5%', marginBottom: 12, alignItems: 'center'
  },
  image: { width: 70, height: 70, borderRadius: 8, marginBottom: 4 },
  name: { fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 2, textAlign: 'center' },
  detail: { fontSize: 12, color: '#fff', marginBottom: 2 },
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 16,
  },
  pageButton: { color: '#812732', fontWeight: 'bold', fontSize: 16 },
  disabledButton: { color: '#ccc' },
  pageText: { fontSize: 16, color: '#333' },
});
