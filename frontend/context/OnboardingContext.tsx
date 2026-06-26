import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    ReactNode,
} from "react";

import type { Language } from "./LanguageContext";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

export interface AnimalCounts {
    cow: number;
    buffalo: number;
    goat: number;
    calf: number;
    bull: number;
    other: number;
}

export interface OnboardingData {
    /* ------------------------- Screen 1 ------------------------- */

    language: Language;

    /* ------------------------- Screen 2 ------------------------- */

    farmName: string;

    ownerName: string;

    phone: string;

    email: string;

    /* ------------------------- Screen 3 ------------------------- */

    village: string;

    district: string;

    state: string;

    pincode: string;

    /* ------------------------- Screen 4 ------------------------- */

    animals: AnimalCounts;

    /* ------------------------- Screen 5 ------------------------- */

    locationPermission: boolean;

    notificationsEnabled: boolean;
}

/* -------------------------------------------------------------------------- */
/*                             DEFAULT VALUES                                 */
/* -------------------------------------------------------------------------- */

const defaultData: OnboardingData = {
    language: "en",

    farmName: "",

    ownerName: "",

    phone: "",

    email: "",

    village: "",

    district: "",

    state: "",

    pincode: "",

    animals: {
        cow: 0,
        buffalo: 0,
        goat: 0,
        calf: 0,
        bull: 0,
        other: 0,
    },

    locationPermission: true,

    notificationsEnabled: true,
};

/* -------------------------------------------------------------------------- */
/*                             CONTEXT INTERFACE                              */
/* -------------------------------------------------------------------------- */

interface OnboardingContextType {
    data: OnboardingData;

    currentStep: number;

    totalSteps: number;

    completed: boolean;

    totalAnimals: number;

    /* ---------- Generic field updater ---------- */

    setField: <K extends keyof OnboardingData>(
        key: K,
        value: OnboardingData[K]
    ) => void;

    /* ---------- Animal updater ---------- */

    setAnimalCount: (
        animal: keyof AnimalCounts,
        count: number
    ) => void;

    increaseAnimal: (
        animal: keyof AnimalCounts
    ) => void;

    decreaseAnimal: (
        animal: keyof AnimalCounts
    ) => void;

    /* ---------- Navigation ---------- */

    goNext: () => void;

    goBack: () => void;

    goToStep: (step: number) => void;

    /* ---------- Validation ---------- */

    validateCurrentStep: () => boolean;

    /* ---------- Reset ---------- */

    reset: () => void;
}

const OnboardingContext =
    createContext<OnboardingContextType | null>(null);
/* -------------------------------------------------------------------------- */
/*                             PROVIDER                                       */
/* -------------------------------------------------------------------------- */

export function OnboardingProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [data, setData] =
        useState<OnboardingData>(defaultData);

    /**
     * Screen Order
     *
     * 0 → Welcome
     * 1 → Farm Details
     * 2 → Location
     * 3 → Animals
     * 4 → Permissions
     * 5 → Success
     */

    const [currentStep, setCurrentStep] = useState(0);

    const totalSteps = 6;

    /* ---------------------------------------------------------------------- */
    /*                            FIELD UPDATES                               */
    /* ---------------------------------------------------------------------- */

    const setField = <
        K extends keyof OnboardingData
    >(
        key: K,
        value: OnboardingData[K]
    ) => {
        setData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    /* ---------------------------------------------------------------------- */
    /*                          ANIMAL UPDATES                                */
    /* ---------------------------------------------------------------------- */

    const setAnimalCount = (
        animal: keyof AnimalCounts,
        count: number
    ) => {
        setData((prev) => ({
            ...prev,
            animals: {
                ...prev.animals,
                [animal]: Math.max(0, count),
            },
        }));
    };

    const increaseAnimal = (
        animal: keyof AnimalCounts
    ) => {
        setData((prev) => ({
            ...prev,
            animals: {
                ...prev.animals,
                [animal]: prev.animals[animal] + 1,
            },
        }));
    };

    const decreaseAnimal = (
        animal: keyof AnimalCounts
    ) => {
        setData((prev) => ({
            ...prev,
            animals: {
                ...prev.animals,
                [animal]: Math.max(
                    0,
                    prev.animals[animal] - 1
                ),
            },
        }));
    };

    /* ---------------------------------------------------------------------- */
    /*                           TOTAL ANIMALS                                */
    /* ---------------------------------------------------------------------- */

    const totalAnimals = useMemo(() => {
        return Object.values(data.animals).reduce(
            (sum, value) => sum + value,
            0
        );
    }, [data.animals]);

    /* ---------------------------------------------------------------------- */
    /*                             NAVIGATION                                 */
    /* ---------------------------------------------------------------------- */

    const goNext = () => {
        if (!validateCurrentStep()) return;

        setCurrentStep((prev) =>
            Math.min(prev + 1, totalSteps - 1)
        );
    };

    const goBack = () => {
        setCurrentStep((prev) =>
            Math.max(prev - 1, 0)
        );
    };

    const goToStep = (step: number) => {
        const safeStep = Math.max(
            0,
            Math.min(step, totalSteps - 1)
        );

        setCurrentStep(safeStep);
    };

    /* ---------------------------------------------------------------------- */
    /*                              VALIDATION                                */
    /* ---------------------------------------------------------------------- */

    const validateCurrentStep = () => {
        switch (currentStep) {
            /**
             * Welcome
             */
            case 0:
                return true;

            /**
             * Farm Details
             */
            case 1:
                return (
                    data.farmName.trim().length > 0 &&
                    data.ownerName.trim().length > 0 &&
                    data.phone.trim().length === 10
                );

            /**
             * Location
             */
            case 2:
                return (
                    data.village.trim().length > 0 &&
                    data.district.trim().length > 0 &&
                    data.state.trim().length > 0
                );

            /**
             * Animals
             */
            case 3:
                return totalAnimals > 0;

            /**
             * Permissions
             */
            case 4:
                return true;

            /**
             * Success
             */
            case 5:
                return true;

            default:
                return true;
        }
    };

    /* ---------------------------------------------------------------------- */
    /*                               RESET                                    */
    /* ---------------------------------------------------------------------- */

    const reset = () => {
        setData(defaultData);
        setCurrentStep(0);
    };

    const completed = currentStep === totalSteps - 1;
    /* ---------------------------------------------------------------------- */
    /*                           CONTEXT VALUE                                */
    /* ---------------------------------------------------------------------- */

    const value = useMemo<OnboardingContextType>(
        () => ({
            data,

            currentStep,

            totalSteps,

            completed,

            totalAnimals,

            setField,

            setAnimalCount,

            increaseAnimal,

            decreaseAnimal,

            goNext,

            goBack,

            goToStep,

            validateCurrentStep,

            reset,
        }),
        [
            data,

            currentStep,

            totalSteps,

            completed,

            totalAnimals,
        ]
    );

    return (
        <OnboardingContext.Provider value= { value } >
        { children }
        </OnboardingContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/*                                   HOOK                                     */
/* -------------------------------------------------------------------------- */

export function useOnboarding() {
    const context = useContext(OnboardingContext);

    if (!context) {
        throw new Error(
            "useOnboarding must be used inside OnboardingProvider."
        );
    }

    return context;
}

/* -------------------------------------------------------------------------- */
/*                             HELPER HOOKS                                   */
/* -------------------------------------------------------------------------- */

export function useAnimalCounts() {
    const {
        data,
        totalAnimals,
        increaseAnimal,
        decreaseAnimal,
        setAnimalCount,
    } = useOnboarding();

    return {
        animals: data.animals,

        totalAnimals,

        increaseAnimal,

        decreaseAnimal,

        setAnimalCount,
    };
}

export function useFarmDetails() {
    const { data, setField } = useOnboarding();

    return {
        farmName: data.farmName,

        ownerName: data.ownerName,

        phone: data.phone,

        email: data.email,

        setField,
    };
}

export function useLocationDetails() {
    const { data, setField } = useOnboarding();

    return {
        village: data.village,

        district: data.district,

        state: data.state,

        pincode: data.pincode,

        setField,
    };
}

export function usePermissions() {
    const { data, setField } = useOnboarding();

    return {
        locationPermission: data.locationPermission,

        notificationsEnabled: data.notificationsEnabled,

        setField,
    };
}

export function useLanguagePreference() {
    const { data, setField } = useOnboarding();

    return {
        language: data.language,

        setLanguage: (language: Language) =>
            setField("language", language),
    };
}

/* -------------------------------------------------------------------------- */
/*                           EXPORT DEFAULT DATA                              */
/* -------------------------------------------------------------------------- */

export { defaultData };