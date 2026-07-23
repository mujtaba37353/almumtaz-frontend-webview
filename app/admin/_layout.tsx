import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, space, typography } from '../../theme/tokens';
import { LinearGradientFallback } from '../../components/ui';

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [navItems, setNavItems] = useState<any[]>([]);

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
        { label: 'الرئيسية', icon: 'home-outline', path: '/admin/main' },
        { label: 'المستخدمون', icon: 'people-outline', path: '/admin/users' },
        { label: 'الاشتراكات', icon: 'document-text-outline', path: '/admin/subscriptions' },
        { label: 'الحسابات', icon: 'person-circle-outline', path: '/admin/accounts' },
      ]);
    } else if (role === 'AccountOwner' || role === 'GeneralAccountant') {
      setNavItems([
        { label: 'الرئيسية', icon: 'home-outline', path: '/admin/main' },
        { label: 'المستخدمون', icon: 'people-outline', path: '/admin/users' },
        { label: 'المتاجر', icon: 'storefront-outline', path: '/admin/stores' },
        { label: 'المنتجات', icon: 'cube-outline', path: '/admin/products' },
        { label: 'العملاء', icon: 'person-outline', path: '/admin/parties', params: { kind: 'customer' } },
        { label: 'الموردون', icon: 'people-circle-outline', path: '/admin/parties', params: { kind: 'supplier' } },
        { label: 'المخزون', icon: 'file-tray-stacked-outline', path: '/admin/warehouses' },
        { label: 'المشتريات', icon: 'cart-outline', path: '/admin/purchases' },
        { label: 'المحاسبة', icon: 'book-outline', path: '/admin/finance' },
        { label: 'الذمم', icon: 'wallet-outline', path: '/admin/vouchers' },
        { label: 'التقارير', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'المبيعات', icon: 'calculator-outline', path: '/admin/sales' },
        ...(role === 'AccountOwner'
          ? [
              { label: 'المنشأة', icon: 'business-outline', path: '/admin/business-settings' },
              { label: 'ZATCA', icon: 'shield-checkmark-outline', path: '/admin/zatca' },
            ]
          : []),
      ]);
    } else if (role === 'StoreAdmin') {
      setNavItems([
        { label: 'الرئيسية', icon: 'home-outline', path: '/admin/main' },
        { label: 'المستخدمون', icon: 'people-outline', path: '/admin/users' },
        { label: 'المنتجات', icon: 'cube-outline', path: '/admin/products' },
        { label: 'العملاء', icon: 'person-outline', path: '/admin/parties', params: { kind: 'customer' } },
        { label: 'المخزون', icon: 'file-tray-stacked-outline', path: '/admin/warehouses' },
        { label: 'المشتريات', icon: 'cart-outline', path: '/admin/purchases' },
        { label: 'التقارير', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'المبيعات', icon: 'calculator-outline', path: '/admin/sales' },
      ]);
    } else if (role === 'StoreAccountant') {
      setNavItems([
        { label: 'الرئيسية', icon: 'home-outline', path: '/admin/main' },
        { label: 'المستخدمون', icon: 'people-outline', path: '/admin/users' },
        { label: 'المنتجات', icon: 'cube-outline', path: '/admin/products' },
        { label: 'المخزون', icon: 'file-tray-stacked-outline', path: '/admin/warehouses' },
        { label: 'الذمم', icon: 'wallet-outline', path: '/admin/vouchers' },
        { label: 'التقارير', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'المبيعات', icon: 'calculator-outline', path: '/admin/sales' },
      ]);
    } else if (role === 'Cashier') {
      setNavItems([
        { label: 'الرئيسية', icon: 'home-outline', path: '/admin/main' },
        { label: 'التقارير', icon: 'bar-chart-outline', path: '/admin/reports' },
        { label: 'المبيعات', icon: 'calculator-outline', path: '/admin/sales' },
      ]);
    } else {
      setNavItems([]);
    }
  };

  useEffect(() => {
    fetchUser();
    loadRole();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'role', 'user']);
      delete axios.defaults.headers.common.Authorization;
    } catch (err) {
      console.error('فشل تسجيل الخروج:', err);
    } finally {
      router.replace('/login');
    }
  };

  const baseURL = axios.defaults.baseURL?.replace('/api', '') || '';
  const avatarUri = user?.profileImage
    ? { uri: `${baseURL}${user.profileImage}` }
    : require('../../assets/images/logo.png');

  return (
    <View style={styles.wrapper}>
      <View style={styles.sidebar}>
        <LinearGradientFallback
          colors={[colors.brandDeep, colors.brand]}
          style={styles.sidebarInner}
        >
          <View style={styles.sidebarHeader}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.profileSection}>
              <Image source={avatarUri} style={styles.avatar} resizeMode="cover" />
              <Text style={styles.welcome} numberOfLines={1}>
                {user?.name || 'مستخدم'}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push('/admin/profile')}
              >
                <Text style={styles.editButtonText}>الملف</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.navScroll}
            contentContainerStyle={styles.navList}
            showsVerticalScrollIndicator={false}
          >
            {navItems.map((item, idx) => {
              const isActive =
                pathname === item.path ||
                (item.path !== '/admin/main' && pathname?.startsWith(item.path));

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.navItem, isActive && styles.activeItem]}
                  onPress={() =>
                    router.push(
                      item.params
                        ? ({ pathname: item.path, params: item.params } as any)
                        : item.path
                    )
                  }
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={isActive ? colors.primary : colors.textOnBrand}
                    style={styles.navIcon}
                  />
                  <Text style={[styles.navText, isActive && styles.activeText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </LinearGradientFallback>
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
    backgroundColor: colors.canvas,
  },
  sidebar: {
    width: Platform.OS === 'web' ? 260 : 240,
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
  },
  sidebarInner: {
    flex: 1,
    paddingTop: space.xl,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  sidebarHeader: {
    alignItems: 'center',
    flexShrink: 0,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  logo: {
    width: 132,
    height: 52,
    marginBottom: space.sm,
  },
  profileSection: {
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    marginBottom: space.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  welcome: {
    color: colors.textOnBrand,
    fontSize: typography.sizeSm,
    fontFamily: typography.fontArMd,
    maxWidth: '100%',
    textAlign: 'center',
  },
  editButton: {
    marginTop: space.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  editButtonText: {
    color: colors.textOnBrand,
    fontSize: typography.sizeXs,
    fontFamily: typography.fontArMd,
  },
  navScroll: {
    flex: 1,
    width: '100%',
    marginTop: space.md,
    marginBottom: space.sm,
  },
  navList: {
    width: '100%',
    paddingBottom: space.sm,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    width: '100%',
  },
  navIcon: {
    marginRight: space.sm,
  },
  navText: {
    color: colors.textOnBrand,
    fontSize: typography.sizeMd,
    fontFamily: typography.fontAr,
    flexShrink: 1,
  },
  activeItem: {
    backgroundColor: colors.surface,
  },
  activeText: {
    color: colors.primary,
    fontFamily: typography.fontArBold,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.22)',
    flexShrink: 0,
    gap: space.sm,
  },
  logoutText: {
    color: colors.textOnBrand,
    fontSize: typography.sizeMd,
    fontFamily: typography.fontArMd,
  },
});
