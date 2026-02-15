/**
 * Account Screen - Driver Profile and Settings
 * Manages profile info, payment methods, preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

interface DriverProfile {
  name: string;
  email: string;
  phone: string;
  rating: number;
  totalJobs: number;
  accountStatus: 'active' | 'suspended' | 'pending';
}

interface AccountScreenProps {
  navigation: any;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoAcceptDirect, setAutoAcceptDirect] = useState(false);
  const [showOnMap, setShowOnMap] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/api/driver/profile`);
      // const data = await response.json();

      const mockProfile: DriverProfile = {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        rating: 4.8,
        totalJobs: 156,
        accountStatus: 'active',
      };
      setProfile(mockProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          // TODO: Call logout API and clear session
          navigation.replace('Login');
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>JS</Text>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
            <Text style={styles.rating}>{profile.rating}</Text>
            <Text style={styles.ratingCount}>({profile.totalJobs} jobs)</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: profile.accountStatus === 'active' ? colors.successLight : colors.warningLight }]}>
            <Text style={[styles.statusText, { color: profile.accountStatus === 'active' ? colors.success : colors.warning }]}>
              {profile.accountStatus.charAt(0).toUpperCase() + profile.accountStatus.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Contact Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{profile.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{profile.phone}</Text>
        </View>
      </View>

      {/* Documents Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents & Compliance</Text>
        
        <TouchableOpacity style={styles.documentRow}>
          <MaterialCommunityIcons name="file-document" size={20} color={colors.primary} />
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>Driver's License</Text>
            <Text style={styles.documentStatus}>Verified • Expires 12/2028</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.documentRow}>
          <MaterialCommunityIcons name="security" size={20} color={colors.primary} />
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>Background Check</Text>
            <Text style={styles.documentStatus}>Verified • Updated 02/2025</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.documentRow}>
          <MaterialCommunityIcons name="car" size={20} color={colors.primary} />
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>Vehicle Registration</Text>
            <Text style={styles.documentStatus}>Verified • Expires 08/2025</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <MaterialCommunityIcons name="bell" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.gray300, true: colors.primaryLight }}
            thumbColor={colors.primary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Email Notifications</Text>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: colors.gray300, true: colors.primaryLight }}
            thumbColor={colors.primary}
          />
        </View>
      </View>

      {/* Load Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Load Preferences</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.primary} />
            <View>
              <Text style={styles.settingLabel}>Auto-Accept Direct Loads</Text>
              <Text style={styles.settingDescription}>Automatically accept posted loads over $2/mile</Text>
            </View>
          </View>
          <Switch
            value={autoAcceptDirect}
            onValueChange={setAutoAcceptDirect}
            trackColor={{ false: colors.gray300, true: colors.primaryLight }}
            thumbColor={colors.primary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <MaterialCommunityIcons name="map" size={20} color={colors.primary} />
            <View>
              <Text style={styles.settingLabel}>Show My Location</Text>
              <Text style={styles.settingDescription}>Shippers can see where you are</Text>
            </View>
          </View>
          <Switch
            value={showOnMap}
            onValueChange={setShowOnMap}
            trackColor={{ false: colors.gray300, true: colors.primaryLight }}
            thumbColor={colors.primary}
          />
        </View>
      </View>

      {/* Payment Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        
        <TouchableOpacity style={styles.paymentRow}>
          <MaterialCommunityIcons name="bank" size={20} color={colors.primary} />
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Bank Account</Text>
            <Text style={styles.paymentStatus}>Checking •••• 4567</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.paymentRow}>
          <MaterialCommunityIcons name="credit-card" size={20} color={colors.primary} />
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Add Payment Method</Text>
            <Text style={styles.paymentStatus}>PayPal, Stripe, ACH</Text>
          </View>
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        
        <TouchableOpacity style={styles.helpRow}>
          <MaterialCommunityIcons name="help-circle" size={20} color={colors.primary} />
          <Text style={styles.helpText}>Help Center</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpRow}>
          <MaterialCommunityIcons name="chat" size={20} color={colors.primary} />
          <Text style={styles.helpText}>Contact Support</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpRow}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
          <Text style={styles.helpText}>Terms & Privacy</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.gray400} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatar: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  rating: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '600',
  },
  ratingCount: {
    ...typography.caption,
    color: colors.gray600,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.gray900,
    flex: 1,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...typography.body,
    color: colors.gray900,
    fontWeight: '600',
  },
  documentStatus: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  settingLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.gray900,
    fontWeight: '600',
  },
  settingDescription: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    ...typography.body,
    color: colors.gray900,
    fontWeight: '600',
  },
  paymentStatus: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  helpText: {
    ...typography.body,
    color: colors.gray900,
    flex: 1,
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.danger,
    fontWeight: '600',
  },
});

export default AccountScreen;
