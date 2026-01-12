"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if already installed and detect platform
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if user dismissed within last 7 days
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show iOS prompt after delay
    if (isIOSDevice) {
      const timeout = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Listen for install prompt events
  useEffect(() => {
    if (typeof window === "undefined" || isInstalled) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error("Error during PWA installation:", error);
    } finally {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }, []);

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-fade-in md:left-auto md:right-4 md:max-w-sm">
      <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl shadow-2xl shadow-amber-200/60 border-2 border-amber-200 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-amber-100 transition-colors z-10"
          aria-label="Dismiss"
        >
          <svg
            className="w-5 h-5 text-stone-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-300/50 animate-bubble">
              <span className="text-2xl">🧋</span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-lg font-bold text-stone-800 mb-1">
                Install Boba
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {isIOS
                  ? "Add to your home screen for quick access!"
                  : "Install for faster access and offline support!"}
              </p>
            </div>
          </div>

          {/* iOS Instructions */}
          {isIOS ? (
            <div className="bg-white rounded-2xl p-4 border border-amber-100">
              <p className="text-sm text-stone-700 font-medium mb-3">
                How to install:
              </p>
              <ol className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 text-amber-500 font-semibold">1.</span>
                  <span>
                    Tap the <strong>Share</strong> button{" "}
                    <span className="inline-block px-1.5 py-0.5 bg-stone-100 rounded text-xs">
                      ↑
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 text-amber-500 font-semibold">2.</span>
                  <span>
                    Scroll and tap{" "}
                    <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 text-amber-500 font-semibold">3.</span>
                  <span>
                    Tap <strong>Add</strong> in the top right
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            /* Standard Install Button */
            <button
              onClick={handleInstall}
              disabled={isInstalling || !deferredPrompt}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-amber-300/40 transition-all hover:shadow-xl hover:shadow-amber-400/50 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Installing...
                </>
              ) : (
                <>
                  <span className="text-lg">⬇️</span>
                  Install App
                </>
              )}
            </button>
          )}

          {/* Benefits */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>Faster</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📱</span>
              <span>Native feel</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🎨</span>
              <span>Fullscreen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
