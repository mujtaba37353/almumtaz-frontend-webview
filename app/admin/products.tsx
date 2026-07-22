// ✅ نسخة محسنة من admin/products.tsx: دعم التصفح (pagination) + فلترة متقدمة + عرض 6 كروت في الصف و6 صفوف بالصفحة + أزرار تنقل + زر إضافة منتج للأدوار المصرح بها

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Image, Alert, Platform, TextInput
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
  const [role, setRole] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PRODUCTS_PER_PAGE = 36; // 6 كروت * 6 صفوف

  const fetchData = async () => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');

    const profileRes = await axios.get('/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const roleVal = profileRes.data.role;
    setRole(roleVal);

    // ✅ تمرير store فقط إذا كان AccountOwner أو GeneralAccountant
    const storeParam = ['AccountOwner', 'GeneralAccountant'].includes(roleVal)
      ? (selectedStore ? `store=${selectedStore}` : '')
      : '';

    const queryParams = [
      `page=${page}`,
      `limit=${PRODUCTS_PER_PAGE}`,
      storeParam,
      searchTerm ? `search=${searchTerm}` : '',
      barcode ? `barcode=${barcode}` : '',
      minPrice ? `minPrice=${minPrice}` : '',
      maxPrice ? `maxPrice=${maxPrice}` : '',
    ].filter(Boolean).join('&');

    // ✅ جلب المتاجر فقط إذا كان الدور يسمح بذلك
    let storesRes = { data: [] };
    if (['AccountOwner', 'GeneralAccountant'].includes(roleVal)) {
      storesRes = await axios.get('/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    const productsRes = await axios.get(`/products?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setProducts(productsRes.data.data);
    setTotalPages(productsRes.data.meta.totalPages);
    setStores(storesRes.data); // ستكون [] في الأدوار الأخرى
  } catch (err) {
    console.error('Error fetching products:', err);
    Alert.alert('خطأ', 'فشل تحميل المنتجات');
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchData();
  }, [page, selectedStore, searchTerm, barcode, minPrice, maxPrice]);

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
      <View style={styles.filterContainer}>
        <TextInput placeholder="بحث بالاسم" value={searchTerm} onChangeText={setSearchTerm} style={styles.fullInput} />
        <View style={styles.rowInputs}>
          <TextInput placeholder="باركود" value={barcode} onChangeText={setBarcode} style={styles.smallInput} />
          <TextInput placeholder="أقل سعر" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" style={styles.smallInput} />
          <TextInput placeholder="أعلى سعر" value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" style={styles.smallInput} />
        </View>
        <View style={styles.rowInputs}>
          <View style={styles.pickerWrapper}>
            {Platform.OS === 'web' ? (
              <select
                value={selectedStore || ''}
                onChange={(e) => setSelectedStore(e.target.value || null)}
                style={{
                  padding: '7px 8px',
                  borderRadius: 10,
                  border: '1px solid #ccc',
                  fontSize: 16,
                  width: '100%',
                  backgroundColor: '#fff',
                  marginBottom: 10,
                }}
              >
                <option value="">كل المتاجر</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setSelectedStore(value)}
                placeholder={{ label: 'كل المتاجر', value: null }}
                value={selectedStore}
                items={stores.map((s) => ({ label: s.name, value: s._id }))}
                style={pickerSelectStyles}
              />
            )}
          </View>
        </View>
      </View>

      {['AccountOwner', 'GeneralAccountant', 'StoreAdmin', 'StoreAccountant'].includes(role || '') && (
        <TouchableOpacity
          style={[styles.pageButton, { alignSelf: 'flex-end', marginBottom: 10 }]}
          onPress={() => router.push('/admin/create-product')}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.pageButtonText}>إضافة منتج</Text>
        </TouchableOpacity>
      )}
        {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
          <TouchableOpacity
            style={[styles.pageButton, { alignSelf: 'flex-end', marginBottom: 10, backgroundColor: '#32a8c4' }]}
            onPress={() => router.push('/admin/copy-products')}
          >
            <Ionicons name="copy-outline" size={18} color="#fff" />
            <Text style={styles.pageButtonText}>نسخ المنتجات</Text>
          </TouchableOpacity>
        )}

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        numColumns={6}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#812732" /> : null}
      />

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, page === 1 && styles.disabledButton]}
          onPress={() => page > 1 && setPage(page - 1)}
        >
          <Text style={styles.pageButtonText}>⬅ السابق</Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>الصفحة {page} من {totalPages}</Text>

        <TouchableOpacity
          style={[styles.pageButton, page === totalPages && styles.disabledButton]}
          onPress={() => page < totalPages && setPage(page + 1)}
        >
          <Text style={styles.pageButtonText}>التالي ➡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  filterContainer: { alignSelf: 'center', width: '50%', gap: 10, marginBottom: 10 },
  fullInput: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, width: '100%'
  },
  rowInputs: { flexDirection: 'row', gap: 20 },
  smallInput: {
    flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10
  },
  pickerWrapper: { flex: 1 },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: '#32a8c4', padding: 10, borderRadius: 10,
    width: '15.5%', marginBottom: 12, alignItems: 'center',
  },
  image: { width: 70, height: 70, borderRadius: 8, marginBottom: 4 },
  name: { fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 2, textAlign: 'center' },
  detail: { fontSize: 12, color: '#fff', marginBottom: 2 },
  paginationContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 20, gap: 20
  },
  pageButton: {
    backgroundColor: '#812732', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  pageButtonText: {
    color: '#fff', fontWeight: 'bold'
  },
  pageInfo: {
    fontSize: 16, color: '#333', fontWeight: 'bold'
  }
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
};