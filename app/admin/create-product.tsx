import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from '../api/axiosInstance';
import {
  Screen,
  Surface,
  TextField,
  Button,
  PageHeader,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

export default function CreateProductScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    price: '',
    quantity: '',
    description: '',
    category: '',
    sku: '',
    barcodes: '',
    store: '',
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [specifications, setSpecifications] = useState<any[]>([]);

  const { sku } = useLocalSearchParams();

  useEffect(() => {
    const fetchStoresAndRole = async () => {
      const token = await AsyncStorage.getItem('token');
      const roleVal = await AsyncStorage.getItem('role');
      setRole(roleVal);

      if (['AccountOwner', 'GeneralAccountant'].includes(roleVal || '')) {
        const res = await axios.get('/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(res.data);
      } else if (['StoreAdmin', 'StoreAccountant'].includes(roleVal || '')) {
        const res = await axios.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.store) {
          setForm((prev) => ({ ...prev, store: res.data.store }));
        }
      }
    };

    fetchStoresAndRole();

    if (sku && typeof sku === 'string') {
      setForm((prev) => ({ ...prev, sku }));
    }
  }, [sku]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddSpecification = () => {
    setSpecifications([...specifications, { name: '', price: '' }]);
  };

  const handleSpecChange = (index: number, field: string, value: string) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const handleSubmit = async () => {
    try {
      const { name, price, store } = form;
      if (!name || !price || !store) {
        Alert.alert('الرجاء تعبئة الاسم، السعر، والمتجر');
        return;
      }

      let uploadedImage = '';
      if (imageUri) {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const file = new File([blob], 'product.jpg', { type: blob.type });
        const formData = new FormData();
        formData.append('image', file);

        const uploadBase = (axios.defaults.baseURL || '').replace(/\/$/, '');
        const uploadRes = await fetch(`${uploadBase}/upload/product`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          console.error('❌ رفع الصورة فشل:', errText);
          throw new Error('فشل رفع الصورة');
        }

        const uploadData = await uploadRes.json();
        uploadedImage = uploadData.imageUrl;
      }

      const token = await AsyncStorage.getItem('token');
      const payload = {
        ...form,
        price: parseFloat(form.price),
        quantity: form.quantity ? parseInt(form.quantity) : undefined,
        barcodes: form.barcodes
          .split(',')
          .map((b) => b.trim())
          .filter((b) => b),
        image: uploadedImage,
        specifications: specifications
          .filter((s) => s.name && s.name.trim() !== '')
          .map((s) => ({
            name: s.name,
            price: s.price ? Number(s.price) : undefined,
          })),
      };

      await axios.post('/products', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('تم', 'تم إنشاء المنتج بنجاح');
      router.back();
    } catch (err) {
      console.error('❌ إضافة المنتج فشلت:', err);
      Alert.alert('خطأ', 'فشل إنشاء المنتج');
    }
  };

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader title="إنشاء منتج" subtitle="أدخل بيانات المنتج والمواصفات" />

      <Surface>
        <Pressable onPress={pickImage} style={styles.imageBlock}>
          <Image
            source={imageUri ? { uri: imageUri } : require('../../assets/images/logo.png')}
            style={styles.image}
          />
          <Text style={styles.changeImage}>اختر صورة المنتج</Text>
        </Pressable>

        <TextField
          label="الاسم"
          placeholder="الاسم"
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />
        <TextField
          label="السعر"
          placeholder="السعر"
          value={form.price}
          onChangeText={(val) => setForm({ ...form, price: val })}
          keyboardType="numeric"
        />
        <TextField
          label="الكمية"
          placeholder="الكمية"
          value={form.quantity}
          onChangeText={(val) => setForm({ ...form, quantity: val })}
          keyboardType="numeric"
        />
        <TextField
          label="الوصف"
          placeholder="الوصف"
          value={form.description}
          onChangeText={(val) => setForm({ ...form, description: val })}
        />
        <TextField
          label="التصنيف"
          placeholder="التصنيف"
          value={form.category}
          onChangeText={(val) => setForm({ ...form, category: val })}
        />
        <TextField
          label="SKU"
          placeholder="SKU"
          value={form.sku}
          onChangeText={(val) => setForm({ ...form, sku: val })}
        />
        <TextField
          label="الباركود"
          placeholder="مفصولة بفاصلة"
          value={form.barcodes}
          onChangeText={(val) => setForm({ ...form, barcodes: val })}
        />

        {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>المتجر</Text>
            {Platform.OS === 'web' ? (
              <select
                value={form.store}
                onChange={(e) => setForm((prev) => ({ ...prev, store: e.target.value }))}
                style={styles.webSelect as any}
              >
                <option value="">اختر المتجر</option>
                {stores.map((store) => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))}
              </select>
            ) : (
              stores.map((store) => {
                const selected = form.store === store._id;
                return (
                  <Pressable
                    key={store._id}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => setForm((prev) => ({ ...prev, store: store._id }))}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {store.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        <Text style={styles.sectionLabel}>المواصفات (اختياري)</Text>
        {specifications.map((spec, idx) => (
          <View key={idx} style={styles.specBox}>
            <TextField
              label="اسم المواصفة"
              placeholder="اسم المواصفة"
              value={spec.name}
              onChangeText={(val) => handleSpecChange(idx, 'name', val)}
            />
            <TextField
              label="سعر إضافي"
              placeholder="سعر إضافي"
              value={spec.price}
              keyboardType="numeric"
              onChangeText={(val) => handleSpecChange(idx, 'price', val)}
            />
          </View>
        ))}
        <Button title="إضافة مواصفة" variant="secondary" onPress={handleAddSpecification} />
        <Button title="حفظ المنتج" onPress={handleSubmit} style={{ marginTop: space.md }} />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
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
  imageBlock: {
    alignItems: 'center',
    marginBottom: space.lg,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: space.sm,
  },
  changeImage: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeSm,
  },
  label: {
    ...textStyles.label,
    marginBottom: space.xs,
  },
  sectionLabel: {
    ...textStyles.label,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  fieldBlock: {
    marginBottom: space.lg,
  },
  webSelect: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.sm,
  },
  optionSelected: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(42, 155, 176, 0.1)',
  },
  optionText: {
    ...textStyles.body,
  },
  optionTextSelected: {
    color: colors.brandDeep,
    fontFamily: typography.fontArMd,
  },
  specBox: {
    backgroundColor: colors.canvasAlt,
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.md,
  },
});
