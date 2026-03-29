import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import RegisterScreen from '../screens/RegisterScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AuthNavigatorProps {
  initialRoute?: keyof RootStackParamList;
}

export default function AuthNavigator({ initialRoute = 'PhoneVerification' }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute as any}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
    </Stack.Navigator>
  );
}
