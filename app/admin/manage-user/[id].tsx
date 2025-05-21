import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from '../../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ManageUserScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', role: '', store: '', image: null });
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);

          if (parsed.role === 'AppOwner') {
            setRoleOptions(['AppAdmin']);
          } else if (parsed.role === 'AccountOwner') {
            setRoleOptions(['GeneralAccountant', 'StoreAdmin', 'StoreAccountant', 'Cashier']);
          } else if (parsed.role === 'GeneralAccountant') {
            setRoleOptions(['StoreAdmin', 'StoreAccountant', 'Cashier']);
          } else if (parsed.role === 'StoreAdmin') {
            setRoleOptions(['StoreAccountant', 'Cashier']);
          }

          if (["AccountOwner", "GeneralAccountant"].includes(parsed.role)) {
            const storesRes = await axios.get('/stores', {
              headers: { Authorization: `Bearer ${token}` },
            });
            setStores(storesRes.data);
          }
        }

        const res = await axios.get(`/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        setForm({
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          store: res.data.store || '',
          image: res.data.profileImage ? `${axios.defaults.baseURL?.replace('/api', '')}${res.data.profileImage}` : null,
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        Alert.alert('Error', 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedData = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(form.role)) {
        updatedData['store'] = form.store;
      }
      await axios.put(`/users/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'User updated');
      router.back();
    } catch (err: any) {
      console.error('Update error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Deleted', 'User has been removed');
      router.replace('/admin/users');
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  const isSelf = currentUser?._id?.toString() === user?._id?.toString();

  const canEdit = (() => {
    if (!currentUser || !user) return false;

    const currentRole = currentUser.role;
    const targetRole = user.role;

    if (isSelf) return true;
    if (currentRole === 'AppOwner' && targetRole === 'AppAdmin') return true;
    if (currentRole === 'AccountOwner' && currentUser.account === user.account) return true;
    if (
      currentRole === 'GeneralAccountant' &&
      currentUser.account === user.account &&
      targetRole !== 'AccountOwner'
    ) return true;
    if (
      currentRole === 'StoreAdmin' &&
      currentUser.store === user.store &&
      ['StoreAccountant', 'Cashier'].includes(targetRole)
    ) return true;

    return false;
  })();

  const canDelete = (() => {
    if (!currentUser || !user) return false;

    const currentRole = currentUser.role;
    const targetRole = user.role;

    if (isSelf) return true;
    if (currentRole === 'AppOwner' && targetRole === 'AppAdmin') return true;
    if (currentRole === 'AccountOwner' && currentUser.account === user.account) return true;
    if (
      currentRole === 'GeneralAccountant' &&
      currentUser.account === user.account &&
      targetRole !== 'AccountOwner'
    ) return true;
    if (
      currentRole === 'StoreAdmin' &&
      currentUser.store === user.store &&
      ['StoreAccountant', 'Cashier'].includes(targetRole)
    ) return true;

    return false;
  })();

  const isStoreRole = ['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(form.role);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} color="#812732" />;
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>User not found</Text>
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
      <Text style={styles.title}>Manage User</Text>

      {form.image && (
        <Image
          source={{ uri: form.image }}
          style={styles.avatar}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={form.name}
        editable={canEdit}
        onChangeText={(val) => setForm({ ...form, name: val })}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={form.email}
        editable={canEdit}
        onChangeText={(val) => setForm({ ...form, email: val })}
      />

      {canEdit && (
        <>
          <TouchableOpacity
            onPress={() => setShowRoleOptions(!showRoleOptions)}
            style={styles.dropdownToggle}
          >
            <Text style={styles.dropdownText}>Role: {form.role}</Text>
          </TouchableOpacity>

          {showRoleOptions && (
            <View style={styles.dropdown}>
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setForm({ ...form, role, store: '' });
                    setShowRoleOptions(false);
                  }}
                >
                  <Text>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {canEdit && isStoreRole && (
        <View style={{ width: '40%', marginBottom: 16 }}>
          <Text style={{ marginBottom: 4 }}>Select Store:</Text>
          <View style={styles.dropdown}>
            {stores.map((store) => (
              <TouchableOpacity
                key={store._id}
                onPress={() => setForm({ ...form, store: store._id })}
                style={[
                  styles.dropdownItem,
                  form.store === store._id && styles.dropdownItemSelected,
                ]}
              >
                <Text>{store.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {canEdit && (
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      )}

      {canDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>🗑️ Delete User</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c23a8c',
    marginBottom: 20,
  },
  input: {
    width: '40%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#c23a8c',
    paddingVertical: 12,
    borderRadius: 8,
    width: '40%',
    marginTop: 10,
  },
  saveText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#812732',
    paddingVertical: 12,
    borderRadius: 8,
    width: '40%',
    marginTop: 10,
  },
  deleteText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: '#ccc',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemSelected: {
    backgroundColor: '#eee',
  },
  dropdownToggle: {
    width: '40%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 10,
  },
  dropdownText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
