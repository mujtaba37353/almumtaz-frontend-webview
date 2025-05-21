import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../api/axiosInstance';

export default function ManageProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [specifications, setSpecifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProduct(res.data);
        setSpecifications(res.data.specifications || []);
      } catch (error) {
        console.error('فشل تحميل المنتج:', error);
        Alert.alert('خطأ', 'فشل تحميل بيانات المنتج');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, []);

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

  const handleSpecChange = (index: number, field: string, value: string) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const handleAddSpec = () => {
    setSpecifications([...specifications, { name: '', price: '' }]);
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('تم', 'تم حذف المنتج بنجاح');
      router.replace('/admin/products');
    } catch (err) {
      Alert.alert('خطأ', 'فشل حذف المنتج');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      let updatedImage = product.image;

      // رفع الصورة إن وُجدت
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], 'product.jpg', { type: blob.type });
        const formData = new FormData();
        formData.append('image', file);

        const uploadRes = await fetch(`${axios.defaults.baseURL?.replace('/api', '')}/api/upload/product`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await uploadRes.json();
        updatedImage = data.imageUrl;
      }

      // تصفية وتحويل المواصفات
      const cleanSpecifications = specifications
        .filter(spec => spec.name && spec.name.trim() !== '')
        .map(spec => ({
          name: spec.name,
          price: spec.price ? Number(spec.price) : undefined,
        }));

      await axios.put(`/products/${id}`, {
        ...product,
        image: updatedImage,
        specifications: cleanSpecifications,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('تم', 'تم حفظ التعديلات');
      router.replace('/admin/products');

    } catch (err) {
      console.error('خطأ في الحفظ:', err);
      Alert.alert('خطأ', 'فشل حفظ التعديلات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#812732" style={{ marginTop: 50 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#c23a8c" />
        </TouchableOpacity>
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUri ? { uri: imageUri } : product.image ? { uri: `${axios.defaults.baseURL?.replace('/api', '')}${product.image}` } : require('../../../assets/images/logo.png')}
          style={styles.image}
        />
        <Text style={styles.changeImage}>📸 تغيير الصورة</Text>
      </TouchableOpacity>

      {[
        { label: 'الاسم', key: 'name' },
        { label: 'الوصف', key: 'description' },
        { label: 'السعر', key: 'price' },
        { label: 'الكمية', key: 'quantity' },
        { label: 'التصنيف', key: 'category' },
        { label: 'SKU', key: 'sku' },
      ].map(({ label, key }) => (
        <TextInput
          key={key}
          placeholder={label}
          value={product[key]}
          onChangeText={(val) => setProduct({ ...product, [key]: val })}
          style={styles.input}
        />
      ))}

      <Text style={styles.label}>المواصفات:</Text>
      {specifications.map((spec, index) => (
        <View key={index} style={styles.specBox}>
          <TextInput
            placeholder="اسم المواصفة"
            value={spec.name}
            onChangeText={(val) => handleSpecChange(index, 'name', val)}
            style={styles.input}
          />
          <TextInput
            placeholder="سعر إضافي"
            value={spec.price}
            keyboardType="numeric"
            onChangeText={(val) => handleSpecChange(index, 'price', val)}
            style={styles.input}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addSpecButton} onPress={handleAddSpec}>
        <Text style={styles.addSpecText}>➕ إضافة مواصفة</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>💾 حفظ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>🗑️ حذف</Text>
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
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 10,
  },
  changeImage: {
    textAlign: 'center',
    color: '#c23a8c',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  specBox: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  addSpecButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addSpecText: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#32a8c4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  saveText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#cc4da0',
    padding: 12,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
