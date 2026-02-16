// apps/mobile/src/screens/OnboardingScreen.tsx

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBar from "../components/ProgressBar";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    userType: "shipper", // shipper | driver
  });

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Infamous Freight",
      description: "Let's get your account set up in a few simple steps",
      component: <WelcomeStep />,
    },
    {
      id: "profile",
      title: "Your Profile",
      description: "Tell us about yourself",
      component: <ProfileStep data={formData} onChange={setFormData} />,
    },
    {
      id: "account-type",
      title: "Account Type",
      description: "What will you use Infamous Freight for?",
      component: <AccountTypeStep data={formData} onChange={setFormData} />,
    },
    {
      id: "permissions",
      title: "Permissions",
      description: "We need access to your location for tracking",
      component: <PermissionsStep />,
    },
    {
      id: "complete",
      title: "All Set!",
      description: "Your account is ready to use",
      component: <CompleteStep />,
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Save onboarding data
      await AsyncStorage.setItem(
        "onboarding_complete",
        JSON.stringify({
          ...formData,
          completedAt: new Date().toISOString(),
        }),
      );

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const step = steps[currentStep];

  return (
    <View style={styles.container}>
      <ProgressBar current={currentStep + 1} total={steps.length} style={styles.progress} />

      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        <View style={styles.stepContent}>{step.component}</View>

        <View style={styles.buttons}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function WelcomeStep() {
  return (
    <View style={{ paddingVertical: 20 }}>
      <Text style={{ fontSize: 16, textAlign: "center" }}>
        Ship smarter, deliver faster. Welcome to Infamous Freight - your all-in-one shipping
        solution.
      </Text>
    </View>
  );
}

function ProfileStep({ data, onChange }: any) {
  return (
    <View style={{ gap: 15 }}>
      <TextField
        label="Full Name"
        value={data.fullName}
        onChangeText={(fullName) => onChange({ ...data, fullName })}
        placeholder="John Doe"
      />
      <TextField
        label="Email"
        value={data.email}
        onChangeText={(email) => onChange({ ...data, email })}
        placeholder="john@example.com"
        keyboardType="email-address"
      />
      <TextField
        label="Phone"
        value={data.phone}
        onChangeText={(phone) => onChange({ ...data, phone })}
        placeholder="(555) 123-4567"
      />
      <TextField
        label="Company"
        value={data.company}
        onChangeText={(company) => onChange({ ...data, company })}
        placeholder="Your Company"
      />
    </View>
  );
}

function AccountTypeStep({ data, onChange }: any) {
  return (
    <View style={{ gap: 10 }}>
      <AccountTypeButton
        selected={data.userType === "shipper"}
        onPress={() => onChange({ ...data, userType: "shipper" })}
        title="Shipper"
        description="I need to ship packages"
      />
      <AccountTypeButton
        selected={data.userType === "driver"}
        onPress={() => onChange({ ...data, userType: "driver" })}
        title="Driver"
        description="I want to deliver packages"
      />
    </View>
  );
}

function PermissionsStep() {
  return (
    <View style={{ gap: 10 }}>
      <PermissionItem
        title="Location"
        description="Access to real-time GPS for tracking"
        icon="📍"
      />
      <PermissionItem
        title="Notifications"
        description="Get updates about your shipments"
        icon="🔔"
      />
    </View>
  );
}

function CompleteStep() {
  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }}>
      <Text style={{ fontSize: 48, marginBottom: 10 }}>✓</Text>
      <Text style={{ fontSize: 16, textAlign: "center" }}>
        Your account is all set up and ready to use!
      </Text>
    </View>
  );
}

function TextField({ label, ...props }: any) {
  return (
    <View>
      <Text style={{ fontWeight: "600", marginBottom: 5 }}>{label}</Text>
      <View style={styles.input}></View>
    </View>
  );
}

function AccountTypeButton({ selected, title, description, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.typeButton, selected && styles.typeButtonSelected]}
      onPress={onPress}
    >
      <Text style={{ fontWeight: "600" }}>{title}</Text>
      <Text style={{ fontSize: 12, color: "#666" }}>{description}</Text>
    </TouchableOpacity>
  );
}

function PermissionItem({ title, description, icon }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10 }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <View>
        <Text style={{ fontWeight: "600" }}>{title}</Text>
        <Text style={{ fontSize: 12, color: "#666" }}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  progress: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  stepContent: {
    flex: 1,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
  },
  nextButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    height: 44,
  },
  typeButton: {
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
  },
  typeButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
});
