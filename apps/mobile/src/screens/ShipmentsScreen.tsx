/**
 * Shipments/Loads Screen - Browse and Manage Loads
 * Shows available loads with swipe accept/reject
 */

import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
  FlatList,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";

const { width } = Dimensions.get("window");

interface Load {
  id: string;
  pickupCity: string;
  dropoffCity: string;
  miles: number;
  rate: number;
  weight: number;
  postedTime: number; // minutes ago
  loads: number; // # of skids/pallets
  equipment: string;
  deadlineTime?: number; // hours to pickup
  score?: number; // AI score 0-100
}

interface ShipmentsScreenProps {
  navigation: any;
}

export const ShipmentsScreen: React.FC<ShipmentsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"available" | "accepted" | "history">("available");
  const [loads, setLoads] = useState<Load[]>([]);
  const [acceptedLoads, setAcceptedLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlyDirectLoads, setOnlyDirectLoads] = useState(false);
  const [minRate, setMinRate] = useState(0);

  useEffect(() => {
    loadShipments();
  }, [tab]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL;

      if (tab === "available") {
        if (apiBaseUrl) {
          try {
            const query = new URLSearchParams({
              source: "all",
              pickupCity: "Dallas",
              pickupState: "TX",
              dropoffCity: "Houston",
              dropoffState: "TX",
              minRate: String(Math.max(minRate, 0.5)),
              maxMiles: "500",
            });

            const response = await fetch(`${apiBaseUrl}/api/loads/search?${query.toString()}`);
            if (response.ok) {
              const result = await response.json();
              const apiLoads = result?.data?.loads || result?.loads || [];
              if (Array.isArray(apiLoads) && apiLoads.length > 0) {
                const mappedLoads: Load[] = apiLoads.map((load) => ({
                  id: load.id,
                  pickupCity: load.pickupCity || load.origin || "Unknown",
                  dropoffCity: load.dropoffCity || load.destination || "Unknown",
                  miles: load.miles || load.distance || 0,
                  rate: load.rate || load.ratePerMile || 0,
                  weight: load.weight || 0,
                  postedTime: load.postedTime || 0,
                  loads: load.loads || 1,
                  equipment: load.equipment || load.equipmentType || "Dry Van",
                  deadlineTime: load.deadlineTime,
                  score: load.score,
                }));
                setLoads(mappedLoads);
                return;
              }
            }
          } catch (apiError) {
            console.warn("Load board API unavailable, using mock data:", apiError);
          }
        }

        const mockLoads: Load[] = [
          {
            id: "LOAD-001",
            pickupCity: "Dallas, TX",
            dropoffCity: "Houston, TX",
            miles: 245,
            rate: 1.15,
            weight: 42000,
            postedTime: 5,
            loads: 4,
            equipment: "Dry Van",
            deadlineTime: 3,
            score: 92,
          },
          {
            id: "LOAD-002",
            pickupCity: "Houston, TX",
            dropoffCity: "Austin, TX",
            miles: 165,
            rate: 1.08,
            weight: 35000,
            postedTime: 15,
            loads: 3,
            equipment: "Dry Van",
            deadlineTime: 2,
            score: 78,
          },
          {
            id: "LOAD-003",
            pickupCity: "Austin, TX",
            dropoffCity: "San Antonio, TX",
            miles: 82,
            rate: 0.95,
            weight: 28000,
            postedTime: 22,
            loads: 2,
            equipment: "Dry Van",
            score: 65,
          },
        ];
        setLoads(mockLoads);
      } else if (tab === "accepted") {
        const mockAccepted: Load[] = [
          {
            id: "LOAD-A001",
            pickupCity: "Memphis, TN",
            dropoffCity: "Chicago, IL",
            miles: 450,
            rate: 1.45,
            weight: 45000,
            postedTime: 120,
            loads: 5,
            equipment: "Dry Van",
          },
        ];
        setAcceptedLoads(mockAccepted);
      }
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShipments().finally(() => setRefreshing(false));
  };

  const acceptLoad = (load: Load) => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL;
    if (apiBaseUrl) {
      fetch(`${apiBaseUrl}/api/loads/${load.id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "0000000000", comments: "Accepted via mobile app" }),
      }).catch((error) => {
        console.warn("Load accept API failed:", error);
      });
    }
    console.log("Accepting load:", load.id);
    setAcceptedLoads([...acceptedLoads, load]);
    setLoads(loads.filter((l) => l.id !== load.id));
  };

  const rejectLoad = (load: Load) => {
    setLoads(loads.filter((l) => l.id !== load.id));
  };

  const renderLoadCard = (
    load: Load,
    onAccept?: (load: Load) => void,
    onReject?: (load: Load) => void,
  ) => (
    <View key={load.id} style={styles.loadCard}>
      {/* Score Badge (if available) */}
      {load.score && (
        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: load.score > 80 ? colors.success : colors.warning },
          ]}
        >
          <Text style={styles.scoreBadgeText}>{load.score}</Text>
        </View>
      )}

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeCity}>
          <MaterialCommunityIcons name="circle" size={12} color={colors.primary} />
          <Text style={styles.routeText}>{load.pickupCity}</Text>
        </View>

        <View style={styles.routeLine}>
          <Text style={styles.mileageText}>{load.miles} mi</Text>
        </View>

        <View style={styles.routeCity}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.warning} />
          <Text style={styles.routeText}>{load.dropoffCity}</Text>
        </View>
      </View>

      {/* Load Details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="cube" size={16} color={colors.gray600} />
          <Text style={styles.detailLabel}>Load</Text>
          <Text style={styles.detailValue}>{load.loads}</Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="weight" size={16} color={colors.gray600} />
          <Text style={styles.detailLabel}>Weight</Text>
          <Text style={styles.detailValue}>{(load.weight / 1000).toFixed(0)}K</Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="truck" size={16} color={colors.gray600} />
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {load.equipment}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="clock" size={16} color={colors.gray600} />
          <Text style={styles.detailLabel}>Posted</Text>
          <Text style={styles.detailValue}>{load.postedTime}m ago</Text>
        </View>
      </View>

      {/* Rate and Actions */}
      <View style={styles.rateContainer}>
        <View>
          <Text style={styles.rateLabel}>Rate</Text>
          <Text style={styles.rateAmount}>${(load.miles * load.rate).toFixed(2)}</Text>
          <Text style={styles.ratePerMile}>${load.rate.toFixed(2)}/mi</Text>
        </View>

        {onAccept && onReject && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(load)}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => onAccept(load)}
            >
              <MaterialCommunityIcons name="check" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {load.deadlineTime !== undefined && (
        <View style={styles.deadline}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={colors.warning} />
          <Text style={styles.deadlineText}>Pickup in {load.deadlineTime} hours</Text>
        </View>
      )}
    </View>
  );

  if (loading && tab === "available" && loads.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === "available" && styles.tabActive]}
          onPress={() => setTab("available")}
        >
          <Text style={[styles.tabText, tab === "available" && styles.tabTextActive]}>
            Available
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === "accepted" && styles.tabActive]}
          onPress={() => setTab("accepted")}
        >
          <Text style={[styles.tabText, tab === "accepted" && styles.tabTextActive]}>
            My Loads ({acceptedLoads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === "history" && styles.tabActive]}
          onPress={() => setTab("history")}
        >
          <Text style={[styles.tabText, tab === "history" && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Filters (Available tab only) */}
      {tab === "available" && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Direct Loads Only</Text>
            <Switch
              value={onlyDirectLoads}
              onValueChange={setOnlyDirectLoads}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={colors.primary}
            />
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.scrollView}
      >
        {tab === "available" && (
          <View style={styles.loadsContainer}>
            {loads.length > 0 ? (
              loads.map((load) => renderLoadCard(load, acceptLoad, rejectLoad))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="inbox" size={48} color={colors.gray400} />
                <Text style={styles.emptyStateText}>No loads available right now</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                  <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {tab === "accepted" && (
          <View style={styles.loadsContainer}>
            {acceptedLoads.length > 0 ? (
              acceptedLoads.map((load) => renderLoadCard(load))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="truck-check" size={48} color={colors.gray400} />
                <Text style={styles.emptyStateText}>You haven't accepted any loads yet</Text>
              </View>
            )}
          </View>
        )}

        {tab === "history" && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={48} color={colors.gray400} />
            <Text style={styles.emptyStateText}>Load history coming soon</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.gray600,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    padding: spacing.lg,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterLabel: {
    ...typography.body,
    color: colors.gray900,
  },
  scrollView: {
    flex: 1,
  },
  loadsContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  loadCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scoreBadge: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreBadgeText: {
    ...typography.button,
    color: colors.white,
    fontWeight: "700",
  },
  routeContainer: {
    marginBottom: spacing.md,
    paddingRight: spacing.xl,
  },
  routeCity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  routeText: {
    ...typography.body,
    color: colors.gray900,
    fontWeight: "600",
  },
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  mileageText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.gray200,
    borderBottomColor: colors.gray200,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  detailValue: {
    ...typography.body,
    color: colors.gray900,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  rateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  rateLabel: {
    ...typography.caption,
    color: colors.gray600,
  },
  rateAmount: {
    ...typography.h2,
    color: colors.success,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  ratePerMile: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: "600",
  },
  deadline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  deadlineText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 3,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.gray600,
    marginTop: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

export default ShipmentsScreen;
