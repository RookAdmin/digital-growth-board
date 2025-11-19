import { useEffect } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { PageHero } from "@/components/PageHero";
import { PartnerDock } from "@/components/PartnerDock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { PartnerHeader } from "@/components/PartnerHeader";

const mockAgreements = [
  {
    title: "Master Services Agreement",
    status: "Signed",
    updatedAt: "Feb 12, 2025",
  },
  {
    title: "Annual Revenue Addendum",
    status: "Waiting Signature",
    updatedAt: "Jan 28, 2025",
  },
  {
    title: "Awards & Recognition Playbook",
    status: "Acknowledged",
    updatedAt: "Dec 05, 2024",
  },
];

const PartnerAgreementsPage = () => {
  const { partner } = usePartnerAuth();

  useEffect(() => {
    document.title = "Agreements - Realm Partner";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <PartnerHeader />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <PageHero
          title="Agreements"
          description="All contracts, correspondence, and reward communications stored securely."
        />

        <div className="space-y-4">
          {mockAgreements.map((doc) => (
            <Card
              key={doc.title}
              className="border border-white/70 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900">{doc.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Last updated {doc.updatedAt}
                  </p>
                </div>
                <BadgeIntent status={doc.status} />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-600">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span>
                    {doc.status === "Signed"
                      ? "Stored securely for reference."
                      : "Awaiting your review."}
                  </span>
                </div>
                <Button variant="ghost" className="text-gray-700">
                  <Download className="mr-2 h-4 w-4" />
                  View
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <PartnerDock />
    </div>
  );
};

const BadgeIntent = ({ status }: { status: string }) => {
  const colorClass =
    status === "Signed"
      ? "bg-green-100 text-green-700"
      : status === "Acknowledged"
      ? "bg-blue-100 text-blue-700"
      : "bg-yellow-100 text-yellow-800";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};

export default PartnerAgreementsPage;

