import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [freeTrialDays, setFreeTrialDays] = useState('');
  const [allowedUsers, setAllowedUsers] = useState('');
  const [allowedStores, setAllowedStores] = useState('');
  const [allowedProducts, setAllowedProducts] = useState('');

  useEffect(() => {
    const getRole = async () => {
      const savedRole = await AsyncStorage.getItem('role');
      setRole(savedRole);
    };
    getRole();
  }, []);

  const handleCreate = async () => {
    if (!name || !monthlyPrice || !yearlyPrice || !allowedUsers || !allowedStores || !allowedProducts) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        '/subscriptions',
        {
          name,
          monthlyPrice: parseFloat(monthlyPrice),
          yearlyPrice: parseFloat(yearlyPrice),
          type,
          freeTrialDays: parseInt(freeTrialDays || '0'),
          allowedUsers: parseInt(allowedUsers),
          allowedStores: parseInt(allowedStores),
          allowedProducts: parseInt(allowedProducts),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('تم', 'تم إنشاء الاشتراك بنجاح');
      router.replace('/admin/subscriptions');
    } catch (err) {
      Alert.alert('خطأ', 'فشل إنشاء الاشتراك');
      console.error(err);
    }
  };

  if (role !== 'AppOwner') {
    return (
      <View style={styles.restricted}>
        <Text style={styles.restrictedText}>ليس لديك صلاحية الوصول إلى هذه الصفحة</Text>
      </View>
    );
  }

  const renderField = (icon: string, placeholder: string, value: string, setValue: (val: string) => void, keyboardType = 'default') => (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon as any} size={20} color="#32a8c4" style={styles.inputIcon} />
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* زر رجوع */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      {/* الشعار */}
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      
        {renderField('reader-outline', 'Name', name, setName)}
        {renderField('pricetag-outline', 'Monthly Price', monthlyPrice, setMonthlyPrice, 'numeric')}
        {renderField('pricetags-outline', 'Yearly Price', yearlyPrice, setYearlyPrice, 'numeric')}
        <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
            نوع الاشتراك: {type === 'public' ? 'عام (Public)' : 'خاص (Private)'}
        </Text>
            <Switch
                value={type === 'public'}
                onValueChange={(val) => setType(val ? 'public' : 'private')}
                thumbColor="#fff"
                trackColor={{ false: '#32a8c4', true: '#ccc' }}
                style={{ transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }] }}
            />
        </View>

        {renderField('time-outline', 'Free Trial Days', freeTrialDays, setFreeTrialDays, 'numeric')}
        {renderField('person-outline', 'Allowed Users', allowedUsers, setAllowedUsers, 'numeric')}
        {renderField('storefront-outline', 'Allowed Stores', allowedStores, setAllowedStores, 'numeric')}
        {renderField('cube-outline', 'Allowed Products', allowedProducts, setAllowedProducts, 'numeric')}

      {/* أزرار الحفظ */}
      <TouchableOpacity style={styles.saveButton} onPress={handleCreate}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.inactiveButton}>
        <Text style={styles.inactiveText}>Inactivate</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 120,
    marginVertical: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#32a8c4',
    borderWidth: 1,
    borderRadius: 8,
    width: '40%',
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  switchRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '40%',
  marginTop: 12,
  marginBottom: 20,
  paddingHorizontal: 10,
},
switchLabel: {
  fontSize: 18,
  color: '#333',
},
  saveButton: {
    backgroundColor: '#32a8c4',
    paddingVertical: 12,
    width: '40%',
    borderRadius: 8,
    marginTop: 20,
  },
  saveText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inactiveButton: {
    backgroundColor: '#cc4da0',
    paddingVertical: 12,
    width: '40%',
    borderRadius: 8,
    marginTop: 12,
  },
  inactiveText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  restricted: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restrictedText: {
    fontSize: 16,
    color: '#812732',
    fontWeight: 'bold',
  },
});
