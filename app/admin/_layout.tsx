import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [navItems, setNavItems] = useState([]);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.error('فشل تحميل بيانات المستخدم:', err);
    }
  };

  const loadRole = async () => {
    const role = await AsyncStorage.getItem('role');

    if (role === 'AppOwner' || role === 'AppAdmin') {
      setNavItems([
        { label: 'Main', icon: 'home-outline', path: '/admin/main' },
        { label: 'Users', icon: 'people-outline', path: '/admin/users' },
        { label: 'Subscriptions', icon: 'document-text-outline', path: '/admin/subscriptions' },
        { label: 'Accounts', icon: 'person-circle-outline', path: '/admin/accounts' },
      ]);
    } else if (role === 'AccountOwner' || role === 'GeneralAccountant') {
      setNavItems([
        { label: 'Main', icon: 'home-outline', path: '/admin/main' },
        { label: 'Users', icon: 'people-outline', path: '/admin/users' },
        { label: 'Stores', icon: 'storefront-outline', path: '/admin/stores' },
        { label: 'Products', icon: 'cube-outline', path: '/admin/products' },
        { label: 'Reports', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'Sales', icon: 'calculator-outline', path: '/admin/sales' },
      ]);
    } else if (role === 'StoreAdmin') {
      setNavItems([
        { label: 'Main', icon: 'home-outline', path: '/admin/main' },
        { label: 'Users', icon: 'people-outline', path: '/admin/users' },
        { label: 'Products', icon: 'cube-outline', path: '/admin/products' },
        { label: 'Reports', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'Sales', icon: 'calculator-outline', path: '/admin/sales' },
      ]);
    } else if (role === 'StoreAccountant') {
      setNavItems([
        { label: 'Main', icon: 'home-outline', path: '/admin/main' },
        { label: 'Users', icon: 'people-outline', path: '/admin/users' },
        { label: 'Products', icon: 'cube-outline', path: '/admin/products' },
        { label: 'Reports', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'Sales', icon: 'calculator-outline', path: '/admin/sales' },
      ]);
    } else if (role === 'Cashier') {
      setNavItems([
        { label: 'Main', icon: 'home-outline', path: '/admin/main' },
        { label: 'Reports', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'Sales', icon: 'calculator-outline', path: '/admin/sales' },
      ]);
    } else {
      setNavItems([]);
    }
  };

  useEffect(() => {
    fetchUser();
    loadRole();
  }, []);

  const baseURL = axios.defaults.baseURL?.replace('/api', '') || '';
  const avatarUri = user?.profileImage
    ? { uri: `${baseURL}${user.profileImage}` }
    : require('../../assets/images/logo.png');

  return (
    <View style={styles.wrapper}>
      <View style={styles.sidebar}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

        <View style={styles.profileSection}>
          <Image source={avatarUri} style={styles.avatar} resizeMode="cover" />
          <Text style={styles.welcome}>Welcome, {user?.name || 'User'}</Text>

          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/admin/profile')}>
            <Text style={styles.editButtonText}>View</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navList}>
          {navItems.map((item, idx) => {
            const isActive = pathname === item.path;

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.navItem, isActive && styles.activeItem]}
                onPress={() => router.push(item.path)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={isActive ? '#c23a8c' : '#ffffff'}
                  style={styles.navIcon}
                />
                <Text style={[styles.navText, isActive && styles.activeText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'row-reverse',
    width: '100%',
    height: '100%',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#50b3c9',
    paddingTop: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 10,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  welcome: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  editButton: {
    marginTop: 8,
    backgroundColor: '#c23a8c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  navList: {
    flexGrow: 1,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  navIcon: {
    marginRight: 10,
    marginLeft: 5,
  },
  navText: {
    color: '#fff',
    fontSize: 24,
  },
  activeItem: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  activeText: {
    color: '#c23a8c',
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});
