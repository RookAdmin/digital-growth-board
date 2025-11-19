
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { KanbanBoard } from "@/components/KanbanBoard";
import { FilterBar } from "@/components/FilterBar";
import { AddLeadDialog } from "@/components/AddLeadDialog";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { DockNav } from "@/components/DockNav";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [singleDate, setSingleDate] = useState<Date | undefined>();

  useEffect(() => {
    document.title = "Dashboard - Rook";
  }, []);

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSingleDateChange = (date?: Date) => {
    setSingleDate(date);
  };

  const handleReportsClick = () => {
    navigate('/dashboard/reporting');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5ef] via-[#f4f0ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <PageHero
          title="Dashboard"
          description="Pulse through every lead, follow-up, and milestone with a calmer command center."
          actions={
            <>
              <Button
                variant="ghost"
                onClick={handleReportsClick}
                className="rounded-full border border-white/70 bg-white/80 text-gray-900 hover:bg-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Reports
              </Button>
              <AddLeadDialog
                trigger={
                  <Button className="rounded-full bg-gray-900 text-white hover:bg-black">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead
                  </Button>
                }
              />
            </>
          }
        />

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_15px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search leads by name, email, or phone..."
            startDate={startDate}
            endDate={endDate}
            singleDate={singleDate}
            onDateRangeChange={handleDateRangeChange}
            onSingleDateChange={handleSingleDateChange}
          />
        </section>

        <section className="rounded-[32px] border border-white/80 bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] animate-in fade-in duration-500">
          <KanbanBoard
            searchTerm={searchTerm}
            startDateFilter={startDate}
            endDateFilter={endDate}
            dateFilter={singleDate}
          />
        </section>
      </main>
      <DockNav />
    </div>
  );
};

export default DashboardPage;
