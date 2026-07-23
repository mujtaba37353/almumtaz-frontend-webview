import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from '../api/axiosInstance';
import { useRouter } from 'expo-router';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  colors,
  space,
  typography,
} from '../../components/ui';

export default function ProfileScreen() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm({
          username: res.data.name || '',
          email: res.data.email || '',
          password: '',
        });
        setUploadedUrl(res.data.profileImage || null);
      } catch (err) {
        Alert.alert('خطأ', 'فشل تحميل الملف الشخصي');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
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

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      let profileImage = uploadedUrl;

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const file = new File([blob], 'avatar.jpg', { type: blob.type });

        const formData = new FormData();
        formData.append('image', file);

        const uploadBase = (axios.defaults.baseURL || '').replace(/\/$/, '');
        const uploadRes = await fetch(`${uploadBase}/upload/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          console.error('❌ رفع الصورة فشل:', errText);
          throw new Error('فشل رفع الصورة');
        }

        const data = await uploadRes.json();
        profileImage = data.imageUrl;
      }

      const updateData: any = {
        username: form.username,
        email: form.email,
        profileImage,
      };

      if (form.password.trim()) {
        updateData.password = form.password;
      }

      console.log('📝 بيانات التحديث:', updateData);

      const res = await axios.patch('/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user));

        setUploadedUrl(res.data.user.profileImage || null);
        setImageUri(null);

        Alert.alert('تم', 'تم تحديث الملف الشخصي بنجاح');
        router.replace('/admin/main');
      } else {
        throw new Error('لم يتم استلام بيانات المستخدم بعد التحديث');
      }
    } catch (err: any) {
      console.error('❌ update error:', err?.response?.data || err.message);
      Alert.alert('خطأ', err?.message || 'فشل تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  const fullImageUri = uploadedUrl
    ? `${axios.defaults.baseURL?.replace('/api', '')}${uploadedUrl}`
    : null;

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader title="الملف الشخصي" subtitle="تحديث بيانات الحساب والصورة" />

      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: space.xl }} />
      )}

      {!loading && (
        <Surface>
          <Pressable onPress={pickImage} style={styles.avatarWrap}>
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : fullImageUri
                    ? { uri: fullImageUri }
                    : require('../../assets/images/logo.png')
              }
              style={styles.avatar}
            />
            <Text style={styles.changePhoto}>تغيير الصورة</Text>
          </Pressable>

          <TextField
            label="الاسم"
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
          />
          <TextField
            label="البريد الإلكتروني"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="كلمة المرور الجديدة"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
            placeholder="اتركه فارغاً للإبقاء على الحالية"
          />
          <Button title="حفظ التعديلات" onPress={handleUpdate} />
        </Surface>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.lg,
  },
  backText: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeMd,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: space.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: space.sm,
    backgroundColor: colors.canvasAlt,
  },
  changePhoto: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeSm,
  },
});
