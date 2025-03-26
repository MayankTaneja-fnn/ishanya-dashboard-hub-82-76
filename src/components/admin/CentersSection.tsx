
import React from 'react';
import { Center } from '@/lib/api';
import CenterList from '@/components/centers/CenterList';

interface CentersSectionProps {
  onSelectCenter: (center: Center) => void;
}

const CentersSection = ({ onSelectCenter }: CentersSectionProps) => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Centers</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage all centers and their programs</p>
      </div>
      
      <CenterList onSelectCenter={onSelectCenter} />
    </div>
  );
};

export default CentersSection;
