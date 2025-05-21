import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function StoresScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(res.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRole = async () => {
    const savedRole = await AsyncStorage.getItem('role');
    setRole(savedRole);
  };

  useEffect(() => {
    loadRole();
    fetchStores();
  }, []);

  // ✨ داخل renderStoreCard:
const renderStoreCard = ({ item }: any) => (
  <View style={styles.card}>
    <Ionicons name="storefront" size={28} color="#fff" style={{ marginBottom: 10 }} />
    <Text style={styles.name}>{item.name}</Text>
    {item.location && <Text style={styles.detail}>📍 {item.location}</Text>}
    <Text style={styles.detail}>
      {item.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
    </Text>

    {/* زر تفاصيل المتجر متاح للجميع */}
    <TouchableOpacity
      style={styles.detailsButton}
      onPress={() => router.push(`/admin/store/${item._id}`)}
    >
      <Text style={styles.detailsText}>View Details</Text>
    </TouchableOpacity>

    {/* زر التعديل مخصص للأدوار المصرح لها */}
    {(role === 'AccountOwner' || role === 'GeneralAccountant') && (
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push(`/admin/manage-store/${item._id}`)}
      >
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    )}
  </View>
);


  return (
    <View style={styles.container}>
      {/* Header */}
            <View style={styles.header}>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#000" />
                <Text style={styles.locationText}>Riyadh, Saudi Arabia 🌤️ 30°</Text>
              </View>
              <Text style={styles.dateText}>📅 {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>


      {/* Logo */}
            <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            
      {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/admin/create-store')}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addText}>Add Store</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />
      ) : stores.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
          No stores found.
        </Text>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item._id}
          renderItem={renderStoreCard}
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
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    width: 320,
    height: 120,
    alignSelf: 'center',
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: '#cc4da0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#32a8c4',
    padding: 16,
    borderRadius: 10,
    width: '30%',
    marginBottom: 16,
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  detail: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  editText: {
    color: '#cc4da0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // ✨ في styles:
detailsButton: {
  backgroundColor: '#fff',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 6,
  marginTop: 6,
},
detailsText: {
  color: '#32a8c4',
  fontWeight: 'bold',
  textAlign: 'center',
},

});
