
import { useState, useRef, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { bulkInsert } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';

export type CsvUploadProps = {
  tableName: string;
  onSuccess: () => void;
  onClose?: () => void;
  onCancel?: () => void;
};

const CsvUpload = ({ tableName, onSuccess, onClose, onCancel }: CsvUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const text = await file.text();

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`);
            setIsUploading(false);
            return;
          }

          const rows = results.data.map((row) => {
            return Object.fromEntries(
              Object.entries(row).map(([key, value]) => {
                if (value === '') return [key, null]; // Convert empty strings to null
                if (!isNaN(Number(value))) return [key, Number(value)]; // Convert numeric values
                return [key, value];
              })
            );
          });

          // Automatically add created_at if missing
          const finalRows = rows.map((row) => ({
            ...row,
            created_at: row.created_at || new Date().toISOString(),
          }));

          console.log(`Parsed ${finalRows.length} rows from CSV for ${tableName}`, finalRows);

          if (finalRows.length === 0) {
            setError('CSV file contains no data');
            setIsUploading(false);
            return;
          }

          try {
            const result = await bulkInsert(tableName, finalRows);
            setIsUploading(false);

            if (result.success) {
              toast.success(result.message);
              onSuccess();
              if (onClose) onClose();
            } else {
              setError(result.message);
            }
          } catch (err: any) {
            setError(err.message || 'Error uploading data');
            setIsUploading(false);
          }
        },
        error: (error) => {
          setError(`CSV parsing error: ${error.message}`);
          setIsUploading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error reading file');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Upload a CSV file with the following columns:
        </p>
        <div className="bg-gray-50 p-3 rounded-md border text-xs">
          <code>
            {tableName === 'students' && 'first_name, last_name, gender, dob, enrollment_year, status, address, contact_number, center_id, program_id'}
            {tableName === 'educators' && 'name, designation, email, phone, date_of_birth, date_of_joining, center_id'}
            {tableName === 'employees' && 'name, gender, designation, department, employment_type, email, phone, date_of_birth, status, center_id'}
            {tableName === 'courses' && 'name, duration_weeks, max_students, description, start_date, end_date, center_id, program_id'}
          </code>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="bg-ishanya-green hover:bg-ishanya-green/90"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>

      {error && (
        <div className="flex items-start text-sm text-red-600 gap-2 p-2 bg-red-50 rounded-md">
          <AlertOctagon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file && (
        <p className="text-sm text-gray-600">
          Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
        </p>
      )}
    </div>
  );
};

export default CsvUpload;
