import styles from "./page.module.css";
import DateTime from "@/components/nexus/DateTime";
import DaySnapshot from "@/components/nexus/DaySnapshot";
import QuickLauncher from "@/components/nexus/QuickLauncher";
import AmbientBackground from "@/components/nexus/AmbientBackground";
import ServicesPanel from "@/components/nexus/ServicesPanel";
import FeatureFlagsPanel from "@/components/nexus/FeatureFlagsPanel";
import ThemeToggle from "@/components/nexus/ThemeToggle";

export default function Home() {
  return (
    <div className={styles.dashboard}>
      <AmbientBackground />
      <div className={styles.topRow}>
        <div className={`${styles.welcomeSection} glass-panel`}>
          <div className={styles.welcomeHeader}>
            <h1 className={styles.greeting}>
              Welcome back, <span>Commander</span>.
            </h1>
            <ThemeToggle />
          </div>
          <div className={styles.statusGrid}>
            <div className={styles.statusCard}>
              <span className={styles.statusLabel}>System Integrity</span>
              <span className={styles.statusValue}>100%</span>
            </div>
            <div className={styles.statusCard}>
              <span className={styles.statusLabel}>Active Tasks</span>
              <span className={styles.statusValue}>3</span>
            </div>
            <div className={styles.statusCard}>
              <span className={styles.statusLabel}>Next Event</span>
              <span className={styles.statusValue}>14:00</span>
            </div>
          </div>
        </div>
        <DateTime />
      </div>

      <div className={styles.mainArea}>
        <div className={styles.sidebar}>
          <QuickLauncher />
        </div>
        <div className={styles.contentArea}>
          <div className={styles.panelGrid}>
            <ServicesPanel />
            <FeatureFlagsPanel />
          </div>
          <DaySnapshot />
        </div>
      </div>
    </div>
  );
}
