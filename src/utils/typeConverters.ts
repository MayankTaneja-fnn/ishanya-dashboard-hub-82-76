
// Helper functions to convert between string and number types

/**
 * Safely converts a number to a string
 */
export const numberToString = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Safely converts a string to a number
 */
export const stringToNumber = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Type converter for student data
 */
export const convertStudentDataTypes = (data: any) => {
  return {
    ...data,
    student_id: data.student_id ? numberToString(data.student_id) : '',
    program_id: data.program_id ? numberToString(data.program_id) : '',
    center_id: data.center_id ? numberToString(data.center_id) : '',
    educator_employee_id: data.educator_employee_id ? numberToString(data.educator_employee_id) : '',
  };
};

/**
 * Type converter for educator data
 */
export const convertEducatorDataTypes = (data: any) => {
  return {
    ...data,
    employee_id: data.employee_id ? numberToString(data.employee_id) : '',
    center_id: data.center_id ? numberToString(data.center_id) : '',
  };
};

/**
 * Type converter for task data
 */
export const convertTaskDataTypes = (data: any) => {
  // Add created_at if it doesn't exist
  if (!data.created_at) {
    data.created_at = new Date().toISOString();
  }
  return data;
};
