export const industries = [
  {
    slug: "education",
    title: "Education & learning",
    description:
      "Connected campuses, digital workflows and technical capability for learning environments.",
    needs: [
      "Campus networks and reliable Wi-Fi",
      "Administrative software and digital workflows",
      "ICT equipment and staff development",
    ],
    service: "networks-infrastructure",
  },
  {
    slug: "institutions",
    title: "Public institutions",
    description:
      "Infrastructure, systems integration and procurement planning around institutional requirements.",
    needs: [
      "Network and infrastructure planning",
      "Systems integration and access controls",
      "Clear technical specifications",
    ],
    service: "digital-transformation",
  },
  {
    slug: "enterprise",
    title: "Enterprise & business",
    description:
      "Software, cloud and secure connectivity shaped around day-to-day business operations.",
    needs: [
      "Business software and automation",
      "Cloud and recovery planning",
      "Secure user and branch connectivity",
    ],
    service: "software-engineering",
  },
  {
    slug: "growing-businesses",
    title: "Growing organisations",
    description:
      "Practical technology foundations that can evolve as teams and operational needs grow.",
    needs: [
      "Fit-for-purpose equipment",
      "Maintainable applications and networks",
      "Training and ongoing ICT support",
    ],
    service: "equipment-supply",
  },
] as const;
export const delivery = [
  [
    "Discover",
    "We clarify the operating environment, the people using it and the outcome you need.",
  ],
  [
    "Design & deliver",
    "We agree the scope and engineer a solution around security, reliability and maintainability.",
  ],
  [
    "Enable & support",
    "We support implementation, knowledge transfer and the next stage of your technology journey.",
  ],
] as const;
