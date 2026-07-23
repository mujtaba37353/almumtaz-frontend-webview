import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  EmptyState,
  colors,
  space,
  typography,
} from '../../components/ui';

export default function ManageSessionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [discount, setDiscount] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [vatScheme, setVatScheme] = useState<'inclusive' | 'exclusive' | 'none'>('exclusive');
  const [vatRate, setVatRate] = useState(15);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [showAddProductPrompt, setShowAddProductPrompt] = useState(false);
  const [lastScannedSku, setLastScannedSku] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');

  const barcodeInputRef = useRef<TextInputType>(null);

  useEffect(() => {
    const fetchData = async () => {
      const t = await AsyncStorage.getItem('token');
      if (!t) return;
      setToken(t);

      try {
        const res = await axios.get(`/sessions/${id}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setSession(res.data);

        const prods = await axios.post(
          '/products/by-store',
          {
            store: res.data.store._id,
          },
          {
            headers: { Authorization: `Bearer ${t}` },
          }
        );
        setProducts(prods.data);

        try {
          const acc = await axios.get('/accounts/me/current', {
            headers: { Authorization: `Bearer ${t}` },
          });
          if (acc.data?.vatScheme) setVatScheme(acc.data.vatScheme);
          if (acc.data?.vatRate != null) setVatRate(acc.data.vatRate);
        } catch {
          /* optional */
        }

        try {
          const cust = await axios.get('/customers', {
            headers: { Authorization: `Bearer ${t}` },
          });
          setCustomers(cust.data || []);
        } catch {
          /* optional */
        }
      } catch (err) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart((prev) => [...prev, { ...product, quantity: 1 }]);
    }

    setShowAddProductPrompt(false);
    setLastScannedSku('');
    setScannedBarcode('');
    barcodeInputRef.current?.clear();
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((item) => (item._id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  const handleBarcodeInput = (sku: string) => {
    const cleaned = sku.trim().replace(/[^\w\-]/g, '');
    if (!cleaned || cleaned === lastScannedSku) return;

    setLastScannedSku(cleaned);

    const foundProduct = products.find(
      (p) => p.sku === cleaned || (Array.isArray(p.barcodes) && p.barcodes.includes(cleaned))
    );

    if (foundProduct) {
      addToCart(foundProduct);
    } else {
      searchProductBySku(cleaned);
    }
  };

  const searchProductBySku = async (sku: string) => {
    try {
      setLastScannedSku(sku);
      const res = await axios.get(`/products/check-sku?sku=${sku}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.exists) {
        addToCart(res.data.product);
      } else {
        setShowAddProductPrompt(true);
      }
    } catch (err) {
      console.error('SKU Scan Error:', err);
    }
  };

  const handleCloseSession = async () => {
    try {
      const res = await axios.patch(
        `/sessions/close/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSession(res.data.session);

      router.replace('/admin/sales');
    } catch (err) {
      console.error('❌ فشل إغلاق الجلسة:', err);
    }
  };

  const handleCreateSale = async () => {
    if (!session?.isOpen) {
      Toast.show({ type: 'error', text1: 'الجلسة مغلقة' });
      return;
    }
    if (cart.length === 0) {
      Toast.show({ type: 'error', text1: 'السلة فارغة' });
      return;
    }

    const productsSold = cart.map((item) => ({
      product: item._id,
      quantity: item.quantity,
      priceAtSale: item.price,
    }));

    if (paymentType === 'credit' && !customerId) {
      Toast.show({ type: 'error', text1: 'اختر عميلاً للبيع الآجل' });
      return;
    }

    const payload = {
      store: session.store._id,
      session: session._id,
      productsSold,
      clientName,
      clientPhone,
      clientEmail,
      customer: customerId || undefined,
      discount: parseFloat(discount) || 0,
      vatType: vatScheme,
      paymentType,
    };

    try {
      const { data } = await axios.post('/sales', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: 'success',
        text1: 'تم إنشاء البيع بنجاح',
        text2: data?.invoice?.invoiceNumber ? `فاتورة ${data.invoice.invoiceNumber}` : undefined,
        visibilityTime: 2000,
      });

      if (data?.invoice) setLastInvoice(data.invoice);
      resetSaleForm();
      const prods = await axios.post(
        '/products/by-store',
        {
          store: session.store._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(prods.data);
    } catch (err: any) {
      console.error('❌ فشل إنشاء عملية البيع:', err);
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || 'فشل إنشاء عملية البيع',
        visibilityTime: 2500,
      });
    }
  };

  const resetSaleForm = () => {
    setCart([]);
    setDiscount('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setLastScannedSku('');
    setScannedBarcode('');
    setShowAddProductPrompt(false);

    barcodeInputRef.current?.clear();
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountValue = parseFloat(discount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountValue);
  const rate = vatRate / 100;
  let taxPreview = 0;
  let totalPreview = afterDiscount;
  if (vatScheme === 'exclusive') {
    taxPreview = Math.round(afterDiscount * rate * 100) / 100;
    totalPreview = Math.round((afterDiscount + taxPreview) * 100) / 100;
  } else if (vatScheme === 'inclusive') {
    taxPreview = Math.round((afterDiscount - afterDiscount / (1 + rate)) * 100) / 100;
    totalPreview = afterDiscount;
  }

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <EmptyState title="لم يتم العثور على الجلسة" />
      </Screen>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <View style={styles.productsPanel}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>عودة</Text>
        </Pressable>

        <PageHeader
          title={session.store?.name || 'نقطة البيع'}
          subtitle={new Date(session.startTime).toLocaleString()}
          right={
            <Text style={styles.balance}>
              الرصيد: {session.openingBalance.toFixed(2)} ر.س
            </Text>
          }
        />

        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={3}
          renderItem={({ item }) => (
            <Surface style={styles.productCard} padded={false}>
              <View style={styles.productInner}>
                <Image
                  source={
                    item.image
                      ? { uri: axios.defaults.baseURL?.replace('/api', '') + item.image }
                      : require('../../assets/images/logo.png')
                  }
                  style={styles.productImage}
                />
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>{item.price} ر.س</Text>
                <Button title="إضافة" onPress={() => addToCart(item)} style={styles.addBtn} />
              </View>
            </Surface>
          )}
          contentContainerStyle={styles.productGrid}
          columnWrapperStyle={{ gap: space.md }}
        />
      </View>

      <View style={styles.cartPanel}>
        <Text style={styles.cartTitle}>سلة المبيعات</Text>

        <Text style={styles.panelLabel}>العميل</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerRow}>
          <Pressable
            style={[styles.chip, !customerId && styles.chipActive]}
            onPress={() => setCustomerId('')}
          >
            <Text style={[styles.chipText, !customerId && styles.chipTextActive]}>نقدي/زائر</Text>
          </Pressable>
          {customers.map((c) => (
            <Pressable
              key={c._id}
              style={[styles.chip, customerId === c._id && styles.chipActive]}
              onPress={() => {
                setCustomerId(c._id);
                setClientName(c.name || '');
                setClientPhone(c.phone || '');
              }}
            >
              <Text style={[styles.chipText, customerId === c._id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <TextField
          placeholder="اسم العميل"
          value={clientName}
          onChangeText={setClientName}
          containerStyle={styles.compactField}
        />
        <TextField
          placeholder="رقم العميل"
          value={clientPhone}
          onChangeText={setClientPhone}
          containerStyle={styles.compactField}
        />
        <TextField
          placeholder="البريد الإلكتروني"
          value={clientEmail}
          onChangeText={setClientEmail}
          containerStyle={styles.compactField}
        />

        <FlatList
          data={cart}
          keyExtractor={(item) => item._id}
          style={styles.cartList}
          ListEmptyComponent={<Text style={styles.emptyCart}>السلة فارغة</Text>}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.cartItemText}>
                {item.name} — {(item.price * item.quantity).toFixed(2)} ر.س
              </Text>
              <View style={styles.cartActions}>
                <Pressable onPress={() => updateQuantity(item._id, item.quantity - 1)} style={styles.qtyHit}>
                  <Text style={styles.qtyBtn}>−</Text>
                </Pressable>
                <Text style={styles.cartQty}>{item.quantity}</Text>
                <Pressable onPress={() => updateQuantity(item._id, item.quantity + 1)} style={styles.qtyHit}>
                  <Text style={styles.qtyBtn}>+</Text>
                </Pressable>
                <Pressable onPress={() => removeFromCart(item._id)} style={styles.qtyHit}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          )}
        />

        {showAddProductPrompt && (
          <View style={styles.promptContainer}>
            <Button
              title="المنتج غير موجود — اضغط لإضافته"
              variant="secondary"
              onPress={() => router.push(`/admin/create-product?sku=${lastScannedSku}`)}
            />
            <Button
              title="إلغاء"
              variant="ghost"
              onPress={() => {
                setShowAddProductPrompt(false);
                setLastScannedSku('');
                setScannedBarcode('');
                barcodeInputRef.current?.clear();
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
              }}
              style={{ marginTop: space.sm }}
            />
          </View>
        )}

        <TextInput
          ref={barcodeInputRef}
          placeholder="Scan SKU here"
          onSubmitEditing={(e) => handleBarcodeInput(e.nativeEvent.text)}
          style={styles.hiddenScan}
          autoCapitalize="none"
          keyboardType="default"
          autoFocus
          blurOnSubmit={false}
          importantForAutofill="no"
          autoCorrect={false}
          spellCheck={false}
        />

        <TextField
          placeholder="إضافة خصم"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="numeric"
          containerStyle={styles.compactField}
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>المجموع: {subtotal.toFixed(2)} ر.س</Text>
          <Text style={styles.summaryText}>الخصم: {discountValue.toFixed(2)} ر.س</Text>
          <Text style={styles.summaryText}>
            الضريبة ({vatRate}% / {vatScheme}): {taxPreview.toFixed(2)} ر.س
          </Text>
          <Text style={styles.totalText}>الإجمالي: {totalPreview.toFixed(2)} ر.س</Text>
        </View>

        {lastInvoice ? (
          <Button
            title={`عرض الفاتورة ${lastInvoice.invoiceNumber}`}
            variant="secondary"
            onPress={() => router.push(`/admin/invoice/${lastInvoice._id}`)}
            style={{ marginBottom: space.md }}
          />
        ) : null}

        <Text style={styles.panelLabel}>طريقة الدفع</Text>
        <View style={styles.paymentOptions}>
          {(['cash', 'card', 'credit'] as const).map((type) => {
            const active = paymentType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setPaymentType(type)}
                style={[styles.payChip, active && styles.payChipActive]}
              >
                <Text style={[styles.payChipText, active && styles.payChipTextActive]}>
                  {type === 'cash' ? 'نقدي' : type === 'card' ? 'بطاقة' : 'آجل'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actionsRow}>
          <Button title="إلغاء" variant="ghost" onPress={resetSaleForm} style={{ flex: 1 }} />
          <Button title="إتمام البيع" onPress={handleCreateSale} style={{ flex: 1 }} />
        </View>

        {session.isOpen && (
          <Button
            title="إغلاق الجلسة"
            variant="danger"
            onPress={handleCloseSession}
            style={{ marginTop: space.md }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.canvas,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsPanel: {
    flex: 3,
    padding: space.xl,
  },
  cartPanel: {
    flex: 1.25,
    padding: space.lg,
    backgroundColor: colors.brandDeep,
    borderLeftWidth: 1,
    borderLeftColor: colors.brandDark,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  backText: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeMd,
  },
  balance: {
    fontFamily: typography.fontSansMd,
    fontSize: typography.sizeSm,
    color: colors.brandDeep,
  },
  productGrid: {
    gap: space.md,
    paddingBottom: space.xxl,
  },
  productCard: {
    flex: 1,
    maxWidth: '32%',
    marginBottom: space.md,
    overflow: 'hidden',
  },
  productInner: {
    padding: space.md,
    alignItems: 'center',
  },
  productImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginBottom: space.sm,
  },
  productName: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeSm,
    color: colors.text,
    marginBottom: space.xs,
    textAlign: 'center',
  },
  productPrice: {
    fontFamily: typography.fontSansMd,
    fontSize: typography.sizeSm,
    color: colors.brandDeep,
    marginBottom: space.sm,
  },
  addBtn: {
    minHeight: 40,
    paddingHorizontal: space.md,
    alignSelf: 'stretch',
  },
  cartTitle: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeLg,
    color: colors.textOnBrand,
    marginBottom: space.md,
  },
  panelLabel: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeSm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: space.sm,
  },
  customerRow: {
    marginBottom: space.md,
    maxHeight: 44,
  },
  chip: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginRight: space.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
  chipText: {
    fontFamily: typography.fontAr,
    color: colors.textOnBrand,
    fontSize: typography.sizeSm,
  },
  chipTextActive: {
    color: colors.text,
    fontFamily: typography.fontArMd,
  },
  compactField: {
    marginBottom: space.sm,
  },
  cartList: {
    maxHeight: 180,
    marginBottom: space.sm,
  },
  emptyCart: {
    fontFamily: typography.fontAr,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingVertical: space.md,
  },
  cartItem: {
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: 10,
    marginBottom: space.sm,
  },
  cartItemText: {
    fontFamily: typography.fontArMd,
    color: colors.text,
    marginBottom: space.sm,
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  qtyHit: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  qtyBtn: {
    fontSize: 20,
    color: colors.brandDeep,
    fontFamily: typography.fontSansBold,
  },
  cartQty: {
    fontFamily: typography.fontSansMd,
    fontSize: typography.sizeMd,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  promptContainer: {
    marginVertical: space.md,
  },
  hiddenScan: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.md,
  },
  summaryText: {
    fontFamily: typography.fontAr,
    color: colors.textOnBrand,
    fontSize: typography.sizeSm,
    marginBottom: 4,
  },
  totalText: {
    fontFamily: typography.fontArBold,
    color: colors.textOnBrand,
    fontSize: typography.sizeMd,
    marginTop: space.xs,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.lg,
  },
  payChip: {
    flex: 1,
    paddingVertical: space.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
  },
  payChipActive: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
  payChipText: {
    fontFamily: typography.fontArMd,
    color: colors.textOnBrand,
    fontSize: typography.sizeSm,
  },
  payChipTextActive: {
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: space.md,
  },
});
