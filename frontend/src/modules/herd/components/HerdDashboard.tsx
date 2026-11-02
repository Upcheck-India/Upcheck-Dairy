import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useLanguage } from "@/context/LanguageContext";
import { Animal } from "../../animals/models/Animal";
import { useSheds, Shed, DEFAULT_SHEDS, DEFAULT_SHED_CAPACITY } from "../context/ShedProvider";
import { resolveAnimalShed } from "../utils/shedAssignment";
import { useCategories, DEFAULT_CATEGORIES } from "../context/CategoryProvider";
import { ShedManagementModal } from "./ShedManagementModal";
import { CategoryManagementModal } from "./CategoryManagementModal";

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
  const tabBarHeight = useTabBarHeight();
  const { language } = useLanguage();
  const { sheds: storedSheds } = useSheds();
  const { categories: storedCategories } = useCategories();

  const [shedModalVisible, setShedModalVisible] = useState(false);
  const [shedModalAction, setShedModalAction] = useState<"list" | "create" | "edit">("list");
  const [targetShedId, setTargetShedId] = useState<string | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryModalAction, setCategoryModalAction] = useState<"list" | "create" | "edit">("list");
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);

  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  // Helper to resolve an animal's category
  const getAnimalCategory = (animal: Animal): string => {
    if (animal.status) return animal.status;
    if (animal.type === "calf") return "calf";
    if (animal.isPregnant) return "pregnant";
    
    const idNum = parseInt(animal.id) || 0;
    if (idNum % 5 === 0) return "other";
    if (idNum % 3 === 0) return "dry";
    return "lactating";
  };

  // Helper to resolve an animal's shed against the sheds that currently exist
  const getAnimalShed = (animal: Animal): string => resolveAnimalShed(animal, storedSheds);

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
    shed_4: {
      en: "Shed 4 - Calf Pen",
      ta: "கொட்டகை 4 - கன்றுக்குட்டி",
      hi: "शेड 4 - बछड़ा",
      descEn: "Calf and young stock",
      descTa: "கன்றுக்குட்டிகள் பகுதி",
    },
  };

  // Seeded sheds get translated copy until the farmer renames them; anything the
  // farmer typed is shown exactly as entered.
  const getShedMeta = (shed: Shed) => {
    const seeded = DEFAULT_SHEDS.find((d) => d.id === shed.id);
    const standard = STANDARD_SHEDS[shed.id];
    const untouched = seeded && standard && seeded.name === shed.name;

    return {
      name: untouched
        ? lx({ ta: standard.ta, hi: standard.hi, en: standard.en })
        : shed.name,
      desc: untouched
        ? lx({ ta: standard.descTa, en: standard.descEn })
        : shed.desc || lx({ ta: "கொட்டகை இருப்பிடம்", en: "Housing section" }),
    };
  };

  // Sheds come straight from the shed list, so created/renamed/deleted sheds
  // show up immediately and deleted ones never reappear.
  const sheds = React.useMemo(() => {
    return storedSheds.map((shed) => {
      const meta = getShedMeta(shed);
      const shedAnimals = animals.filter((a) => getAnimalShed(a) === shed.id);
      return {
        id: shed.id,
        name: meta.name,
        desc: meta.desc,
        capacity: shed.capacity ?? DEFAULT_SHED_CAPACITY,
        lactating: shedAnimals.filter((a) => getAnimalCategory(a) === "lactating").length,
        pregnant: shedAnimals.filter((a) => getAnimalCategory(a) === "pregnant").length,
        dry: shedAnimals.filter((a) => getAnimalCategory(a) === "dry").length,
        calf: shedAnimals.filter((a) => getAnimalCategory(a) === "calf").length,
        total: shedAnimals.length,
      };
    });
  }, [animals, storedSheds, language]);

  const totalCapacity = React.useMemo(
    () => sheds.reduce((sum, s) => sum + s.capacity, 0),
    [sheds]
  );

  // Translated copy for the built-in categories, used until they are renamed.
  const STANDARD_CATEGORIES: Record<string, { en: string; ta: string; te?: string; hi?: string; descEn: string; descTa: string }> = {
    lactating: {
      en: "Lactating",
      ta: "பால் கறப்பவை",
      te: "పాలు ఇచ్చేవి",
      hi: "दुधारू पशु",
      descEn: "Animals that are currently giving milk",
      descTa: "தற்போது பால் கறக்கும் மாடுகள்",
    },
    pregnant: {
      en: "Pregnant",
      ta: "சினை மாடுகள்",
      te: "గర్భం",
      hi: "गर्भवती पशु",
      descEn: "Pregnant animals",
      descTa: "கர்ப்பமாக உள்ள மாடுகள்",
    },
    dry: {
      en: "Dry",
      ta: "வறண்ட மாடுகள்",
      te: "పాలు ఇవ్వనివి",
      hi: "सूखे पशु",
      descEn: "Animals not giving milk",
      descTa: "பால் கறக்காத மாடுகள்",
    },
    calf: {
      en: "Calves",
      ta: "கன்றுகள்",
      te: "దూడలు",
      hi: "बछड़े",
      descEn: "Young animals (not weaned)",
      descTa: "இளம் கன்றுக்குட்டிகள்",
    },
    other: {
      en: "Others",
      ta: "மற்றவை",
      te: "ఇతరాలు",
      hi: "अन्य",
      descEn: "Bulls, sick, in treatment, heifers, etc.",
      descTa: "காளைகள், கிடேரிகள் மற்றும் சிகிச்சை பெறுபவை",
    },
  };

  // Categories come from the category list, so create/rename/delete show up here
  // immediately.
  const categories = React.useMemo(() => {
    return storedCategories.map((category) => {
      const seeded = DEFAULT_CATEGORIES.find((d) => d.id === category.id);
      const standard = STANDARD_CATEGORIES[category.id];
      const untouched = seeded && standard && seeded.name === category.name;

      return {
        id: category.id,
        name: untouched
          ? lx({ ta: standard.ta, te: standard.te ?? standard.en, hi: standard.hi ?? standard.en, en: standard.en })
          : category.name,
        desc: untouched
          ? lx({ ta: standard.descTa, en: standard.descEn })
          : category.desc || lx({ ta: "தனிப்பயன் வகை", en: "Custom category" }),
        color: category.color,
        icon: category.icon,
        count: animals.filter((a) => getAnimalCategory(a) === category.id).length,
      };
    });
  }, [storedCategories, animals, language]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
    >
      {activeTab === "by_shed" ? (
        <View style={styles.section}>
          {/* Header Row */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {lx({ ta: "கொட்டகைகள் (இடங்கள்)", hi: "शेड (स्थान)", en: "Sheds (Locations)" })}
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
              <Feather name="plus" size={14} color="#16a34a" style={{ marginRight: 3 }} />
              <Text style={styles.addShedText}>{lx({ en: "New Shed", ta: "புதிய கொட்டகை" })}</Text>
            </Pressable>
          </View>

          {/* Shed List */}
          <View style={styles.listContainer}>
            {sheds.length === 0 ? (
              <View style={[styles.emptyShedCard, { borderColor: colors.border }]}>
                <Feather name="home" size={22} color={colors.mutedForeground} />
                <Text style={[styles.emptyShedText, { color: colors.mutedForeground }]}>
                  {lx({
                    en: "No sheds yet. Create one to start organising your herd.",
                    ta: "கொட்டகைகள் இல்லை. ஒன்றை உருவாக்கி தொடங்குங்கள்.",
                  })}
                </Text>
              </View>
            ) : null}
            {sheds.map((shed) => (
              <Pressable
                key={shed.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onShedSelect(shed.id, shed.name);
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{shed.name}</Text>
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{shed.desc}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTotal, { color: "#16a34a" }]}>{shed.total}</Text>
                    <Pressable
                      style={styles.cardActionBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShedModalAction("edit");
                        setTargetShedId(shed.id);
                        setShedModalVisible(true);
                      }}
                      hitSlop={8}
                    >
                      <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                    </Pressable>
                    <Feather name="chevron-right" size={18} color="#16a34a" />
                  </View>
                </View>

                {/* Circles for Status Counts */}
                <View style={styles.countsRow}>
                  <View style={[styles.countCircle, { backgroundColor: "#7c3aed18" }]}>
                    <Text style={[styles.countText, { color: "#7c3aed" }]}>{shed.lactating}</Text>
                  </View>
                  <View style={[styles.countCircle, { backgroundColor: "#ef444418" }]}>
                    <Text style={[styles.countText, { color: "#ef4444" }]}>{shed.pregnant}</Text>
                  </View>
                  <View style={[styles.countCircle, { backgroundColor: "#2563eb18" }]}>
                    <Text style={[styles.countText, { color: "#2563eb" }]}>{shed.dry}</Text>
                  </View>
                  <View style={[styles.countCircle, { backgroundColor: "#ea580c18" }]}>
                    <Text style={[styles.countText, { color: "#ea580c" }]}>{shed.calf}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            {[
              { label: lx({ ta: "கறவை", en: "Lactating" }), color: "#7c3aed" },
              { label: lx({ ta: "சினை", en: "Pregnant" }), color: "#ef4444" },
              { label: lx({ ta: "வறண்ட", en: "Dry" }), color: "#2563eb" },
              { label: lx({ ta: "கன்றுகள்", en: "Calves" }), color: "#ea580c" },
            ].map((item, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              </View>
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
            <Pressable
              style={styles.addCategoryBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryModalAction("create");
                setTargetCategoryId(null);
                setCategoryModalVisible(true);
              }}
            >
              <Feather name="plus" size={14} color="#7c3aed" style={{ marginRight: 3 }} />
              <Text style={styles.addCategoryText}>{lx({ en: "New Category", ta: "புதிய வகை" })}</Text>
            </Pressable>
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
                      <MaterialCommunityIcons name={(cat.icon as any) || "dots-horizontal"} size={22} color="#fff" />
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
                  <Pressable
                    style={styles.cardActionBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategoryModalAction("edit");
                      setTargetCategoryId(cat.id);
                      setCategoryModalVisible(true);
                    }}
                    hitSlop={8}
                  >
                    <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                  </Pressable>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Summary Stats Box */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryVal, { color: "#16a34a" }]}>{animals.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {lx({ ta: "மொத்த மாடுகள்", en: "Total Animals" })}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryVal, { color: colors.foreground }]}>{sheds.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {lx({ ta: "கொட்டகைகள்", en: "Sheds" })}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryVal, { color: colors.foreground }]}>{totalCapacity}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {lx({ ta: "கொள்ளளவு", en: "Capacity" })}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryVal, { color: colors.foreground }]}>
              {totalCapacity > 0 ? `${Math.round((animals.length / totalCapacity) * 100)}%` : "—"}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {lx({ ta: "நிரம்பியது", en: "Occupancy" })}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.quickActionsContainer}>
        <Text style={[styles.quickActionsTitle, { color: colors.foreground }]}>
          {lx({ ta: "விரைவு செயல்பாடுகள்", hi: "त्वरित कार्रवाई", en: "Quick Actions" })}
        </Text>
        <View style={styles.quickActionsGrid}>
          <View style={styles.quickActionsRow}>
            <Pressable
              style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShedModalAction("list");
                setTargetShedId(null);
                setShedModalVisible(true);
                onManageSheds();
              }}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#16a34a15" }]}>
                <Feather name="home" size={18} color="#16a34a" />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.foreground }]}>
                {lx({ ta: "கொட்டகைகள்", en: "Manage Sheds" })}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryModalAction("list");
                setTargetCategoryId(null);
                setCategoryModalVisible(true);
                onManageCategories();
              }}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#7c3aed15" }]}>
                <Feather name="tag" size={18} color="#7c3aed" />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.foreground }]}>
                {lx({ ta: "வகைகள்", en: "Manage Categories" })}
              </Text>
            </Pressable>
          </View>

          <View style={styles.quickActionsRow}>
            <Pressable
              style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onHealthOverview();
              }}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#ef444415" }]}>
                <Feather name="activity" size={18} color="#ef4444" />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.foreground }]}>
                {lx({ ta: "ஆரோக்கியம்", en: "Health Overview" })}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onHerdReports();
              }}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#ea580c15" }]}>
                <Feather name="trending-up" size={18} color="#ea580c" />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.foreground }]}>
                {lx({ ta: "அறிக்கைகள்", en: "Herd Reports" })}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ShedManagementModal
        visible={shedModalVisible}
        onClose={() => setShedModalVisible(false)}
        initialAction={shedModalAction}
        targetShedId={targetShedId}
      />

      <CategoryManagementModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        initialAction={categoryModalAction}
        targetCategoryId={targetCategoryId}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  addShedBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16a34a15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addShedText: {
    color: "#16a34a",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  addCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7c3aed15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addCategoryText: {
    color: "#7c3aed",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  cardActionBtn: {
    padding: 4,
    marginLeft: 4,
    marginRight: 2,
  },
  listContainer: {
    gap: 12,
  },
  emptyShedCard: {
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyShedText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardTotal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  countsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  countCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
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
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  summaryVal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#ccc",
    opacity: 0.3,
  },
  quickActionsContainer: {
    marginTop: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  quickActionsGrid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    gap: 10,
  },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
});
