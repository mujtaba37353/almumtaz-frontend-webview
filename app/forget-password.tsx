import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from './api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function ForgetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني');
      return;
    }

    try {
      const response = await axios.post('/auth/forgot-password', { email });

      if (response.status === 200) {
        Alert.alert('تم', 'تم التحقق من البريد الإلكتروني');
        router.push({ pathname: '/change-password', params: { email } });
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('خطأ', error?.response?.data?.message || 'فشل في إرسال الطلب');
    }
  };
  

  return (
    <View style={styles.container}>
      {/* زر الرجوع */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      {/* الصورة */}
      <Image source={require('../assets/images/forget-image.png')} style={styles.image} resizeMode="contain" />

      {/* حقل البريد */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      {/* زر الإرسال */}
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  image: {
    width: '100%',
    height: 220,
    alignSelf: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#00aacc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#c23a8c',
    paddingVertical: 14,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
