import React from "react";
import { View, StyleSheet } from "react-native";
import BreedingSection from "@/components/BreedingSection";

export function BreedingWorkspace() {
  return (
    <View style={styles.container}>
      <BreedingSection />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
