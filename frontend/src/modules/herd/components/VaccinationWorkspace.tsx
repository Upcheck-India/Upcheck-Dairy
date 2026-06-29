import React from "react";
import { View, StyleSheet } from "react-native";
import VaccinationSection from "@/components/VaccinationSection";

export function VaccinationWorkspace() {
  return (
    <View style={styles.container}>
      <VaccinationSection />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
