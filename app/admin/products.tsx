import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Image, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import RNPickerSelect from 'react-native-picker-select';

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userRole = profileRes.data.role;
      setRole(userRole);

      const [productsRes, storesRes] = await Promise.all([
        axios.get('/products', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/stores', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setProducts(productsRes.data.data);
      setStores(storesRes.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = selectedStore
    ? products.filter((p) => p.store === selectedStore)
    : products;

  const handleDelete = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('تم الحذف', 'تم حذف المنتج بنجاح');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('خطأ', 'فشل حذف المنتج');
    }
  };

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
          source={imageUrl ? { uri: imageUrl } : require('../../assets/images/logo.png')}
          style={styles.image}
        />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>💵 {item.price} SAR</Text>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={16} color="#000" />
          <Text style={styles.locationText}>Riyadh, Saudi Arabia 🌤️ 30°</Text>
        </View>
        <Text style={styles.dateText}>📅 {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      {['AccountOwner', 'GeneralAccountant', 'StoreAdmin', 'StoreAccountant'].includes(role || '') && (
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/admin/create-product')}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addText}>Add Product</Text>
        </TouchableOpacity>
      )}

      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Filter by Store</Text>
        {Platform.OS === 'web' ? (
          <select
            value={selectedStore || ''}
            onChange={(e) => setSelectedStore(e.target.value || null)}
            style={{
              padding: 10,
              borderRadius: 8,
              borderColor: '#ccc',
              borderWidth: 1,
              marginBottom: 10,
              width: '100%',
              backgroundColor: '#fff'
            }}
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.name}
              </option>
            ))}
          </select>
        ) : (
          <RNPickerSelect
            onValueChange={(value) => setSelectedStore(value)}
            placeholder={{ label: 'All Stores', value: null }}
            value={selectedStore}
            items={stores.map((store) => ({
              label: store.name,
              value: store._id
            }))}
            style={pickerSelectStyles}
          />
        )}
      </View>

      {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => router.push('/admin/copy-products')}
        >
          <Ionicons name="copy" size={18} color="#fff" />
          <Text style={styles.copyText}>Copy Products</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={4}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 4, fontSize: 14, color: '#333' },
  dateText: { fontSize: 14, color: '#333' },
  logo: { width: 320, height: 120, alignSelf: 'center', marginVertical: 10 },
  addButton: {
    backgroundColor: '#cc4da0', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8,
    alignSelf: 'flex-end', marginBottom: 10,
  },
  addText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  copyButton: {
    backgroundColor: '#812732', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8,
    alignSelf: 'flex-end', marginBottom: 10,
  },
  copyText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  dropdownContainer: { marginBottom: 10, width: '60%', alignSelf: 'center' },
  label: { fontSize: 14, color: '#333', marginBottom: 4 },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: '#32a8c4', padding: 12, borderRadius: 10,
    width: '23%', marginBottom: 16, alignItems: 'center',
  },
  image: { width: 80, height: 80, borderRadius: 8, marginBottom: 6 },
  name: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 4, textAlign: 'center' },
  detail: { fontSize: 13, color: '#fff', marginBottom: 4 },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    color: '#333', paddingRight: 30, backgroundColor: '#fff', marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    color: '#333', paddingRight: 30, backgroundColor: '#fff', marginBottom: 10,
  },
};
