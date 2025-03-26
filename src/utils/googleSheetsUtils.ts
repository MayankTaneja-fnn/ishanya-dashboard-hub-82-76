
/**
 * Utility functions for working with Google Sheets
 */

/**
 * Deletes a row from a Google Sheet
 * @param rowIndex The index of the row to delete (0-based)
 * @returns Promise resolving when the operation is complete
 */
export const deleteGoogleSheetRow = async (rowIndex: number): Promise<void> => {
  try {
    // In a real implementation, this would use the Google Sheets API
    // For now, we'll just simulate a successful operation
    console.log(`Deleting row ${rowIndex} from Google Sheet`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error deleting row from Google Sheet:', error);
    return Promise.reject(error);
  }
};

/**
 * Fetches data from a Google Sheet
 * @param sheetId The ID of the sheet to fetch
 * @param range The range to fetch (e.g., 'Sheet1!A1:Z100')
 * @returns Promise resolving with the fetched data
 */
export const fetchGoogleSheetData = async (sheetId: string, range: string): Promise<any[][]> => {
  try {
    // In a real implementation, this would use the Google Sheets API
    // For now, we'll just return mock data
    console.log(`Fetching data from sheet ${sheetId}, range ${range}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return [
      ['First Name', 'Last Name', 'DOB', 'Gender', 'Program', 'Center', 'Contact Person', 'Contact Number', 'Email', 'Address'],
      ['John', 'Doe', '2012-05-15', 'Male', 'Special Education', 'Bangalore Center', 'Jane Doe', '9876543210', 'jane.doe@example.com', '123 Main St, Bangalore'],
      ['Alice', 'Smith', '2014-02-20', 'Female', 'Inclusive Learning', 'Pune Center', 'Bob Smith', '8765432109', 'bob.smith@example.com', '456 Park Ave, Pune'],
      ['Ravi', 'Kumar', '2013-09-10', 'Male', 'Vocational Training', 'Delhi Center', 'Priya Kumar', '7654321098', 'priya.kumar@example.com', '789 Garden Rd, Delhi']
    ];
  } catch (error) {
    console.error('Error fetching data from Google Sheet:', error);
    return Promise.reject(error);
  }
};

/**
 * Appends data to a Google Sheet
 * @param sheetId The ID of the sheet to append to
 * @param range The range to append to (e.g., 'Sheet1!A1')
 * @param values The values to append
 * @returns Promise resolving when the operation is complete
 */
export const appendGoogleSheetData = async (sheetId: string, range: string, values: any[][]): Promise<void> => {
  try {
    // In a real implementation, this would use the Google Sheets API
    // For now, we'll just simulate a successful operation
    console.log(`Appending data to sheet ${sheetId}, range ${range}`, values);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error appending data to Google Sheet:', error);
    return Promise.reject(error);
  }
};
