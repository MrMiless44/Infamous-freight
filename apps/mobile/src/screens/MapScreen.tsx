/**
 * Map Screen - Real-time Navigation and Tracking
 * Shows current route, ETA, and delivery status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

interface RouteInfo {
  distance: number;
  duration: number;
  remainingDistance: number;
  remainingTime: number;
  status: 'in_transit' | 'at_pickup' | 'at_delivery' | 'idle';
  currentLat: number;
  currentLng: number;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
}

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapRef, setMapRef] = useState<MapView | null>(null);

  useEffect(() => {
    loadRouteData();
  }, []);

  const loadRouteData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/api/driver/route`);
      // const data = await response.json();

      const mockRoute: RouteInfo = {
        distance: 245,
        duration: 380,
        remainingDistance: 120,
        remainingTime: 185,
        status: 'in_transit',
        currentLat: 32.7767,
        currentLng: -96.797,
        pickupLat: 32.7555,
        pickupLng: -96.8888,
        deliveryLat: 29.7604,
        deliveryLng: -95.3698,
      };
      setRoute(mockRoute);
    } catch (error) {
      console.error('Error loading route data:', error);
    } finally {
      setLoading(false);
    }
  };

  const centerOnCurrent = () => {
    if (route && mapRef) {
      mapRef.animateToRegion({
        latitude: route.currentLat,
        longitude: route.currentLng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const showFullRoute = () => {
    if (route && mapRef) {
      mapRef.fitToSuppliedMarkers(['current', 'delivery'], {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 200,
          left: 50,
        },
      });
    }
  };

  if (loading || !route) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Map */}
      <MapView
        ref={setMapRef}
        style={styles.map}
        initialRegion={{
          latitude: route.currentLat,
          longitude: route.currentLng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Delivery Marker */}
        <Marker
          identifier="delivery"
          coordinate={{
            latitude: route.deliveryLat,
            longitude: route.deliveryLng,
          }}
          title="Delivery Location"
        >
          <View style={styles.deliveryMarker}>
            <MaterialCommunityIcons name="map-marker" size={30} color={colors.danger} />
          </View>
        </Marker>

        {/* Current Location Marker */}
        <Marker
          identifier="current"
          coordinate={{
            latitude: route.currentLat,
            longitude: route.currentLng,
          }}
          title="Current Location"
        >
          <View style={styles.currentMarker}>
            <View style={styles.currentMarkerInner}>
              <MaterialCommunityIcons name="truck" size={24} color={colors.white} />
            </View>
          </View>
        </Marker>

        {/* Route Line */}
        <Polyline
          coordinates={[
            { latitude: route.currentLat, longitude: route.currentLng },
            { latitude: route.deliveryLat, longitude: route.deliveryLng },
          ]}
          strokeColor={colors.primary}
          strokeWidth={3}
          geodesic
        />
      </MapView>

      {/* ETA Card (Bottom) */}
      <View style={[styles.etaCard, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.etaHeader}>
          <Text style={styles.etaTitle}>Delivery ETA</Text>
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.statusText}>On Time</Text>
          </View>
        </View>

        <View style={styles.etaMain}>
          <Text style={styles.etaTime}>{Math.ceil(route.remainingTime / 60)}m</Text>
          <View style={styles.etaDetails}>
            <View style={styles.etaDetail}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.gray600} />
              <Text style={styles.etaDetailText}>{route.remainingDistance} miles</Text>
            </View>
            <View style={styles.etaSeparator} />
            <View style={styles.etaDetail}>
              <MaterialCommunityIcons name="map-search" size={16} color={colors.gray600} />
              <Text style={styles.etaDetailText}>Via I-45</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={centerOnCurrent}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
            <Text style={styles.quickActionLabel}>Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={showFullRoute}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            <Text style={styles.quickActionLabel}>Route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.callButton]}
            onPress={() => {}}
          >
            <MaterialCommunityIcons name="phone" size={20} color={colors.white} />
            <Text style={[styles.quickActionLabel, styles.callButtonText]}>Call Shipper</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Panel (Top Right) */}
      <View style={[styles.infoPanel, { top: insets.top + spacing.lg }]}>
        <TouchableOpacity
          style={styles.infoPanelButton}
          onPress={() => setRoute({ ...route, status: 'idle' })}
        >
          <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  currentMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  currentMarkerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.danger,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  etaCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  etaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  etaTitle: {
    ...typography.subtitle,
    color: colors.gray900,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  statusText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  etaMain: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  etaTime: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  etaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  etaDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  etaDetailText: {
    ...typography.body,
    color: colors.gray600,
  },
  etaSeparator: {
    width: 1,
    height: 20,
    backgroundColor: colors.gray300,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  callButton: {
    backgroundColor: colors.primary,
  },
  quickActionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  callButtonText: {
    color: colors.white,
  },
  infoPanel: {
    position: 'absolute',
    right: spacing.lg,
  },
  infoPanelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default MapScreen;
