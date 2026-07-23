import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
  RefreshControlProps,
} from 'react-native';
import { LinearGradientFallback } from './LinearGradientFallback';
import { colors, space } from '../../theme/tokens';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  padded = true,
  refreshControl,
}: Props) {
  const pad = padded ? styles.padded : null;

  return (
    <LinearGradientFallback style={[styles.root, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, pad, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, pad, contentStyle]}>{children}</View>
      )}
    </LinearGradientFallback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  fill: {
    flex: 1,
  },
  padded: {
    padding: space.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: space.xxl,
  },
});
