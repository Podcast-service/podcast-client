import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.castapp.app",
  appName: "Castapp",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
