import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, space } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PageHeader({ title, subtitle, right, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: space.xl,
    gap: space.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...textStyles.title,
  },
  subtitle: {
    ...textStyles.subtitle,
    marginTop: space.xs,
  },
  right: {
    flexShrink: 0,
  },
});
