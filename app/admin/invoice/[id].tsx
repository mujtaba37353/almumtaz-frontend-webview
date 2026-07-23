import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../../api/axiosInstance';
import QRCode from 'react-native-qrcode-svg';
import {
  Screen,
  Surface,
  Button,
  PageHeader,
  StatusBadge,
  EmptyState,
  colors,
  space,
  textStyles,
} from '../../../components/ui';

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
      <Screen scroll={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!invoice) {
    return (
      <Screen scroll={false} contentStyle={styles.centered}>
        <EmptyState title="الفاتورة غير موجودة" />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`${invoice.invoiceType} / ${invoice.documentType}`}
        right={<StatusBadge label={invoice.status} active={invoice.status === 'cleared' || invoice.status === 'reported'} />}
      />

      <Surface>
        <Text style={styles.rowLabel}>UUID</Text>
        <Text style={styles.rowValue}>{invoice.uuid}</Text>

        <Text style={styles.rowLabel}>الصافي</Text>
        <Text style={styles.rowValue}>{Number(invoice.netAmount).toFixed(2)} ر.س</Text>

        <Text style={styles.rowLabel}>الضريبة</Text>
        <Text style={styles.rowValue}>{Number(invoice.vatAmount).toFixed(2)} ر.س</Text>

        <Text style={styles.rowLabel}>الإجمالي</Text>
        <Text style={styles.total}>{Number(invoice.totalAmount).toFixed(2)} ر.س</Text>

        {invoice.qrBase64 ? (
          <View style={styles.qrBox}>
            <QRCode value={invoice.qrBase64} size={180} />
            <Text style={styles.hint}>رمز QR للفاتورة (TLV Base64)</Text>
          </View>
        ) : null}

        <Button
          title="مشاركة الإيصال"
          onPress={() =>
            Share.share({
              message: `فاتورة ${invoice.invoiceNumber}\nالإجمالي: ${invoice.totalAmount} SAR\nQR: ${invoice.qrBase64}`,
            })
          }
          style={{ marginTop: space.lg }}
        />

        {invoice.documentType === 'invoice' && (
          <>
            <Button title="إنشاء إشعار دائن (مرتجع)" variant="secondary" onPress={creditNote} style={{ marginTop: space.md }} />
            <Button
              title="إنشاء إشعار مدين"
              variant="secondary"
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
              style={{ marginTop: space.md }}
            />
          </>
        )}

        {['failed', 'queued', 'issued'].includes(invoice.status) && (
          <Button title="إعادة إرسال ZATCA" variant="secondary" onPress={retry} style={{ marginTop: space.md }} />
        )}
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
  rowLabel: {
    ...textStyles.label,
    marginTop: space.md,
  },
  rowValue: {
    ...textStyles.body,
    marginTop: space.xs,
  },
  total: {
    ...textStyles.title,
    color: colors.brandDeep,
    marginTop: space.xs,
  },
  qrBox: {
    alignItems: 'center',
    marginTop: space.xl,
  },
  hint: {
    ...textStyles.subtitle,
    marginTop: space.sm,
  },
});
