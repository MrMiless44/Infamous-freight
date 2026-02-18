---
name: Mobile Development
description: Build native iOS/Android apps using React Native and Expo with TypeScript
applyTo:
  - apps/mobile/**/*
keywords:
  - react-native
  - expo
  - typescript
  - ios
  - android
  - mobile
  - navigation
  - api-integration
---

# Mobile Development Skill

## 📋 Quick Rules

1. **Framework**: React Native + Expo (TypeScript)
2. **Build System**: Expo CLI & EAS Build
3. **Navigation**: React Navigation v6+
4. **API**: REST calls to same backend as Web
5. **Shared Types**: Import from `@infamous-freight/shared`

## 📁 Project Structure

```
apps/mobile/
├── src/
│   ├── api/              # API integration
│   ├── components/       # Reusable components
│   ├── hooks/            # Custom hooks
│   ├── navigation/       # Navigation stacks
│   ├── screens/          # Screen components
│   ├── context/          # Context providers
│   └── utils/            # Utilities & helpers
├── app.json              # Expo configuration
├── eas.json              # EAS Build config
└── package.json
```

## 🚀 Setup & Development

### Initialize New Project

```bash
expo create infamous-freight-mobile
cd infamous-freight-mobile
npx create-expo-app@latest --template

# Install navigation
expo install @react-navigation/native @react-navigation/stack
expo install react-native-screens react-native-safe-area-context
```

### Run Locally

```bash
# Development server
expo start

# iOS simulator
expo start --ios

# Android emulator
expo start --android

# Web (experimental)
expo start --web
```

## 📱 Navigation Pattern

```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ShipmentDetailsScreen from '../screens/ShipmentDetailsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {isSignedIn ? (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Shipments' }}
            />
            <Stack.Screen 
              name="ShipmentDetails" 
              component={ShipmentDetailsScreen}
              options={({ route }) => ({ 
                title: route.params.shipment.trackingNum 
              })}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 🔌 API Integration

```typescript
// apps/mobile/src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '@infamous-freight/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add JWT token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => response.data as ApiResponse,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
    }
    throw error;
  }
);

export default apiClient;
```

### API Hooks

```typescript
// apps/mobile/src/hooks/useApi.ts
import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export function useShipments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/shipments');
        setData(response.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}
```

## 📝 Screen Component Example

```typescript
// apps/mobile/src/screens/ShipmentsScreen.tsx
import React from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Shipment } from '@infamous-freight/shared';
import { useShipments } from '../hooks/useApi';

export default function ShipmentsScreen({ navigation }) {
  const { data, loading, error } = useShipments();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('ShipmentDetails', { shipment: item })
            }
          >
            <Text style={styles.tracking}>{item.trackingNum}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  tracking: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  status: { fontSize: 12, color: '#666' },
  error: { fontSize: 16, color: 'red' },
});
```

## 🔐 Authentication

```typescript
// apps/mobile/src/context/AuthContext.tsx
import React, { createContext, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

interface AuthContextType {
  isSignedIn: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });
      
      if (response.success) {
        const token = response.data.token;
        await SecureStore.setItemAsync('authToken', token);
        setUser(response.data.user);
        setIsSignedIn(true);
      }
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
    setIsSignedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## 🏗️ Build & Release

### EAS Configuration

```json
{
  "cli": {
    "version": ">= 5.4.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview2": {
      "android": {
        "buildType": "aab"
      }
    },
    "production": {}
  },
  "submit": {
    "production": {
      "ios": true,
      "android": true
    }
  }
}
```

### Build & Submit

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## 🧪 Testing

```bash
# Jest tests
npm test

# E2E with Detox
detox build-framework-cache
detox build-app --configuration ios.sim.debug
detox test e2e --configuration ios.sim.debug
```

## 📋 Essential Libraries

```json
{
  "react-native": "^0.73.0",
  "expo": "^50.0.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "axios": "^1.6.0",
  "expo-secure-store": "^12.3.0",
  "zustand": "^4.4.0"
}
```

## 🔗 Resources

- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation Docs](https://reactnavigation.org)
- [EAS Docs](https://docs.expo.dev/build/introduction/)
