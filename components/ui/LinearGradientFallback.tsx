import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

/** Lightweight two-tone canvas without extra gradient deps */
export function LinearGradientFallback({
  children,
  style,
  colors: stops = [colors.canvas, colors.canvasAlt],
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: string[];
}) {
  return (
    <View style={[styles.base, { backgroundColor: stops[0] }, style]}>
      <View style={[styles.wash, { backgroundColor: stops[1] || colors.canvasAlt }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    opacity: 0.45,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
