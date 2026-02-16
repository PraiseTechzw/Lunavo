import { ThemedText } from "@/app/components/themed-text";
import { BorderRadius, Colors, PlatformStyles, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUser } from "@/hooks/use-auth-guard";
import { getGalleryImages } from "@/lib/database";

import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - Spacing.md * 3) / 2;

export default function GalleryScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];

    const { user } = useCurrentUser();
    const isPrivileged = user?.role === 'peer-educator-executive' || user?.role === 'admin';

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = ["All", "Team", "Events", "Club Life"];

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const dbItems = await getGalleryImages();
                if (dbItems) {
                    setItems(dbItems.map(i => ({
                        id: i.id,
                        title: i.title,
                        category: i.tags && i.tags.length > 0 ? i.tags[0] : 'General',
                        image: i.url || i.file_path,
                        description: i.description || 'No description provided.',
                        type: i.resource_type || 'image'
                    })));
                }
            } catch (e) {
                console.error("Gallery Load Error:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredItems = activeCategory === "All"
        ? items
        : items.filter(item => item.category === activeCategory);

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(600)}
            style={styles.cardContainer}
        >
            <TouchableOpacity
                style={[styles.card, PlatformStyles.premiumShadow]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedImage(item);
                }}
                activeOpacity={0.9}
            >
                <Image
                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                    style={styles.image}
                    contentFit="cover"
                    transition={1000}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.cardOverlay}
                >
                    <ThemedText style={styles.itemTitle} numberOfLines={1}>{item.title}</ThemedText>
                    <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>{item.category}</ThemedText>
                    </View>
                </LinearGradient>
                {item.type === 'video' && (
                    <View style={styles.playIconContainer}>
                        <MaterialCommunityIcons name="play-circle" size={40} color="#FFF" />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText type="h1" style={styles.headerTitle}>Gallery</ThemedText>
                    {isPrivileged ? (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/executive/new-resource', params: { category: 'gallery' } })}
                            style={styles.addButton}
                        >
                            <LinearGradient
                                colors={['#4F46E5', '#7C3AED']}
                                style={styles.addIconGradient}
                            >
                                <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}
                </View>

                <View style={styles.filterContainer}>
                    <FlatList
                        horizontal
                        data={categories}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setActiveCategory(item);
                                }}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: activeCategory === item ? colors.primary : colors.surface,
                                        borderColor: activeCategory === item ? colors.primary : colors.border
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

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredItems}
                        renderItem={renderItem}
                        numColumns={2}
                        keyExtractor={(item) => item.id}
                        columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.md }}
                        contentContainerStyle={{ paddingBottom: 100, gap: Spacing.md }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="image-off-outline" size={64} color={colors.icon} />
                                <ThemedText style={styles.emptyText}>No memories captured yet.</ThemedText>
                                {isPrivileged && (
                                    <TouchableOpacity
                                        style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
                                        onPress={() => router.push({ pathname: '/executive/new-resource', params: { category: 'gallery' } })}
                                    >
                                        <ThemedText style={styles.emptyAddText}>Start Uploading</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />
                )}

                {/* Preview Modal */}
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
                            <View style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={28} color="#FFF" />
                            </View>
                        </TouchableOpacity>

                        {selectedImage && (
                            <View style={styles.modalContent}>
                                <Animated.View entering={ZoomIn.duration(400)} style={styles.modalMediaContainer}>
                                    <Image
                                        source={typeof selectedImage.image === 'string' ? { uri: selectedImage.image } : selectedImage.image}
                                        style={styles.modalImage}
                                        contentFit="contain"
                                    />
                                </Animated.View>

                                <Animated.View entering={FadeInUp.delay(200)} style={styles.modalTextContainer}>
                                    <View style={styles.modalHeaderRow}>
                                        <View style={[styles.modalBadge, { backgroundColor: colors.primary }]}>
                                            <ThemedText style={styles.modalBadgeText}>{selectedImage.category}</ThemedText>
                                        </View>
                                        {selectedImage.type === 'video' && (
                                            <View style={[styles.modalBadge, { backgroundColor: '#EF4444', marginLeft: 8 }]}>
                                                <ThemedText style={styles.modalBadgeText}>Video</ThemedText>
                                            </View>
                                        )}
                                    </View>
                                    <ThemedText style={styles.modalTitle}>{selectedImage.title}</ThemedText>
                                    <ThemedText style={styles.modalDesc}>{selectedImage.description}</ThemedText>

                                    <TouchableOpacity
                                        style={styles.modalAction}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            // Share or Save logic could go here
                                        }}
                                    >
                                        <MaterialCommunityIcons name="share-variant" size={20} color="#FFF" />
                                        <ThemedText style={styles.modalActionText}>Share Memory</ThemedText>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        )}
                    </View>
                </Modal>
            </View>
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
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: "900",
        fontSize: 32,
    },
    addButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    addIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...PlatformStyles.premiumShadow,
    },
    filterContainer: {
        marginBottom: Spacing.lg,
        marginTop: Spacing.sm,
    },
    filterContent: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "700",
    },
    cardContainer: {
        width: COLUMN_WIDTH,
    },
    card: {
        width: '100%',
        height: COLUMN_WIDTH * 1.5,
        borderRadius: BorderRadius.xxl,
        overflow: "hidden",
        backgroundColor: '#000',
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
        fontWeight: "800",
        fontSize: 14,
        marginBottom: 6,
    },
    badge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        alignSelf: "flex-start",
    },
    badgeText: {
        color: "#FFF",
        fontSize: 9,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    playIconContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 50,
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        opacity: 0.5,
        textAlign: 'center',
    },
    emptyAddButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
    },
    emptyAddText: {
        color: '#FFF',
        fontWeight: '800',
    },
    modalBg: {
        flex: 1,
        backgroundColor: "black",
    },
    modalClose: {
        position: "absolute",
        top: 60,
        right: 20,
        zIndex: 100,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        flex: 1,
        justifyContent: "center",
    },
    modalMediaContainer: {
        width: width,
        height: width * 1.2,
    },
    modalImage: {
        width: "100%",
        height: "100%",
    },
    modalTextContainer: {
        padding: Spacing.xl,
        marginTop: -Spacing.xxl,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    modalBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    modalBadgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "900",
        textTransform: 'uppercase',
    },
    modalTitle: {
        color: "#FFF",
        fontSize: 28,
        fontWeight: "900",
        marginBottom: 12,
    },
    modalDesc: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    modalAction: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    modalActionText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    }
});
