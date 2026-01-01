import styles from './page.module.css';

const sectionData = [
  {
    title: 'Tech',
    subTitle: 'Explore vibrant learning paths and playbooks for builders.',
    gradient: 'linear-gradient(135deg, rgba(91, 120, 255, 0.12), rgba(219, 79, 255, 0.08))',
    accent: 'var(--color-nexus-accent)',
    items: [
      {
        name: 'roadmaps',
        displayName: 'RoadMaps',
        href: 'https://pclub.in/roadmaps',
        description: 'Programming Club IITK trail of learning paths across CS domains.',
      },
    ],
  },
  {
    title: 'Fitness',
    subTitle: 'Fresh motivation for daily movement and mindful energy.',
    gradient: 'linear-gradient(135deg, rgba(255, 110, 117, 0.12), rgba(255, 166, 65, 0.08))',
    accent: 'var(--color-pulse-accent)',
    items: [
      {
        name: 'chloe',
        displayName: 'Workout',
        href: 'https://chloeting.com/program',
        description: 'Chloe Ting workout programs covering strength, core, and cardio.',
      },
    ],
  },
];

export default function AppsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.kicker}>Apps</p>
        <h1 className={styles.title}>Worlds that spark discovery</h1>
        <p className={styles.subtitle}>
          Handpicked destinations grouped by vibe—tech power-ups and fitness rituals wrapped in bold,
          playful color.
        </p>
      </div>
      <div className={styles.sections}>
        {sectionData.map((section) => (
          <section key={section.title} className={styles.sectionWrapper}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionTitle}>{section.title}</p>
              <p className={styles.sectionSubtitle}>{section.subTitle}</p>
            </div>
            <div className={styles.appGrid}>
              {section.items.map((item) => (
                <a
                  key={item.name}
                  className={styles.appCard}
                  style={{ backgroundImage: section.gradient }}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className={styles.appIcon} style={{ borderColor: section.accent }}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.appInfo}>
                    <p className={styles.appName}>{item.displayName || item.name}</p>
                    <p className={styles.appDescription}>{item.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
