
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Users, GraduationCap, ClipboardList } from 'lucide-react';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import PendingReviews from '@/components/admin/PendingReviews';
import ActivitiesSection from '@/components/admin/ActivitiesSection';
import AnnouncementBoard from '@/components/announcements/AnnouncementBoard';

interface OverviewSectionProps {
  stats: {
    totalStudents: number;
    totalEducators: number;
    totalEmployees: number;
  };
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
  onViewStudentPerformance: () => void;
}

const OverviewSection = ({ 
  stats, 
  showAnalytics, 
  onToggleAnalytics, 
  onViewStudentPerformance 
}: OverviewSectionProps) => {
  return (
    <div>
      <div className="flex justify-between mb-4">
        <button
          onClick={onToggleAnalytics}
          className="px-4 py-2 rounded-md bg-white border-ishanya-green text-ishanya-green hover:bg-ishanya-green/10 transition-colors duration-200"
        >
          {showAnalytics ? "Hide Analytics" : "Show Analytics"}
        </button>
        
        <button
          onClick={onViewStudentPerformance}
          className="px-4 py-2 rounded-md bg-ishanya-green hover:bg-ishanya-green/80 text-white transition-colors duration-200"
        >
          View Student Performance
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-ishanya-green">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-ishanya-green" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ishanya-green">{stats.totalStudents}</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-ishanya-yellow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-ishanya-yellow" />
              Total Educators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ishanya-yellow">{stats.totalEducators}</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-500">{stats.totalEmployees}</p>
          </CardContent>
        </Card>
      </div>
      
      {showAnalytics && <AnalyticsDashboard />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PendingReviews />
        <ActivitiesSection />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">View recent activity across all centers</p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <AnnouncementBoard />
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
