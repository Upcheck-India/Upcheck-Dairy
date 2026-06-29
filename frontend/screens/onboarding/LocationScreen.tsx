import React from "react";

import {
    View,
    StyleSheet,
} from "react-native";

import {
    ScreenContainer,
    LanguageSelector,
    ScreenHeader,
    Card,
    InputField,
    PrimaryButton,
    BackButton,
    DotIndicator,
} from "@/components/onboarding";

import {

    Layout,

    Spacing,

} from "@/constants/theme";

import { useOnboarding } from "@/context/OnboardingContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LocationScreen() {

    const {

        data,

        setField,

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

                title={t.onboardingLocationTitle}

                subtitle={t.onboardingLocationSubtitle}

            />

            <Card>

                <View style={styles.form}>
                    <InputField
                        label={t.onboardingLocationVillageLabel}
                        required
                        placeholder={t.onboardingLocationVillagePlaceholder}
                        value={data.village}
                        onChangeText={(text) =>
                            setField("village", text)
                        }
                        autoCapitalize="words"
                        returnKeyType="next"
                    />

                    <InputField
                        label={t.onboardingLocationDistrictLabel}
                        required
                        placeholder={t.onboardingLocationDistrictPlaceholder}
                        value={data.district}
                        onChangeText={(text) =>
                            setField("district", text)
                        }
                        autoCapitalize="words"
                        returnKeyType="next"
                    />

                    <InputField
                        label={t.onboardingLocationStateLabel}
                        required
                        placeholder={t.onboardingLocationStatePlaceholder}
                        value={data.state}
                        onChangeText={(text) =>
                            setField("state", text)
                        }
                        autoCapitalize="words"
                        returnKeyType="next"
                    />

                    <InputField
                        label={t.onboardingLocationPincodeLabel}
                        placeholder={t.onboardingLocationPincodePlaceholder}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={data.pincode}
                        onChangeText={(text) =>
                            setField(
                                "pincode",
                                text.replace(/[^0-9]/g, "")
                            )
                        }
                        returnKeyType="done"
                    />

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
    form: {
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    page: {
        flex: 1,
    },
    card: {
        marginTop: Layout.sectionSpacing,
    },
    helperText: {
        marginTop: Spacing.md,
        textAlign: "center",
        fontSize: 13,
        color: "#64748B",
        lineHeight: 20,
    },
    footerSpacing: {
        height: 20,
    },
});