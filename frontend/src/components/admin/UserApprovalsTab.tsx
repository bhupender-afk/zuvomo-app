import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  UserCheck,
  UserX,
  Eye,
  Mail,
  Building,
  MapPin,
  Calendar,
  TrendingUp,
  BarChart3,
  Star,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface PendingUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'investor' | 'project_owner';
  company?: string;
  location?: string;
  bio?: string;
  linkedin_url?: string;
  website_url?: string;
  investment_range?: string;
  portfolio_size?: string;
  investment_categories?: string[];
  experience_level?: string;
  investment_focus?: string[];
  accredited_investor?: boolean;
  enhanced_signup: boolean;
  created_at: string;
  profile_completed: boolean;
}

interface UserApprovalsTabProps {
  pendingCount?: number;
  onCountUpdate?: (count: number) => void;
}

export const UserApprovalsTab: React.FC<UserApprovalsTabProps> = ({
  pendingCount,
  onCountUpdate
}) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [userToReject, setUserToReject] = useState<PendingUser | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/pending-approvals`);
      const data = await response.json();

      if (data.success) {
        setPendingUsers(data.data);
        onCountUpdate?.(data.data.length);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNotes: 'Approved via enhanced signup flow'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Remove approved user from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
        onCountUpdate?.(pendingUsers.length - 1);

        // Show success message (you could add a toast here)
        console.log('User approved successfully');
      } else {
        console.error('Failed to approve user:', data.message);
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async () => {
    if (!userToReject || !rejectionReason.trim()) return;

    try {
      setActionLoading(userToReject.id);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reject-user/${userToReject.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Remove rejected user from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== userToReject.id));
        onCountUpdate?.(pendingUsers.length - 1);

        // Close dialog and reset state
        setShowRejectionDialog(false);
        setUserToReject(null);
        setRejectionReason('');

        console.log('User rejected successfully');
      } else {
        console.error('Failed to reject user:', data.message);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectionDialog = (user: PendingUser) => {
    setUserToReject(user);
    setRejectionReason('');
    setShowRejectionDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'investor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Users awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingUsers.filter(u => u.role === 'investor').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Investor registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Owners</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingUsers.filter(u => u.role === 'project_owner').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Project owner registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending User Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500">No pending user approvals at the moment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Profile Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </span>
                        {user.company && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {user.company}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role === 'investor' ? 'Venture Capital' : 'Project Owner'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.enhanced_signup && (
                          <Badge variant="outline" className="text-xs">
                            Enhanced
                          </Badge>
                        )}
                        {user.profile_completed && (
                          <Badge variant="outline" className="text-xs">
                            Complete
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                User Profile: {user.first_name} {user.last_name}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p>{selectedUser.first_name} {selectedUser.last_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p>{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Role</label>
                                    <p className="capitalize">{selectedUser.role}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Company</label>
                                    <p>{selectedUser.company || 'Not specified'}</p>
                                  </div>
                                </div>

                                {selectedUser.role === 'investor' && (
                                  <div className="space-y-3 border-t pt-4">
                                    <h4 className="font-medium">Investment Profile</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <label className="font-medium">Investment Range</label>
                                        <p>{selectedUser.investment_range || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Portfolio Size</label>
                                        <p>{selectedUser.portfolio_size || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Experience Level</label>
                                        <p className="capitalize">{selectedUser.experience_level || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Accredited Investor</label>
                                        <p>{selectedUser.accredited_investor ? 'Yes' : 'No'}</p>
                                      </div>
                                    </div>
                                    {selectedUser.investment_categories && selectedUser.investment_categories.length > 0 && (
                                      <div>
                                        <label className="font-medium">Investment Categories</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {selectedUser.investment_categories.map((category, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {category}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {selectedUser.bio && (
                                  <div className="border-t pt-4">
                                    <label className="font-medium">Bio</label>
                                    <p className="text-sm mt-1">{selectedUser.bio}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApproveUser(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openRejectionDialog(user)}
                          disabled={actionLoading === user.id}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this user's registration. This will help improve our approval process.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false);
                  setUserToReject(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectUser}
                disabled={!rejectionReason.trim() || actionLoading === userToReject?.id}
              >
                {actionLoading === userToReject?.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Reject User'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserApprovalsTab;