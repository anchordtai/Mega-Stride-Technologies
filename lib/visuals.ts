export const visuals = {
  infrastructure: "/images/mega-stride/hero/infrastructure.webp",
  operations: "/images/mega-stride/hero/operations.webp",
  software: "/images/mega-stride/hero/software.webp",
  connectivity: "/images/mega-stride/hero/connectivity.webp",
  security: "/images/mega-stride/services/security.webp",
  automation: "/images/mega-stride/services/automation.webp",
  equipment: "/images/mega-stride/services/equipment.webp",
  academy: "/images/mega-stride/academy/academy.webp",
  trade: "/images/mega-stride/trade/trade.webp",
} as const;

export const solutionVisuals: Record<
  string,
  {
    src: string;
    alt: string;
    label: string;
    challenge: string;
    applications: string[];
    technologies: string[];
  }
> = {
  "software-engineering": {
    src: visuals.software,
    alt: "AI illustration of software engineers collaborating at workstations",
    label: "Digital products",
    challenge:
      "When disconnected tools and manual handoffs slow your work, a well-designed application can bring people, information and processes together.",
    applications: [
      "Business portals and self-service experiences",
      "School administration and operational workflows",
      "Web platforms and connected applications",
    ],
    technologies: [
      "Web & mobile platforms",
      "APIs & database integration",
      "Role-based workflows",
    ],
  },
  "networks-infrastructure": {
    src: visuals.infrastructure,
    alt: "AI illustration of enterprise server racks and orderly network cabling",
    label: "Connected infrastructure",
    challenge:
      "Reliable connectivity starts with understanding coverage, capacity, segmentation and the environment your users depend on.",
    applications: [
      "Campus and multi-floor connectivity",
      "Branch and office networks",
      "Server rooms and infrastructure upgrades",
    ],
    technologies: [
      "Routing & switching",
      "Enterprise wireless",
      "Structured copper & fibre",
    ],
  },
  cybersecurity: {
    src: visuals.security,
    alt: "AI illustration of analysts in a security operations environment",
    label: "Security by design",
    challenge:
      "Security gaps often sit between systems, permissions and everyday practices. Start with the assets, access and risks that matter to your operations.",
    applications: [
      "Network perimeter and segmentation",
      "User and administrative access",
      "Security awareness and operational readiness",
    ],
    technologies: [
      "Firewalls & network controls",
      "Identity & access",
      "Monitoring requirements",
    ],
  },
  "cloud-data-centre": {
    src: visuals.connectivity,
    alt: "AI concept of global digital connectivity and fibre pathways",
    label: "Cloud & resilience",
    challenge:
      "Capacity, recovery and ongoing operations need to be considered together before a migration or infrastructure investment.",
    applications: [
      "Infrastructure modernisation",
      "Backup and recovery planning",
      "Virtualised and cloud-connected workloads",
    ],
    technologies: [
      "Cloud architecture",
      "Virtualisation & storage",
      "Backup & recovery",
    ],
  },
  "digital-transformation": {
    src: visuals.operations,
    alt: "AI illustration of technology professionals reviewing connected operations",
    label: "Intelligent operations",
    challenge:
      "Digital transformation becomes useful when it resolves a specific operational problem and makes the work easier for the people doing it.",
    applications: [
      "Administrative process improvement",
      "Systems and information integration",
      "Technology strategy and adoption",
    ],
    technologies: [
      "Workflow automation",
      "Systems integration",
      "ICT project planning",
    ],
  },
  "ai-automation-iot": {
    src: visuals.automation,
    alt: "AI illustration of an engineer working with industrial sensors and a robotic arm",
    label: "Applied innovation",
    challenge:
      "Promising ideas need a practical use case, appropriate data and a measurable pilot before a wider investment.",
    applications: [
      "Repetitive workflow evaluation",
      "Connected-device prototypes",
      "AI integration feasibility and pilots",
    ],
    technologies: [
      "AI integration",
      "Sensors & connected devices",
      "Automation prototypes",
    ],
  },
  "equipment-supply": {
    src: visuals.equipment,
    alt: "AI product illustration of unbranded servers, a network switch and workstation",
    label: "Technology supply",
    challenge:
      "The right equipment must fit your existing environment, capacity needs, support expectations and deployment plan.",
    applications: [
      "Office and campus ICT procurement",
      "Network and server refreshes",
      "Specification-led technology sourcing",
    ],
    technologies: [
      "Networking equipment",
      "Servers & storage",
      "Workstations & peripherals",
    ],
  },
};

export function pathwayVisual(title: string) {
  if (/security/i.test(title)) return visuals.security;
  if (/artificial|automation/i.test(title)) return visuals.automation;
  if (/software|devops|database/i.test(title)) return visuals.software;
  if (/cloud|linux/i.test(title)) return visuals.connectivity;
  if (/support/i.test(title)) return visuals.equipment;
  return visuals.academy;
}
