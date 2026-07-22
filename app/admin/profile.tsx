// app/admin/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import mime from 'mime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from '../api/axiosInstance';
import { useRouter } from 'expo-router';

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
      setImageUri(null); // لإعادة ضبط اختيار الصورة


      Alert.alert('تم', 'تم تحديث الملف الشخصي بنجاح');
      router.replace('/admin/main'); // ← تأكد من تعديل المسار حسب المطلوب
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








  const fullImageUri = uploadedUrl ? `${axios.defaults.baseURL?.replace('/api', '')}${uploadedUrl}` : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      <Text style={styles.title}>الملف الشخصي</Text>

      {loading && <ActivityIndicator size="large" color="#812732" style={{ marginVertical: 20 }} />}

      {!loading && (
        <>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={imageUri ? { uri: imageUri } : fullImageUri ? { uri: fullImageUri } : require('../../assets/images/logo.png')}
              style={styles.avatar}
            />
            <Text style={styles.changePhoto}>تغيير الصورة</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="الاسم"
            style={styles.input}
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
          />

          <TextInput
            placeholder="البريد الإلكتروني"
            style={styles.input}
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />

          <TextInput
            placeholder="كلمة المرور الجديدة"
            style={styles.input}
            secureTextEntry
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
          />

          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>حفظ التعديلات</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#812732',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    color: '#812732',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: '#ccc',
  },
  changePhoto: {
    color: '#c23a8c',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#c23a8c',
    paddingVertical: 12,
    borderRadius: 8,
    width: '60%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});