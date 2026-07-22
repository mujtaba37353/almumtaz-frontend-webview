import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

I18nManager.allowRTL(true);

const ADMIN_ROLES = [
  'AppOwner',
  'AppAdmin',
  'AccountOwner',
  'GeneralAccountant',
  'StoreAdmin',
  'StoreAccountant',
  'Cashier',
];

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('role');
        if (token && role && ADMIN_ROLES.includes(role)) {
          router.replace('/admin/main');
          return;
        }
      } catch {
        /* fall through */
      }
      router.replace('/login');
    }, 1500);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('window').width * 0.7,
  },
});
