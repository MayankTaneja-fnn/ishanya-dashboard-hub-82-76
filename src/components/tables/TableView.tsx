
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, fetchTableColumns } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { capitalizeFirstLetter } from './TableFieldFormatter';

export interface TableViewProps {
  table: string;
  onRecordDeleted?: () => void;
  onRecordUpdated?: () => void;
}

const TableView = ({ table }: TableViewProps) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const columnsData = await fetchTableColumns(table);
        if (!columnsData) {
          setError('Failed to fetch table columns');
          return;
        }
        
        // Extract column names
        const columnNames = columnsData.map(col => col.name);
        setColumns(columnNames);
        
        const { data: tableData, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .limit(50);
        
        if (fetchError) {
          console.error('Error fetching data:', fetchError);
          setError('Failed to fetch data');
          return;
        }
        
        setData(tableData || []);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [table]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-4">No data found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.slice(0, 6).map((column) => (
              <TableHead key={column}>
                {capitalizeFirstLetter(column)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.slice(0, 6).map((column) => (
                <TableCell key={column}>
                  {row[column] !== null ? 
                    (typeof row[column] === 'object' ? 
                      JSON.stringify(row[column]) : 
                      String(row[column])
                    ) : '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableView;
