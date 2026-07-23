import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../api/axiosInstance';
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
} from '../../../components/ui';

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

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], 'product.jpg', { type: blob.type });
        const formData = new FormData();
        formData.append('image', file);

        const uploadRes = await fetch(
          `${axios.defaults.baseURL?.replace('/api', '')}/api/upload/product`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        const data = await uploadRes.json();
        updatedImage = data.imageUrl;
      }

      const cleanSpecifications = specifications
        .filter((spec) => spec.name && spec.name.trim() !== '')
        .map((spec) => ({
          name: spec.name,
          price: spec.price ? Number(spec.price) : undefined,
        }));

      await axios.put(
        `/products/${id}`,
        {
          ...product,
          image: updatedImage,
          specifications: cleanSpecifications,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('تم', 'تم حفظ التعديلات');
      router.replace('/admin/products');
    } catch (err) {
      console.error('خطأ في الحفظ:', err);
      Alert.alert('خطأ', 'فشل حفظ التعديلات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <Text style={styles.backText}>تعذر تحميل المنتج</Text>
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

      <PageHeader title="تعديل المنتج" subtitle={product.name} />

      <Surface>
        <Pressable onPress={pickImage} style={styles.imageBlock}>
          <Image
            source={
              imageUri
                ? { uri: imageUri }
                : product.image
                  ? { uri: `${axios.defaults.baseURL?.replace('/api', '')}${product.image}` }
                  : require('../../../assets/images/logo.png')
            }
            style={styles.image}
          />
          <Text style={styles.changeImage}>تغيير الصورة</Text>
        </Pressable>

        <TextField
          label="الاسم"
          placeholder="الاسم"
          value={String(product.name ?? '')}
          onChangeText={(val) => setProduct({ ...product, name: val })}
        />
        <TextField
          label="الوصف"
          placeholder="الوصف"
          value={String(product.description ?? '')}
          onChangeText={(val) => setProduct({ ...product, description: val })}
        />
        <TextField
          label="السعر"
          placeholder="السعر"
          value={String(product.price ?? '')}
          onChangeText={(val) => setProduct({ ...product, price: val })}
          keyboardType="numeric"
        />
        <TextField
          label="الكمية"
          placeholder="الكمية"
          value={String(product.quantity ?? '')}
          onChangeText={(val) => setProduct({ ...product, quantity: val })}
          keyboardType="numeric"
        />
        <TextField
          label="التصنيف"
          placeholder="التصنيف"
          value={String(product.category ?? '')}
          onChangeText={(val) => setProduct({ ...product, category: val })}
        />
        <TextField
          label="SKU"
          placeholder="SKU"
          value={String(product.sku ?? '')}
          onChangeText={(val) => setProduct({ ...product, sku: val })}
        />

        <Text style={styles.sectionLabel}>المواصفات</Text>
        {specifications.map((spec, index) => (
          <View key={index} style={styles.specBox}>
            <TextField
              label="اسم المواصفة"
              placeholder="اسم المواصفة"
              value={String(spec.name ?? '')}
              onChangeText={(val) => handleSpecChange(index, 'name', val)}
            />
            <TextField
              label="سعر إضافي"
              placeholder="سعر إضافي"
              value={String(spec.price ?? '')}
              keyboardType="numeric"
              onChangeText={(val) => handleSpecChange(index, 'price', val)}
            />
          </View>
        ))}

        <Button title="إضافة مواصفة" variant="secondary" onPress={handleAddSpec} />
        <Button title="حفظ" onPress={handleSave} style={{ marginTop: space.md }} />
        <Button title="حذف" variant="danger" onPress={handleDelete} style={{ marginTop: space.md }} />
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
  sectionLabel: {
    ...textStyles.label,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  specBox: {
    backgroundColor: colors.canvasAlt,
    borderRadius: 12,
    padding: space.md,
    marginBottom: space.md,
  },
});
