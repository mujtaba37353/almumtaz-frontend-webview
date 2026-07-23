import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  TextField,
  PageHeader,
  StatusBadge,
  EmptyState,
  Button,
  colors,
  space,
  typography,
  textStyles,
} from '../../../components/ui';

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
    const filtered = products.filter((p) => p.name?.toLowerCase().includes(lowerSearch));
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
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/admin/manage-product/${item._id}`)}
      >
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../../assets/images/logo.png')}
          style={styles.image}
        />
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.detail}>{item.price} SAR</Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!store) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <EmptyState title="Store not found" />
        <Button title="رجوع" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader
        title={store.name}
        subtitle={store.location || undefined}
        right={<StatusBadge active={store.status === 'active'} />}
      />

      <Text style={styles.sectionTitle}>المستخدمون في هذا المتجر</Text>
      {users.length > 0 ? (
        users.map((user) => (
          <Surface key={user._id} style={styles.userBox}>
            <Text style={styles.itemText}>
              {user.name} ({user.role})
            </Text>
            <Pressable onPress={() => router.push(`/admin/user-info/${user._id}`)}>
              <Text style={styles.viewButton}>عرض التفاصيل</Text>
            </Pressable>
          </Surface>
        ))
      ) : (
        <EmptyState title="لا يوجد مستخدمون" />
      )}

      <TextField
        label="بحث"
        placeholder="بحث عن منتج..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        containerStyle={{ marginTop: space.lg }}
      />

      <Text style={styles.sectionTitle}>منتجات المتجر</Text>
      {paginatedProducts.length > 0 ? (
        <FlatList
          data={paginatedProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ gap: space.md }}
        />
      ) : (
        <EmptyState title="لا توجد منتجات" />
      )}

      {filteredProducts.length > PRODUCTS_PER_PAGE && (
        <View style={styles.pagination}>
          <Pressable disabled={page === 1} onPress={() => setPage(page - 1)}>
            <Text style={[styles.pageButton, page === 1 && styles.disabledButton]}>السابق</Text>
          </Pressable>
          <Text style={styles.pageText}>
            الصفحة {page} من {totalPages}
          </Text>
          <Pressable disabled={page === totalPages} onPress={() => setPage(page + 1)}>
            <Text style={[styles.pageButton, page === totalPages && styles.disabledButton]}>التالي</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xl,
  },
  backText: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeMd,
  },
  sectionTitle: {
    ...textStyles.title,
    fontSize: typography.sizeLg,
    marginTop: space.xl,
    marginBottom: space.md,
  },
  itemText: {
    ...textStyles.body,
  },
  viewButton: {
    fontFamily: typography.fontArMd,
    color: colors.brand,
    marginTop: space.sm,
  },
  userBox: {
    marginBottom: space.md,
  },
  list: {
    paddingBottom: space.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.md,
    alignItems: 'center',
    maxWidth: '32%',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginBottom: space.sm,
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
    fontSize: typography.sizeXs,
    color: colors.brandDeep,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xl,
    marginTop: space.lg,
  },
  pageButton: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeMd,
  },
  disabledButton: {
    color: colors.textMuted,
  },
  pageText: {
    ...textStyles.body,
  },
});
