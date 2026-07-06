import React from "react";

import {
    View,
    StyleSheet,
    Alert,
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

export default function FarmDetailsScreen() {

    const {

        data,

        setField,

        goNext,

        goBack,

        validateCurrentStep,

    } = useOnboarding();

    const { t } = useLanguage();

    function handleNext() {
        if (!data.farmName.trim()) {
            Alert.alert("Error", "Please enter your farm name");
            return;
        }
        if (!data.ownerName.trim()) {
            Alert.alert("Error", "Please enter the owner's name");
            return;
        }
        if (data.phone.trim().length !== 10) {
            Alert.alert("Error", "Please enter a valid 10-digit phone number");
            return;
        }

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

                title={t.onboardingFarmDetailsTitle}

                subtitle={t.onboardingFarmDetailsSubtitle}

            />

            <Card>

                <View style={styles.form}>
                    <InputField
                        label={t.onboardingFarmDetailsFarmNameLabel}
                        required
                        placeholder={t.onboardingFarmDetailsFarmNamePlaceholder}
                        value={data.farmName}
                        onChangeText={(text) =>
                            setField("farmName", text)
                        }
                        autoCapitalize="words"
                        returnKeyType="next"
                    />

                    <InputField
                        label={t.onboardingFarmDetailsOwnerNameLabel}
                        required
                        placeholder={t.onboardingFarmDetailsOwnerNamePlaceholder}
                        value={data.ownerName}
                        onChangeText={(text) =>
                            setField("ownerName", text)
                        }
                        autoCapitalize="words"
                        returnKeyType="next"
                    />

                    <InputField
                        label={t.onboardingPhoneLabel}
                        required
                        placeholder={t.onboardingFarmDetailsPhonePlaceholder}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={data.phone}
                        onChangeText={(text) =>
                            setField(
                                "phone",
                                text.replace(/[^0-9]/g, "")
                            )
                        }
                        returnKeyType="next"
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
