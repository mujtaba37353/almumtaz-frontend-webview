import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';


export default function MainScreen() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
    };
    fetchRole();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ العنوان (الموقع + التاريخ + الوقت) */}
      <View style={styles.header}>
        <Text style={styles.location}>📍 Riyadh, Saudi Arabia</Text>
        <Text style={styles.date}>🗓️ 06/08/2025 02:57 PM</Text>
      </View>

      {/* ✅ الشعار */}
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      {/* ✅ الفلاتر */}
      <View style={styles.filters}>
        <TextInput style={styles.filterInput} placeholder="From" />
        <TextInput style={styles.filterInput} placeholder="To" />
        <TouchableOpacity style={styles.filterBtn}><Text>Year ⌄</Text></TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}><Text>Month ⌄</Text></TouchableOpacity>
        <TouchableOpacity style={styles.filterCheck}><Text>✔️</Text></TouchableOpacity>
      </View>

      
        {/* ✅ رسم بياني ثابت */}

        <View style={styles.chartAndCards}>
            <View style={styles.chartContainer}>
                {/* الرسم البياني */}
                <View style={styles.chartContainer}>
                <BarChart
                    data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{ data: [20, 15, 30, 31, 18, 28, 27] }],
                    }}
                    width={Dimensions.get('window').width - 700}
                    height={440}
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
            </View>
            <View style={styles.cards}>
                {/* البطاقات */}
                {/* ✅ محتوى الجانب الأيمن حسب الدور */}
                    <View style={styles.sideContent}>
                        {(role === 'AppOwner' || role === 'AppAdmin') ? (
                        <>
                            <View style={styles.box}>
                            <Text style={styles.boxText}>🟢 Active Users: 30</Text>
                            <Text style={styles.boxText}>🔴 Inactive Users: 10</Text>
                            </View>
                            <View style={styles.box}>
                            <Text style={styles.boxText}>🏬 Active Stores: 20</Text>
                            <Text style={styles.boxText}>🚫 Inactive Stores: 5</Text>
                            </View>
                        </>
                        ) : (
                        <View style={styles.subscriptionBox}>
                            <Text style={styles.packageTitle}>💎 Diamond Package</Text>
                            <Text style={styles.packageText}>📅 End Date: 01/01/2026</Text>
                            <Text style={styles.packageText}>🟢 Active Users: 10</Text>
                            <Text style={styles.packageText}>🏬 Active Store: 4</Text>
                            <TouchableOpacity style={styles.upgradeBtn}>
                            <Text style={{ color: '#c23a8c', fontWeight: 'bold' }}>Upgrade Subscription</Text>
                            </TouchableOpacity>
                        </View>
                        )}
                    </View>
            </View>
        </View>
    </ScrollView>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  location: {
    fontSize: 24,
    color: '#333',
  },
  date: {
    fontSize: 24,
    color: '#333',
  },
  logo: {
    width: 900,
    height: 180,
    alignSelf: 'center',
    marginVertical: 10,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#00aacc',
    borderRadius: 8,
    padding: 10,
    width: 100,
    margin: 5,
  },
  filterBtn: {
    backgroundColor: '#d7f1f7',
    padding: 10,
    borderRadius: 8,
    margin: 5,
  },
  filterCheck: {
    backgroundColor: '#00aacc',
    padding: 10,
    borderRadius: 8,
    margin: 5,
  },
  chartContainer: {
    backgroundColor: '#D9D9D9',
    marginBottom: 20,
    width: '70%',
    alignItems: 'center',
  }, 
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00aacc',
    marginBottom: 10,
    alignSelf: 'center',
  },
  sideContent: {
    height: '100%',
    margin: 10, 
    gap: 10,
  },
  box: {
    backgroundColor: '#50b3c9',
    padding: 16,
    borderRadius: 12,
  },
  boxText: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 5,
  },
  subscriptionBox: {
    backgroundColor: '#50b3c9',
    padding: 16,
    borderRadius: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  packageText: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 6,
  },
  upgradeBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  chartAndCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 30,
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 30,
  },
  chartContainer: {
    flex: 2,
    minWidth: 300,
    alignItems: 'center',
  },
  cards: {
    flex: 1,
    minWidth: 250,
    maxWidth: 300,
    gap: 16,
    alignSelf: 'flex-start',
  },
});
