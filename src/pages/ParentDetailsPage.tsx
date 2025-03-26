
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Book, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReportUploader from '@/components/parent/ReportUploader';

const ParentDetailsPage = () => {
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any | null>(null);
  const [educator, setEducator] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [showReportUploader, setShowReportUploader] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch parent data
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('*')
          .eq('email', user.email)
          .single();
          
        if (parentError) {
          console.error('Error fetching parent data:', parentError);
          setError('Failed to load parent information');
          setLoading(false);
          return;
        }
        
        if (!parentData || !parentData.student_id) {
          setError('No student associated with this parent account');
          setLoading(false);
          return;
        }
        
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', parentData.student_id)
          .single();
          
        if (studentError) {
          console.error('Error fetching student data:', studentError);
          setError('Failed to load student information');
          setLoading(false);
          return;
        }
        
        setStudent(studentData);
        setFeedback(parentData.feedback || '');
        
        // Fetch educator data if student has an assigned educator
        if (studentData.educator_employee_id) {
          const { data: educatorData, error: educatorError } = await supabase
            .from('educators')
            .select('*')
            .eq('employee_id', studentData.educator_employee_id)
            .single();
            
          if (!educatorError && educatorData) {
            setEducator(educatorData);
          }
        }
        
        // Fetch student reports
        await fetchStudentReports(parentData.student_id);
        
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const fetchStudentReports = async (studentId: number) => {
    try {
      setLoadingReports(true);
      
      const { data: reportFiles, error: reportsError } = await supabase
        .storage
        .from('ishanya')
        .list(`student-reports/${studentId}`);
        
      if (reportsError) {
        console.error('Error fetching student reports:', reportsError);
        setReports([]);
        return;
      }
      
      const formattedReports = reportFiles ? reportFiles.map(file => ({
        name: file.name,
        created_at: file.created_at,
        size: file.metadata?.size || 0,
        id: file.id
      })) : [];
      
      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching student reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };
  
  const handleFeedbackSubmit = async () => {
    if (!user || !student) return;
    
    try {
      const { error } = await supabase
        .from('parents')
        .update({ feedback })
        .eq('email', user.email);
        
      if (error) {
        console.error('Error updating feedback:', error);
        alert('Failed to save feedback');
        return;
      }
      
      alert('Feedback saved successfully');
    } catch (err) {
      console.error('Error in handleFeedbackSubmit:', err);
      alert('An unexpected error occurred');
    }
  };
  
  const handleViewReport = async (fileName: string) => {
    if (!student) return;
    
    try {
      const { data, error } = await supabase
        .storage
        .from('ishanya')
        .createSignedUrl(`student-reports/${student.student_id}/${fileName}`, 60);
        
      if (error || !data) {
        alert('Failed to generate URL for the report');
        return;
      }
      
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing report:', error);
      alert('An error occurred while trying to view the report');
    }
  };
  
  if (loading) {
    return (
      <Layout title="Parent Portal" subtitle="Loading your information...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout title="Parent Portal" subtitle="There was a problem loading your information">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }
  
  if (!student) {
    return (
      <Layout title="Parent Portal" subtitle="No student information found">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We couldn't find any student associated with your account. Please contact the administrator.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }
  
  return (
    <Layout title="Parent Portal" subtitle={`Welcome back, ${user?.name || 'Parent'}`}>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {student.first_name} {student.last_name}</p>
              <p><strong>Student ID:</strong> {student.student_id}</p>
              <p><strong>Email:</strong> {student.student_email}</p>
              <p><strong>Date of Birth:</strong> {new Date(student.dob).toLocaleDateString()}</p>
              <p><strong>Program ID:</strong> {student.program_id}</p>
              <p><strong>Status:</strong> {student.status}</p>
            </div>
          </CardContent>
        </Card>
        
        {educator && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Educator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {educator.name}</p>
                <p><strong>Designation:</strong> {educator.designation}</p>
                <p><strong>Email:</strong> {educator.email}</p>
                <p><strong>Phone:</strong> {educator.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="reports" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center">
              <Book className="w-4 h-4 mr-2" />
              Provide Feedback
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Student Reports</CardTitle>
                  <Button onClick={() => setShowReportUploader(true)}>Upload Report</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingReports ? (
                  <div className="flex justify-center p-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No reports available.</p>
                ) : (
                  <div className="space-y-2">
                    {reports.map((report, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{report.name.replace(/^\d+-/, '')}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewReport(report.name)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {showReportUploader && student && (
              <ReportUploader 
                studentId={student.student_id} 
                onClose={() => {
                  setShowReportUploader(false);
                  fetchStudentReports(student.student_id);
                }}
                onSuccess={() => {
                  setShowReportUploader(false);
                  fetchStudentReports(student.student_id);
                }}
              />
            )}
          </TabsContent>
          
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Your Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    className="w-full p-3 border rounded-md h-32"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Please share your thoughts and feedback about your child's progress..."
                  />
                  <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ParentDetailsPage;
