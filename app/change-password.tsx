import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from './api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleConfirm = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('تنبيه', 'يرجى إدخال كل الحقول');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      const response = await axios.post('/auth/reset-password', {
        email,
        password,
      });

      if (response.status === 200) {
        Alert.alert('تم ✅', 'تم تعيين كلمة المرور بنجاح');
        router.replace('/login');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('خطأ', error?.response?.data?.message || 'فشل في تعيين كلمة المرور');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* زر الرجوع */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      {/* الصورة */}
      <Image
        source={require('../assets/images/change-password.png')}
        style={styles.image}
        resizeMode="contain"
      />

      {/* الحقول */}
      <TextInput
        placeholder="Type New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TextInput
        placeholder="Re-Type New Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
      />

      {/* زر التأكيد */}
      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    marginBottom: 30,
  },
  input: {
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#00aacc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#c23a8c',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
