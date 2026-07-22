import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, FlatList, Image, ToastAndroid, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import type { TextInput as TextInputType } from 'react-native';


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

        const prods = await axios.post('/products/by-store', {
          store: res.data.store._id
        }, {
          headers: { Authorization: `Bearer ${t}` },
        });
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

  // ✅ إعادة تهيئة حالة إضافة منتج جديد
  setShowAddProductPrompt(false);
  setLastScannedSku('');
  setScannedBarcode('');
  barcodeInputRef.current?.clear();
  setTimeout(() => barcodeInputRef.current?.focus(), 100);
};



  const updateQuantity = (productId: string, newQty: number) => {
  if (newQty < 1) return;
  setCart((prev) =>
    prev.map((item) =>
      item._id === productId ? { ...item, quantity: newQty } : item
    )
  );
};

// ✅ دالة حذف منتج من السلة
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
    const res = await axios.patch(`/sessions/close/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSession(res.data.session);

    // ✅ إعادة التوجيه إلى صفحة المبيعات
    router.replace('/admin/sales');
  } catch (err) {
    console.error('❌ فشل إغلاق الجلسة:', err);
  }
};


// ✅ عملية البيع
const handleCreateSale = async () => {
  if (!session?.isOpen) {
    Toast.show({ type: 'error', text1: 'الجلسة مغلقة' });
    return;
  }
  if (cart.length === 0) {
    Toast.show({ type: 'error', text1: 'السلة فارغة' });
    return;
  }

  const productsSold = cart.map(item => ({
    product: item._id,
    quantity: item.quantity,
    priceAtSale: item.price,
  }));

  const payload = {
    store: session.store._id,
    session: session._id,
    productsSold,
    clientName,
    clientPhone,
    clientEmail,
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
    // refresh product stock
    const prods = await axios.post('/products/by-store', {
      store: session.store._id
    }, { headers: { Authorization: `Bearer ${token}` } });
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

// ✅ دالة إعادة تعيين الحقول بعد البيع أو الإلغاء
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
    return <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />;
  }

  if (!session) {
    return <Text style={{ textAlign: 'center', marginTop: 40 }}>لم يتم العثور على الجلسة</Text>;
  }
  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.productsPanel}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#C63F8F" />
            <Text style={styles.backText}>عودة</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>{new Date(session.startTime).toLocaleString()}</Text>
          <Text style={styles.headerText}>🛒 {session.store?.name || '---'}</Text>
          <Text style={styles.balance}>Opening Balance: {session.openingBalance.toFixed(2)} SAR</Text>
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image
                source={item.image ? { uri: axios.defaults.baseURL?.replace('/api', '') + item.image } : require('../../assets/images/logo.png')}
                style={styles.productImage}
              />
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price} SAR</Text>
              <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item)}>
                <Text style={styles.addToCartText}>Add To Cart</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.productGrid}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      </View>

      <View style={styles.cartPanel}>
        <Text style={styles.cartTitle}>🛍️ سلة المبيعات</Text>
        <TextInput placeholder="اسم العميل" value={clientName} onChangeText={setClientName} style={styles.input} />
        <TextInput placeholder="رقم العميل" value={clientPhone} onChangeText={setClientPhone} style={styles.input} />
        <TextInput placeholder="البريد الإلكتروني للعميل" value={clientEmail} onChangeText={setClientEmail} style={styles.input} />

        <FlatList
          data={cart}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.cartItemText}>{item.name} - {(item.price * item.quantity).toFixed(2)} SAR</Text>
              <View style={styles.cartActions}>
                <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)}>
                  <Text style={styles.qtyBtn}>➖</Text>
                </TouchableOpacity>
                <Text style={styles.cartQty}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)}>
                  <Text style={styles.qtyBtn}>➕</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {showAddProductPrompt && (
          <View style={styles.promptContainer}>
            <TouchableOpacity
              onPress={() => router.push(`/admin/create-product?sku=${lastScannedSku}`)}
              style={styles.addProductButtonLarge}
            >
              <Text style={styles.addProductTextLarge}>📦 المنتج غير موجود — اضغط لإضافته</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAddProductPrompt(false);
                setLastScannedSku('');
                setScannedBarcode('');
                barcodeInputRef.current?.clear();
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
              }}
              style={styles.cancelPromptButton}
            >
              <Text style={styles.cancelPromptText}>❌ إلغاء</Text>
            </TouchableOpacity>
          </View>
        )}



        <TextInput
          ref={barcodeInputRef}
          placeholder="Scan SKU here"
          onSubmitEditing={(e) => handleBarcodeInput(e.nativeEvent.text)}
          style={{ height: 0, width: 0 }}
          autoCapitalize="none"
          keyboardType="default"
          autoFocus
          blurOnSubmit={false}
          importantForAutofill="no"
          autoCorrect={false}
          spellCheck={false}
        />




        <TextInput
          placeholder="إضافة خصم"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.summaryText}>المجموع: {subtotal.toFixed(2)} ر.س</Text>
        <Text style={styles.summaryText}>الخصم: {discountValue.toFixed(2)} ر.س</Text>
        <Text style={styles.summaryText}>
          الضريبة ({vatRate}% / {vatScheme}): {taxPreview.toFixed(2)} ر.س
        </Text>
        <Text style={styles.summaryText}>الإجمالي: {totalPreview.toFixed(2)} ر.س</Text>

        {lastInvoice ? (
          <TouchableOpacity
            style={{ backgroundColor: '#fff', padding: 10, borderRadius: 8, marginVertical: 8 }}
            onPress={() => router.push(`/admin/invoice/${lastInvoice._id}`)}
          >
            <Text style={{ color: '#c23a8c', fontWeight: 'bold', textAlign: 'center' }}>
              عرض الفاتورة {lastInvoice.invoiceNumber}
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.paymentLabel}>طريقة الدفع:</Text>
        <View style={styles.paymentOptions}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
            {(['cash', 'card', 'credit'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setPaymentType(type)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: '#fff',
                    marginRight: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: paymentType === type ? '#fff' : 'transparent',
                  }}
                >
                  {paymentType === type && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#50b3c9',
                      }}
                    />
                  )}
                </View>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {type === 'cash' ? 'نقدي' : type === 'card' ? 'بطاقة' : 'آجل'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.proceedButton} onPress={handleCreateSale}>
            <Text style={styles.proceedText}>Proceed</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={resetSaleForm}
          style={{
            backgroundColor: '#888',
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>❌ إلغاء البيع</Text>
        </TouchableOpacity>

        {session.isOpen && (
          <TouchableOpacity onPress={handleCloseSession} style={styles.closeButton}>
            <Ionicons name="lock-closed" size={18} color="#fff" />
            <Text style={styles.closeText}>إغلاق الجلسة</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  productsPanel: { flex: 3, padding: 16 },
  cartPanel: { flex: 1.2, padding: 16, backgroundColor: '#3AA6B9' },
  header: { alignItems: 'center', marginBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 10 },
  backText: { marginLeft: 6, color: '#C63F8F', fontSize: 16, fontWeight: 'bold' },
  headerText: { fontSize: 14, color: '#444' },
  balance: { marginTop: 6, fontSize: 16, fontWeight: 'bold', color: '#007aff' },
  productGrid: { gap: 16 },
  productCard: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    width: '32%',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  addToCartButton: {
    backgroundColor: '#C63F8F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cartTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  summaryText: { color: '#fff', fontSize: 14, marginBottom: 4 },
  paymentLabel: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginTop: 10 },
  paymentOptions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  radio: { backgroundColor: '#eee', padding: 6, borderRadius: 6 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelButton: { backgroundColor: '#eee', padding: 10, borderRadius: 6 },
  cancelText: { color: '#333', fontWeight: 'bold' },
  proceedButton: { backgroundColor: '#fff', padding: 10, borderRadius: 6 },
  proceedText: { color: '#C63F8F', fontWeight: 'bold' },
  closeButton: {
    backgroundColor: '#C63F8F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartItem: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  cartItemText: {
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyBtn: {
    fontSize: 20,
    color: '#812732',
    paddingHorizontal: 10,
  },
  cartQty: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  deleteBtn: {
    fontSize: 20,
    color: '#c00',
    paddingHorizontal: 10,
  },
  addProductButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginVertical: 10,
    alignItems: 'center',
  },
  addProductText: {
    color: '#C63F8F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  promptContainer: {
  flexDirection: 'column',
  alignItems: 'center',
  marginVertical: 12,
  gap: 8,
},
addProductButtonLarge: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 10,
  alignItems: 'center',
  width: '100%',
  borderColor: '#C63F8F',
  borderWidth: 2,
},
addProductTextLarge: {
  color: '#C63F8F',
  fontWeight: 'bold',
  fontSize: 16,
},
cancelPromptButton: {
  backgroundColor: '#eee',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 6,
},
cancelPromptText: {
  color: '#333',
  fontWeight: 'bold',
  fontSize: 14,
},
});
