import { Stack } from 'expo-router';

export default function ManageSessionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // بدون هيدر
        animation: 'none',  // لا أنيميشن عند التنقل
      }}
    />
  );
}
