import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { Screen } from "@/components/screen";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  FEATURED_TRANSLATIONS,
  LANGUAGE_OPTIONS,
} from "@/constants/translations";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  ensureTranslationOffline,
  getAvailableTranslations,
  getOfflineMeta,
  isTranslationOffline,
} from "@/services/bible-api";
import {
  cancelDailyReadingNotifications,
  formatReminderTime,
  getNotificationPermissionState,
  isExpoGoAndroidWithoutNotifications,
  isNotificationsSupported,
  PERMISSION_DENIED_THRESHOLD,
  requestNotificationPermissions,
  scheduleTestDailyReadingNotification,
  syncDailyReadingNotifications,
} from "@/services/daily-notifications";
import { useBibleStore } from "@/store/bible-store";
import type { ApiTranslation, ColorSchemePreference } from "@/types/bible";
import { openExternalUrl } from "@/utils/open-external-url";

const THEME_OPTIONS: { value: ColorSchemePreference; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Automático" },
];

export default function SettingsScreen() {
  const language = useBibleStore((s) => s.language);
  const translationId = useBibleStore((s) => s.translationId);
  const fontSize = useBibleStore((s) => s.fontSize);
  const colorSchemePreference = useBibleStore((s) => s.colorSchemePreference);
  const setLanguage = useBibleStore((s) => s.setLanguage);
  const setTranslationId = useBibleStore((s) => s.setTranslationId);
  const setFontSize = useBibleStore((s) => s.setFontSize);
  const setColorSchemePreference = useBibleStore(
    (s) => s.setColorSchemePreference,
  );
  const dailyReminderEnabled = useBibleStore((s) => s.dailyReminderEnabled);
  const dailyReminderHour = useBibleStore((s) => s.dailyReminderHour);
  const dailyReminderMinute = useBibleStore((s) => s.dailyReminderMinute);
  const notificationPermissionDeniedCount = useBibleStore(
    (s) => s.notificationPermissionDeniedCount,
  );
  const setDailyReminderEnabled = useBibleStore(
    (s) => s.setDailyReminderEnabled,
  );
  const setDailyReminderTime = useBibleStore((s) => s.setDailyReminderTime);
  const recordNotificationPermissionDenied = useBibleStore(
    (s) => s.recordNotificationPermissionDenied,
  );
  const clearNotificationPermissionDeniedCount = useBibleStore(
    (s) => s.clearNotificationPermissionDeniedCount,
  );

  const [allTranslations, setAllTranslations] = useState<ApiTranslation[]>([]);
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineVerseCount, setOfflineVerseCount] = useState<number | null>(
    null,
  );
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState(false);
  const [canAskNotificationPermission, setCanAskNotificationPermission] =
    useState(true);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const { contentContainerStyle } = useResponsiveLayout({
    variant: "settings",
  });
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "cardBorder");
  const accent = useThemeColor({}, "accent");
  const muted = useThemeColor({}, "muted");

  useEffect(() => {
    void getAvailableTranslations()
      .then(setAllTranslations)
      .catch(() => {});
  }, []);

  useEffect(() => {
    void (async () => {
      const ready = await isTranslationOffline(translationId);
      setOfflineReady(ready);
      if (ready) {
        const meta = await getOfflineMeta(translationId);
        setOfflineVerseCount(meta?.verseCount ?? null);
      } else {
        setOfflineVerseCount(null);
      }
    })();
  }, [translationId]);

  const featuredForLanguage = FEATURED_TRANSLATIONS.filter(
    (t) => t.language === language,
  );
  const activeTranslation = allTranslations.find((t) => t.id === translationId);
  const expoGoAndroidWithoutNotifications = isExpoGoAndroidWithoutNotifications();
  const notificationsSupported = isNotificationsSupported();
  const showOpenSettingsButton =
    notificationsSupported &&
    !notificationPermissionGranted &&
    (!canAskNotificationPermission ||
      notificationPermissionDeniedCount >= PERMISSION_DENIED_THRESHOLD);

  const refreshNotificationPermission = useCallback(async () => {
    if (!notificationsSupported) return;

    const permission = await getNotificationPermissionState();
    setNotificationPermissionGranted(permission.granted);
    setCanAskNotificationPermission(permission.canAskAgain);

    if (permission.granted) {
      clearNotificationPermissionDeniedCount();
    }
  }, [clearNotificationPermissionDeniedCount, notificationsSupported]);

  useEffect(() => {
    void refreshNotificationPermission();
  }, [refreshNotificationPermission]);

  useEffect(() => {
    if (!notificationsSupported) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshNotificationPermission();
      }
    });

    return () => subscription.remove();
  }, [notificationsSupported, refreshNotificationPermission]);

  const scheduleDailyReminder = useCallback(async () => {
    await syncDailyReadingNotifications({
      hour: dailyReminderHour,
      minute: dailyReminderMinute,
      translationId,
    });
  }, [dailyReminderHour, dailyReminderMinute, translationId]);

  useEffect(() => {
    if (!dailyReminderEnabled || !notificationPermissionGranted) return;
    void scheduleDailyReminder();
  }, [
    dailyReminderEnabled,
    notificationPermissionGranted,
    scheduleDailyReminder,
  ]);

  const ensureNotificationPermission = useCallback(async () => {
    const current = await getNotificationPermissionState();
    if (current.granted) {
      return true;
    }

    if (!current.canAskAgain) {
      recordNotificationPermissionDenied();
      return false;
    }

    const requested = await requestNotificationPermissions();
    setNotificationPermissionGranted(requested.granted);
    setCanAskNotificationPermission(requested.canAskAgain);

    if (requested.granted) {
      clearNotificationPermissionDeniedCount();
      return true;
    }

    recordNotificationPermissionDenied();
    return false;
  }, [
    clearNotificationPermissionDeniedCount,
    recordNotificationPermissionDenied,
  ]);

  const handleDailyReminderToggle = useCallback(
    async (enabled: boolean) => {
      if (!notificationsSupported) {
        Alert.alert(
          "No disponible",
          "Los recordatorios diarios solo están disponibles en iOS y Android.",
        );
        return;
      }

      if (!enabled) {
        setDailyReminderEnabled(false);
        await cancelDailyReadingNotifications();
        return;
      }

      setNotificationBusy(true);
      try {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          Alert.alert(
            "Permiso necesario",
            "Activa las notificaciones para recibir la lectura del día.",
          );
          return;
        }

        setDailyReminderEnabled(true);
        await scheduleDailyReminder();
      } finally {
        setNotificationBusy(false);
      }
    },
    [
      ensureNotificationPermission,
      notificationsSupported,
      scheduleDailyReminder,
      setDailyReminderEnabled,
    ],
  );

  const handleReminderHourChange = useCallback(
    async (delta: number) => {
      const nextHour = (dailyReminderHour + delta + 24) % 24;
      setDailyReminderTime(nextHour, dailyReminderMinute);

      if (dailyReminderEnabled && notificationPermissionGranted) {
        await syncDailyReadingNotifications({
          hour: nextHour,
          minute: dailyReminderMinute,
          translationId,
        });
      }
    },
    [
      dailyReminderEnabled,
      dailyReminderHour,
      dailyReminderMinute,
      notificationPermissionGranted,
      setDailyReminderTime,
      translationId,
    ],
  );

  const handleReminderMinuteChange = useCallback(
    async (delta: number) => {
      const nextMinute = (dailyReminderMinute + delta + 60) % 60;
      setDailyReminderTime(dailyReminderHour, nextMinute);

      if (dailyReminderEnabled && notificationPermissionGranted) {
        await syncDailyReadingNotifications({
          hour: dailyReminderHour,
          minute: nextMinute,
          translationId,
        });
      }
    },
    [
      dailyReminderEnabled,
      dailyReminderHour,
      dailyReminderMinute,
      notificationPermissionGranted,
      setDailyReminderTime,
      translationId,
    ],
  );

  const openSystemSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        "No se pudo abrir Ajustes",
        "Abre los ajustes del sistema manualmente y activa las notificaciones para esta app.",
      );
    }
  }, []);

  const handleTestNotification = useCallback(async () => {
    setNotificationBusy(true);
    try {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Permiso necesario",
          "Activa las notificaciones para probar el recordatorio.",
        );
        return;
      }

      await scheduleTestDailyReadingNotification(translationId);
      Alert.alert(
        "Notificación programada",
        "Recibirás la lectura del día en unos segundos. Tócala para probar la navegación.",
      );
    } catch {
      Alert.alert(
        "No se pudo programar",
        "Comprueba los permisos de notificaciones e inténtalo de nuevo.",
      );
    } finally {
      setNotificationBusy(false);
    }
  }, [ensureNotificationPermission, translationId]);

  const openLicense = useCallback(async (url: string) => {
    try {
      await openExternalUrl(url);
    } catch {
      Alert.alert(
        "No se pudo abrir el enlace",
        "Comprueba tu conexión e inténtalo de nuevo.",
      );
    }
  }, []);

  return (
    <Screen variant="settings">
      <ScrollView
        contentContainerStyle={[contentContainerStyle, styles.content]}
      >
        <ThemedText type="title" style={styles.heading}>
          Ajustes
        </ThemedText>

        <Section title="Idioma">
          <View style={styles.chipRow}>
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = language === option.code;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => setLanguage(option.code)}
                  style={[
                    styles.chip,
                    {
                      borderColor,
                      backgroundColor: selected ? accent : cardColor,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Traducción">
          {featuredForLanguage.map((translation) => {
            const selected = translationId === translation.id;
            return (
              <Pressable
                key={translation.id}
                onPress={() => setTranslationId(translation.id)}
                style={[
                  styles.option,
                  { backgroundColor: cardColor, borderColor },
                  selected && { borderColor: accent, borderWidth: 2 },
                ]}
              >
                <ThemedText type="defaultSemiBold">
                  {translation.label}
                </ThemedText>
                <ThemedText style={[styles.optionDesc, { color: muted }]}>
                  {translation.description}
                </ThemedText>
              </Pressable>
            );
          })}
        </Section>

        <Section title="Apariencia">
          <View style={styles.chipRow}>
            {THEME_OPTIONS.map((option) => {
              const selected = colorSchemePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setColorSchemePreference(option.value)}
                  style={[
                    styles.chip,
                    {
                      borderColor,
                      backgroundColor: selected ? accent : cardColor,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText style={[styles.optionDesc, { color: muted }]}>
            Automático sigue el tema del sistema operativo.
          </ThemedText>
        </Section>

        <Section title="Tamaño de fuente">
          <ThemedView
            style={[
              styles.fontRow,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <Pressable
              onPress={() => setFontSize(Math.max(14, fontSize - 1))}
              style={[styles.fontButton, { borderColor }]}
            >
              <ThemedText type="defaultSemiBold">A−</ThemedText>
            </Pressable>
            <ThemedText style={styles.fontSizeLabel}>{fontSize} pt</ThemedText>
            <Pressable
              onPress={() => setFontSize(Math.min(24, fontSize + 1))}
              style={[styles.fontButton, { borderColor }]}
            >
              <ThemedText type="defaultSemiBold">A+</ThemedText>
            </Pressable>
          </ThemedView>
        </Section>

        {expoGoAndroidWithoutNotifications ? (
          <Section title="Recordatorio diario">
            <ThemedText style={[styles.optionDesc, { color: muted }]}>
              En Expo Go para Android las notificaciones no están disponibles. Para
              probarlas necesitas compilar la app con un development build.
            </ThemedText>
            <ThemedView
              style={[styles.option, { backgroundColor: cardColor, borderColor }]}>
              <ThemedText type="defaultSemiBold">Development build</ThemedText>
              <ThemedText style={[styles.optionDesc, { color: muted }]}>
                Ejecuta en tu computadora: npx expo run:android
              </ThemedText>
              <ThemedText style={[styles.optionDesc, { color: muted }]}>
                Eso instala una versión de la app con soporte nativo de notificaciones.
              </ThemedText>
            </ThemedView>
          </Section>
        ) : notificationsSupported ? (
          <Section title="Recordatorio diario">
            <ThemedView
              style={[
                styles.option,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <View style={styles.reminderHeader}>
                <View style={styles.reminderCopy}>
                  <ThemedText type="defaultSemiBold">
                    Lectura del día
                  </ThemedText>
                  <ThemedText style={[styles.optionDesc, { color: muted }]}>
                    Recibe cada mañana el versículo recomendado. Al tocar la
                    notificación irás directo a leerlo.
                  </ThemedText>
                </View>
                <Switch
                  value={dailyReminderEnabled}
                  onValueChange={(value) =>
                    void handleDailyReminderToggle(value)
                  }
                  disabled={notificationBusy}
                  trackColor={{ false: borderColor, true: accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ThemedView>

            {dailyReminderEnabled ? (
              <ThemedView
                style={[
                  styles.timeRow,
                  { backgroundColor: cardColor, borderColor },
                ]}
              >
                <ThemedText type="defaultSemiBold">
                  Hora del recordatorio
                </ThemedText>
                <View style={styles.timeControls}>
                  <View style={styles.timePart}>
                    <Pressable
                      onPress={() => void handleReminderHourChange(-1)}
                      style={[styles.timeButton, { borderColor }]}
                    >
                      <ThemedText type="defaultSemiBold">−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.timeValue}>
                      {String(dailyReminderHour).padStart(2, "0")}
                    </ThemedText>
                    <Pressable
                      onPress={() => void handleReminderHourChange(1)}
                      style={[styles.timeButton, { borderColor }]}
                    >
                      <ThemedText type="defaultSemiBold">+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={styles.timeSeparator}>:</ThemedText>
                  <View style={styles.timePart}>
                    <Pressable
                      onPress={() => void handleReminderMinuteChange(-5)}
                      style={[styles.timeButton, { borderColor }]}
                    >
                      <ThemedText type="defaultSemiBold">−</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.timeValue}>
                      {String(dailyReminderMinute).padStart(2, "0")}
                    </ThemedText>
                    <Pressable
                      onPress={() => void handleReminderMinuteChange(5)}
                      style={[styles.timeButton, { borderColor }]}
                    >
                      <ThemedText type="defaultSemiBold">+</ThemedText>
                    </Pressable>
                  </View>
                </View>
                <ThemedText style={[styles.optionDesc, { color: muted }]}>
                  Programado para las{" "}
                  {formatReminderTime(dailyReminderHour, dailyReminderMinute)}.
                </ThemedText>
              </ThemedView>
            ) : null}

            {!notificationPermissionGranted ? (
              <ThemedText style={[styles.optionDesc, { color: muted }]}>
                {showOpenSettingsButton
                  ? "Las notificaciones están desactivadas en el sistema. Ábrelas desde Ajustes para recibir el recordatorio."
                  : "Se te pedirá permiso al abrir la app para enviarte la lectura del día."}
              </ThemedText>
            ) : null}

            {showOpenSettingsButton ? (
              <Pressable
                onPress={() => void openSystemSettings()}
                style={[
                  styles.option,
                  { backgroundColor: cardColor, borderColor },
                ]}
              >
                <ThemedText type="defaultSemiBold">
                  Abrir ajustes del sistema
                </ThemedText>
                <ThemedText style={[styles.link, { color: accent }]}>
                  Activar notificaciones →
                </ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => void handleTestNotification()}
              disabled={notificationBusy}
              style={[
                styles.option,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <ThemedText type="defaultSemiBold">
                Probar notificación ahora
              </ThemedText>
              <ThemedText style={[styles.optionDesc, { color: muted }]}>
                Envía la lectura del día en 3 segundos (solo para pruebas).
              </ThemedText>
            </Pressable>
          </Section>
        ) : null}

        <Section title="Uso sin conexión">
          <ThemedText style={[styles.optionDesc, { color: muted }]}>
            {offlineReady
              ? `Esta traducción está guardada en el dispositivo${offlineVerseCount ? ` (${offlineVerseCount.toLocaleString()} versículos)` : ""}. Puedes leer y buscar sin internet.`
              : "Conéctate a internet una vez para descargar la traducción completa. Después podrás usar la app sin cobertura."}
          </ThemedText>
          {!offlineReady ? (
            <Pressable
              onPress={() => void ensureTranslationOffline(translationId)}
              style={[
                styles.option,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <ThemedText type="defaultSemiBold">
                Descargar traducción actual
              </ThemedText>
              <ThemedText style={[styles.link, { color: accent }]}>
                Requiere conexión →
              </ThemedText>
            </Pressable>
          ) : null}
        </Section>

        <Section title="Licencias">
          <ThemedText style={[styles.licenseNote, { color: muted }]}>
            Esta app usa traducciones de dominio público o con licencia libre,
            aptas para uso comercial. Reina Valera 1960 (RVR1960) no está
            incluida por restricciones de copyright.
          </ThemedText>
          {activeTranslation?.licenseUrl ? (
            <Pressable
              onPress={() => void openLicense(activeTranslation.licenseUrl)}
              style={[
                styles.option,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <ThemedText type="defaultSemiBold">
                {activeTranslation.name}
              </ThemedText>
              <ThemedText style={[styles.link, { color: accent }]}>
                Ver licencia →
              </ThemedText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => void openLicense("https://bible.helloao.org/")}
            style={[styles.option, { backgroundColor: cardColor, borderColor }]}
          >
            <ThemedText type="defaultSemiBold">Free Use Bible API</ThemedText>
            <ThemedText style={[styles.link, { color: accent }]}>
              helloao.org →
            </ThemedText>
          </Pressable>
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 40,
    gap: 8,
  },
  heading: {
    fontFamily: "Lora-Bold",
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    opacity: 0.75,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  optionDesc: {
    fontSize: 13,
  },
  fontRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  fontButton: {
    borderWidth: 1,
    borderRadius: 10,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  reminderCopy: {
    flex: 1,
    gap: 4,
  },
  timeRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  timeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timePart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  timeValue: {
    fontSize: 22,
    fontWeight: "600",
    minWidth: 36,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 2,
  },
  licenseNote: {
    lineHeight: 22,
    fontSize: 14,
  },
  link: {
    fontSize: 14,
  },
});
