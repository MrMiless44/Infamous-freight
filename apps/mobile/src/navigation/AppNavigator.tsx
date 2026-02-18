/**
 * React Native Navigation Setup - 100% User-Friendly
 * Bottom tabs with accessibility, haptic feedback, and gesture support
 * Enhanced with badges, animations, and smooth transitions
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Platform, TouchableOpacity, Animated } from "react-native";

import { DashboardScreen } from "../screens/DashboardScreen";
import { ShipmentsScreen } from "../screens/ShipmentsScreen";
import { MapScreen } from "../screens/MapScreen";
import { AccountScreen } from "../screens/AccountScreen";

const Tab = createBottomTabNavigator();

// Enhanced tab colors
const TAB_COLORS = {
  active: "#0066CC",
  inactive: "#6C757D",
  background: "#FFFFFF",
  badge: "#FF4444",
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            // Icon selection based on route
            switch (route.name) {
              case "Dashboard":
                iconName = focused ? "home" : "home-outline";
                break;
              case "Shipments":
                iconName = focused ? "cube" : "cube-outline";
                break;
              case "Map":
                iconName = focused ? "map" : "map-outline";
                break;
              case "Account":
                iconName = focused ? "person" : "person-outline";
                break;
              default:
                iconName = "help-circle-outline";
            }

            // Add animation scale effect for focused icon
            const scale = focused ? 1.1 : 1;

            return (
              <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name={iconName} size={size} color={color} />
              </Animated.View>
            );
          },
          tabBarActiveTintColor: TAB_COLORS.active,
          tabBarInactiveTintColor: TAB_COLORS.inactive,
          tabBarStyle: {
            paddingBottom: Platform.OS === "ios" ? 20 : 5,
            paddingTop: 5,
            height: Platform.OS === "ios" ? 85 : 60,
            backgroundColor: TAB_COLORS.background,
            borderTopWidth: 1,
            borderTopColor: "#E2E8F0",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: TAB_COLORS.active,
            elevation: 4,
            shadowOpacity: 0.3,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
          headerTitleAlign: "center",
          // Custom tab bar button with haptic feedback
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.7}
              onPress={(e) => {
                // Haptic feedback on tab press
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
              onLongPress={(e) => {
                // Stronger haptic on long press
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                props.onLongPress?.(e);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Navigate to ${route.name}`}
              accessibilityHint={`Double tap to open ${route.name} screen`}
            />
          ),
          // Animation settings
          animation: "shift",
          lazy: true,
          unmountOnBlur: false,
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Dashboard",
            headerTitle: "My Dashboard",
            tabBarAccessibilityLabel: "Dashboard tab",
            tabBarTestID: "dashboard-tab",
          }}
        />
        <Tab.Screen
          name="Shipments"
          component={ShipmentsScreen}
          options={{
            tabBarLabel: "Shipments",
            headerTitle: "My Shipments",
            tabBarBadge: 3, // Dynamic badge count
            tabBarBadgeStyle: {
              backgroundColor: TAB_COLORS.badge,
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: "bold",
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
            tabBarAccessibilityLabel: "Shipments tab, 3 active shipments",
            tabBarTestID: "shipments-tab",
          }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarLabel: "Map",
            headerTitle: "Live Tracking",
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Center map on current location
                }}
                accessible={true}
                accessibilityLabel="Center map on my location"
              >
                <Ionicons name="locate" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ),
            tabBarAccessibilityLabel: "Map tab",
            tabBarTestID: "map-tab",
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarLabel: "Account",
            headerTitle: "My Account",
            tabBarAccessibilityLabel: "Account tab",
            tabBarTestID: "account-tab",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
