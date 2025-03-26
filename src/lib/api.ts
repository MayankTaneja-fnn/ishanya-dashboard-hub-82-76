
// Let's add a helper function to ensure all tasks have a created_at field
export const ensureTasksHaveCreatedAt = (tasks: any[]): any[] => {
  return tasks.map(task => ({
    ...task,
    created_at: task.created_at || new Date().toISOString()
  }));
};

// Type definitions
export interface Center {
  id: string;
  center_id: number;
  name: string;
  location?: string;
  description?: string;
  num_of_student?: number;
  num_of_educator?: number;
  num_of_employees?: number;
  created_at?: string;
}

export interface Program {
  id: string;
  program_id: number;
  name: string;
  description?: string;
  center_id: number;
  created_at?: string;
}

export interface TableInfo {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  program_id?: number;
  center_id?: number;
}

export interface Task {
  id: number;
  student_id: number;
  description: string;
  due_date: string;
  completed: boolean;
  created_at: string;
}

// API response type
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// API functions
import { supabase } from '@/integrations/supabase/client';

export const fetchCenters = async (): Promise<Center[] | null> => {
  try {
    const { data, error } = await supabase
      .from('centers')
      .select('*');
      
    if (error) {
      console.error('Error fetching centers:', error);
      return null;
    }
    
    return data as Center[];
  } catch (error) {
    console.error('Exception in fetchCenters:', error);
    return null;
  }
};

export const fetchProgramsByCenter = async (centerId: number): Promise<Program[] | null> => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('center_id', centerId);
      
    if (error) {
      console.error('Error fetching programs:', error);
      return null;
    }
    
    return data as Program[];
  } catch (error) {
    console.error('Exception in fetchProgramsByCenter:', error);
    return null;
  }
};

export const fetchTablesByProgram = async (programId: number): Promise<TableInfo[] | null> => {
  try {
    // This is a simplified implementation - normally you'd fetch this from your backend
    // For now, let's return some default tables based on program ID
    return [
      { 
        id: 'students', 
        name: 'students',
        display_name: 'Students',
        description: 'Manage students in this program',
        program_id: programId 
      },
      { 
        id: 'educators', 
        name: 'educators',
        display_name: 'Educators',
        description: 'Manage educators in this program',
        program_id: programId 
      },
      // Add more tables as needed
    ];
  } catch (error) {
    console.error('Exception in fetchTablesByProgram:', error);
    return null;
  }
};

export const fetchTableColumns = async (tableName: string): Promise<string[]> => {
  // In a real application, you might fetch this from API or database metadata
  // For simplicity, we'll return hardcoded columns for common tables
  const tableColumns: Record<string, string[]> = {
    students: ['id', 'student_id', 'first_name', 'last_name', 'gender', 'dob', 'enrollment_year', 'status', 'student_email', 'program_id', 'contact_number', 'center_id'],
    educators: ['id', 'employee_id', 'name', 'designation', 'email', 'phone', 'date_of_birth', 'date_of_joining', 'center_id'],
    employees: ['id', 'employee_id', 'name', 'gender', 'designation', 'department', 'email', 'phone', 'date_of_birth', 'date_of_joining', 'center_id'],
    centers: ['id', 'center_id', 'name', 'location', 'num_of_student', 'num_of_educator', 'num_of_employees'],
    programs: ['id', 'program_id', 'name', 'description', 'center_id']
  };
  
  return tableColumns[tableName.toLowerCase()] || [];
};

export const bulkInsert = async (tableName: string, data: any[]): Promise<ApiResponse> => {
  try {
    // Using fixed table names since dynamic table names aren't supported in the type system
    const allowedTables = ['students', 'educators', 'employees', 'centers', 'programs', 'courses'];
    
    if (!allowedTables.includes(tableName)) {
      return { 
        success: false, 
        message: `Invalid table name: ${tableName}. Allowed tables are: ${allowedTables.join(', ')}` 
      };
    }
    
    const { error } = await supabase
      .from(tableName as any)
      .insert(data);
      
    if (error) {
      console.error(`Error bulk inserting into ${tableName}:`, error);
      return { 
        success: false, 
        message: `Error inserting data: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: `Successfully inserted ${data.length} records into ${tableName}` 
    };
  } catch (error: any) {
    console.error(`Exception in bulkInsert for ${tableName}:`, error);
    return { 
      success: false, 
      message: `Unexpected error: ${error.message}` 
    };
  }
};

// Export as default to fix module import issues
const api = {
  ensureTasksHaveCreatedAt,
  fetchCenters,
  fetchProgramsByCenter,
  fetchTablesByProgram,
  fetchTableColumns,
  bulkInsert
};

export default api;
