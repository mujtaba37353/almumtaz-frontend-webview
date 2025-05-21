// app/subscription/[id].tsx

import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import axios from '../api/axiosInstance';

export default function SubscriptionDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`/subscriptions/public/${id}`)
        .then((res) => setSubscription(res.data))
        .catch((err) => console.error('Failed to fetch subscription:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} color="#812732" />;
  }

  if (!subscription) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Subscription not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅️ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.name}>{subscription.name}</Text>
      <Text style={styles.label}>Monthly: <Text style={styles.value}>{subscription.monthlyPrice} SAR</Text></Text>
      <Text style={styles.label}>Yearly: <Text style={styles.value}>{subscription.yearlyPrice} SAR</Text></Text>
      <Text style={styles.label}>Free Trial: <Text style={styles.value}>{subscription.freeTrialDays} days</Text></Text>
      <Text style={styles.label}>Allowed Users: <Text style={styles.value}>{subscription.allowedUsers}</Text></Text>
      <Text style={styles.label}>Allowed Stores: <Text style={styles.value}>{subscription.allowedStores}</Text></Text>
      <Text style={styles.label}>Allowed Products: <Text style={styles.value}>{subscription.allowedProducts}</Text></Text>
      <Text style={styles.label}>Type: <Text style={styles.value}>{subscription.type}</Text></Text>

      <TouchableOpacity style={styles.enrollButton} onPress={() => router.push(`/create-account?subscriptionId=${subscription._id}`)}>
        <Text style={styles.enrollText}>Enroll Now</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅️ Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fdfafa',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  signInText: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    fontSize: 16,
    color: '#c23a8c',
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#c23a8c',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  value: {
    fontWeight: 'normal',
    color: '#666',
  },
  enrollButton: {
    marginTop: 30,
    backgroundColor: '#c23a8c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  enrollText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backText: {
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});