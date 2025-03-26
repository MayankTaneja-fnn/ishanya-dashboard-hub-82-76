import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, GraduationCap, UserCog, Mic } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import VoiceInputDialog from '@/components/ui/VoiceInputDialog';
import * as api from '@/lib/api'; // Import as a namespace instead of default

const DataManager = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showEducatorDialog, setShowEducatorDialog] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [showVoiceInputDialog, setShowVoiceInputDialog] = useState(false);

  const studentSchema = z.object({
    first_name: z.string().min(2, { message: 'First name is required' }),
    last_name: z.string().min(2, { message: 'Last name is required' }),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }),
    contact_number: z.string().min(10, { message: 'Valid contact number is required' }),
    student_email: z.string().email({ message: 'Valid email is required' }).optional().or(z.literal('')),
    parents_email: z.string().email({ message: 'Valid parent email is required' }).optional().or(z.literal('')),
    address: z.string().optional(),
    program_id: z.string().min(1, { message: 'Program is required' }),
    center_id: z.string().min(1, { message: 'Center is required' }),
  });

  const employeeSchema = z.object({
    name: z.string().min(2, { message: 'Name is required' }),
    employee_id: z.string().min(1, { message: 'Employee ID is required' }),
    email: z.string().email({ message: 'Valid email is required' }),
    designation: z.string().min(2, { message: 'Designation is required' }),
    department: z.string().min(2, { message: 'Department is required' }),
    date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }),
    contact_number: z.string().min(10, { message: 'Valid contact number is required' }),
    center_id: z.string().min(1, { message: 'Center is required' }),
  });

  const educatorSchema = z.object({
    name: z.string().min(2, { message: 'Name is required' }),
    educator_id: z.string().min(1, { message: 'Educator ID is required' }),
    email: z.string().email({ message: 'Valid email is required' }),
    designation: z.string().min(2, { message: 'Designation is required' }),
    subject: z.string().min(2, { message: 'Subject is required' }),
    date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }),
    contact_number: z.string().min(10, { message: 'Valid contact number is required' }),
    center_id: z.string().min(1, { message: 'Center is required' }),
    program_id: z.string().min(1, { message: 'Program is required' }),
  });

  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      dob: '',
      contact_number: '',
      student_email: '',
      parents_email: '',
      address: '',
      program_id: '',
      center_id: '',
    },
  });

  const employeeForm = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      employee_id: '',
      email: '',
      designation: '',
      department: '',
      date_of_joining: '',
      contact_number: '',
      center_id: '',
    },
  });

  const educatorForm = useForm<z.infer<typeof educatorSchema>>({
    resolver: zodResolver(educatorSchema),
    defaultValues: {
      name: '',
      educator_id: '',
      email: '',
      designation: '',
      subject: '',
      date_of_joining: '',
      contact_number: '',
      center_id: '',
      program_id: '',
    },
  });

  const fetchCenters = async () => {
    try {
      const { data, error } = await supabase.from('centers').select('*');
      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error('Error fetching centers:', error);
      toast.error('Failed to load centers');
    }
  };

  const fetchPrograms = async (centerId: string) => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('center_id', centerId);
      
      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load programs');
    }
  };

  const handleOpenStudentDialog = () => {
    fetchCenters();
    setShowStudentDialog(true);
  };

  const handleOpenEmployeeDialog = () => {
    fetchCenters();
    setShowEmployeeDialog(true);
  };

  const handleOpenEducatorDialog = () => {
    fetchCenters();
    setShowEducatorDialog(true);
  };

  const handleOpenVoiceInputDialog = () => {
    fetchCenters();
    setShowVoiceInputDialog(true);
  };

  const handleVoiceInputComplete = async (data: Record<string, any>) => {
    setIsLoading(true);
    
    try {
      let result;
      
      if (activeTab === 'students') {
        // Make sure to include all required fields for students
        const studentData = {
          ...data,
          created_at: new Date().toISOString(),
          // Ensure the following required fields have default values if not provided
          student_id: data.student_id || Math.floor(Math.random() * 10000),
          enrollment_year: data.enrollment_year || new Date().getFullYear(),
          gender: data.gender || 'Not Specified',
          status: data.status || 'Active',
          educator_employee_id: data.educator_employee_id || 1,
          center_id: Number(data.center_id) || 1,
          program_id: Number(data.program_id) || 1,
          contact_number: data.contact_number || '0000000000',
          dob: data.dob || '2000-01-01'
        };

        const { data: insertedData, error } = await supabase
          .from('students')
          .insert(studentData)
          .select();

        if (error) throw error;
        result = insertedData;
        toast.success('Student created successfully via voice input');
      } 
      else if (activeTab === 'educators') {
        // Make sure to include all required fields for educators
        const educatorData = {
          ...data,
          created_at: new Date().toISOString(),
          // Ensure the following required fields have default values if not provided
          employee_id: data.employee_id || Math.floor(Math.random() * 10000),
          name: data.name || 'Unknown',
          designation: data.designation || 'Teacher',
          email: data.email || `educator${Math.floor(Math.random() * 10000)}@example.com`,
          phone: data.phone || '0000000000',
          date_of_birth: data.date_of_birth || '1980-01-01',
          date_of_joining: data.date_of_joining || new Date().toISOString().split('T')[0],
          work_location: data.work_location || 'Main Campus',
          center_id: Number(data.center_id) || 1
        };

        const { data: insertedData, error } = await supabase
          .from('educators')
          .insert(educatorData)
          .select();

        if (error) throw error;
        result = insertedData;
        toast.success('Educator created successfully via voice input');
      }
      else if (activeTab === 'employees') {
        // Make sure to include all required fields for employees
        const employeeData = {
          ...data,
          created_at: new Date().toISOString(),
          // Ensure the following required fields have default values if not provided
          employee_id: data.employee_id || Math.floor(Math.random() * 10000),
          name: data.name || 'Unknown',
          gender: data.gender || 'Not Specified',
          designation: data.designation || 'Staff',
          department: data.department || 'Administration',
          employment_type: data.employment_type || 'Full-Time',
          email: data.email || `employee${Math.floor(Math.random() * 10000)}@example.com`,
          phone: data.phone || '0000000000',
          date_of_birth: data.date_of_birth || '1980-01-01',
          date_of_joining: data.date_of_joining || new Date().toISOString().split('T')[0],
          emergency_contact_name: data.emergency_contact_name || 'Emergency Contact',
          emergency_contact: data.emergency_contact || '0000000000',
          center_id: Number(data.center_id) || 1,
          password: data.password || 'defaultpassword'
        };

        const { data: insertedData, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select();

        if (error) throw error;
        result = insertedData;
        toast.success('Employee created successfully via voice input');
      }
      
      setShowVoiceInputDialog(false);
    } catch (error: any) {
      console.error(`Error creating ${activeTab.slice(0, -1)}:`, error);
      toast.error(`Failed to create ${activeTab.slice(0, -1)}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCenterChange = (centerId: string, formType: 'student' | 'employee' | 'educator') => {
    setSelectedCenter(centerId);
    fetchPrograms(centerId);
    
    if (formType === 'student') {
      studentForm.setValue('center_id', centerId);
    } else if (formType === 'employee') {
      employeeForm.setValue('center_id', centerId);
    } else if (formType === 'educator') {
      educatorForm.setValue('center_id', centerId);
    }
  };

  const handleProgramChange = (programId: string, formType: 'student' | 'educator') => {
    if (formType === 'student') {
      studentForm.setValue('program_id', programId);
    } else if (formType === 'educator') {
      educatorForm.setValue('program_id', programId);
    }
  };

  const onSubmitStudent = async (data: z.infer<typeof studentSchema>) => {
    setIsLoading(true);
    try {
      const studentData = {
        ...data,
        created_at: new Date().toISOString(),
        program_id: parseInt(data.program_id),
        center_id: parseInt(data.center_id),
        // Add required fields with default values if not provided by the form
        student_id: Math.floor(Math.random() * 10000),
        enrollment_year: new Date().getFullYear(),
        gender: 'Not Specified',
        status: 'Active',
        educator_employee_id: 1
      };

      const { data: insertedData, error } = await supabase
        .from('students')
        .insert(studentData)
        .select();

      if (error) {
        console.error('Error creating student:', error);
        toast.error('Failed to create student: ' + error.message);
        return;
      }

      toast.success('Student created successfully');
      setShowStudentDialog(false);
      studentForm.reset();
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error('An unexpected error occurred: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitEmployee = async (data: z.infer<typeof employeeSchema>) => {
    setIsLoading(true);
    try {
      const employeeData = {
        ...data,
        created_at: new Date().toISOString(),
        center_id: parseInt(data.center_id),
        date_of_birth: '1980-01-01', // Default value for required field
        gender: 'Not Specified', // Default value for required field
        emergency_contact: '0000000000', // Default value for required field
        emergency_contact_name: 'Emergency Contact', // Default value for required field
        employment_type: 'Full-Time', // Default value for required field
        phone: data.contact_number, // Map contact_number to phone
        password: 'defaultpassword', // Default value for required field
        employee_id: parseInt(data.employee_id || '0')
      };

      const { data: insertedData, error } = await supabase
        .from('employees')
        .insert(employeeData)
        .select();

      if (error) {
        console.error('Error creating employee:', error);
        toast.error('Failed to create employee: ' + error.message);
        return;
      }

      toast.success('Employee created successfully');
      setShowEmployeeDialog(false);
      employeeForm.reset();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error('An unexpected error occurred: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitEducator = async (data: z.infer<typeof educatorSchema>) => {
    setIsLoading(true);
    try {
      const educatorData = {
        // Only include fields that are valid for the educators table
        name: data.name,
        date_of_birth: data.date_of_joining, // Required field
        date_of_joining: data.date_of_joining,
        designation: data.designation,
        email: data.email,
        center_id: parseInt(data.center_id),
        employee_id: parseInt(data.educator_id),
        phone: data.contact_number,
        work_location: 'Main Campus', // Required field with default value
        created_at: new Date().toISOString()
        // Note: program_id is not used in educators table
      };

      const { data: insertedData, error } = await supabase
        .from('educators')
        .insert(educatorData)
        .select();

      if (error) {
        console.error('Error creating educator:', error);
        toast.error('Failed to create educator: ' + error.message);
        return;
      }

      toast.success('Educator created successfully');
      setShowEducatorDialog(false);
      educatorForm.reset();
    } catch (error: any) {
      console.error('Error creating educator:', error);
      toast.error('An unexpected error occurred: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-t-4 border-ishanya-green">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <CardTitle className="text-lg text-gray-800">Add New Records</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs 
          defaultValue="students" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students" className="data-[state=active]:bg-ishanya-green data-[state=active]:text-white">
              Students
            </TabsTrigger>
            <TabsTrigger value="educators" className="data-[state=active]:bg-ishanya-yellow data-[state=active]:text-white">
              Educators
            </TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Employees
            </TabsTrigger>
          </TabsList>
          <TabsContent value="students" className="mt-4">
            <div className="text-center space-y-4">
              <Button 
                onClick={handleOpenStudentDialog}
                className="bg-ishanya-green hover:bg-ishanya-green/90 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Student
              </Button>
              
              <div className="flex items-center justify-center">
                <div className="border-t border-gray-300 w-1/3"></div>
                <div className="mx-3 text-gray-500">or</div>
                <div className="border-t border-gray-300 w-1/3"></div>
              </div>
              
              <Button 
                onClick={handleOpenVoiceInputDialog}
                variant="outline"
                className="border-ishanya-green text-ishanya-green hover:bg-ishanya-green/10"
              >
                <Mic className="mr-2 h-4 w-4" />
                Add Student with Voice
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="educators" className="mt-4">
            <div className="text-center space-y-4">
              <Button 
                onClick={handleOpenEducatorDialog}
                className="bg-ishanya-yellow hover:bg-ishanya-yellow/90 text-white"
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Add New Educator
              </Button>
              
              <div className="flex items-center justify-center">
                <div className="border-t border-gray-300 w-1/3"></div>
                <div className="mx-3 text-gray-500">or</div>
                <div className="border-t border-gray-300 w-1/3"></div>
              </div>
              
              <Button 
                onClick={handleOpenVoiceInputDialog}
                variant="outline"
                className="border-ishanya-yellow text-ishanya-yellow hover:bg-ishanya-yellow/10"
              >
                <Mic className="mr-2 h-4 w-4" />
                Add Educator with Voice
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="employees" className="mt-4">
            <div className="text-center space-y-4">
              <Button 
                onClick={handleOpenEmployeeDialog}
                className="bg-purple-500 hover:bg-purple-400 text-white"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Add New Employee
              </Button>
              
              <div className="flex items-center justify-center">
                <div className="border-t border-gray-300 w-1/3"></div>
                <div className="mx-3 text-gray-500">or</div>
                <div className="border-t border-gray-300 w-1/3"></div>
              </div>
              
              <Button 
                onClick={handleOpenVoiceInputDialog}
                variant="outline"
                className="border-purple-500 text-purple-500 hover:bg-purple-50"
              >
                <Mic className="mr-2 h-4 w-4" />
                Add Employee with Voice
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-ishanya-green flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Student
              </DialogTitle>
            </DialogHeader>
            <Form {...studentForm}>
              <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={studentForm.control}
                    name="center_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Center <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => handleCenterChange(value, 'student')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a center" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {centers.map((center) => (
                              <SelectItem key={center.center_id} value={center.center_id.toString()}>
                                {center.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="program_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => handleProgramChange(value, 'student')}
                          disabled={!selectedCenter}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map((program) => (
                              <SelectItem key={program.program_id} value={program.program_id.toString()}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name (e.g., John)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name (e.g., Smith)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="YYYY-MM-DD (e.g., 2010-05-20)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="contact_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact number (e.g., 9876543210)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="student_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email (e.g., student@example.com)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="parents_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent's Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email (e.g., parent@example.com)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter complete address with city and pincode" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-ishanya-green hover:bg-ishanya-green/90"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : "Add Student"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-purple-500 flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Add New Employee
              </DialogTitle>
            </DialogHeader>
            <Form {...employeeForm}>
              <form onSubmit={employeeForm.handleSubmit(onSubmitEmployee)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={employeeForm.control}
                    name="center_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Center <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => handleCenterChange(value, 'employee')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a center" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {centers.map((center) => (
                              <SelectItem key={center.center_id} value={center.center_id.toString()}>
                                {center.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter employee ID (e.g., E12345)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name (e.g., John Smith)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email (e.g., employee@example.com)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter job title (e.g., Manager)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter department (e.g., Administration)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="date_of_joining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Joining <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="YYYY-MM-DD (e.g., 2022-01-15)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="contact_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact number (e.g., 9876543210)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-500 hover:bg-purple-400"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : "Add Employee"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showEducatorDialog} onOpenChange={setShowEducatorDialog}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-ishanya-yellow flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Add New Educator
              </DialogTitle>
            </DialogHeader>
            <Form {...educatorForm}>
              <form onSubmit={educatorForm.handleSubmit(onSubmitEducator)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={educatorForm.control}
                    name="center_id"
                    render={({ field }) => (
