import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import RNPickerSelect from 'react-native-picker-select';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  EmptyState,
  colors,
  space,
  radius,
  typography,
  textStyles,
} from '../../components/ui';

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

  const PRODUCTS_PER_PAGE = 36;

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roleVal = profileRes.data.role;
      setRole(roleVal);

      const storeParam = ['AccountOwner', 'GeneralAccountant'].includes(roleVal)
        ? selectedStore
          ? `store=${selectedStore}`
          : ''
        : '';

      const queryParams = [
        `page=${page}`,
        `limit=${PRODUCTS_PER_PAGE}`,
        storeParam,
        searchTerm ? `search=${searchTerm}` : '',
        barcode ? `barcode=${barcode}` : '',
        minPrice ? `minPrice=${minPrice}` : '',
        maxPrice ? `maxPrice=${maxPrice}` : '',
      ]
        .filter(Boolean)
        .join('&');

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
      setStores(storesRes.data);
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
        headers: { Authorization: `Bearer ${token}` },
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
      <Pressable onPress={() => router.push(`/admin/manage-product/${item._id}`)} style={styles.cardWrap}>
        <Surface style={styles.card}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
            </View>
          )}
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.detail}>{item.price} ر.س</Text>
          <Pressable onPress={() => handleDelete(item._id)} hitSlop={8} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </Surface>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <PageHeader
        title="المنتجات"
        subtitle="بحث وإدارة كتالوج المنتجات"
        right={
          <View style={styles.headerActions}>
            {['AccountOwner', 'GeneralAccountant', 'StoreAdmin', 'StoreAccountant'].includes(role || '') && (
              <Button title="إضافة منتج" onPress={() => router.push('/admin/create-product')} />
            )}
            {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
              <Button
                title="نسخ المنتجات"
                variant="secondary"
                onPress={() => router.push('/admin/copy-products')}
              />
            )}
          </View>
        }
      />

      <Surface style={styles.filterContainer}>
        <TextField
          placeholder="بحث بالاسم"
          value={searchTerm}
          onChangeText={setSearchTerm}
          containerStyle={styles.fullField}
        />
        <View style={styles.rowInputs}>
          <TextField
            placeholder="باركود"
            value={barcode}
            onChangeText={setBarcode}
            containerStyle={styles.smallField}
          />
          <TextField
            placeholder="أقل سعر"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
            containerStyle={styles.smallField}
          />
          <TextField
            placeholder="أعلى سعر"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
            containerStyle={styles.smallField}
          />
        </View>
        {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
          <View style={styles.pickerWrapper}>
            {Platform.OS === 'web' ? (
              <select
                value={selectedStore || ''}
                onChange={(e) => setSelectedStore(e.target.value || null)}
                style={{
                  padding: '12px 14px',
                  borderRadius: radius.md,
                  border: `1px solid ${colors.border}`,
                  fontSize: 15,
                  width: '100%',
                  backgroundColor: colors.surface,
                  color: colors.text,
                }}
              >
                <option value="">كل المتاجر</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
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
        )}
      </Surface>

      {loading && products.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : products.length === 0 ? (
        <EmptyState title="لا توجد منتجات" subtitle="جرّب تعديل فلاتر البحث" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={6}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? <ActivityIndicator size="large" color={colors.primary} /> : null
          }
        />
      )}

      <View style={styles.paginationContainer}>
        <Button
          title="السابق"
          variant="secondary"
          disabled={page === 1}
          onPress={() => page > 1 && setPage(page - 1)}
        />
        <Text style={styles.pageInfo}>
          الصفحة {page} من {totalPages}
        </Text>
        <Button
          title="التالي"
          variant="secondary"
          disabled={page === totalPages}
          onPress={() => page < totalPages && setPage(page + 1)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    justifyContent: 'flex-end',
  },
  filterContainer: {
    marginBottom: space.lg,
    gap: 0,
  },
  fullField: {
    marginBottom: space.md,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: space.md,
  },
  smallField: {
    flex: 1,
    marginBottom: space.md,
  },
  pickerWrapper: {
    width: '100%',
  },
  list: {
    paddingBottom: space.lg,
  },
  row: {
    justifyContent: 'space-between',
    gap: space.sm,
  },
  cardWrap: {
    width: '15.5%',
    marginBottom: space.md,
  },
  card: {
    alignItems: 'center',
    padding: space.md,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: radius.sm,
    marginBottom: space.sm,
    backgroundColor: colors.canvasAlt,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeSm,
    color: colors.text,
    marginBottom: space.xs,
    textAlign: 'center',
  },
  detail: {
    fontFamily: typography.fontSansMd,
    fontSize: typography.sizeSm,
    color: colors.brandDeep,
    marginBottom: space.xs,
  },
  deleteBtn: {
    marginTop: space.xs,
    padding: space.xs,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space.lg,
    gap: space.lg,
  },
  pageInfo: {
    ...textStyles.body,
    fontFamily: typography.fontArMd,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: colors.surface,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingRight: 30,
    backgroundColor: colors.surface,
  },
};
