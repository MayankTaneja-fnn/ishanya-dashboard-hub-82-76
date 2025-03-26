
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export type ReportUploaderProps = {
  studentId: string | number;
  onSuccess: () => void;
  onClose?: () => void; // Making onClose optional
};

const ReportUploader = ({ studentId, onSuccess, onClose }: ReportUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      // Generate a unique prefix for the file using timestamp
      const filePrefix = `${Date.now()}-${selectedFile.name}`;
      
      const { error } = await supabase.storage
        .from('ishanya')
        .upload(`student-reports/${studentId}/${filePrefix}`, selectedFile);

      if (error) {
        throw error;
      }

      toast.success('Report uploaded successfully');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess();
      if (onClose) onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Upload Student Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="report">Select PDF Report</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="report" 
                type="file" 
                accept=".pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="flex-1"
              />
              {selectedFile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearSelection}
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {selectedFile && (
            <div className="text-sm bg-muted p-2 rounded">
              <p><strong>Selected file:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="bg-ishanya-green hover:bg-ishanya-green/90"
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <FileUpload className="mr-2 h-4 w-4" />
              Upload Report
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportUploader;
