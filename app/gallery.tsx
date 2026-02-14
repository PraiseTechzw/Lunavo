import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - Spacing.md * 3) / 2;

const GALLERY_ITEMS = [
    {
        id: "1",
        title: "Executive Team",
        category: "Team",
        image: require("../assets/images/team/excutive/Praise Masunga.jpg"),
        description: "Our dedicated leadership team driving change.",
    },
    {
        id: "2",
        title: "Member Portrait",
        category: "Team",
        image: require("../assets/images/team/excutive/Ashley  Mashatise.jpg"),
        description: "Core committee member.",
    },
    {
        id: "3",
        title: "Academic Support",
        category: "Events",
        image: require("../assets/images/team/excutive/Dalitso Chafuwa.jpg"),
        description: "Peer educator session at the library.",
    },
    {
        id: "4",
        title: "Wellness Workshop",
        category: "Events",
        image: require("../assets/images/team/excutive/Ruvarashe Mushonga   .jpg"),
        description: "SRH awareness campaign.",
    },
    {
        id: "5",
        title: "Social Outreach",
        category: "Club Life",
        image: require("../assets/images/team/excutive/Tafara  Chakandinakira.jpg"),
        description: "Community engagement day.",
    },
    {
        id: "6",
        title: "Peer Mentor",
        category: "Team",
        image: require("../assets/images/team/excutive/Tatenda  Marundu                              .jpg"),
        description: "One-on-one support sessions.",
    },
];

export default function GalleryScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];

    const [selectedImage, setSelectedImage] = useState<any>(null);

    const categories = ["All", "Team", "Events", "Club Life"];
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredItems = activeCategory === "All"
        ? GALLERY_ITEMS
        : GALLERY_ITEMS.filter(item => item.category === activeCategory);

    const renderItem = ({ item }: { item: typeof GALLERY_ITEMS[0] }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedImage(item)}
            activeOpacity={0.9}
        >
            <Image
                source={item.image}
                style={styles.image}
                contentFit="cover"
                transition={300}
            />
            <View style={[styles.cardOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{item.category}</ThemedText>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h2" style={styles.headerTitle}>Gallery</ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.filterContainer}>
                    <FlatList
                        horizontal
                        data={categories}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setActiveCategory(item)}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: activeCategory === item ? colors.primary : colors.surface,
                                        borderColor: colors.border
                                    }
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.filterText,
                                        { color: activeCategory === item ? "#FFF" : colors.text }
                                    ]}
                                >
                                    {item}
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.md }}
                    contentContainerStyle={{ paddingBottom: Spacing.xl, gap: Spacing.md }}
                />

                {/* Image Preview Modal */}
                <Modal
                    visible={!!selectedImage}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedImage(null)}
                >
                    <View style={styles.modalBg}>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setSelectedImage(null)}
                        >
                            <MaterialCommunityIcons name="close" size={32} color="#FFF" />
                        </TouchableOpacity>

                        {selectedImage && (
                            <View style={styles.modalContent}>
                                <Image
                                    source={selectedImage.image}
                                    style={styles.modalImage}
                                    contentFit="contain"
                                />
                                <View style={styles.modalTextContainer}>
                                    <ThemedText style={styles.modalTitle}>{selectedImage.title}</ThemedText>
                                    <ThemedText style={styles.modalCategory}>{selectedImage.category}</ThemedText>
                                    <ThemedText style={styles.modalDesc}>{selectedImage.description}</ThemedText>
                                </View>
                            </View>
                        )}
                    </View>
                </Modal>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    headerTitle: {
        fontWeight: "800",
    },
    filterContainer: {
        marginBottom: Spacing.md,
    },
    filterContent: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "600",
    },
    card: {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH * 1.5,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    cardOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.md,
        justifyContent: "flex-end",
    },
    itemTitle: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 14,
        marginBottom: 4,
    },
    badge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    badgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    modalBg: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalClose: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
    },
    modalContent: {
        width: "100%",
        height: "80%",
        justifyContent: "center",
    },
    modalImage: {
        width: "100%",
        height: "70%",
    },
    modalTextContainer: {
        padding: Spacing.xl,
    },
    modalTitle: {
        color: "#FFF",
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 4,
    },
    modalCategory: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
        marginBottom: 12,
    },
    modalDesc: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 16,
        lineHeight: 24,
    },
});
