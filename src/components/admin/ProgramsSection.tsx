
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProgramsSectionProps {
  onSelectProgram: (program: any) => void;
}

const ProgramsSection = ({ onSelectProgram }: ProgramsSectionProps) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('programs')
          .select('*, centers(name)');

        if (error) {
          throw error;
        }

        if (data) {
          setPrograms(data);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">All Programs</h2>
        <p className="text-gray-500 dark:text-gray-400">View and manage all programs across centers</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Card 
            key={program.program_id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectProgram(program)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{program.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Center: {program.centers?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">ID: {program.program_id}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProgramsSection;
