
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/auth';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    // Redirect to parent details page directly
    navigate('/parent/details');
  }, [navigate]);

  return (
    <Layout
      title="Parent Dashboard"
      subtitle="Loading your dashboard..."
    >
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    </Layout>
  );
};

export default ParentDashboard;
