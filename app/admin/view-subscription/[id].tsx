// app/admin/view-subscription/[id].tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from '../../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ViewSubscription() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);

      const endpoint =
        storedRole === 'AppOwner' || storedRole === 'AppAdmin'
          ? `/subscriptions/${id}` 
          : `/subscriptions/public/${id}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubscription(res.data);
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحميل الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} color="#812732" />;
  }

  if (!subscription) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Subscription not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>⬅️ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#c23a8c" />
      </TouchableOpacity>
      {/* Logo */}
      <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      {/* Details */}
      <View style={styles.input}><Ionicons name="document-text-outline" size={18} color="#888" /><Text style={styles.inputText}>{subscription.name}</Text></View>
      <View style={styles.input}><Ionicons name="pricetag-outline" size={18} color="#888" /><Text style={styles.inputText}>{subscription.monthlyPrice}</Text></View>
      <View style={styles.input}><Ionicons name="pricetag-outline" size={18} color="#888" /><Text style={styles.inputText}>{subscription.yearlyPrice}</Text></View>
      <View style={styles.input}><Ionicons name="time-outline" size={18} color="#888" /><Text style={styles.inputText}>{subscription.freeTrialDays}</Text></View>
      <View style={styles.input}><Ionicons name="people-outline" size={18} color="#888" /><Text style={styles.inputText}>{subscription.allowedUsers}</Text></View>
      <View style={styles.input}><Ionicons name="storefront-outline" size={18} color="#888" /><Text style={styles.inputText}>{subscription.allowedStores}</Text></View>
      <View style={styles.input}><Ionicons name="cube-outline" size={18} color="#888" /><Text style={styles.inputText}>{subscription.allowedProducts}</Text></View>
      <Text style={styles.note}>نوع الاشتراك: {subscription.type === 'public' ? 'عام (Public)' : 'خاص (Private)'}</Text>

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
    width: 300,
    height: 100,
    marginBottom: 20,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#50b3c9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '40%',
    marginBottom: 12,
  },
  inputText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});