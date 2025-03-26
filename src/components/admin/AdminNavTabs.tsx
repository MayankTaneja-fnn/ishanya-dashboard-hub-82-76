
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminNavTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavTabs = ({ activeTab, onTabChange }: AdminNavTabsProps) => {
  return (
    <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview" className="text-center">
            Overview
          </TabsTrigger>
          <TabsTrigger value="centers" className="text-center">
            Centers
          </TabsTrigger>
          <TabsTrigger value="programs" className="text-center">
            Programs
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default AdminNavTabs;
