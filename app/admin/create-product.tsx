import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Platform
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from '../api/axiosInstance';

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
        setForm(prev => ({ ...prev, store: res.data.store }));
      }
    }
  };

  fetchStoresAndRole();

  // ✅ إضافة SKU من رابط الصفحة
  if (sku && typeof sku === 'string') {
    setForm(prev => ({ ...prev, sku }));
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
        barcodes: form.barcodes.split(',').map(b => b.trim()).filter(b => b),
        image: uploadedImage,
        specifications: specifications
          .filter(s => s.name && s.name.trim() !== '')
          .map(s => ({
            name: s.name,
            price: s.price ? Number(s.price) : undefined
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
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUri ? { uri: imageUri } : require('../../assets/images/logo.png')}
          style={styles.image}
        />
        <Text style={styles.changeImage}>📸 اختر صورة المنتج</Text>
      </TouchableOpacity>

      {[
        { placeholder: 'الاسم', key: 'name' },
        { placeholder: 'السعر', key: 'price', keyboardType: 'numeric' },
        { placeholder: 'الكمية', key: 'quantity', keyboardType: 'numeric' },
        { placeholder: 'الوصف', key: 'description' },
        { placeholder: 'التصنيف', key: 'category' },
        { placeholder: 'SKU', key: 'sku' },
        { placeholder: 'الباركود (مفصولة بفاصلة)', key: 'barcodes' },
      ].map(({ placeholder, key, keyboardType }) => (
        <TextInput
          key={key}
          placeholder={placeholder}
          value={form[key as keyof typeof form]}
          onChangeText={(val) => setForm({ ...form, [key]: val })}
          style={styles.input}
          keyboardType={keyboardType}
        />
      ))}

      {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
        <View style={styles.input}>
          {Platform.OS === 'web' ? (
            <select
              value={form.store}
              onChange={(e) => setForm(prev => ({ ...prev, store: e.target.value }))}
              style={{ padding: 10, width: '100%' }}
            >
              <option value="">اختر المتجر</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>{store.name}</option>
              ))}
            </select>
          ) : (
            stores.map((store) => (
              <TouchableOpacity
                key={store._id}
                onPress={() => setForm(prev => ({ ...prev, store: store._id }))}
              >
                <Text style={{ padding: 8 }}>{store.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <Text style={styles.label}>المواصفات (اختياري):</Text>
      {specifications.map((spec, idx) => (
        <View key={idx} style={styles.specBox}>
          <TextInput
            placeholder="اسم المواصفة"
            value={spec.name}
            onChangeText={(val) => handleSpecChange(idx, 'name', val)}
            style={styles.input}
          />
          <TextInput
            placeholder="سعر إضافي"
            value={spec.price}
            keyboardType="numeric"
            onChangeText={(val) => handleSpecChange(idx, 'price', val)}
            style={styles.input}
          />
        </View>
      ))}
      <TouchableOpacity onPress={handleAddSpecification} style={styles.addSpecButton}>
        <Text style={styles.addSpecText}>➕ إضافة مواصفة</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
        <Text style={styles.saveText}>حفظ المنتج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 10,
  },
  changeImage: {
    color: '#c23a8c',
    textAlign: 'center',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#812732',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  saveText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  specBox: {
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 6,
  },
  addSpecButton: {
    backgroundColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addSpecText: {
    color: '#333',
  },
});
