
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { Check, X, ChevronRight, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StudentFormHandler from './StudentFormHandler';
import StudentForm from './StudentForm';
import { deleteGoogleSheetRow } from '@/utils/googleSheetsUtils';

// Custom type for student data from Google Sheets
interface GoogleSheetStudent {
  rowIndex: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  program: string;
  center: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
}

const PendingReviews = () => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<GoogleSheetStudent | null>(null);
  const [isAcceptFormOpen, setIsAcceptFormOpen] = useState(false);
  const [lastStudentId, setLastStudentId] = useState<number | null>(null);
  const [centerId, setCenterId] = useState<number | null>(null);
  const [programId, setProgramId] = useState<number | null>(null);

  // Fetch last student ID
  useEffect(() => {
    fetchLastStudentId();
  }, []);

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

  // Fetch student review data from Google Sheets
  const { data: pendingStudents, isLoading, isError, refetch } = useQuery({
    queryKey: ['pendingStudents'],
    queryFn: async () => {
      try {
        // This would normally fetch from Google Sheets API
        // For now, we'll return mock data
        return [
          {
            rowIndex: 2,
            firstName: 'John',
            lastName: 'Doe',
            dob: '2012-05-15',
            gender: 'Male',
            program: 'Special Education',
            center: 'Bangalore Center',
            contactPerson: 'Jane Doe',
            contactNumber: '9876543210',
            email: 'jane.doe@example.com',
            address: '123 Main St, Bangalore'
          },
          {
            rowIndex: 3,
            firstName: 'Alice',
            lastName: 'Smith',
            dob: '2014-02-20',
            gender: 'Female',
            program: 'Inclusive Learning',
            center: 'Pune Center',
            contactPerson: 'Bob Smith',
            contactNumber: '8765432109',
            email: 'bob.smith@example.com',
            address: '456 Park Ave, Pune'
          },
          {
            rowIndex: 4,
            firstName: 'Ravi',
            lastName: 'Kumar',
            dob: '2013-09-10',
            gender: 'Male',
            program: 'Vocational Training',
            center: 'Delhi Center',
            contactPerson: 'Priya Kumar',
            contactNumber: '7654321098',
            email: 'priya.kumar@example.com',
            address: '789 Garden Rd, Delhi'
          }
        ] as GoogleSheetStudent[];
      } catch (error) {
        console.error('Error fetching pending students:', error);
        throw error;
      }
    }
  });

  const handleViewDetails = (student: GoogleSheetStudent) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
    
    // Look up center ID and program ID
    findCenterAndProgramIds(student.center, student.program);
  };

  const findCenterAndProgramIds = async (centerName: string, programName: string) => {
    try {
      // Get center ID
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .select('center_id')
        .ilike('name', `%${centerName}%`)
        .limit(1);
      
      if (centerError) {
        console.error('Error finding center:', centerError);
        return;
      }
      
      if (centerData && centerData.length > 0) {
        setCenterId(centerData[0].center_id);
        
        // Get program ID using center ID
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('program_id')
          .eq('center_id', centerData[0].center_id)
          .ilike('name', `%${programName}%`)
          .limit(1);
        
        if (programError) {
          console.error('Error finding program:', programError);
          return;
        }
        
        if (programData && programData.length > 0) {
          setProgramId(programData[0].program_id);
        } else {
          setProgramId(null);
        }
      } else {
        setCenterId(null);
        setProgramId(null);
      }
    } catch (error) {
      console.error('Error finding center and program IDs:', error);
    }
  };

  const handleAccept = () => {
    if (!selectedStudent) return;
    
    setIsDetailModalOpen(false);
    setIsAcceptFormOpen(true);
  };

  const handleReject = async () => {
    if (!selectedStudent) return;
    
    try {
      // Delete row from Google Sheet
      await deleteGoogleSheetRow(selectedStudent.rowIndex);
      
      toast.success('Student entry rejected and removed from review queue');
      setIsDetailModalOpen(false);
      
      // Refresh the list
      refetch();
    } catch (error) {
      console.error('Error rejecting student:', error);
      toast.error('Failed to reject student entry');
    }
  };

  const handleAddStudent = async (data: any) => {
    try {
      // Add student to database
      const { error } = await supabase
        .from('students')
        .insert([data]);
        
      if (error) {
        throw error;
      }
      
      // If successfully added to database, delete from Google Sheet
      if (selectedStudent) {
        await deleteGoogleSheetRow(selectedStudent.rowIndex);
      }
      
      toast.success('Student added successfully');
      setIsAcceptFormOpen(false);
      
      // Refresh the list
      refetch();
      fetchLastStudentId();
      
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Failed to add student');
      return Promise.reject(error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading pending reviews</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-5 w-5 mr-2 text-ishanya-green" />
            Pending Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingStudents && pendingStudents.length > 0 ? (
            <div className="space-y-4">
              {pendingStudents.map((student, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{student.firstName} {student.lastName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.program} - {student.center}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleViewDetails(student)}
                    className="text-ishanya-green"
                  >
                    View <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No reviews pending</p>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Review the student information before accepting or rejecting
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p>{selectedStudent.firstName} {selectedStudent.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p>{selectedStudent.dob}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p>{selectedStudent.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Program</p>
                  <p>{selectedStudent.program}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Center</p>
                  <p>{selectedStudent.center}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Person</p>
                  <p>{selectedStudent.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Number</p>
                  <p>{selectedStudent.contactNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{selectedStudent.email}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p>{selectedStudent.address}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={handleReject} className="flex items-center bg-red-50 text-red-600 hover:bg-red-100 border-red-200">
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleAccept} className="flex items-center bg-green-600 text-white hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Form for Accepting */}
      <StudentFormHandler
        isOpen={isAcceptFormOpen}
        onClose={() => setIsAcceptFormOpen(false)}
        onSubmit={handleAddStudent}
        centerId={centerId}
        programId={programId}
      >
        {(handleSubmit) => (
          <StudentForm
            onSubmit={handleSubmit}
            lastStudentId={lastStudentId}
            centerId={centerId}
            programId={programId}
            initialData={{
              firstName: selectedStudent?.firstName || '',
              lastName: selectedStudent?.lastName || '',
              dob: selectedStudent?.dob || '',
              gender: selectedStudent?.gender || '',
              contactPerson: selectedStudent?.contactPerson || '',
              contactNumber: selectedStudent?.contactNumber || '',
              email: selectedStudent?.email || '',
              address: selectedStudent?.address || '',
            }}
          />
        )}
      </StudentFormHandler>
    </>
  );
};

export default PendingReviews;
