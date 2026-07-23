import React, { useEffect, useState } from 'react';
import { Text, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Surface,
  PageHeader,
  colors,
  space,
  typography,
  textStyles,
} from '../../../components/ui';

export default function UserInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    };

    if (id) fetchUser();
  }, [id]);

  if (!user) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backText}>رجوع</Text>
      </Pressable>

      <PageHeader title="معلومات الموظف" subtitle={user.role} />

      <Surface style={styles.card}>
        <Image
          source={
            user.profileImage
              ? { uri: `${axios.defaults.baseURL?.replace('/api', '')}${user.profileImage}` }
              : require('../../../assets/images/logo.png')
          }
          style={styles.avatar}
        />

        <Text style={styles.rowLabel}>اسم الموظف</Text>
        <Text style={styles.rowValue}>{user.name}</Text>

        <Text style={styles.rowLabel}>البريد الإلكتروني</Text>
        <Text style={styles.rowValue}>{user.email}</Text>

        <Text style={styles.rowLabel}>الوظيفة</Text>
        <Text style={styles.rowValue}>{user.role}</Text>

        {user.store?.name ? (
          <>
            <Text style={styles.rowLabel}>المتجر</Text>
            <Text style={styles.rowValue}>{user.store.name}</Text>
          </>
        ) : null}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.subtitle,
    marginTop: space.md,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xl,
  },
  backText: {
    fontFamily: typography.fontArMd,
    color: colors.primary,
    fontSize: typography.sizeMd,
  },
  card: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: space.lg,
  },
  rowLabel: {
    ...textStyles.label,
    alignSelf: 'stretch',
    marginTop: space.md,
  },
  rowValue: {
    ...textStyles.body,
    alignSelf: 'stretch',
    marginTop: space.xs,
  },
});
