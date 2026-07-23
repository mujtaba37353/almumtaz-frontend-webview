import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import QRCode from 'react-native-qrcode-svg';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoice(res.data);
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'تعذر تحميل الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const creditNote = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `/invoices/${id}/credit-note`,
        { reason: 'مرتجع' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('تم', 'تم إنشاء إشعار دائن');
      load();
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إنشاء إشعار دائن');
    }
  };

  const retry = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`/invoices/${id}/retry`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('تم', 'تمت إعادة الإرسال إلى ZATCA');
      load();
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إعادة المحاولة');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c23a8c" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text>الفاتورة غير موجودة</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{invoice.invoiceNumber}</Text>
      <Text>UUID: {invoice.uuid}</Text>
      <Text>الحالة: {invoice.status}</Text>
      <Text>النوع: {invoice.invoiceType} / {invoice.documentType}</Text>
      <Text>الصافي: {Number(invoice.netAmount).toFixed(2)} ر.س</Text>
      <Text>الضريبة: {Number(invoice.vatAmount).toFixed(2)} ر.س</Text>
      <Text>الإجمالي: {Number(invoice.totalAmount).toFixed(2)} ر.س</Text>

      {invoice.qrBase64 ? (
        <View style={styles.qrBox}>
          <QRCode value={invoice.qrBase64} size={180} />
          <Text style={styles.hint}>رمز QR للفاتورة (TLV Base64)</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.btn}
        onPress={() =>
          Share.share({
            message: `فاتورة ${invoice.invoiceNumber}\nالإجمالي: ${invoice.totalAmount} SAR\nQR: ${invoice.qrBase64}`,
          })
        }
      >
        <Text style={styles.btnText}>مشاركة الإيصال</Text>
      </TouchableOpacity>

      {invoice.documentType === 'invoice' && (
        <>
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={creditNote}>
            <Text style={styles.btnText}>إنشاء إشعار دائن (مرتجع)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.secondary]}
            onPress={async () => {
              try {
                const token = await AsyncStorage.getItem('token');
                await axios.post(
                  `/invoices/${id}/debit-note`,
                  { reason: 'تسوية مدينة' },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                Alert.alert('تم', 'تم إنشاء إشعار مدين');
                load();
              } catch (err: any) {
                Alert.alert('خطأ', err?.response?.data?.message || 'فشل');
              }
            }}
          >
            <Text style={styles.btnText}>إنشاء إشعار مدين</Text>
          </TouchableOpacity>
        </>
      )}

      {['failed', 'queued', 'issued'].includes(invoice.status) && (
        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={retry}>
          <Text style={styles.btnText}>إعادة إرسال ZATCA</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c23a8c', marginBottom: 12 },
  qrBox: { alignItems: 'center', marginVertical: 20 },
  hint: { marginTop: 8, color: '#666' },
  btn: {
    backgroundColor: '#c23a8c',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  secondary: { backgroundColor: '#50b3c9' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
