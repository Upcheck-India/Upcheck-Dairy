import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { Animal } from "../../animals/models/Animal";
import { useSheds, Shed } from "../context/ShedProvider";
import { ShedManagementModal } from "./ShedManagementModal";

interface HerdDashboardProps {
  activeTab: "by_shed" | "by_category";
  animals: Animal[];
  onShedSelect: (shedId: string, shedName: string) => void;
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  onManageSheds: () => void;
  onManageCategories: () => void;
  onHealthOverview: () => void;
  onHerdReports: () => void;
}

export function HerdDashboard({
  activeTab,
  animals,
  onShedSelect,
  onCategorySelect,
  onManageSheds,
  onManageCategories,
  onHealthOverview,
  onHerdReports,
}: HerdDashboardProps) {
  const colors = useColors();
  const { language } = useLanguage();
  const { sheds: storedSheds } = useSheds();

  const [shedModalVisible, setShedModalVisible] = useState(false);
  const [shedModalAction, setShedModalAction] = useState<"list" | "create" | "edit">("list");
  const [targetShedId, setTargetShedId] = useState<string | null>(null);

  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  // Helper to resolve an animal's category
  const getAnimalCategory = (animal: Animal): "lactating" | "pregnant" | "dry" | "calf" | "other" => {
    if (animal.status) return animal.status as any;
    if (animal.type === "calf") return "calf";
    if (animal.isPregnant) return "pregnant";
    
    const idNum = parseInt(animal.id) || 0;
    if (idNum % 5 === 0) return "other";
    if (idNum % 3 === 0) return "dry";
    return "lactating";
  };

  // Helper to resolve an animal's shed
  const getAnimalShed = (animal: Animal): string => {
    if (animal.shed) return animal.shed;
    const idNum = parseInt(animal.id) || 0;
    const index = idNum % 3;
    return `shed_${index + 1}`;
  };

  const STANDARD_SHEDS: Record<string, { en: string; ta: string; hi: string; descEn: string; descTa: string }> = {
    shed_1: {
      en: "Shed 1 - Main Shed",
      ta: "கொட்டகை 1 - மெயின்",
      hi: "शेड 1 - मुख्य",
      descEn: "Main housing shed",
      descTa: "முக்கிய மாட்டு கொட்டகை",
    },
    shed_2: {
      en: "Shed 2 - North Shed",
      ta: "கொட்டகை 2 - வடக்கு",
      hi: "शेड 2 - उत्तर",
      descEn: "North block",
      descTa: "வடக்கு பகுதி",
    },
    shed_3: {
      en: "Shed 3 - Open Shed",
      ta: "கொட்டகை 3 - திறந்த",
      hi: "शेड 3 - खुला",
      descEn: "Open housing",
      descTa: "திறந்தவெளி கொட்டகை",
    },
  };

  const getShedMeta = (shedId: string) => {
    const stored = storedSheds.find((s) => s.id === shedId);
    if (stored) {
      return {
        name: stored.name,
        desc: stored.desc || lx({ ta: "கொட்டகை இருப்பிடம்", en: "Housing section" }),
      };
    }
    const key = shedId.toLowerCase().replace(/\s+/g, "_");
    if (STANDARD_SHEDS[key]) {
      return {
        name: lx({ ta: STANDARD_SHEDS[key].ta, hi: STANDARD_SHEDS[key].hi, en: STANDARD_SHEDS[key].en }),
        desc: lx({ ta: STANDARD_SHEDS[key].descTa, en: STANDARD_SHEDS[key].descEn }),
      };
    }
    const formattedName = shedId.startsWith("shed_")
      ? `Shed ${shedId.replace("shed_", "")}`
      : shedId;
    return {
      name: formattedName,
      desc: lx({ ta: "கொட்டகை இருப்பிடம்", en: "Housing section" }),
    };
  };

  // Process Sheds dynamically combining stored custom sheds and animal occurrences
  const sheds = React.useMemo(() => {
    const storedIds = storedSheds.map((s) => s.id);
    const animalShedIds = animals.map((a) => getAnimalShed(a)).filter(Boolean);
    const uniqueShedIds = Array.from(new Set([...storedIds, ...animalShedIds]));

    return uniqueShedIds.map((shedId) => {
      const meta = getShedMeta(shedId);
      const shedAnimals = animals.filter((a) => getAnimalShed(a) === shedId);
      return {
        id: shedId,
        name: meta.name,
        desc: meta.desc,
        lactating: shedAnimals.filter((a) => getAnimalCategory(a) === "lactating").length,
        pregnant: shedAnimals.filter((a) => getAnimalCategory(a) === "pregnant").length,
        dry: shedAnimals.filter((a) => getAnimalCategory(a) === "dry").length,
        calf: shedAnimals.filter((a) => getAnimalCategory(a) === "calf").length,
        total: shedAnimals.length,
      };
    });
  }, [animals, storedSheds, language]);

  // Process Categories
  const categories = [
    {
      id: "lactating",
      name: lx({ ta: "பால் கறப்பவை", te: "పాలు ఇచ్చేవి", hi: "दुधारू पशु", en: "Lactating" }),
      desc: lx({ ta: "தற்போது பால் கறக்கும் மாடுகள்", en: "Animals that are currently giving milk" }),
      color: "#9333ea", // Purple
      icon: "cow" as const,
      count: animals.filter((a) => getAnimalCategory(a) === "lactating").length,
    },
    {
      id: "pregnant",
      name: lx({ ta: "சினை மாடுகள்", te: "గర్భம்", hi: "गर्भवती पशु", en: "Pregnant" }),
      desc: lx({ ta: "கர்ப்பமாக உள்ள மாடுகள்", en: "Pregnant animals" }),
      color: "#ef4444", // Red
      icon: "heart" as const,
      count: animals.filter((a) => getAnimalCategory(a) === "pregnant").length,
    },
    {
      id: "dry",
      name: lx({ ta: "வறண்ட மாடுகள்", te: "పాలు ఇవ్వనిவி", hi: "सूखे पशु", en: "Dry" }),
      desc: lx({ ta: "பால் கறக்காத மாடுகள்", en: "Animals not giving milk" }),
      color: "#2563eb", // Blue
      icon: "water-off" as const,
      count: animals.filter((a) => getAnimalCategory(a) === "dry").length,
    },
    {
      id: "calf",
      name: lx({ ta: "கன்றுகள்", te: "దూడలు", hi: "बछड़े", en: "Calves" }),
      desc: lx({ ta: "இளம் கன்றுக்குட்டிகள்", en: "Young animals (not weaned)" }),
      color: "#ea580c", // Orange
      icon: "baby-bottle" as const,
      count: animals.filter((a) => getAnimalCategory(a) === "calf").length,
    },
    {
      id: "other",
      name: lx({ ta: "மற்றவை", te: "ఇతరాలు", hi: "अन्य", en: "Others" }),
      desc: lx({ ta: "காளைகள், கிடேரிகள் மற்றும் சிகிச்சை பெறுபவை", en: "Bulls, sick, in treatment, heifers, etc." }),
      color: "#4b5563", // Grey
      icon: "dots-horizontal" as const,
      count: animals.filter((a) => getAnimalCategory(a) === "other").length,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {activeTab === "by_shed" ? (
        <View style={styles.section}>
          {/* Header Row */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {lx({ ta: "கொட்டகைகள்", hi: "शेड", en: "Sheds" })}
            </Text>
            <Pressable
              style={styles.addShedBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShedModalAction("create");
                setTargetShedId(null);
                setShedModalVisible(true);
              }}
            >
              <Feather name="plus" size={14} color="#00a651" style={{ marginRight: 4 }} />
              <Text style={styles.addShedText}>{lx({ en: "New Shed", ta: "புதிய கொட்டகை" })}</Text>
            </Pressable>
          </View>

          {/* Shed List */}
          <View style={styles.listContainer}>
            {sheds.map((shed) => (
              <Pressable
                key={shed.id}
                style={[styles.shedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onShedSelect(shed.id, shed.name);
                }}
              >
                {/* Top Section */}
                <View style={styles.shedCardTop}>
                  <View style={styles.shedIconBadge}>
                    <Feather name="home" size={22} color="#00a651" />
                  </View>

                  <View style={styles.shedTitleWrap}>
                    <View style={styles.shedNameRow}>
                      <Text style={[styles.shedName, { color: colors.foreground }]}>{shed.name}</Text>
                      <Pressable
                        style={styles.editPencilBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setShedModalAction("edit");
                          setTargetShedId(shed.id);
                          setShedModalVisible(true);
                        }}
                        hitSlop={8}
                      >
                        <Feather name="edit-2" size={12} color="#6b7280" />
                      </Pressable>
                    </View>
                    <Text style={[styles.shedDesc, { color: colors.mutedForeground }]}>{shed.desc}</Text>
                  </View>

                  <Feather name="chevron-right" size={20} color="#00a651" />
                </View>

                {/* Light Dotted Divider */}
                <View style={styles.cardDivider} />

                {/* Bottom Counts Row */}
                <View style={styles.shedCardBottom}>
                  {/* Left Column: Total Animals */}
                  <View style={styles.animalsTotalCol}>
                    <Text style={[styles.animalsTotalNum, { color: "#00a651" }]}>{shed.total}</Text>
                    <Text style={[styles.animalsTotalLabel, { color: colors.mutedForeground }]}>Animals</Text>
                  </View>

                  {/* Right 4 Metric Columns */}
                  <View style={styles.breakdownRow}>
                    {/* Lactating */}
                    <View style={styles.breakdownCol}>
                      <View style={styles.dotLabelRow}>
                        <View style={[styles.statusDot, { backgroundColor: "#9333ea" }]} />
                        <Text style={styles.statusLabel}>Lactating</Text>
                      </View>
                      <Text style={[styles.statusCountNum, { color: "#9333ea" }]}>{shed.lactating}</Text>
                    </View>

                    <View style={styles.verticalDivider} />

                    {/* Pregnant */}
                    <View style={styles.breakdownCol}>
                      <View style={styles.dotLabelRow}>
                        <View style={[styles.statusDot, { backgroundColor: "#ef4444" }]} />
                        <Text style={styles.statusLabel}>Pregnant</Text>
                      </View>
                      <Text style={[styles.statusCountNum, { color: "#ef4444" }]}>{shed.pregnant}</Text>
                    </View>

                    <View style={styles.verticalDivider} />

                    {/* Dry */}
                    <View style={styles.breakdownCol}>
                      <View style={styles.dotLabelRow}>
                        <View style={[styles.statusDot, { backgroundColor: "#2563eb" }]} />
                        <Text style={styles.statusLabel}>Dry</Text>
                      </View>
                      <Text style={[styles.statusCountNum, { color: "#2563eb" }]}>{shed.dry}</Text>
                    </View>

                    <View style={styles.verticalDivider} />

                    {/* Calves */}
                    <View style={styles.breakdownCol}>
                      <View style={styles.dotLabelRow}>
                        <View style={[styles.statusDot, { backgroundColor: "#ea580c" }]} />
                        <Text style={styles.statusLabel}>Calves</Text>
                      </View>
                      <Text style={[styles.statusCountNum, { color: "#ea580c" }]}>{shed.calf}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          {/* Header Row */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {lx({ ta: "விலங்கு நிலைமை", hi: "पशु स्थिति", en: "Animal Status" })}
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Total Animals: {animals.length}
            </Text>
          </View>

          {/* Categories List */}
          <View style={[styles.categoryList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {categories.map((cat, idx) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryRow,
                  idx < categories.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCategorySelect(cat.id, cat.name);
                }}
              >
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIconBg, { backgroundColor: cat.color }]}>
                    {cat.icon === "cow" ? (
                      <MaterialCommunityIcons name="cow" size={22} color="#fff" />
                    ) : cat.icon === "heart" ? (
                      <Feather name="heart" size={18} color="#fff" />
                    ) : cat.icon === "water-off" ? (
                      <MaterialCommunityIcons name="water-off" size={22} color="#fff" />
                    ) : cat.icon === "baby-bottle" ? (
                      <MaterialCommunityIcons name="baby-bottle" size={22} color="#fff" />
                    ) : (
                      <MaterialCommunityIcons name="dots-horizontal" size={22} color="#fff" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.categoryName, { color: colors.foreground }]}>{cat.name}</Text>
                    <Text style={[styles.categoryDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {cat.desc}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryCount, { color: colors.foreground }]}>{cat.count}</Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Farm Overview Section */}
      <View style={styles.overviewSection}>
        <Text style={[styles.overviewTitle, { color: colors.foreground }]}>
          {lx({ ta: "பண்ணை மேலோட்டம்", hi: "फार्म अवलोकन", en: "Farm Overview" })}
        </Text>

        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.overviewCol}>
            <View style={styles.overviewIconCircle}>
              <MaterialCommunityIcons name="cow" size={22} color="#00a651" />
            </View>
            <Text style={styles.overviewVal}>{animals.length}</Text>
            <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Animals</Text>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewCol}>
            <View style={styles.overviewIconCircle}>
              <Feather name="home" size={20} color="#00a651" />
            </View>
            <Text style={styles.overviewVal}>{sheds.length}</Text>
            <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Sheds</Text>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewCol}>
            <View style={styles.overviewIconCircle}>
              <MaterialCommunityIcons name="gauge" size={22} color="#00a651" />
            </View>
            <Text style={styles.overviewVal}>{animals.length} / 100</Text>
            <View style={styles.capacityLabelRow}>
              <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Capacity</Text>
              <Feather name="info" size={13} color={colors.mutedForeground} style={{ marginLeft: 3 }} />
            </View>
          </View>
        </View>
      </View>

      <ShedManagementModal
        visible={shedModalVisible}
        onClose={() => setShedModalVisible(false)}
        initialAction={shedModalAction}
        targetShedId={targetShedId}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  addShedBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addShedText: {
    color: "#00a651",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  listContainer: {
    gap: 14,
  },
  shedCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  shedCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  shedIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shedTitleWrap: {
    flex: 1,
    justifyContent: "center",
  },
  shedNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  shedName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  editPencilBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  shedDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  cardDivider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e5e7eb",
    marginVertical: 14,
  },
  shedCardBottom: {
    flexDirection: "row",
    alignItems: "center",
  },
  animalsTotalCol: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 12,
    minWidth: 52,
  },
  animalsTotalNum: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  animalsTotalLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  breakdownRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownCol: {
    flex: 1,
    alignItems: "center",
  },
  dotLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#4b5563",
  },
  statusCountNum: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#f0f0f0",
  },
  categoryList: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  categoryDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryCount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  overviewSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  overviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  overviewCol: {
    flex: 1,
    alignItems: "center",
  },
  overviewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewVal: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#00a651",
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  capacityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#f0f0f0",
  },
});
