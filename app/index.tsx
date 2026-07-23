import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, I18nManager, Text } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradientFallback, colors, typography, space } from '../components/ui';

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
    }, 1400);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <LinearGradientFallback style={styles.container} colors={[colors.canvas, colors.canvasAlt]}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brand}>الممتاز</Text>
      <View style={styles.bar} />
    </LinearGradientFallback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: Dimensions.get('window').width * 0.55,
    height: Dimensions.get('window').width * 0.55,
    maxWidth: 280,
    maxHeight: 280,
  },
  brand: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeXl,
    color: colors.brandDeep,
    marginTop: space.md,
  },
  bar: {
    marginTop: space.lg,
    width: 64,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
