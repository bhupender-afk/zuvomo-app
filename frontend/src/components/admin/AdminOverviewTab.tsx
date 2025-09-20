import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  Activity,
  Users,
  BarChart3
} from 'lucide-react';
import AdminStatsCard from './AdminStatsCard';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/adminHelpers';

interface AdminStats {
  project_counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
    under_review: number;
    funded: number;
    completed: number;
  };
  funding_stats: {
    total_projects: number;
    total_funding_goal: number;
    total_current_funding: number;
    avg_progress: string;
  };
  recent_activity: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    first_name: string;
    last_name: string;
    company: string;
    owner_name: string;
  }>;
  category_breakdown: Array<{
    category: string;
    count: number;
    total_funding: number;
  }>;
}

interface AdminOverviewTabProps {
  stats: AdminStats | null;
  onTabChange: (tab: string) => void;
}

const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ stats, onTabChange }) => {
  const pendingCount = (stats?.project_counts.pending || 0) +
                      (stats?.project_counts?.submitted || 0) +
                      (stats?.project_counts.under_review || 0);

  return (
    <div className="space-y-6">
      {/* Pending Projects Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  {pendingCount} Project{pendingCount > 1 ? 's' : ''} Awaiting Review
                </h3>
                <p className="text-sm text-yellow-700">
                  New projects have been submitted and need admin approval to go live.
                </p>
              </div>
            </div>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => onTabChange('pending-reviews')}
            >
              Review Now
            </Button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title="Total Projects"
          value={stats?.project_counts.total || 0}
          description="All projects"
          icon={FileText}
        />

        <AdminStatsCard
          title="Pending Review"
          value={pendingCount}
          description="Awaiting approval"
          icon={Clock}
          valueColor="text-yellow-600"
        />

        <AdminStatsCard
          title="Approved Projects"
          value={stats?.project_counts.approved || 0}
          description="Live projects"
          icon={CheckCircle}
          valueColor="text-green-600"
        />

        <AdminStatsCard
          title="Total Funding"
          value={formatCurrency(stats?.funding_stats.total_current_funding || 0)}
          description="Current funding"
          icon={DollarSign}
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_activity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-500">by {activity.owner_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(activity.created_at)}</p>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onTabChange('projects')}
                >
                  View All Projects
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                onClick={() => onTabChange('pending-reviews')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Review Pending Projects ({stats?.project_counts.pending || 0})
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onTabChange('users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onTabChange('analytics')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {stats?.category_breakdown && stats.category_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.category_breakdown.map((category) => (
                <div key={category.category} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{category.category}</h3>
                      <p className="text-sm text-gray-500">{category.count} projects</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(category.total_funding)}</p>
                      <p className="text-xs text-gray-500">total funding</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOverviewTab;