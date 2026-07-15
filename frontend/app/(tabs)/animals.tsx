import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFarm } from "@/src/modules/farms/hooks/useFarm";
import { useFarmer } from "@/context/FarmerContext";
import { useAnimals } from "@/src/modules/animals/hooks/useAnimals";
import { Animal } from "@/src/modules/animals/models/Animal";
import { useHealth } from "@/src/modules/health/hooks/useHealth";

// Helper: resolve the display status label and colour from an Animal model
function getAnimalStatusDisplay(animal: Animal): { label: string; color: string } {
  const s = animal.status;
  if (s === "lactating") return { label: "Lactating", color: "#22c55e" };
  if (s === "pregnant") return { label: "Pregnant", color: "#ef4444" };
  if (s === "dry") return { label: "Dry", color: "#a855f7" };
  if (s === "calf" || animal.type === "calf") return { label: "Calf", color: "#0ea5e9" };
  return { label: "Other", color: "#64748b" };
}

export default function AnimalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeFarm, farms, switchFarm } = useFarm();
  const { farmer } = useFarmer();
  const { animals: allAnimals, loading, error } = useAnimals();
  const { healthEvents, loading: healthLoading, error: healthError } = useHealth();
  const params = useLocalSearchParams();
  const shedId = params.shedId as string | undefined;
  const shedName = params.shedName as string;

  const [activeTab, setActiveTab] = useState<"animals" | "feed" | "health" | "breeding">("animals");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Initials for avatar
  const initials = farmer?.name
    ? farmer.name.trim().split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "HS";

  const toggleDropdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (dropdownOpen) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setDropdownOpen(false));
    } else {
      setDropdownOpen(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSelectFarm = (farmId: string) => {
    Haptics.selectionAsync();
    switchFarm(farmId);
    toggleDropdown();
  };

  // Step 1: filter to this shed's animals from the already-loaded context
  const shedAnimals: Animal[] = useMemo(() => {
    if (!shedId) return allAnimals;
    return allAnimals.filter((a) => a.shed === shedId);
  }, [allAnimals, shedId]);

  // Step 2: further filter by search query
  const filteredAnimals: Animal[] = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return shedAnimals;
    return shedAnimals.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.tagNumber ?? "").toLowerCase().includes(q) ||
        (a.breed ?? "").toLowerCase().includes(q)
    );
  }, [shedAnimals, searchQuery]);

  // Step 3: compute summary counts from the shed's animals (not filtered)
  const summary = useMemo(() => ({
    total: shedAnimals.length,
    lactating: shedAnimals.filter((a) => a.status === "lactating").length,
    dry: shedAnimals.filter((a) => a.status === "dry").length,
    calves: shedAnimals.filter((a) => a.type === "calf" || a.status === "calf").length,
    healthy: shedAnimals.filter((a) => a.healthStatus === "healthy").length,
  }), [shedAnimals]);

  // Step 4: filter health events (alerts) for animals in this shed
  const shedHealthEvents = useMemo(() => {
    const shedAnimalIds = new Set(shedAnimals.map((a) => Number(a.id)));
    return healthEvents.filter((e) => !shedId || shedAnimalIds.has(Number(e.animalId)));
  }, [healthEvents, shedAnimals, shedId]);

  // Step 5: search/filter health alerts
  const filteredHealthEvents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return shedHealthEvents;
    return shedHealthEvents.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        (e.veterinarianName ?? "").toLowerCase().includes(q) ||
        (e.type ?? "").toLowerCase().includes(q)
    );
  }, [shedHealthEvents, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {shedName ? `Animals (${shedName})` : "Animals"}
        </Text>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert("Alerts", "You have 3 notifications regarding breeding cycle updates.");
            }}
            style={styles.bellBtn}
            hitSlop={12}
          >
            <Feather name="bell" size={22} color={colors.foreground} />
            <View style={[styles.badge, { backgroundColor: "#ef4444" }]}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.avatarBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/profile");
            }}
            hitSlop={8}
          >
            <View style={[styles.avatarCircle, { backgroundColor: farmer?.avatarColor ?? "#16a34a" }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Farm Selector and Add Button Row */}
      <View style={styles.selectorRow}>
        <View style={styles.dropdownContainer}>
          <Pressable
            style={[
              styles.selectorCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleDropdown}
          >
            <View style={styles.selectorLeft}>
              <View style={[styles.homeIconBg, { backgroundColor: "#16a34a20" }]}>
                <Feather name="home" size={15} color="#16a34a" />
              </View>
              <Text style={[styles.farmName, { color: colors.foreground }]} numberOfLines={1}>
                {activeFarm?.name || "Select Farm"}
              </Text>
            </View>
            <Feather
              name={dropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>

          {dropdownOpen && (
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: dropdownAnim,
                  transform: [
                    {
                      translateY: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {farms.length === 0 ? (
                <Text style={[styles.noFarmsText, { color: colors.mutedForeground }]}>
                  No farms available
                </Text>
              ) : (
                farms.map((farm) => {
                  const isSelected = farm.id === activeFarm?.id;
                  return (
                    <Pressable
                      key={farm.id}
                      style={({ pressed }) => [
                        styles.farmItem,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + "12"
                            : pressed
                            ? colors.muted
                            : "transparent",
                        },
                      ]}
                      onPress={() => handleSelectFarm(farm.id)}
                    >
                      <Feather
                        name="home"
                        size={14}
                        color={isSelected ? "#16a34a" : colors.mutedForeground}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.farmItemText,
                          {
                            color: isSelected ? colors.primary : colors.foreground,
                            fontFamily: isSelected ? "Inter_700Bold" : "Inter_400Regular",
                          },
                        ]}
                      >
                        {farm.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </Animated.View>
          )}
        </View>

        <Pressable
          style={[styles.addBtn, { backgroundColor: "#16a34a" }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert("Add Animal", "Opening Add Animal Modal...");
          }}
          hitSlop={8}
        >
          <Feather name="plus" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add Animal</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        {[
          { key: "animals", label: "Animals", icon: "cow" },
          { key: "feed", label: "Feed", icon: "grain" },
          { key: "health", label: "Health", icon: "heart-pulse" },
          { key: "breeding", label: "Breeding", icon: "cards-playing-heart-multiple" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tabButton,
                isActive && { borderBottomColor: "#16a34a" },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key as any);
              }}
            >
              <View style={styles.tabContent}>
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? "#16a34a" : colors.mutedForeground}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? "#16a34a" : colors.mutedForeground,
                      fontFamily: isActive ? "Inter_700Bold" : "Inter_500Medium",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Animal Summary Section */}
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Animal Summary</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Insights", "Navigating to Animal Insights...");
            }}
          >
            <Text style={[styles.insightsLink, { color: "#16a34a" }]}>View Insights &gt;</Text>
          </Pressable>
        </View>

        <View style={styles.summaryContainer}>
          {[
            { label: "Total Animals", count: summary.total, icon: "cow", bgColor: "#6366f112", color: "#6366f1" },
            { label: "Lactating", count: summary.lactating, icon: "water", bgColor: "#0ea5e912", color: "#0ea5e9" },
            { label: "Dry", count: summary.dry, icon: "water-off", bgColor: "#ea580c12", color: "#ea580c" },
            { label: "Calves", count: summary.calves, icon: "baby-bottle-outline", bgColor: "#a855f712", color: "#a855f7" },
            { label: "Healthy", count: summary.healthy, icon: "shield-check-outline", bgColor: "#22c55e12", color: "#22c55e" },
          ].map((card, idx) => (
            <View key={idx} style={[styles.summaryCardView, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.summaryIconBg, { backgroundColor: card.bgColor }]}>
                <MaterialCommunityIcons name={card.icon as any} size={18} color={card.color} />
              </View>
              <Text style={[styles.summaryCountText, { color: colors.foreground }]}>{card.count}</Text>
              <Text style={[styles.summaryLabelText, { color: colors.mutedForeground }]} numberOfLines={2} adjustsFontSizeToFit>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* --- ANIMALS TAB CONTENT --- */}
        {activeTab === "animals" && (
          <>
            {/* Loading state */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading animals...</Text>
              </View>
            )}

            {/* Error state */}
            {!loading && error && (
              <View style={styles.emptyContainer}>
                <Feather name="alert-circle" size={48} color={colors.destructive} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Failed to load animals.</Text>
              </View>
            )}

            {/* Animal List Section Header */}
            {!loading && !error && (
              <View style={styles.listSectionHeader}>
                <Text style={[styles.listTitle, { color: colors.foreground }]}>
                  All Animals ({filteredAnimals.length})
                </Text>
              </View>
            )}

            {/* Search and Filter Row */}
            <View style={styles.searchRow}>
              <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search animals..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
              <Pressable
                style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert("Filters", "Filters clicked");
                }}
              >
                <Feather name="sliders" size={18} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Animals List */}
            {!loading && !error && (
              <View style={styles.animalsList}>
                {filteredAnimals.map((animal) => {
                  const { label: statusLabel, color: statusColor } = getAnimalStatusDisplay(animal);
                  const milkQty = animal.lastMilkEntry
                    ? `${animal.lastMilkEntry.quantity.toFixed(1)} L`
                    : "--";
                  const breedDisplay = animal.tagNumber
                    ? `${animal.breed} • ${animal.tagNumber}`
                    : animal.breed;
                  const healthLabel =
                    animal.healthStatus.charAt(0).toUpperCase() + animal.healthStatus.slice(1);

                  // For dry/pregnant animals show subtext instead of metrics row
                  const isExpectingCalve =
                    (animal.status === "dry" || animal.isPregnant) && animal.expectedCalvingDate;
                  const isCalf = animal.type === "calf";

                  return (
                    <Pressable
                      key={animal.id}
                      style={[styles.animalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/animal/${animal.id}`);
                      }}
                    >
                      {animal.photoUri ? (
                        <Image source={{ uri: animal.photoUri }} style={styles.animalPhoto} />
                      ) : (
                        <View style={[styles.animalPhotoPlaceholder, { backgroundColor: colors.muted }]}>
                          <Feather name="camera" size={20} color={colors.mutedForeground} />
                        </View>
                      )}

                      <View style={styles.animalInfo}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.animalName, { color: colors.foreground }]} numberOfLines={1}>
                            {animal.name}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                          </View>
                        </View>

                        <Text style={[styles.animalBreed, { color: colors.mutedForeground }]}>{breedDisplay}</Text>

                        {isExpectingCalve ? (
                          <View style={[styles.subtextBadge, { backgroundColor: "#fef9c3" }]}>
                            <Text style={[styles.subtextText, { color: "#eab308" }]}>
                              Expected to calve in{" "}
                              {Math.max(
                                0,
                                Math.ceil(
                                  (animal.expectedCalvingDate!.getTime() - Date.now()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              )}{" "}
                              days
                            </Text>
                          </View>
                        ) : isCalf && animal.birthDate ? (
                          <View style={[styles.subtextBadge, { backgroundColor: "#f1f5f9" }]}>
                            <Text style={[styles.subtextText, { color: "#64748b" }]}>
                              Age: {animal.formattedAge}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.detailsRow}>
                            <View style={styles.detailItem}>
                              <Feather name="droplet" size={12} color="#0ea5e9" style={{ marginRight: 3 }} />
                              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{milkQty}</Text>
                            </View>
                            {animal.weightKg != null && (
                              <View style={styles.detailItem}>
                                <MaterialCommunityIcons name="scale" size={12} color="#ea580c" style={{ marginRight: 3 }} />
                                <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                                  {Number(animal.weightKg).toFixed(1)} kg
                                </Text>
                              </View>
                            )}
                            <View style={styles.detailItem}>
                              <Feather name="shield" size={12} color="#22c55e" style={{ marginRight: 3 }} />
                              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{healthLabel}</Text>
                            </View>
                          </View>
                        )}
                      </View>

                      <View style={styles.animalRight}>
                        <Text style={[styles.rightMilkQty, { color: colors.foreground }]}>{milkQty}</Text>
                        <Text style={[styles.rightMilkLabel, { color: colors.mutedForeground }]}>Milk Today</Text>

                        <View style={styles.cardActions}>
                          <Pressable
                            style={styles.actionIcon}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              Alert.alert("More Options", `Options for ${animal.name}`);
                            }}
                            hitSlop={8}
                          >
                            <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
                          </Pressable>
                          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}

                {filteredAnimals.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Feather
                      name={searchQuery.length > 0 ? "search" : "grid"}
                      size={48}
                      color={colors.border}
                    />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      {searchQuery.length > 0
                        ? "No matching animals found"
                        : "No animals in this shed"}
                    </Text>
                  </View>
                )}

                {filteredAnimals.length > 0 && (
                  <Pressable
                    style={styles.viewAllBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert("All Animals", "Navigating to View All Animals...");
                    }}
                  >
                    <Text style={styles.viewAllText}>View All Animals &gt;</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        {/* --- HEALTH ALERTS TAB CONTENT --- */}
        {activeTab === "health" && (
          <>
            {/* Loading state */}
            {healthLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading health alerts...</Text>
              </View>
            )}

            {/* Error state */}
            {!healthLoading && healthError && (
              <View style={styles.emptyContainer}>
                <Feather name="alert-circle" size={48} color={colors.destructive} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Failed to load health alerts.</Text>
              </View>
            )}

            {/* Health Alert List Section Header */}
            {!healthLoading && !healthError && (
              <View style={styles.listSectionHeader}>
                <Text style={[styles.listTitle, { color: colors.foreground }]}>
                  Health Alerts ({filteredHealthEvents.length})
                </Text>
              </View>
            )}

            {/* Search Row */}
            <View style={styles.searchRow}>
              <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search alerts..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Health Alert List */}
            {!healthLoading && !healthError && (
              <View style={styles.animalsList}>
                {filteredHealthEvents.map((e) => {
                  const animal = allAnimals.find((a) => Number(a.id) === Number(e.animalId));
                  const animalName = animal ? animal.name : `Animal #${e.animalId}`;

                  const alertColor =
                    e.type === "vaccination"
                      ? "#0ea5e9"
                      : e.type === "treatment"
                      ? "#ef4444"
                      : e.type === "diagnosis"
                      ? "#ea580c"
                      : "#22c55e";

                  const iconName =
                    e.type === "vaccination"
                      ? "shield"
                      : e.type === "treatment"
                      ? "activity"
                      : e.type === "diagnosis"
                      ? "alert-circle"
                      : "file-text";

                  const typeLabel = e.type.charAt(0).toUpperCase() + e.type.slice(1);

                  return (
                    <Pressable
                      key={e.id}
                      style={[styles.animalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/animal/${e.animalId}`);
                      }}
                    >
                      <View style={[styles.healthEntryIcon, { backgroundColor: alertColor + "15" }]}>
                        <Feather name={iconName} size={16} color={alertColor} />
                      </View>

                      <View style={styles.animalInfo}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.animalName, { color: colors.foreground }]} numberOfLines={1}>
                            {animalName}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: alertColor + "15" }]}>
                            <Text style={[styles.statusText, { color: alertColor }]}>{typeLabel}</Text>
                          </View>
                        </View>

                        <Text style={[styles.healthDescText, { color: colors.foreground }]} numberOfLines={2}>
                          {e.description}
                        </Text>

                        <Text style={[styles.animalBreed, { color: colors.mutedForeground }]}>
                          {new Date(e.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          {e.veterinarianName ? ` • Dr. ${e.veterinarianName}` : ""}
                        </Text>
                      </View>

                      <View style={styles.animalRight}>
                        {e.cost !== null && e.cost !== undefined && (
                          <Text style={[styles.rightMilkQty, { color: colors.accent }]}>
                            ₹{Number(e.cost).toFixed(0)}
                          </Text>
                        )}
                        <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginTop: 4 }} />
                      </View>
                    </Pressable>
                  );
                })}

                {filteredHealthEvents.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Feather name="heart" size={48} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      {searchQuery.length > 0
                        ? "No matching alerts found"
                        : "No health alerts for this shed"}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* --- FEED TAB CONTENT (PLACEHOLDER) --- */}
        {activeTab === "feed" && (
          <View style={styles.animalsList}>
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="grain" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No feed alerts for this shed
              </Text>
            </View>
          </View>
        )}

        {/* --- BREEDING TAB CONTENT (PLACEHOLDER) --- */}
        {activeTab === "breeding" && (
          <View style={styles.animalsList}>
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cards-playing-heart-multiple" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No breeding alerts for this shed
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellBtn: {
    padding: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  avatarBtn: {
    marginLeft: 4,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 6,
    zIndex: 9999,
  },
  dropdownContainer: {
    flex: 1,
    position: "relative",
  },
  selectorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  homeIconBg: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  farmName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: "105%",
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 9999,
  },
  farmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  farmItemText: {
    fontSize: 13,
  },
  noFarmsText: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 10,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 14,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 18,
  },
  summaryTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  insightsLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  summaryCardView: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  summaryCountText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  summaryLabelText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 11,
  },
  listSectionHeader: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    fontFamily: "Inter_400Regular",
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  animalsList: {
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  animalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  animalPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  animalPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  healthEntryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  healthDescText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  animalInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  animalName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  animalBreed: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  subtextBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  subtextText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  animalRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 4,
  },
  rightMilkQty: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  rightMilkLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  actionIcon: {
    padding: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  viewAllBtn: {
    alignSelf: "center",
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#16a34a",
  },
});
