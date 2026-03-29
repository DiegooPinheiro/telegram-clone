import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import RegisterScreen from '../screens/RegisterScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';
import TwoStepVerifyPasswordScreen from '../screens/TwoStepVerifyPassword';
import TwoStepSuccessScreen from '../screens/TwoStepSuccessScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AuthNavigatorProps {
  initialRoute?: keyof RootStackParamList;
  twoStepParams?: RootStackParamList['TwoStepVerifyPassword'];
}

export default function AuthNavigator({ initialRoute = 'PhoneVerification', twoStepParams }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute as any}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen
        name="TwoStepVerifyPassword"
        component={TwoStepVerifyPasswordScreen}
        initialParams={twoStepParams}
      />
      <Stack.Screen name="TwoStepSuccess" component={TwoStepSuccessScreen} />
    </Stack.Navigator>
  );
}
