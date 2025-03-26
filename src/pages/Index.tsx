
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Center, Program, fetchCenters } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from "@/integrations/supabase/client";
import StudentFormHandler from '@/components/admin/StudentFormHandler';
import StudentForm from '@/components/admin/StudentForm';
import ProgramList from '@/components/programs/ProgramList';
import TableListWrapper from '@/components/tables/TableListWrapper';
import FilteredTableView from '@/components/tables/FilteredTableView';
import AdminNavTabs from '@/components/admin/AdminNavTabs';
import OverviewSection from '@/components/admin/OverviewSection';
import CentersSection from '@/components/admin/CentersSection';
import ProgramsSection from '@/components/admin/ProgramsSection';

const Index = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEducators: 0,
    totalEmployees: 0
  });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [lastStudentId, setLastStudentId] = useState<number | null>(null);

  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadCenters = async () => {
      try {
        const centersData = await fetchCenters();
        if (centersData) {
          setCenters(centersData);
        }
      } catch (error) {
        console.error('Error fetching centers:', error);
        toast.error('Failed to load centers');
      } finally {
        setLoading(false);
      }
    };

    loadCenters();
    fetchStats();
    fetchLastStudentId();
    
    const studentsChannel = supabase
      .channel('students-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'students'
      }, () => {
        fetchStats();
        fetchLastStudentId();
      })
      .subscribe();
      
    const educatorsChannel = supabase
      .channel('educators-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'educators'
      }, () => {
        fetchStats();
      })
      .subscribe();
      
    const employeesChannel = supabase
      .channel('employees-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, () => {
        fetchStats();
      })
      .subscribe();
    
    // Listen for form submission events
    window.addEventListener('openAddRecordForm', handleOpenAddRecordForm);
    
    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(educatorsChannel);
      supabase.removeChannel(employeesChannel);
      window.removeEventListener('openAddRecordForm', handleOpenAddRecordForm);
    };
  }, []);
  
  const handleOpenAddRecordForm = (event: CustomEvent) => {
    const { tableName } = event.detail;
    
    if (tableName === 'students') {
      // Set the form data and open the form
      setShowStudentForm(true);
    }
  };
  
  const fetchLastStudentId = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('student_id')
        .order('student_id', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error fetching last student ID:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setLastStudentId(data[0].student_id);
      } else {
        setLastStudentId(1000); // Default starting ID
      }
    } catch (error) {
      console.error('Error fetching last student ID:', error);
    }
  };
  
  const fetchStats = async () => {
    try {
      const { count: studentCount, error: studentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      const { count: educatorCount, error: educatorError } = await supabase
        .from('educators')
        .select('*', { count: 'exact', head: true });
      
      const { count: employeeCount, error: employeeError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      if (studentError || educatorError || employeeError) {
        console.error('Error fetching counts:', studentError || educatorError || employeeError);
        return;
      }
      
      setStats({
        totalStudents: studentCount || 0,
        totalEducators: educatorCount || 0,
        totalEmployees: employeeCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSelectCenter = (center: Center) => {
    setSelectedCenter(center);
    setSelectedProgram(null);
    setSelectedTable(null);
    setActiveTab('detail');
  };

  const handleSelectProgram = (program: Program) => {
    setSelectedProgram(program);
    setSelectedTable(null);
    setActiveTab('detail');
  };

  const handleSelectTable = (table: any) => {
    setSelectedTable(table);
    setActiveTab('detail');
  };

  const handleBack = () => {
    if (selectedTable) {
      setSelectedTable(null);
    } else if (selectedProgram) {
      setSelectedProgram(null);
    } else if (selectedCenter) {
      setSelectedCenter(null);
      setActiveTab('centers');
    } else {
      setActiveTab('overview');
    }
  };
  
  const handleAddStudent = async (data: any) => {
    try {
      const { error } = await supabase
        .from('students')
        .insert([data]);
        
      if (error) {
        throw error;
      }
      
      toast.success('Student added successfully');
      fetchStats();
      fetchLastStudentId();
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Failed to add student');
      return Promise.reject(error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset selection when switching tabs
    if (tab !== 'detail') {
      setSelectedCenter(null);
      setSelectedProgram(null);
      setSelectedTable(null);
    }
  };

  const renderContent = () => {
    // Detail view (when a center, program, or table is selected)
    if (activeTab === 'detail') {
      if (selectedTable && selectedProgram) {
        return <FilteredTableView table={selectedTable} />;
      }
      
      if (selectedProgram) {
        return (
          <TableListWrapper 
            program={selectedProgram} 
            onSelectTable={handleSelectTable} 
            selectedTable={selectedTable}
          />
        );
      }
      
      if (selectedCenter) {
        return <ProgramList center={selectedCenter} onSelectProgram={handleSelectProgram} />;
      }
      
      // Fallback if somehow we get to detail view without a selection
      handleTabChange('overview');
      return null;
    }
    
    // Main tabs
    switch (activeTab) {
      case 'centers':
        return <CentersSection onSelectCenter={handleSelectCenter} />;
      case 'programs':
        return <ProgramsSection onSelectProgram={handleSelectProgram} />;
      case 'overview':
      default:
        return (
          <OverviewSection 
            stats={stats}
            showAnalytics={showAnalytics}
            onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
            onViewStudentPerformance={() => navigate("/admin/student-performance")}
          />
        );
    }
  };

  if (loading) {
    return (
      <Layout
        title="Loading..."
        subtitle="Please wait while we fetch the centers"
      >
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={selectedTable ? selectedTable.display_name || selectedTable.name : 
           selectedProgram ? selectedProgram.name : 
           selectedCenter ? selectedCenter.name : 
           "Admin Dashboard"}
      subtitle={selectedTable ? "Manage data" : 
              selectedProgram ? "Select a table" : 
              selectedCenter ? "Select a program" : 
              "Manage centers and programs"}
      showBackButton={!!selectedCenter || !!selectedProgram || !!selectedTable}
      onBack={handleBack}
    >
      {/* Navigation Tabs - only show when not in detail view or we're at the root of a detail view */}
      {(activeTab !== 'detail' || (!selectedProgram && !selectedTable)) && (
        <AdminNavTabs activeTab={activeTab} onTabChange={handleTabChange} />
      )}
      
      {renderContent()}
      
      {/* Global Student Form Handler */}
      <StudentFormHandler
        isOpen={showStudentForm}
        onClose={() => setShowStudentForm(false)}
        onSubmit={handleAddStudent}
        centerId={selectedCenter?.center_id}
        programId={selectedProgram?.program_id}
      >
        {(handleSubmit) => (
          <StudentForm
            onSubmit={handleSubmit}
            lastStudentId={lastStudentId}
            centerId={selectedCenter?.center_id}
            programId={selectedProgram?.program_id}
          />
        )}
      </StudentFormHandler>
    </Layout>
  );
};

export default Index;
