import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import axios from '../api/axiosInstance';

export default function PartiesScreen() {
  const params = useLocalSearchParams();
  const kind = (params.kind as string) || 'customer';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const endpoint = kind === 'supplier' ? '/suppliers' : '/customers';

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [kind]);

  const create = async () => {
    if (!name.trim()) return Alert.alert('تنبيه', 'الاسم مطلوب');
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        endpoint,
        { name, phone, vatNumber, kind },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName('');
      setPhone('');
      setVatNumber('');
      load();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل الإنشاء');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#c23a8c" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{kind === 'supplier' ? 'الموردون' : 'العملاء'}</Text>
      <TextInput style={styles.input} placeholder="الاسم" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="الجوال" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="الرقم الضريبي" value={vatNumber} onChangeText={setVatNumber} />
      <TouchableOpacity style={styles.btn} onPress={create}>
        <Text style={styles.btnText}>إضافة</Text>
      </TouchableOpacity>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text>{item.phone}</Text>
            <Text>الرصيد: {Number(item.balance || 0).toFixed(2)}</Text>
            <Text>{item.vatNumber}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#00aacc', borderRadius: 8, padding: 10, marginBottom: 8 },
  btn: { backgroundColor: '#c23a8c', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#f5f9fb', padding: 12, borderRadius: 10, marginBottom: 8 },
  cardTitle: { fontWeight: 'bold', marginBottom: 4 },
});
