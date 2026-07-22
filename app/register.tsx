import { Redirect } from 'expo-router';

/** Signup flow is subscriptions → create-account */
export default function RegisterRedirect() {
  return <Redirect href="/subscriptions" />;
}
