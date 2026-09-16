import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard } from "@capacitor/keyboard";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Network } from "@capacitor/network";

export const isNativePlatform = Capacitor.isNativePlatform();

/**
 * Inicializa todos los plugins y listeners nativos de Android
 */
export async function initNativeBridge(onBackPressed?: () => boolean | void) {
  if (typeof window !== "undefined" && isNativePlatform) {
    // Configurar fallback de barra superior para dispositivos Android donde env(safe-area-inset-top) es 0
    document.documentElement.style.setProperty("--safe-top-fallback", "24px");
  }

  if (!isNativePlatform) return;

  try {
    // 1. Configurar barra de estado nativa
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#070a12" });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (err) {
    console.warn("StatusBar no disponible:", err);
  }

  try {
    // 2. Ocultar splash screen tras iniciar
    await SplashScreen.hide();
  } catch (err) {
    console.warn("SplashScreen hide:", err);
  }

  try {
    // 3. Listener del botón físico 'Atrás' en Android
    App.addListener("backButton", ({ canGoBack }) => {
      // Si la función personalizada devuelve true, se manejó el evento (ej: cerrar un modal)
      if (onBackPressed && onBackPressed()) {
        return;
      }

      // Si hay historial en el navegador
      if (canGoBack && typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
      } else {
        // Salir de la app si está en la pantalla principal
        App.exitApp();
      }
    });
  } catch (err) {
    console.warn("BackButton listener:", err);
  }

  try {
    // 4. Configuración del teclado virtual móvil
    Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch {}

  try {
    // 5. Escuchar cambios de red
    Network.addListener("networkStatusChange", (status) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ficnation_network_changed", {
            detail: { connected: status.connected, connectionType: status.connectionType },
          })
        );
      }
    });
  } catch {}
}

/**
 * Disparador de vibración háptica para botones, votos y acciones clave
 */
export async function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") {
  if (!isNativePlatform) {
    // Fallback para navegadores móviles con Web Vibration API
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "light") navigator.vibrate(15);
      else if (type === "medium") navigator.vibrate(30);
      else if (type === "heavy" || type === "error") navigator.vibrate([40, 30, 40]);
      else navigator.vibrate(25);
    }
    return;
  }

  try {
    if (type === "light") {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === "medium") {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === "heavy") {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === "success") {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === "warning") {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (type === "error") {
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch {}
}
