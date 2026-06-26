import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    ScreenContainer,
    LanguageSelector,
    ScreenHeader,
    Card,
    PrimaryButton,
    BackButton,
    AnimalCounterCard,
    DotIndicator,
} from "@/components/onboarding";

import {
    Layout,
    Onboarding,
    Spacing,
} from "@/constants/theme";

import { useOnboarding } from "@/context/OnboardingContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AnimalScreen() {

    const {

        data,

        totalAnimals,

        increaseAnimal,

        decreaseAnimal,

        goNext,

        goBack,

        validateCurrentStep,

    } = useOnboarding();

    const { t } = useLanguage();

    function handleNext() {

        if (validateCurrentStep()) {

            goNext();

        }

    }

    return (

        <ScreenContainer>

            <LanguageSelector />



            <BackButton
                onPress={goBack}
            />

            <ScreenHeader
                title={t.onboardingAnimalTitle}
                subtitle={t.onboardingAnimalSubtitle}
            />

            <Card>

                <View style={styles.list}>
                    <AnimalCounterCard
                        image={require("@/assets/images/animals/cow.png")}
                        title={t.onboardingAnimalCow}
                        count={data.animals.cow}
                        increase={() => increaseAnimal("cow")}
                        decrease={() => decreaseAnimal("cow")}
                    />

                    <AnimalCounterCard
                        image={require("@/assets/images/animals/buffalo.png")}
                        title={t.onboardingAnimalBuffalo}
                        count={data.animals.buffalo}
                        increase={() => increaseAnimal("buffalo")}
                        decrease={() => decreaseAnimal("buffalo")}
                    />

                    <AnimalCounterCard
                        image={require("@/assets/images/animals/goat.png")}
                        title={t.onboardingAnimalGoat}
                        count={data.animals.goat}
                        increase={() => increaseAnimal("goat")}
                        decrease={() => decreaseAnimal("goat")}
                    />

                    <AnimalCounterCard
                        image={require("@/assets/images/animals/calf.png")}
                        title={t.onboardingAnimalCalf}
                        count={data.animals.calf}
                        increase={() => increaseAnimal("calf")}
                        decrease={() => decreaseAnimal("calf")}
                    />

                    <AnimalCounterCard
                        image={require("@/assets/images/animals/bull.png")}
                        title={t.onboardingAnimalBull}
                        count={data.animals.bull}
                        increase={() => increaseAnimal("bull")}
                        decrease={() => decreaseAnimal("bull")}
                    />

                    <AnimalCounterCard
                        image={require("@/assets/images/animals/other.png")}
                        title={t.onboardingAnimalOthers}
                        count={data.animals.other}
                        increase={() => increaseAnimal("other")}
                        decrease={() => decreaseAnimal("other")}
                    />

                </View>

                <View style={styles.summaryCard}>

                    <Text style={styles.summaryLabel}>
                        {t.onboardingAnimalTotalLabel}
                    </Text>

                    <Text style={styles.summaryValue}>
                        {totalAnimals}
                    </Text>

                    <Text style={styles.summarySubtext}>
                        {t.onboardingAnimalSummarySubtext}
                    </Text>

                </View>

            </Card>

            <PrimaryButton
                title={t.continueBtn}
                icon="arrow-right"
                onPress={handleNext}
            />

            <DotIndicator />

        </ScreenContainer>

    );

}

const styles = StyleSheet.create({

    list: {

        gap: Spacing.sm,

    },

    summaryCard: {

        marginTop: Spacing.lg,

        paddingVertical: 20,

        borderTopWidth: 1,

        borderTopColor: "#E5ECE7",

        alignItems: "center",

    },
    summaryLabel: {
        fontSize: 14,

        fontWeight: "600",

        color: Onboarding.subtitle,

        marginBottom: 8,
    },

    summaryValue: {
        fontSize: 42,

        fontWeight: "700",

        color: Onboarding.primary,

        marginBottom: 8,
    },

    summarySubtext: {
        textAlign: "center",

        fontSize: 13,

        lineHeight: 20,

        color: Onboarding.subtitle,

        paddingHorizontal: 12,
    },

    page: {
        flex: 1,
    },

    card: {
        marginTop: Layout.sectionSpacing,
    },

    footerSpacing: {
        height: 20,
    },
});
