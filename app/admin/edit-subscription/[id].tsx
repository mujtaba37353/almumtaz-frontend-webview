import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ScrollView, Image, Switch, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function EditSubscriptionPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [freeTrialDays, setFreeTrialDays] = useState('');
  const [allowedUsers, setAllowedUsers] = useState('');
  const [allowedStores, setAllowedStores] = useState('');
  const [allowedProducts, setAllowedProducts] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const savedRole = await AsyncStorage.getItem('role');
      setRole(savedRole);

      const token = await AsyncStorage.getItem('token');
      try {
        const res = await axios.get(`/subscriptions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const sub = res.data;

        setName(sub.name);
        setMonthlyPrice(sub.monthlyPrice.toString());
        setYearlyPrice(sub.yearlyPrice.toString());
        setType(sub.type);
        setFreeTrialDays(sub.freeTrialDays?.toString() || '0');
        setAllowedUsers(sub.allowedUsers.toString());
        setAllowedStores(sub.allowedStores.toString());
        setAllowedProducts(sub.allowedProducts.toString());
        setActive(sub.active !== false);
      } catch (err) {
        Alert.alert('خطأ', 'فشل تحميل البيانات');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdate = async () => {
    if (!name || !monthlyPrice || !yearlyPrice || !allowedUsers || !allowedStores || !allowedProducts) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    try {
      await axios.put(
        `/subscriptions/${id}`,
        {
          name,
          monthlyPrice: parseFloat(monthlyPrice),
          yearlyPrice: parseFloat(yearlyPrice),
          type,
          freeTrialDays: parseInt(freeTrialDays || '0'),
          allowedUsers: parseInt(allowedUsers),
          allowedStores: parseInt(allowedStores),
          allowedProducts: parseInt(allowedProducts),
          active,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('تم التحديث', 'تم حفظ التعديلات بنجاح');
      router.replace('/admin/subscriptions');
    } catch (err) {
      Alert.alert('خطأ', 'فشل تعديل الاشتراك');
      console.error(err);
    }
  };

  const handleInactivate = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    await axios.put(
      `/subscriptions/${id}`,
      { active: false },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Alert.alert('تم', 'تم إلغاء تفعيل الاشتراك بنجاح');
    router.back();
  } catch (error: any) {
    console.error('Error inactivating subscription:', error);
    Alert.alert('خطأ', error.response?.data?.message || 'فشل إلغاء التفعيل');
  }
};


  const renderField = (icon: string, placeholder: string, value: string, setValue: (v: string) => void, keyboardType = 'default') => (
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

  if (role !== 'AppOwner') {
    return (
      <View style={styles.restricted}>
        <Text style={styles.restrictedText}>ليس لديك صلاحية للوصول إلى هذه الصفحة</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.restricted}>
        <ActivityIndicator size="large" color="#812732" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>

      <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      {renderField('reader-outline', 'Name', name, setName)}
      {renderField('pricetag-outline', 'Monthly Price', monthlyPrice, setMonthlyPrice, 'numeric')}
      {renderField('pricetags-outline', 'Yearly Price', yearlyPrice, setYearlyPrice, 'numeric')}
      {renderField('time-outline', 'Free Trial Days', freeTrialDays, setFreeTrialDays, 'numeric')}
      {renderField('person-outline', 'Allowed Users', allowedUsers, setAllowedUsers, 'numeric')}
      {renderField('storefront-outline', 'Allowed Stores', allowedStores, setAllowedStores, 'numeric')}
      {renderField('cube-outline', 'Allowed Products', allowedProducts, setAllowedProducts, 'numeric')}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
          نوع الاشتراك: {type === 'public' ? 'عام (Public)' : 'خاص (Private)'}
        </Text>
        <Switch
          value={type === 'public'}
          onValueChange={(val) => setType(val ? 'public' : 'private')}
          thumbColor="#fff"
          trackColor={{ false: '#32a8c4', true: '#ccc' }}
          style={{ transform: [{ scaleX: 1.5 }, { scaleY: 1.4 }] }}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.inactiveButton} onPress={handleInactivate}>
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
    justifyContent: 'space-between',
    width: '40%',
    marginBottom: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
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
