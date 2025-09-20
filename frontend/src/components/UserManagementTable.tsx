import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Mail,
  Clock,
  UserCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  user_type: string;
  company?: string;
  location?: string;
  is_verified: boolean;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  days_waiting?: number;
  rejection_reason?: string;
}

interface UserManagementTableProps {
  refreshTrigger?: number;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({ refreshTrigger }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 10;

  // Fetch users with filters and pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get(`/admin/users?${params.toString()}`);
      if (response.data) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalUsers(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter, refreshTrigger]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter]);

  // Approve user
  const handleApproveUser = async (userId: string, notes?: string) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/admin/users/${userId}/approve`, {
        admin_notes: notes
      });

      if (response.data) {
        alert('User approved successfully! Welcome email has been sent.');
        fetchUsers();
        setShowApprovalDialog(false);
        setSelectedUser(null);
        setAdminNotes('');
      }
    } catch (error: any) {
      console.error('Failed to approve user:', error);
      alert(error.response?.data?.error || 'Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject user
  const handleRejectUser = async (userId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/admin/users/${userId}/reject`, {
        rejection_reason: reason,
        admin_notes: reason
      });

      if (response.data) {
        alert('User rejected successfully! Notification email has been sent.');
        fetchUsers();
        setShowRejectionDialog(false);
        setSelectedUser(null);
        setRejectionReason('');
      }
    } catch (error: any) {
      console.error('Failed to reject user:', error);
      alert(error.response?.data?.error || 'Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk approve users
  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to approve');
      return;
    }

    if (!confirm(`Approve ${selectedUsers.size} selected users?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post('/admin/users/bulk-approve', {
        user_ids: Array.from(selectedUsers),
        admin_notes: 'Bulk approval by admin'
      });

      if (response.data) {
        alert(`${response.data.approved_count} users approved successfully! Welcome emails sent: ${response.data.emails_sent}`);
        fetchUsers();
        setSelectedUsers(new Set());
      }
    } catch (error: any) {
      console.error('Failed to bulk approve users:', error);
      alert(error.response?.data?.error || 'Failed to bulk approve users');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const colors = {
      'project_owner': 'bg-blue-100 text-blue-800',
      'investor': 'bg-purple-100 text-purple-800',
      'admin': 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="project_owner">Project Owners</SelectItem>
                <SelectItem value="investor">Investors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {selectedUsers.size > 0 && (
              <Button
                onClick={handleBulkApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected ({selectedUsers.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Users ({totalUsers})
            </CardTitle>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {!user.is_verified && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs mt-1">Unverified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.user_type)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {getStatusBadge(user.approval_status)}
                          {user.approval_status === 'pending' && user.days_waiting !== undefined && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {user.days_waiting} days waiting
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.company || '-'}</TableCell>
                      <TableCell>{user.location || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {user.approval_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowApprovalDialog(true);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowRejectionDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</h4>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-gray-600">Role: {selectedUser.user_type.replace('_', ' ')}</p>
                {selectedUser.company && (
                  <p className="text-sm text-gray-600">Company: {selectedUser.company}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes for this approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedUser && handleApproveUser(selectedUser.id, adminNotes)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Approving...' : 'Approve & Send Welcome Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</h4>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-gray-600">Role: {selectedUser.user_type.replace('_', ' ')}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Rejection Reason <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Please provide a clear reason for rejection that will be sent to the user..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedUser && handleRejectUser(selectedUser.id, rejectionReason)}
                disabled={actionLoading || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? 'Rejecting...' : 'Reject & Send Notification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTable;