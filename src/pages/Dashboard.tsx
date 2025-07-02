
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { KanbanBoard } from "@/components/KanbanBoard";
import { FilterBar } from "@/components/FilterBar";
import { AddLeadDialog } from "@/components/AddLeadDialog";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

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
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Dashboard</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Manage your leads and track progress.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={handleReportsClick}>
                <FileText className="h-4 w-4" />
                Reports
              </Button>
              <AddLeadDialog />
            </div>
          </div>
        </div>
        
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
        
        <KanbanBoard 
          searchTerm={searchTerm}
          startDateFilter={startDate}
          endDateFilter={endDate}
          dateFilter={singleDate}
        />
      </main>
    </div>
  );
};

export default DashboardPage;
