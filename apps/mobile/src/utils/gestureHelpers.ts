/**
 * Mobile Gesture Helper - Enhanced UX for Mobile Interactions
 * Provides swipe, long-press, and other gesture utilities
 */

import { useRef, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Animated, GestureResponderEvent, PanResponder } from "react-native";

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  haptic?: boolean;
}

/**
 * Hook for handling swipe gestures with haptic feedback
 */
export const useSwipeGesture = (config: SwipeConfig) => {
  const { threshold = 50, haptic = true } = config;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;

        // Horizontal swipes
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > threshold && config.onSwipeRight) {
            if (haptic) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            config.onSwipeRight();
          } else if (dx < -threshold && config.onSwipeLeft) {
            if (haptic) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            config.onSwipeLeft();
          }
        }
        // Vertical swipes
        else {
          if (dy > threshold && config.onSwipeDown) {
            if (haptic) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            config.onSwipeDown();
          } else if (dy < -threshold && config.onSwipeUp) {
            if (haptic) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            config.onSwipeUp();
          }
        }
      },
    }),
  ).current;

  return panResponder.panHandlers;
};

/**
 * Hook for handling long press with haptic feedback
 */
export const useLongPress = (
  onLongPress: () => void,
  duration: number = 500,
  haptic: boolean = true,
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      onLongPress();
    }, duration);
  }, [onLongPress, duration, haptic]);

  const handlePressOut = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  };
};

/**
 * Hook for animated button press effect
 */
export const usePressAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  return {
    scale,
    animateIn,
    animateOut,
  };
};

/**
 * Provides haptic feedback for different interaction types
 */
export const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "warning" | "error") => {
  switch (type) {
    case "light":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case "medium":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case "heavy":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case "success":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case "warning":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case "error":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
};

export default {
  useSwipeGesture,
  useLongPress,
  usePressAnimation,
  triggerHaptic,
};
