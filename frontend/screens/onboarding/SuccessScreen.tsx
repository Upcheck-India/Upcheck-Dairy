import React, { useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    View,
    Alert,
    Pressable,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import {
    ScreenContainer,
    PrimaryButton,
    Card,
    DotIndicator,
} from "@/components/onboarding";

import {
    Layout,
    Onboarding,
    Spacing,
} from "@/constants/theme";

import { useFarmer } from "@/context/FarmerContext";
import { useDatabase } from "@/context/DatabaseContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useLanguage } from "@/context/LanguageContext";

export default function SuccessScreen() {
    const { farmer, createProfile } = useFarmer();
    const { addAnimal } = useDatabase();
    const { data, goToStep } = useOnboarding();
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);

    const animalTypeNames: Record<string, string> = {
        cow: t.onboardingAnimalCow,
        buffalo: t.onboardingAnimalBuffalo,
        goat: t.onboardingAnimalGoat,
        calf: t.onboardingAnimalCalf,
        bull: t.onboardingAnimalBull,
        other: t.onboardingAnimalOthers,
    };

    async function handleContinue() {
        setSaving(true);
        try {
            // 1. Save profile details to backend & context
            await createProfile({
                name: data.ownerName,
                phone: data.phone,
                village: data.village,
                district: data.district,
                state: data.state,
                farmName: data.farmName,
            });

            // 2. Add animals to the local database
            const farmerId = farmer?.id || "";
            const animalEntries = Object.entries(data.animals);

            for (const [type, count] of animalEntries) {
                if (count > 0) {
                    for (let i = 1; i <= count; i++) {
                        // Generate animal name
                        const name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${i}`;

                        // Map standard animal type
                        let dbType: 'cow' | 'buffalo' | 'calf' = 'cow';
                        if (type === 'buffalo') dbType = 'buffalo';
                        else if (type === 'calf') dbType = 'calf';

                        await addAnimal({
                            farmerId,
                            name,
                            type: dbType,
                            breed: "Jersey",
                            tagNumber: `TAG-${type.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
                            photoUri: "",
                            healthStatus: "healthy",
                            notes: "Added during onboarding setup",
                            birthDate: Date.now() - 365 * 24 * 60 * 60 * 1000 * 3, // 3 years old
                            lactationNumber: 1,
                            lastCalvingDate: 0,
                            expectedCalvingDate: 0,
                            isPregnant: false,
                            bodyConditionScore: 3.5,
                            weightKg: 400,
                            lastMilkEntryDate: 0,
                            lastMilkQuantity: 0,
                        } as any);
                    }
                }
            }

            router.replace("/(tabs)" as any);
        } catch (err: any) {
            Alert.alert("Error completing setup", err.message || "Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <ScreenContainer>
            <View style={styles.container}>
                <Image
                    source={require("@/assets/images/onboarding/success-shield.png")}
                    resizeMode="contain"
                    style={styles.image}
                />

                <Text style={styles.title}>
                    {t.onboardingSuccessTitle}
                </Text>

                <Text style={styles.subtitle}>
                    {t.onboardingSuccessSubtitle}
                </Text>

                <Card style={styles.summaryCard}>
                    {/* Farm Name */}
                    <View style={styles.summaryItem}>
                        <View style={styles.iconWrapper}>
                            <Feather name="home" size={18} color="#138A4A" />
                        </View>
                        <View style={styles.summaryDetails}>
                            <Text style={styles.summaryLabel}>{t.onboardingSuccessFarmName}</Text>
                            <Text style={styles.summaryValue}>
                                {data.farmName.trim() || `${data.ownerName.trim()} ${t.onboardingSuccessDefaultFarmSuffix}`}
                            </Text>
                        </View>
                    </View>

                    {/* Location */}
                    <View style={[styles.summaryItem, styles.borderTop]}>
                        <View style={styles.iconWrapper}>
                            <Feather name="map-pin" size={18} color="#138A4A" />
                        </View>
                        <View style={styles.summaryDetails}>
                            <Text style={styles.summaryLabel}>{t.onboardingSuccessLocation}</Text>
                            <Text style={styles.summaryValue}>
                                {`${data.village.trim()}, ${data.district.trim()}, ${data.state.trim()}`}
                            </Text>
                        </View>
                    </View>

                    {/* Animals Added */}
                    <View style={[styles.summaryItem, styles.borderTop, { marginBottom: 0 }]}>
                        <View style={styles.iconWrapper}>
                            <Feather name="clipboard" size={18} color="#138A4A" />
                        </View>
                        <View style={styles.summaryDetails}>
                            <Text style={styles.summaryLabel}>{t.onboardingSuccessAnimalsAdded}</Text>
                            <Text style={styles.summaryValue}>
                                {Object.entries(data.animals)
                                    .filter(([_, val]) => val > 0)
                                    .map(([key, val]) => `${animalTypeNames[key] || key} (${val})`)
                                    .join(", ")}
                            </Text>
                        </View>
                    </View>
                </Card>

                <PrimaryButton
                    title={t.onboardingSuccessGoDashboard}
                    icon="arrow-right"
                    loading={saving}
                    onPress={handleContinue}
                />

                <Pressable
                    style={styles.reviewButton}
                    onPress={() => goToStep(1)}
                    disabled={saving}
                >
                    <Text style={styles.reviewText}>{t.onboardingSuccessReviewDetails}</Text>
                </Pressable>

                <DotIndicator />
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "stretch",
        paddingVertical: 20,
    },
    image: {
        width: Layout.imageSize,
        height: Layout.imageSize,
        alignSelf: "center",
        marginTop: -10,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: Onboarding.title,
        textAlign: "center",
    },
    subtitle: {
        marginTop: Spacing.sm,
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        color: Onboarding.subtitle,
        marginBottom: Spacing.lg,
    },
    summaryCard: {
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E5ECE7",
        marginBottom: Spacing.md,
    },
    summaryItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    iconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#EAF8EF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    summaryDetails: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 2,
        fontWeight: "500",
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F3B2F",
    },
    reviewButton: {
        marginTop: 16,
        paddingVertical: 8,
        alignSelf: "center",
    },
    reviewText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#138A4A",
    },
});