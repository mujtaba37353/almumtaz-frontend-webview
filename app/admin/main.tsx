import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import axios from '../api/axiosInstance';
import {
  Screen,
  PageHeader,
  Surface,
  Button,
  TextField,
  colors,
  space,
  typography,
  textStyles,
} from '../../components/ui';

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

  const chartWidth = Math.min(Dimensions.get('window').width - 40, 700);

  return (
    <Screen>
      <PageHeader title="لوحة التحكم" subtitle="ملخص الأداء والإحصائيات" />

      <View style={styles.filters}>
        <TextField
          placeholder="من (YYYY-MM-DD)"
          value={from}
          onChangeText={setFrom}
          containerStyle={styles.filterField}
        />
        <TextField
          placeholder="إلى (YYYY-MM-DD)"
          value={to}
          onChangeText={setTo}
          containerStyle={styles.filterField}
        />
        <Button title="تطبيق" onPress={load} style={styles.filterBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xl }} />
      ) : (
        <View style={styles.chartAndCards}>
          <Surface style={styles.chartContainer} padded={false}>
            <BarChart
              data={chartData}
              width={chartWidth}
              height={280}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.canvasAlt,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(184, 50, 122, ${opacity})`,
                labelColor: () => colors.text,
                style: { borderRadius: 8 },
              }}
              style={{ borderRadius: 12 }}
            />
          </Surface>

          <View style={styles.cards}>
            {role === 'AppOwner' || role === 'AppAdmin' ? (
              <>
                <Surface style={styles.statCard}>
                  <Text style={styles.statLabel}>المستخدمون</Text>
                  <Text style={styles.statText}>نشطون: {stats?.activeUsers ?? 0}</Text>
                  <Text style={styles.statText}>غير نشطين: {stats?.inactiveUsers ?? 0}</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text style={styles.statLabel}>المتاجر</Text>
                  <Text style={styles.statText}>نشطة: {stats?.activeStores ?? 0}</Text>
                  <Text style={styles.statText}>متوقفة: {stats?.inactiveStores ?? 0}</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text style={styles.statLabel}>الحسابات</Text>
                  <Text style={styles.statValue}>{stats?.accounts ?? 0}</Text>
                </Surface>
              </>
            ) : (
              <Surface style={styles.statCard}>
                <Text style={styles.packageTitle}>
                  {stats?.subscription?.name || 'الاشتراك'}
                </Text>
                <Text style={styles.statText}>الحساب: {stats?.accountName || '-'}</Text>
                <Text style={styles.statText}>مستخدمون نشطون: {stats?.activeUsers ?? 0}</Text>
                <Text style={styles.statText}>متاجر نشطة: {stats?.activeStores ?? 0}</Text>
                <Text style={styles.statText}>منتجات: {stats?.products ?? 0}</Text>
                <Text style={styles.statText}>
                  مبيعات: {(stats?.totalSales ?? 0).toFixed?.(2) ?? stats?.totalSales}
                </Text>
                <Text style={styles.statText}>
                  ضريبة: {(stats?.totalVat ?? 0).toFixed?.(2) ?? stats?.totalVat}
                </Text>
                <Text style={styles.statText}>جلسات مفتوحة: {stats?.openSessions ?? 0}</Text>
              </Surface>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.lg,
  },
  filterField: {
    flexGrow: 1,
    minWidth: 140,
    maxWidth: 200,
    marginBottom: 0,
  },
  filterBtn: {
    minWidth: 100,
    marginTop: 0,
  },
  chartAndCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
  },
  chartContainer: {
    flex: 2,
    minWidth: 280,
    alignItems: 'center',
    overflow: 'hidden',
    padding: space.md,
  },
  cards: {
    flex: 1,
    minWidth: 220,
    maxWidth: 320,
    gap: space.md,
  },
  statCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  statLabel: {
    ...textStyles.label,
    color: colors.brandDeep,
    marginBottom: space.sm,
  },
  packageTitle: {
    fontFamily: typography.fontArBold,
    fontSize: typography.sizeLg,
    color: colors.brandDeep,
    marginBottom: space.md,
  },
  statText: {
    ...textStyles.body,
    marginBottom: space.xs,
  },
  statValue: {
    fontFamily: typography.fontSansBold,
    fontSize: typography.sizeXl,
    color: colors.primary,
  },
});
