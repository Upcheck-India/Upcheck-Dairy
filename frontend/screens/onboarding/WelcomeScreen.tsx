import React from "react";

import {
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";

import {
    ScreenContainer,
    LanguageSelector,
    PrimaryButton,
    DotIndicator,
    FeatureCard,
} from "@/components/onboarding";

import {
    Layout,
    Onboarding,
    Spacing,
    Typography,
} from "@/constants/theme";

import { useOnboarding } from "@/context/OnboardingContext";
import { useLanguage } from "@/context/LanguageContext";

export default function WelcomeScreen() {

    const {

        goNext,

    } = useOnboarding();

    const { t } = useLanguage();

    function handleContinue() {

        goNext();

    }

    return (

        <ScreenContainer>

            {/* Language */}

            <LanguageSelector />

            {/* Logo */}
            <View style={styles.logoContainer}>
                <Image
                    source={require("@/assets/images/logo.png")}
                    resizeMode="contain"
                    style={styles.logo}
                />
            </View>

            {/* Hero Illustration */}

            <View style={styles.heroContainer}>

                <Image

                    source={require("@/assets/images/onboarding/welcome-farm.png")}

                    resizeMode="contain"

                    style={styles.hero}

                />

            </View>

            {/* Title */}

            <Text style={styles.title}>
                {t.onboardingWelcomeTitle}
            </Text>

            {/* Subtitle */}

            <Text style={styles.subtitle}>
                {t.onboardingWelcomeSubtitle}
            </Text>

            {/* Feature Cards */}

            <View style={styles.featureContainer}>

                <FeatureCard
                    icon="shield"
                    title={t.onboardingWelcomeFeature1Title}
                    description={t.onboardingWelcomeFeature1Desc}
                />

                <FeatureCard
                    icon="droplet"
                    title={t.onboardingWelcomeFeature2Title}
                    description={t.onboardingWelcomeFeature2Desc}
                />

                <FeatureCard
                    icon="credit-card"
                    title={t.onboardingWelcomeFeature3Title}
                    description={t.onboardingWelcomeFeature3Desc}
                />
            </View>

            {/* Bottom Button */}

            <PrimaryButton
                title={t.onboardingWelcomeGetStarted}
                icon="arrow-right"
                onPress={handleContinue}
            />

            <DotIndicator />

            {/* Footer */}

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {t.onboardingWelcomeFooter}
                </Text>
            </View>

        </ScreenContainer>
    );
}

const styles = StyleSheet.create({

    heroContainer: {

        alignItems: "center",

        marginTop: Spacing.lg,

        marginBottom: Spacing.lg,

    },

    hero: {

        width: 260,

        height: 220,

    },

    title: {

        textAlign: "center",

        fontSize: Typography.title,

        fontWeight: "700",

        color: Onboarding.title,

        lineHeight: 38,

    },

    subtitle: {

        marginTop: Spacing.md,

        textAlign: "center",

        fontSize: Typography.body,

        color: Onboarding.subtitle,

        lineHeight: 24,

        paddingHorizontal: 12,

        marginBottom: Spacing.xl,

    },

    featureContainer: {

        marginTop: Spacing.md,

    },
    footer: {
        marginTop: Layout.sectionSpacing,

        alignItems: "center",

        justifyContent: "center",

        paddingBottom: 24,
    },

    footerText: {
        fontSize: Typography.caption,

        color: Onboarding.subtitle,

        textAlign: "center",

        opacity: 0.8,
    },
    logoContainer: {
        alignItems: "center",
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    logo: {
        width: 180,
        height: 70,
    },
});