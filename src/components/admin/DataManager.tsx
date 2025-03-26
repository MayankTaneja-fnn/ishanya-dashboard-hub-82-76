import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { Center, Program, TableInfo, TableColumn } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import TableListWrapper from '@/components/tables/TableListWrapper';
import TableView from '@/components/tables/TableView';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { TableFieldFormatter, capitalizeFirstLetter, isFieldRequired } from '@/components/tables/TableFieldFormatter';
import CsvUpload from '@/components/tables/CsvUpload';

type FormData = {
  [key: string]: any;
};

const DataManager = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  useEffect(() => {
    fetchCenters();
  }, []);

  useEffect(() => {
    if (selectedCenter) {
      fetchPrograms(selectedCenter.center_id);
    } else {
      setPrograms([]);
      setSelectedProgram(null);
      setSelectedTable(null);
    }
  }, [selectedCenter]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableColumns(selectedTable.name);
    }
  }, [selectedTable]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .order('name');
      if (error) throw error;
      setCenters(data || []);
    } catch (error: any) {
      console.error('Error fetching centers:', error);
      toast.error(`Failed to load centers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async (centerId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('center_id', centerId)
        .order('name');
      if (error) throw error;
      setPrograms(data || []);
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast.error(`Failed to load programs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableColumns = async (table: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_columns')
        .select('*')
        .eq('table_name', table);
      if (error) throw error;
      setTableColumns(data || []);
    } catch (error: any) {
      console.error('Error fetching table columns:', error);
      toast.error(`Failed to load table columns: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCenterSelect = (centerId: number) => {
    const center = centers.find((c) => c.center_id === centerId);
    setSelectedCenter(center || null);
    setSelectedProgram(null);
    setSelectedTable(null);
  };

  const handleProgramSelect = (programId: number) => {
    const program = programs.find((p) => p.program_id === programId);
    setSelectedProgram(program || null);
    setSelectedTable(null);
  };

  const handleTableSelect = (table: TableInfo) => {
    setSelectedTable(table);
  };

  const fetchTableData = () => {
    // Placeholder function, actual implementation in TableView
  };

  const handleAddRecord = async (table: string, formData: any) => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      
      let dataToInsert: any = {};
      
      if (table === 'students') {
        const studentData = {
          center_id: parseInt(formData.center_id || '0', 10),
          program_id: parseInt(formData.program_id || '0', 10),
          educator_employee_id: parseInt(formData.educator_employee_id || '0', 10),
          
          first_name: formData.first_name || 'New Student',
          last_name: formData.last_name || '',
          gender: formData.gender || 'Unspecified',
          dob: formData.dob || new Date().toISOString().split('T')[0],
          student_id: formData.student_id || Math.floor(Math.random() * 10000),
          enrollment_year: formData.enrollment_year || new Date().getFullYear(),
          status: formData.status || 'Active',
          student_email: formData.student_email || '',
          contact_number: formData.contact_number || '',
          
          ...formData,
          
          created_at: now
        };
        dataToInsert = studentData;
      } else if (table === 'educators') {
        const educatorData = {
          center_id: parseInt(formData.center_id || '0', 10),
          employee_id: parseInt(formData.employee_id || Math.floor(Math.random() * 10000), 10),
          name: formData.name || 'New Educator',
          designation: formData.designation || 'Teacher',
          email: formData.email || 'educator@example.com',
          phone: formData.phone || '',
          date_of_birth: formData.date_of_birth || new Date().toISOString().split('T')[0],
          date_of_joining: formData.date_of_joining || new Date().toISOString().split('T')[0],
          work_location: formData.work_location || '',
          
          ...formData,
          
          created_at: now
        };
        dataToInsert = educatorData;
      } else if (table === 'employees') {
        const employeeData = {
          center_id: parseInt(formData.center_id || '0', 10),
          employee_id: parseInt(formData.employee_id || Math.floor(Math.random() * 10000), 10),
          name: formData.name || 'New Employee',
          gender: formData.gender || 'Unspecified',
          designation: formData.designation || 'Staff',
          department: formData.department || 'Administration',
          employment_type: formData.employment_type || 'Full-time',
          email: formData.email || 'employee@example.com',
          phone: formData.phone || '',
          date_of_birth: formData.date_of_birth || new Date().toISOString().split('T')[0],
          date_of_joining: formData.date_of_joining || new Date().toISOString().split('T')[0],
          emergency_contact_name: formData.emergency_contact_name || '',
          emergency_contact: formData.emergency_contact || '',
          
          ...formData,
          
          created_at: now
        };
        delete employeeData.program_id;
        dataToInsert = employeeData;
      } else {
        dataToInsert = {
          ...formData,
          created_at: now
        };
      }
      
      const { data, error } = await supabase
        .from(table)
        .insert(dataToInsert)
        .select();
      
      if (error) throw error;
      
      fetchTableData();
      
      toast.success(`New record added to ${table} successfully`);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error adding record:', error);
      toast.error(`Failed to add record: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Data Management Console</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Center and Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="center">Center</Label>
              <Select
                value={selectedCenter?.center_id.toString() || ''}
                onValueChange={(value) => handleCenterSelect(parseInt(value, 10))}
              >
                <SelectTrigger id="center">
                  <SelectValue placeholder="Select a center" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((center) => (
                    <SelectItem key={center.center_id} value={center.center_id.toString()}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="program">Program</Label>
              <Select
                value={selectedProgram?.program_id.toString() || ''}
                onValueChange={(value) => handleProgramSelect(parseInt(value, 10))}
                disabled={!selectedCenter}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder={selectedCenter ? "Select a program" : "Select a center first"} />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.program_id} value={program.program_id.toString()}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedProgram && (
        <TableListWrapper 
          program={selectedProgram} 
          onSelectTable={handleTableSelect} 
          selectedTable={selectedTable}
        />
      )}
      
      {selectedTable && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{selectedTable.display_name || selectedTable.name}</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                >
                  Add Record
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchTableData}
                >
                  Refresh
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCsvUpload(true)}
                >
                  Bulk Upload
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <TableView
                tableInfo={selectedTable}
                onRecordDeleted={fetchTableData}
                onRecordUpdated={fetchTableData}
              />
            )}
          </CardContent>
        </Card>
      )}
      
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Record to {selectedTable?.name}</DialogTitle>
          </DialogHeader>
          <Form>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const formValues = Object.fromEntries(formData.entries());
              handleAddRecord(selectedTable?.name || '', formValues);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {tableColumns.map((column) => (
                  <div key={column.name} className="space-y-2">
                    <Label htmlFor={column.name}>
                      {capitalizeFirstLetter(column.name)}
                      {isFieldRequired(selectedTable?.name || '', column.name) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <TableFieldFormatter
                      fieldName={column.name}
                      value=""
                      onChange={() => {}}
                      isEditing={true}
                      isRequired={isFieldRequired(selectedTable?.name || '', column.name)}
                      tableName={selectedTable?.name}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Record'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {showCsvUpload && selectedTable && (
        <CsvUpload
          tableName={selectedTable.name}
          onClose={() => setShowCsvUpload(false)}
          onUploadComplete={() => {
            setShowCsvUpload(false);
            fetchTableData();
          }}
        />
      )}
    </div>
  );
};

export default DataManager;
