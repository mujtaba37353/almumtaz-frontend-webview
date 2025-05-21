import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [availableRoleFilters, setAvailableRoleFilters] = useState<string[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const profileRes = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const currentUser = profileRes.data;
      setRole(currentUser.role);
      await AsyncStorage.setItem('user', JSON.stringify(currentUser));

      // 🟢 تحديد الأدوار المتاحة حسب الدور الحالي
      if (['AppOwner', 'AppAdmin'].includes(currentUser.role)) {
        setAvailableRoleFilters(['AppAdmin', 'AccountOwner']);
      } else if (['AccountOwner', 'GeneralAccountant'].includes(currentUser.role)) {
        setAvailableRoleFilters(['GeneralAccountant', 'StoreAdmin', 'StoreAccountant', 'Cashier']);
      } else if (currentUser.role === 'StoreAdmin') {
        setAvailableRoleFilters(['StoreAccountant', 'Cashier']);
      }

      let fetchedUsers = [];
      if (
        ['AppOwner', 'AppAdmin', 'AccountOwner', 'GeneralAccountant', 'StoreAdmin'].includes(currentUser.role)
      ) {
        const usersRes = await axios.get('/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchedUsers = usersRes.data;
      }

      const currentUserId = currentUser._id || currentUser.id;
      const filteredUsers = fetchedUsers.filter(user => user._id !== currentUserId);

      setAllUsers(filteredUsers);
      setUsers(filteredUsers);

      if (['AccountOwner', 'GeneralAccountant'].includes(currentUser.role)) {
        const storesRes = await axios.get('/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(storesRes.data);
      }

    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...allUsers];

    if (selectedStore) {
      filtered = filtered.filter(user => user.store?._id === selectedStore);
    }

    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedStore, selectedRole]);

  const renderUserCard = ({ item }: any) => (
    <View style={styles.card}>
      <Image
        source={
          item.profileImage
            ? { uri: `${axios.defaults.baseURL?.replace('/api', '')}${item.profileImage}` }
            : require('../../assets/images/logo.png')
        }
        style={styles.avatar}
      />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.status}>
        👤 {item.status === 'active' || item.active ? '🟢 Active' : '🔴 InActive'}
      </Text>
      <Text style={styles.status}>🎯 {item.role}</Text>
      {item.store && item.store.name && (
        <Text style={styles.storeText}>🏬 {item.store.name}</Text>
      )}
      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => {
          router.push(`/admin/manage-user/${item._id}`);
        }}
      >
        <Text style={styles.manageText}>Manage User</Text>
      </TouchableOpacity>
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

      {/* Create User */}
      {['AppOwner', 'AppAdmin', 'AccountOwner', 'GeneralAccountant', 'StoreAdmin'].includes(role || '') && (
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/admin/create-user')}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={styles.createText}>Create User</Text>
        </TouchableOpacity>
      )}

      {/* Dropdown: فلترة بالأدوار */}
      {availableRoleFilters.length > 0 && (
        <View style={styles.dropdownContainer}>
          {Platform.OS === 'web' ? (
              <select
                value={selectedRole || ''}
                onChange={(e) => setSelectedRole(e.target.value || null)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  borderColor: '#ccc',
                  borderWidth: 1,
                  marginBottom: 10,
                  width: '60%',
                  alignSelf: 'center'
                }}
              >
                <option value="">فلترة حسب الدور</option>
                {availableRoleFilters.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setSelectedRole(value)}
                placeholder={{ label: 'فلترة حسب الدور', value: null }}
                value={selectedRole}
                items={availableRoleFilters.map((role) => ({
                  label: role,
                  value: role
                }))}
                style={pickerSelectStyles}
              />
            )}

        </View>
      )}

      {/* Users Grid */}
      {loading ? (
        <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />
      ) : users.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
          لا يوجد مستخدمون يطابقون الفلاتر الحالية.
        </Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserCard}
          numColumns={3}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 10,
    width: '60%',
    alignSelf: 'center',
  },
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
  storeText: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  logo: {
    width: 320,
    height: 120,
    alignSelf: 'center',
    marginVertical: 10,
  },
  createButton: {
    backgroundColor: '#cc4da0',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  createText: {
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
    width: '32%',
    marginBottom: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  status: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 8,
  },
  manageButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  manageText: {
    color: '#cc4da0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
};
