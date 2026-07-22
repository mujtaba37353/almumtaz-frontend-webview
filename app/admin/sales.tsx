import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Platform, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';


export default function SalesScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  const fetchSessions = async () => {
  try {
    setLoading(true);
    setErrorMessage(null);
    
    const token = await AsyncStorage.getItem('token');
    const profileRes = await axios.get('/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = profileRes.data;
    setRole(user.role);
    setUserId(user._id);
    setStoreId(user.store?._id || null);

    // فقط مالك الحساب والمحاسب العام يمكنهم اختيار متجر
    if (["AccountOwner", "GeneralAccountant"].includes(user.role)) {
      const storesRes = await axios.get('/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(storesRes.data);
    }

    // ✅ استخدام الراوت الموحد لجميع الأدوار
    const res = await axios.get('/sessions/all', {
      headers: { Authorization: `Bearer ${token}` },
    });

    setAllSessions(res.data);
    const filtered = applySessionFilter(res.data);
    setSessions(filtered);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    setErrorMessage('فشل في تحميل الجلسات.');
  } finally {
    setLoading(false);
  }
};


  const applySessionFilter = (sessionsList: any[]) => {
    const now = new Date().getTime();
    return sessionsList.filter((session) => {
      if (selectedStoreId && session.store?._id !== selectedStoreId) return false;

      if (sessionStatusFilter === 'open') return session.isOpen === true;

      if (sessionStatusFilter === 'closed') {
        if (!session.isOpen) {
          const closedAt = session.endTime || session.updatedAt || session.createdAt;
          const closedTime = new Date(closedAt).getTime();
          return (now - closedTime) / (1000 * 60 * 60) < 24;
        }
        return false;
      }

      // default: 'all'
      if (!session.isOpen) {
        const closedAt = session.endTime || session.updatedAt || session.createdAt;
        const closedTime = new Date(closedAt).getTime();
        return (now - closedTime) / (1000 * 60 * 60) < 24;
      }

      return true;
    });
  };

  const resetFilters = () => {
    setSessionStatusFilter('all');
    setSelectedStoreId(null);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const filtered = applySessionFilter(allSessions);
    setSessions(filtered);
  }, [sessionStatusFilter, selectedStoreId]);

  const handleCreateSession = () => {
    router.push(`/admin/create-session`);
  };

  const renderCard = ({ item: session }: any) => {
    const isMySession = session.user?._id === userId;
    const canOpen = ['AccountOwner', 'GeneralAccountant', 'StoreAdmin', 'StoreAccountant'].includes(role || '') || (role === 'Cashier' && isMySession);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>جلسة #{session._id.slice(-5)}</Text>
        <Text style={styles.status}>الحالة: {session.isOpen ? '🟢 مفتوحة' : '🔴 مغلقة'}</Text>
        {['AccountOwner', 'GeneralAccountant'].includes(role || '') && (
          <Text style={styles.meta}>المتجر: {session.store?.name}</Text>
        )}
        <Text style={styles.meta}>
          المستخدم: {session.user.name ?? 'غير معروف (قد يكون محذوف)'}
        </Text>


        {canOpen && (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push(`/manage-session/${session._id}`)}
          >
            <Text style={styles.manageText}>رؤية الجلسة</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الجلسات الحالية</Text>
        {(
            (['StoreAdmin', 'StoreAccountant', 'Cashier'].includes(role || '') && storeId) ||
            role === 'AccountOwner' || role === 'GeneralAccountant'
          ) && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreateSession}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.createText}>إنشاء جلسة</Text>
            </TouchableOpacity>
          )}


      </View>

      {/* فلترة حسب حالة الجلسة */}
      <View style={styles.dropdownContainer}>
        {Platform.OS === 'web' ? (
          <select
            value={sessionStatusFilter}
            onChange={(e) => setSessionStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
            style={styles.select}
          >
            <option value="all">جميع الجلسات</option>
            <option value="open">الجلسات المفتوحة 🟢</option>
            <option value="closed">الجلسات المغلقة 🔴</option>
          </select>
        ) : (
          <RNPickerSelect
            onValueChange={(value) => setSessionStatusFilter(value)}
            value={sessionStatusFilter}
            placeholder={{ label: 'تصفية حسب الحالة', value: 'all' }}
            items={[
              { label: 'جميع الجلسات', value: 'all' },
              { label: 'الجلسات المفتوحة 🟢', value: 'open' },
              { label: 'الجلسات المغلقة 🔴', value: 'closed' },
            ]}
            style={pickerSelectStyles}
          />
        )}
      </View>

      {/* فلترة حسب المتجر */}
      {["AccountOwner", "GeneralAccountant"].includes(role || '') && stores.length > 0 && (
        <View style={styles.dropdownContainer}>
          {Platform.OS === 'web' ? (
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value || null)}
              style={styles.select}
            >
              <option value="">فلترة حسب المتجر</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>{store.name}</option>
              ))}
            </select>
          ) : (
            <RNPickerSelect
              onValueChange={(value) => setSelectedStoreId(value)}
              value={selectedStoreId}
              placeholder={{ label: 'فلترة حسب المتجر', value: null }}
              items={stores.map((store) => ({
                label: store.name,
                value: store._id,
              }))}
              style={pickerSelectStyles}
            />
          )}
        </View>
      )}

      {/* زر إعادة تعيين */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetFilters}
      >
        <Ionicons name="refresh-circle" size={18} color="#fff" />
        <Text style={styles.resetText}>إعادة تعيين الفلاتر</Text>
      </TouchableOpacity>

      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#812732" style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
          لا توجد جلسات تطابق الفلاتر المحددة.
        </Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          numColumns={4}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  createButton: {
    backgroundColor: '#812732',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  createText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  dropdownContainer: { marginBottom: 10, width: '60%', alignSelf: 'center' },
  select: {
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    width: '100%',
  },
  resetButton: {
    backgroundColor: '#888',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
    gap: 6,
  },
  resetText: { color: '#fff', fontWeight: 'bold' },
  grid: { paddingBottom: 20 },
  card: {
  backgroundColor: '#3AA6B9',
  padding: 12,
  borderRadius: 10,
  width: '22%',
  marginBottom: 16,
},
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  status: { fontSize: 14, color: '#fff', marginVertical: 6 },
  meta: { fontSize: 13, color: '#fff', fontStyle: 'italic' },
  manageButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  manageText: {
    color: '#812732',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    backgroundColor: '#ffe5e5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
};
