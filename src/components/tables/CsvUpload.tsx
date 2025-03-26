
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { bulkInsert } from '@/lib/api';

type CsvUploadProps = {
  tableName: string;
  onSuccess?: () => void;
  onClose: () => void;
  onUploadComplete?: () => void;
};

interface BulkInsertResponse {
  success: boolean;
  message: string;
}

const CsvUpload = ({ tableName, onSuccess, onClose, onUploadComplete }: CsvUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };
  
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      if (lines.length > 0) {
        const csvHeaders = lines[0].split(',').map(header => header.trim());
        setHeaders(csvHeaders);
        
        // Create initial mappings (direct mapping)
        const initialMappings: Record<string, string> = {};
        csvHeaders.forEach(header => {
          initialMappings[header] = header.toLowerCase();
        });
        setMappings(initialMappings);
        
        // Parse records (skip header)
        const parsedRecords = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(value => value.trim());
            const record: Record<string, string> = {};
            csvHeaders.forEach((header, index) => {
              record[header] = values[index] || '';
            });
            parsedRecords.push(record);
          }
        }
        setRecords(parsedRecords);
        setStep(2);
      }
    };
    reader.readAsText(file);
  };
  
  const handleMappingChange = (csvHeader: string, dbField: string) => {
    setMappings(prev => ({
      ...prev,
      [csvHeader]: dbField
    }));
  };
  
  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    
    try {
      // Map the records using the defined mappings
      const mappedRecords = records.map(record => {
        const mappedRecord: Record<string, any> = {};
        Object.keys(mappings).forEach(csvHeader => {
          const dbField = mappings[csvHeader];
          if (dbField) {
            mappedRecord[dbField] = record[csvHeader];
          }
        });
        return mappedRecord;
      });
      
      // Use the bulk insert function with proper response type handling
      const result = await bulkInsert(tableName, mappedRecords);
      
      if (result.success) {
        toast.success('Data uploaded successfully');
        if (onSuccess) onSuccess();
        if (onUploadComplete) onUploadComplete();
      } else {
        setError(result.message || 'Failed to upload data');
      }
    } catch (error: any) {
      console.error('Error uploading data:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };
  
  const downloadTemplate = () => {
    // Create a template CSV based on the table name
    let csvContent = '';
    
    switch (tableName.toLowerCase()) {
      case 'students':
        csvContent = 'first_name,last_name,gender,dob,student_email,contact_number,address,program_id,center_id\n';
        csvContent += 'John,Doe,Male,2000-01-01,john@example.com,1234567890,123 Main St,1,1\n';
        break;
      case 'employees':
        csvContent = 'name,employee_id,email,designation,department,date_of_joining,contact_number,center_id\n';
        csvContent += 'Jane Smith,1001,jane@example.com,Manager,Administration,2022-01-01,9876543210,1\n';
        break;
      case 'educators':
        csvContent = 'name,educator_id,email,designation,subject,date_of_joining,contact_number,center_id,program_id\n';
        csvContent += 'Alice Johnson,2001,alice@example.com,Teacher,Mathematics,2022-01-01,5555555555,1,1\n';
        break;
      default:
        csvContent = 'No template available for this table';
    }
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${tableName}_template.csv`);
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <p className="text-sm text-muted-foreground">
              Please ensure your CSV file has a header row and follows the expected format.
            </p>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Map CSV Headers to Database Fields</h3>
          <p className="text-sm text-muted-foreground">
            Select which field in your CSV corresponds to each database field.
          </p>
          
          <div className="space-y-2">
            {headers.map(header => (
              <div key={header} className="grid grid-cols-2 gap-2 items-center">
                <div className="text-sm font-medium">{header}</div>
                <select
                  className="border rounded p-1 text-sm w-full"
                  value={mappings[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                >
                  <option value="">-- Skip this field --</option>
                  <option value={header.toLowerCase()}>{header.toLowerCase()}</option>
                  <option value="name">name</option>
                  <option value="email">email</option>
                  <option value="phone">phone</option>
                  <option value="address">address</option>
                  <option value="center_id">center_id</option>
                  <option value="program_id">program_id</option>
                  {/* Add more options based on the actual table schema */}
                </select>
              </div>
            ))}
          </div>
          
          <p className="text-sm">
            Records to import: <strong>{records.length}</strong>
          </p>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setStep(1)}
              disabled={uploading}
            >
              Back
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={uploading || records.length === 0}
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Data
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvUpload;
