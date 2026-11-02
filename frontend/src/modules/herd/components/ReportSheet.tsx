import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Shared bottom-sheet shell for the herd's read-only summaries, so the report
 * and health overview stay visually identical.
 */
export function ReportSheet({ visible, onClose, title, subtitle, children }: ReportSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SheetSection({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>;
}

export function SheetNote({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.note, { color: colors.mutedForeground }]}>{children}</Text>;
}

export function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.statRow}>{children}</View>;
}

/** A labelled value with a proportion bar underneath. */
export function BarRow({
  label,
  value,
  share,
  color,
}: {
  label: string;
  value: string;
  share: number;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[styles.fill, { backgroundColor: color, width: `${Math.round(share * 100)}%` }]}
        />
      </View>
    </View>
  );
}

/** A tappable line item: coloured icon, title, subtitle, trailing value. */
export function SheetListRow({
  icon,
  accent,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  accent: string;
  title: string;
  subtitle: string;
  trailing?: string;
  onPress?: () => void;
}) {
  const colors = useColors();
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      style={[styles.listRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.listIcon, { backgroundColor: accent + "15" }]}>
        <Feather name={icon} size={15} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.listSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {trailing ? (
        <Text style={[styles.listTrailing, { color: accent }]}>{trailing}</Text>
      ) : null}
      {onPress ? (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
      ) : null}
    </Container>
  );
}

export function SheetEmpty({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={44} color={colors.border} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginTop: 20,
    marginBottom: 10,
  },
  statRow: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 3,
    textAlign: "center",
  },
  note: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 8, lineHeight: 15 },
  row: { marginBottom: 10 },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  rowLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  rowValue: { fontSize: 12, fontFamily: "Inter_500Medium", marginLeft: 8 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  listIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  listTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  listSubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1, lineHeight: 14 },
  listTrailing: { fontSize: 12, fontFamily: "Inter_700Bold", marginLeft: 8 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
});
