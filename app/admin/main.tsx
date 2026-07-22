import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import axios from '../api/axiosInstance';

I18nManager.allowRTL(true);

export default function MainScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);

      const params: any = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await axios.get('/reports/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setStats(res.data);
    } catch (err) {
      console.error('dashboard error', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = {
    labels: (stats?.chartLabels || []).map((l: string) => l.slice(0, 3)),
    datasets: [{ data: (stats?.chartData?.length ? stats.chartData : [0]).map((n: number) => n || 0) }],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.location}>الرياض، السعودية</Text>
        <Text style={styles.date}>{new Date().toLocaleString('ar-SA')}</Text>
      </View>

      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      <View style={styles.filters}>
        <TextInput
          style={styles.filterInput}
          placeholder="من (YYYY-MM-DD)"
          value={from}
          onChangeText={setFrom}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="إلى (YYYY-MM-DD)"
          value={to}
          onChangeText={setTo}
        />
        <TouchableOpacity style={styles.filterCheck} onPress={load}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>تطبيق</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#c23a8c" />
      ) : (
        <View style={styles.chartAndCards}>
          <View style={styles.chartContainer}>
            <BarChart
              data={chartData}
              width={Math.min(Dimensions.get('window').width - 40, 700)}
              height={280}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundGradientFrom: '#F5F5F5',
                backgroundGradientTo: '#F5F5F5',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(194, 58, 140, ${opacity})`,
                labelColor: () => '#333',
                style: { borderRadius: 8 },
              }}
              style={{ borderRadius: 12 }}
            />
          </View>

          <View style={styles.cards}>
            {(role === 'AppOwner' || role === 'AppAdmin') ? (
              <>
                <View style={styles.box}>
                  <Text style={styles.boxText}>نشطون: {stats?.activeUsers ?? 0}</Text>
                  <Text style={styles.boxText}>غير نشطين: {stats?.inactiveUsers ?? 0}</Text>
                </View>
                <View style={styles.box}>
                  <Text style={styles.boxText}>متاجر نشطة: {stats?.activeStores ?? 0}</Text>
                  <Text style={styles.boxText}>متاجر متوقفة: {stats?.inactiveStores ?? 0}</Text>
                </View>
                <View style={styles.box}>
                  <Text style={styles.boxText}>الحسابات: {stats?.accounts ?? 0}</Text>
                </View>
              </>
            ) : (
              <View style={styles.subscriptionBox}>
                <Text style={styles.packageTitle}>
                  {stats?.subscription?.name || 'الاشتراك'}
                </Text>
                <Text style={styles.packageText}>الحساب: {stats?.accountName || '-'}</Text>
                <Text style={styles.packageText}>مستخدمون نشطون: {stats?.activeUsers ?? 0}</Text>
                <Text style={styles.packageText}>متاجر نشطة: {stats?.activeStores ?? 0}</Text>
                <Text style={styles.packageText}>منتجات: {stats?.products ?? 0}</Text>
                <Text style={styles.packageText}>مبيعات: {(stats?.totalSales ?? 0).toFixed?.(2) ?? stats?.totalSales}</Text>
                <Text style={styles.packageText}>ضريبة: {(stats?.totalVat ?? 0).toFixed?.(2) ?? stats?.totalVat}</Text>
                <Text style={styles.packageText}>جلسات مفتوحة: {stats?.openSessions ?? 0}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  location: { fontSize: 16, color: '#333' },
  date: { fontSize: 14, color: '#333' },
  logo: { width: '80%', maxWidth: 420, height: 120, alignSelf: 'center', marginVertical: 10 },
  filters: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16, flexWrap: 'wrap', gap: 8 },
  filterInput: { borderWidth: 1, borderColor: '#00aacc', borderRadius: 8, padding: 10, width: 140, margin: 4 },
  filterCheck: { backgroundColor: '#00aacc', padding: 10, borderRadius: 8, margin: 4, justifyContent: 'center' },
  chartAndCards: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginTop: 12 },
  chartContainer: { flex: 2, minWidth: 280, alignItems: 'center' },
  cards: { flex: 1, minWidth: 220, maxWidth: 320, gap: 12 },
  box: { backgroundColor: '#50b3c9', padding: 16, borderRadius: 12 },
  boxText: { color: '#fff', fontSize: 16, marginVertical: 4 },
  subscriptionBox: { backgroundColor: '#50b3c9', padding: 16, borderRadius: 12 },
  packageTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  packageText: { fontSize: 15, color: '#fff', marginBottom: 6 },
});
