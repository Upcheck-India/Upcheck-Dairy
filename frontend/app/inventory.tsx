import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InventoryModal from "@/components/InventoryModal";
import { useColors } from "@/hooks/useColors";
import { useInventory } from "@/src/modules/inventory/hooks/useInventory";
import type { InventoryItem } from "@/src/modules/inventory/models/InventoryItem";

type CategoryFilter = "all" | "feed" | "medicine" | "supplement" | "equipment" | "other";

const CATEGORY_TABS: Array<{ key: CategoryFilter; label: string }> = [
  { key: "all", label: "All Items" },
  { key: "feed", label: "Feed" },
  { key: "medicine", label: "Medicine" },
  { key: "supplement", label: "Supplements" },
  { key: "equipment", label: "Equipment" },
  { key: "other", label: "Other" },
];

function getCategoryConfig(category: string) {
  switch (category) {
    case "feed":
      return {
        bg: "#fef3c7",
        iconColor: "#d97706",
        icon: "barley" as const,
        label: "Feed",
      };
    case "medicine":
      return {
        bg: "#f3e8ff",
        iconColor: "#9333ea",
        icon: "pill" as const,
        label: "Medicine",
      };
    case "supplement":
      return {
        bg: "#e0f2fe",
        iconColor: "#0284c7",
        icon: "flask-outline" as const,
        label: "Supplement",
      };
    case "equipment":
      return {
        bg: "#ffedd5",
        iconColor: "#ea580c",
        icon: "tools" as const,
        label: "Equipment",
      };
    default:
      return {
        bg: "#f1f5f9",
        iconColor: "#64748b",
        icon: "package-variant-closed" as const,
        label: "Other",
      };
  }
}

function formatUpdated(date: Date | string | null | undefined): string {
  if (!date) return "Updated today";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Updated today";
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return "Updated today";
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Updated yesterday";
    return `Updated ${diffDays}d ago`;
  } catch {
    return "Updated today";
  }
}

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { inventoryItems, loading, refresh } = useInventory();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | undefined>(undefined);

  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 16);
  const bottomInset = Math.max(insets.bottom, 16);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const lowStockItems = useMemo(
    () => inventoryItems.filter((item) => item.quantity <= item.minQuantity && item.minQuantity > 0),
    [inventoryItems]
  );

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      // Category filter
      if (selectedFilter !== "all" && item.category !== selectedFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesUnit = item.unit?.toLowerCase().includes(query);
        return matchesName || matchesCategory || matchesUnit;
      }
      return true;
    });
  }, [inventoryItems, selectedFilter, searchQuery]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topInset + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Inventory</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Manage your farm supplies
            </Text>
          </View>
        </View>

        <Pressable
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.headerAddBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEditItem(undefined);
            setModalVisible(true);
          }}
        >
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Summary Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Items</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {inventoryItems.length}
            </Text>
            <Text style={[styles.statSub, { color: "#16a34a" }]}>Across all categories</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Stock Alerts</Text>
            <Text
              style={[
                styles.statValue,
                { color: lowStockItems.length > 0 ? "#dc2626" : colors.foreground },
              ]}
            >
              {lowStockItems.length}
            </Text>
            <Text
              style={[
                styles.statSub,
                { color: lowStockItems.length > 0 ? "#dc2626" : "#16a34a" },
              ]}
            >
              {lowStockItems.length > 0 ? "Needs restocking" : "All items stocked"}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search inventory items..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedFilter(tab.key);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? `${colors.primary}18` : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? colors.primary : colors.mutedForeground,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Your Stock Section */}
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Your Stock</Text>

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Loading stock...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="package-variant-closed" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {searchQuery ? "No matching stock found" : "No inventory items yet"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {searchQuery
                ? "Try searching for a different item name"
                : "Add feed, medicines, and supplies to track stock"}
            </Text>
          </View>
        ) : (
          <View style={[styles.stockCardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {filteredItems.map((item, index) => {
              const cfg = getCategoryConfig(item.category);
              const isLow = item.quantity <= item.minQuantity && item.minQuantity > 0;
              const isLast = index === filteredItems.length - 1;

              return (
                <React.Fragment key={item.id}>
                  <Pressable
                    style={styles.itemRow}
                    onPress={() => {
                      setEditItem(item);
                      setModalVisible(true);
                    }}
                  >
                    {/* Category Icon */}
                    <View style={[styles.itemIconBox, { backgroundColor: cfg.bg }]}>
                      <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.iconColor} />
                    </View>

                    {/* Item Details */}
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                      <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
                        {cfg.label} • {formatUpdated(item.lastUpdated)}
                      </Text>
                      <Text style={[styles.itemQty, { color: colors.foreground }]}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>

                    {/* Stock Status Badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isLow ? "#fee2e2" : "#dcfce7",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: isLow ? "#dc2626" : "#16a34a",
                          },
                        ]}
                      >
                        {isLow ? "Low Stock" : "In Stock"}
                      </Text>
                    </View>
                  </Pressable>

                  {!isLast && <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Add Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset, backgroundColor: colors.background }]}>
        <Pressable
          style={[styles.bottomAddBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEditItem(undefined);
            setModalVisible(true);
          }}
        >
          <Feather name="plus-circle" size={20} color="#fff" />
          <Text style={styles.bottomAddBtnText}>Add Inventory Item</Text>
        </Pressable>
      </View>

      {/* Present Add/Edit Inventory Item Modal */}
      <InventoryModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditItem(undefined);
        }}
        editItem={editItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginRight: -4,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    marginVertical: 2,
  },
  statSub: {
    fontSize: 12,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  filterList: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
  },
  sectionHeading: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  stockCardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  loadingBox: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  bottomAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomAddBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
