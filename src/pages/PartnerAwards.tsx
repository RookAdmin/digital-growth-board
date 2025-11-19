import { useEffect, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/PageHero";
import { PartnerDock } from "@/components/PartnerDock";
import { PARTNER_TIERS, getPartnerTier } from "@/utils/partnerTiers";
import { LoadingState } from "@/components/LoadingState";
import { getFiscalYearRangeForDate, getCurrentFiscalYearRange } from "@/utils/fiscalYear";
import { PartnerHeader } from "@/components/PartnerHeader";
import { FiscalYearFilter } from "@/components/FiscalYearFilter";

const PartnerAwardsPage = () => {
  const { partner } = usePartnerAuth();
  const [revenue, setRevenue] = useState(0);
  const [fyHistory, setFyHistory] = useState<{ label: string; amount: number; start: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFY, setSelectedFY] = useState<string | undefined>();
  const currentFY = getCurrentFiscalYearRange();

  useEffect(() => {
    const fetchRevenue = async () => {
      if (!partner) return;
      try {
        const { data, error } = await supabase
          .from("partner_project_assignments")
          .select(
            `
            partner_id,
            projects:project_id (
              status,
              budget,
              created_at,
              updated_at
            )
          `
          )
          .eq("partner_id", partner.id);

        if (error) throw error;

        const totals: Record<string, { amount: number; start: number }> = {};
        data?.forEach((entry: any) => {
          const project = entry.projects;
          if (!project || project.status !== "Completed") return;
          const referenceDate = project.updated_at ? new Date(project.updated_at) : new Date(project.created_at);
          const fy = getFiscalYearRangeForDate(referenceDate);
          totals[fy.label] = {
            amount: (totals[fy.label]?.amount || 0) + (project.budget || 0),
            start: fy.start.getTime(),
          };
        });

        const history = Object.entries(totals)
          .map(([label, meta]) => ({ label, amount: meta.amount, start: meta.start }))
          .sort((a, b) => b.start - a.start);

        setFyHistory(history);
        const revenueFY = selectedFY || currentFY.label;
        setRevenue(history.find((item) => item.label === revenueFY)?.amount || 0);
      } catch (err) {
        console.error("Error fetching revenue", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [partner, selectedFY]);

  if (!partner || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <PartnerHeader />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <LoadingState message="Loading awards journey..." fullHeight />
        </div>
        <PartnerDock />
      </div>
    );
  }

  const { tier } = getPartnerTier(revenue);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <PartnerHeader />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <PageHero
            title="Awards Journey"
            description="Track your path across Realm's revenue tiers and see what unlocks next."
          />
          <div className="flex-shrink-0">
            <FiscalYearFilter
              selectedFY={selectedFY}
              onFYChange={setSelectedFY}
            />
          </div>
        </div>

        <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_25px_90px_rgba(15,23,42,0.08)] space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
              Current tier
            </p>
            <h2 className="text-3xl font-semibold text-gray-900 mt-2">
              {tier.name} Partner
            </h2>
            <p className="text-gray-600 mt-2">
              ${revenue.toLocaleString()} in credited revenue.
            </p>
          </div>

          <div className="grid gap-4">
            {PARTNER_TIERS.map((tierOption) => {
              const tierInfo = getPartnerTier(revenue);
              const isUnlocked = revenue >= tierOption.minRevenue;
              const progress =
                revenue >= tierOption.minRevenue
                  ? 100
                  : Math.min((revenue / tierOption.minRevenue) * 100, 100);

              return (
                <div
                  key={tierOption.name}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tierOption.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {tierOption.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                        ${tierOption.minRevenue.toLocaleString()}+
                      </p>
                      <p className="text-sm text-gray-500">
                        {isUnlocked ? "Unlocked" : "In progress"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7f5dff] to-[#ff8bd8] transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {fyHistory.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Fiscal Record</p>
              {fyHistory.map((fy) => (
                <div key={fy.label} className="flex items-center justify-between text-sm text-gray-600">
                  <span>{fy.label}</span>
                  <span>${fy.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <PartnerDock />
    </div>
  );
};

export default PartnerAwardsPage;

