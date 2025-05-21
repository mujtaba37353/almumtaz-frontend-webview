import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from './api/axiosInstance';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/subscriptions/public/all')
      .then((res) => {
        const activeSubscriptions = res.data.filter((sub: any) => sub.active === true);
        setSubscriptions(activeSubscriptions);
      })
      .catch((err) => {
        console.error('Error loading subscriptions', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#812732" />
        <Text>جارٍ تحميل الاشتراكات...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} />
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Subscriptions</Text>
      <Text style={styles.description}>
        Choose the right plan to get started. All plans come with great support and tools to help you grow.
      </Text>

      <View style={styles.cardsContainer}>
        {subscriptions.map((item) => (
          <View
            key={item._id}
            style={[styles.card, item.name === 'Diamond' && styles.diamondCard]}
          >
            {item.name === 'Diamond' && (
              <Text style={styles.mostPopular}>MOST POPULAR</Text>
            )}

            <Text style={item.name === 'Diamond' ? styles.priceBig : styles.price}>
              {item.monthlyPrice} SAR <Text style={styles.period}>/monthly</Text>
            </Text>
            <Text style={item.name === 'Diamond' ? styles.priceBig : styles.price}>
              {item.yearlyPrice} SAR <Text style={styles.period}>/yearly</Text>
            </Text>

            <Text style={item.name === 'Diamond' ? styles.planNameWhite : styles.planName}>
              {item.name}
            </Text>
            <Text style={item.name === 'Diamond' ? styles.planDescWhite : styles.planDesc}>
              {item.description || 'Perfect for scaling your business.'}
            </Text>

            <Text style={item.name === 'Diamond' ? styles.bulletWhite : styles.bullet}>
              ✅ Users: {item.allowedUsers}
            </Text>
            <Text style={item.name === 'Diamond' ? styles.bulletWhite : styles.bullet}>
              ✅ Stores: {item.allowedStores}
            </Text>
            <Text style={item.name === 'Diamond' ? styles.bulletWhite : styles.bullet}>
              ✅ Products: {item.allowedProducts}
            </Text>
            <Text style={item.name === 'Diamond' ? styles.bulletWhite : styles.bullet}>
              ✅ Type: {item.type}
            </Text>

            <TouchableOpacity
              style={item.name === 'Diamond' ? styles.seeMoreWhite : styles.seeMore}
              onPress={() => router.push(`/subscription/${item._id}`)}
            >
              <Text style={{ color: item.name === 'Diamond' ? '#c23a8c' : '#fff', fontWeight: 'bold' }}>
                See More
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.enroll}
              onPress={() => router.push(`/create-account?subscriptionId=${item._id}`)}
            >
              <Text style={styles.enrollText}>Enroll Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
  title: {
    fontSize: 26,
    color: '#c23a8c',
    fontWeight: 'bold',
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
    maxWidth: 600,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: 250,
    shadowColor: '#aaa',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00aacc',
  },
  priceBig: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  period: {
    fontSize: 14,
    color: '#888',
  },
  planName: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 18,
    color: '#444',
  },
  planDesc: {
    color: '#777',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    color: '#444',
    marginVertical: 2,
  },
  seeMore: {
    marginTop: 10,
    backgroundColor: '#a3dbe8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  enroll: {
    marginTop: 10,
    backgroundColor: '#c23a8c',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrollText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Diamond Styling
  diamondCard: {
    backgroundColor: '#50b3c9',
  },
  planNameWhite: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
  },
  planDescWhite: {
    color: '#eee',
    marginBottom: 10,
  },
  bulletWhite: {
    fontSize: 14,
    color: '#fff',
    marginVertical: 2,
  },
  seeMoreWhite: {
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mostPopular: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    color: '#50b3c9',
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 8,
    marginBottom: 5,
  },
});
