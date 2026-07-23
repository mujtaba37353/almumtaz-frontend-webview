import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, space } from '../../theme/tokens';
import { typography } from '../../theme/tokens';

export function StatusBadge({
  active,
  label,
}: {
  active?: boolean;
  label?: string;
}) {
  const isActive = active !== false;
  return (
    <View style={[styles.badge, isActive ? styles.on : styles.off]}>
      <Text style={[styles.text, isActive ? styles.textOn : styles.textOff]}>
        {label || (isActive ? 'نشط' : 'غير نشط')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  on: {
    backgroundColor: 'rgba(31, 138, 91, 0.12)',
  },
  off: {
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
  },
  text: {
    fontFamily: typography.fontArMd,
    fontSize: typography.sizeXs,
  },
  textOn: { color: colors.success },
  textOff: { color: colors.danger },
});
