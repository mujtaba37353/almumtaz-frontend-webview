import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptions(res.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async () => {
    const savedRole = await AsyncStorage.getItem('role');
    setRole(savedRole);
  };

  useEffect(() => {
    fetchSubscriptions();
    loadUserRole();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB');
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDateTime(`${formattedDate} ${formattedTime}`);
  }, []);

  if (role !== 'AppOwner' && role !== 'AppAdmin') {
    return (
      <View style={styles.notAllowedContainer}>
        <Text style={styles.notAllowedText}>ليس لديك صلاحية للوصول إلى هذه الصفحة</Text>
      </View>
    );
  }

  const renderItem = ({ item }: any) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => router.push(`/admin/view-subscription/${item._id}`)}
  >
    <Text style={styles.name}>{item.name}</Text>
    <Text style={styles.status}>
  👤 {item.active === false ? '🔴 InActive' : '🟢 Active'}
    </Text>

    <Text style={styles.type}>Type: {item.type === 'public' ? 'Public' : 'Private'}</Text>

    {role === 'AppOwner' && (
      <TouchableOpacity
        style={styles.manageButton}
        onPress={(e) => {
          e.stopPropagation(); // ✅ منع فتح البطاقة عند الضغط على زر التعديل
          router.push(`/admin/edit-subscription/${item._id}`);
        }}
      >
        <Text style={styles.manageText}>Manage Subscription</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);



  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={16} color="black" />
          <Text style={styles.locationText}>Riyadh, Saudi Arabia  🌤️ 30°</Text>
        </View>
        <Text style={styles.dateText}>📅 {dateTime}</Text>
      </View>

      {/* Logo */}
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      {/* Create Button (AppOwner only) */}
      {role === 'AppOwner' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/admin/create-subscription')}
        >
          <Text style={styles.createText}>Create Subscription</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
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
  width: 500, // كان 250
  height: 160, // كان 80
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
  width: '32%', // بدلًا من 48%
  marginBottom: 16,
},

  name: {
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
  type: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  manageButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 6,
  },
  manageText: {
    color: '#cc4da0',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  notAllowedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  notAllowedText: {
    fontSize: 16,
    color: '#812732',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
