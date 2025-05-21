// app/admin/(tabs)/accounts.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function AccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const roleVal = await AsyncStorage.getItem('role');
        setRole(roleVal);

        if (roleVal === 'AppOwner' || roleVal === 'AppAdmin') {
          const res = await axios.get('/accounts', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAccounts(res.data);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const renderAccount = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.accountName}>{item.name}</Text>
      <Text style={styles.status}>
        👤 {item.status === 'active' ? '🟢 Active' : '🔴 InActive'}
      </Text>
      <Text style={styles.userCount}>🟢 Active Users: 10</Text> {/* يمكن ربط العدد الحقيقي لاحقاً */}

      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => router.push(`/admin/view-account/${item._id}`)}
      >
        <Text style={styles.infoText}>Account Information</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={16} color="black" />
          <Text style={styles.locationText}>Riyadh, Saudi Arabia  🌤️ 30°</Text>
        </View>
        <Text style={styles.dateText}>📅 {new Date().toLocaleString()}</Text>
      </View>

      {/* Logo */}
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      {/* Create Button */}
      {role === 'AppOwner' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/admin/create-account')}
        >
          <Text style={styles.createText}>➕ Create Account</Text>
        </TouchableOpacity>
      )}

      {/* Accounts Grid */}
      {loading ? (
        <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item._id}
          renderItem={renderAccount}
          numColumns={3}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  logo: {
    width: 500,
    height: 160,
    alignSelf: 'center',
    marginVertical: 12,
  },
  createButton: {
    backgroundColor: '#cc4da0',
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginBottom: 10,
  },
  createText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#32a8c4',
    padding: 16,
    borderRadius: 10,
    width: '32%',
    marginBottom: 16,
    alignItems: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  userCount: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  infoButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 6,
  },
  infoText: {
    color: '#cc4da0',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
