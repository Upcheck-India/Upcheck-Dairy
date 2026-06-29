import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import {
    ScreenContainer,
    LanguageSelector,
    ScreenHeader,
    Card,
    PrimaryButton,
    BackButton,
    DotIndicator,
} from "@/components/onboarding";

import {
    Layout,
    Onboarding,
    Radius,
    Shadows,
    Spacing,
} from "@/constants/theme";

import { useOnboarding } from "@/context/OnboardingContext";
import { useLanguage } from "@/context/LanguageContext";

export default function PermissionScreen() {

    const {

        data,

        setField,

        goBack,

        goNext,

    } = useOnboarding();

    const { t } = useLanguage();

    function handleContinue() {

        goNext();

    }

    return (

        <ScreenContainer>

            <LanguageSelector />



            <BackButton
                onPress={goBack}
            />

            <ScreenHeader
                title={t.onboardingPermissionTitle}
                subtitle={t.onboardingPermissionSubtitle}
            />

            <View style={styles.container}>
                {/* Location */}

                <Card style={styles.permissionCard}>

                    <View style={styles.header}>

                        <View style={styles.iconCircle}>

                            <Feather

                                name="map-pin"

                                size={24}

                                color={Onboarding.primary}

                            />

                        </View>

                        <View style={styles.info}>

                            <Text style={styles.title}>
                                {t.onboardingPermissionLocationTitle}
                            </Text>

                            <Text style={styles.subtitle}>
                                {t.onboardingPermissionLocationSubtitle}
                            </Text>

                        </View>

                    </View>

                    <PrimaryButton

                        title={
                            data.locationPermission
                                ? t.onboardingPermissionLocationEnabled
                                : t.onboardingPermissionLocationEnable
                        }

                        icon="navigation"

                        onPress={() =>
                            setField(
                                "locationPermission",
                                !data.locationPermission
                            )
                        }

                    />

                </Card>

                {/* Notifications */}

                <Card style={styles.permissionCard}>

                    <View style={styles.header}>

                        <View style={styles.iconCircle}>

                            <Feather

                                name="bell"

                                size={24}

                                color={Onboarding.primary}

                            />

                        </View>

                        <View style={styles.info}>

                            <Text style={styles.title}>
                                {t.onboardingPermissionNotifTitle}
                            </Text>

                            <Text style={styles.subtitle}>
                                {t.onboardingPermissionNotifSubtitle}
                            </Text>

                        </View>

                    </View>

                    <PrimaryButton

                        title={
                            data.notificationsEnabled
                                ? t.onboardingPermissionNotifEnabled
                                : t.onboardingPermissionNotifEnable
                        }

                        icon="bell"

                        onPress={() =>
                            setField(
                                "notificationsEnabled",
                                !data.notificationsEnabled
                            )
                        }

                    />

                </Card>

            </View>

            <PrimaryButton
                title={t.onboardingPermissionFinish}
                icon="check"
                onPress={handleContinue}
            />

            <DotIndicator />

        </ScreenContainer>

    );

}

const styles = StyleSheet.create({

    container: {

        gap: Spacing.lg,

    },
    permissionCard: {
        ...Shadows.card,

        padding: Layout.cardPadding,
    },

    header: {
        flexDirection: "row",

        alignItems: "flex-start",

        marginBottom: Spacing.lg,
    },

    iconCircle: {
        width: 58,

        height: 58,

        borderRadius: Radius.full,

        backgroundColor: "#ECFDF5",

        justifyContent: "center",

        alignItems: "center",

        marginRight: Spacing.md,
    },

    info: {
        flex: 1,
    },

    title: {
        fontSize: 18,

        fontWeight: "700",

        color: Onboarding.title,

        marginBottom: 6,
    },

    subtitle: {
        fontSize: 14,

        lineHeight: 22,

        color: Onboarding.subtitle,
    },

    footerSpacing: {
        height: 20,
    },
});
