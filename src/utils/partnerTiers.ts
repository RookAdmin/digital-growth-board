export type PartnerTier = {
  name: string;
  minRevenue: number;
  description: string;
  rewards: string;
  accent: string;
};

export const PARTNER_TIERS: PartnerTier[] = [
  {
    name: "Black",
    minRevenue: 500000,
    description: "Black award, crafted art piece, exclusive privileges.",
    rewards: "Exclusive privileges & bespoke recognition",
    accent: "from-[#000000] to-[#333333]",
  },
  {
    name: "Diamond",
    minRevenue: 250000,
    description: "Exclusive event invite + enhanced exposure.",
    rewards: "High-visibility press + private event access",
    accent: "from-[#c89bff] to-[#6f42c8]",
  },
  {
    name: "Gold",
    minRevenue: 100000,
    description: "Personalized trophy + Portal feature.",
    rewards: "Personalized trophy & feature spotlight",
    accent: "from-[#f9d976] to-[#f39f86]",
  },
  {
    name: "Silver",
    minRevenue: 50000,
    description: "Engraved plaque + digital badge.",
    rewards: "Plaque & digital badge set",
    accent: "from-[#e0e0e0] to-[#a5b4fc]",
  },
  {
    name: "Bronze",
    minRevenue: 15000,
    description: "Custom frame + certificate.",
    rewards: "Custom frame & certificate",
    accent: "from-[#f7d0a3] to-[#f4a259]",
  },
  {
    name: "Explorer",
    minRevenue: 0,
    description: "Onboarding partner",
    rewards: "Access to Realm partner playbook",
    accent: "from-[#dfe9f3] to-[#fffaf0]",
  },
];

export const getPartnerTier = (revenue: number) => {
  const tier =
    PARTNER_TIERS.find((t) => revenue >= t.minRevenue) ||
    PARTNER_TIERS[PARTNER_TIERS.length - 1];
  const index = PARTNER_TIERS.findIndex((t) => t.name === tier.name);
  const nextTier = index > 0 ? PARTNER_TIERS[index - 1] : null;
  const progressToNext = nextTier
    ? Math.min(1, revenue / nextTier.minRevenue)
    : 1;

  return {
    tier,
    nextTier,
    progressToNext,
  };
};

