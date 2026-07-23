import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: space.xxl,
    alignItems: 'center',
  },
  title: {
    ...textStyles.subtitle,
    color: colors.text,
    fontSize: 16,
  },
  subtitle: {
    ...textStyles.subtitle,
    marginTop: space.sm,
    textAlign: 'center',
  },
});
