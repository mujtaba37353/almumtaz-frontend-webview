import { Stack } from 'expo-router';
import { colors } from '../../theme/tokens';

export default function ManageSessionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}
