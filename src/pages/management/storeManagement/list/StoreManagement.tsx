import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Store as StoreIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  // Building2,
  MapPin,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { storeService } from '@/services/storeService';
import type { Store } from '@/services/storeService';
import { useNavigate } from 'react-router-dom';

// Helper function to get user role from localStorage
const getUserRole = (): string | null => {
  try {
    const userDataString = localStorage.getItem('userData');
    console.log('getUserRole - raw userData:', userDataString);
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      console.log('getUserRole - parsed userData:', userData);
      const role = userData.role_name || userData.role || null;
      console.log('getUserRole - extracted role:', role);
      return role;
    }
  } catch (error) {
    console.error('Error getting user role from localStorage:', error);
  }
  return null;
};

// Helper function to get user ID from localStorage
const getUserId = (): string | null => {
  try {
    const userDataString = localStorage.getItem('userData');
    console.log('getUserId - raw userData:', userDataString);
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      console.log('getUserId - parsed userData:', userData);
      const id = userData.id || null;
      console.log('getUserId - extracted id:', id);
      return id;
    }
  } catch (error) {
    console.error('Error getting user ID from localStorage:', error);
  }
  return null;
};

export const StoreManagement = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [storeTypeFilter, setStoreTypeFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    field: string | null;
    direction: 'asc' | 'desc' | null;
  }>({
    field: null,
    direction: null,
  });

  // Get user role on component mount
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const role = user.role_name || user.role || null;
        setUserRole(role);
        console.log('Store Management - User role:', role); // Debug log
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  // Load stores when component mounts
  useEffect(() => {
    const loadStores = async () => {
      try {
        setIsLoading(true);
        const userRole = getUserRole();
        const userId = getUserId();

        // Enhanced debugging
        console.log('=== Frontend Store Loading ===');
        console.log('Raw localStorage userData:', localStorage.getItem('userData'));
        console.log('Parsed userRole:', userRole);
        console.log('Parsed userId:', userId);

        // Prepare params for the API call
        const params: any = {};

        // Only pass userId and userRole if the user is purchaser or biller
        if (userRole && (userRole === 'purchaser' || userRole === 'biller')) {
          params.userId = userId;
          params.userRole = userRole;
          console.log('User is purchaser or biller, adding params');
        } else {
          console.log('User is not purchaser or biller, no params added');
        }

        console.log('Final API params:', params);
        const response = await storeService.listStores(params);
        console.log('Store API response:', response);
        console.log('Store data received:', response.data);
        console.log('Number of stores:', response.data?.length || 0);
        console.log('=== End Frontend Store Loading ===');
        
        setStores(response.data || []);
      } catch (error: any) {
        console.error('Error loading stores:', error);
        toast.error(error?.message || 'Failed to load stores');
        setStores([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStores();
  }, []);

  const storeTypes = ['all'];

  // Get unique managers for filters
  const managers = useMemo(() => {
    const managerSet = new Set<string>(['all']);
    stores.forEach((store) => {
      if (store.manager) {
        managerSet.add(store.manager);
      }
    });
    return Array.from(managerSet);
  }, [stores]);

  // const storeNames = useMemo(() => {
  //   const nameSet = new Set<string>(['all']);
  //   stores.forEach((store) => {
  //     nameSet.add(store.name);
  //   });
  //   return Array.from(nameSet);
  // }, [stores]);

  // === Filter, Sort, Paginate with useMemo ===
  const filteredAndSortedStores = useMemo(() => {
    let filtered = [...stores];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query)
      );
    }

    // Filters
    if (managerFilter !== 'all') {
      filtered = filtered.filter(
        (s) => s.manager === managerFilter
      );
    }

    // Sorting
    if (sortConfig.field && sortConfig.direction) {
      filtered.sort((a, b) => {
        let aVal: string | number, bVal: string | number;

        switch (sortConfig.field) {
          case 'code':
            aVal = a.code;
            bVal = b.code;
            break;
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'address':
            aVal = a.address || '';
            bVal = b.address || '';
            break;
          case 'store_manager':
            aVal = a.manager || '';
            bVal = b.manager || '';
            break;
          default:
            aVal = a.name;
            bVal = b.name;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [stores, searchQuery, managerFilter, sortConfig]);

  const totalItems = filteredAndSortedStores.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedStores = filteredAndSortedStores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // === Tree View ===
  const buildTree = useMemo(() => {
    // Since we don't have parent/child relationships in the current Store model,
    // we'll treat all stores as root nodes
    const roots = stores.map((store) => ({
      ...store,
      children: [],
    }));

    return roots;
  }, [stores]);

  const storeTree = buildTree;

  const toggleNode = (id: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedNodes(newSet);
  };

  const getAllExpandable = (nodes: typeof storeTree): string[] => {
    let ids: string[] = [];
    nodes.forEach((n: typeof storeTree[0]) => {
      if (n.children.length > 0) {
        ids.push(n._id);
        ids = ids.concat(getAllExpandable(n.children as typeof storeTree));
      }
    });
    return ids;
  };

  const countDescendants = (node: typeof storeTree[0]): number =>
    node.children.length + node.children.reduce((acc: number, c: typeof storeTree[0]) => acc + countDescendants(c), 0);

  const renderTreeNode = (node: typeof storeTree[0], level = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);

    return (
      <div key={node._id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 rounded-md cursor-pointer ${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''
            }`}
          onClick={() => hasChildren && toggleNode(node._id)}
        >
          <div className="flex items-center space-x-2 flex-1">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
            <div className="p-1.5 rounded bg-blue-100">
              <StoreIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{node.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{node.code}</span>
              </div>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[200px]" title={node.address || ''}>
                    {node.address || 'No address'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {node.purchaser === 'ROLE_PURCHASER' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Purchaser
                    </span>
                  )}
                  {node.biller === 'ROLE_BILLER' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Biller
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map((child: typeof storeTree[0]) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // === Sorting ===
  const handleSort = (field: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ field: direction ? field : null, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="h-4 w-4 text-blue-600" />;
    if (sortConfig.direction === 'desc') return <ArrowDown className="h-4 w-4 text-blue-600" />;
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  // === Export CSV ===
  const exportStoresToCSV = () => {
    const headers = ['Store ID', 'Store Name', 'Address', 'Role Assignment'];
    const rows = filteredAndSortedStores.map((store) => [
      `"${store.code}"`,
      `"${store.name}"`,
      `"${store.address || ''}"`,
      `"${store.purchaser === 'ROLE_PURCHASER' ? 'Purchaser' : store.biller === 'ROLE_BILLER' ? 'Biller' : 'None'}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stores-${userRole || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  // === Actions ===
  const openDeleteDialog = (store: Store) => {
    setStoreToDelete(store);
    setIsDialogOpen(true);
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;

    try {
      setIsDeleting(true);
      await storeService.deleteStore(storeToDelete._id);
      toast.success(`Store ${storeToDelete.code} deleted successfully`);
      setIsDialogOpen(false);
      setStoreToDelete(null);
      // Refresh stores list
      const userRole = getUserRole();
      const userId = getUserId();

      // Prepare params for the API call
      const params: any = {};

      // Only pass userId and userRole if the user is purchaser or biller
      if (userRole && (userRole === 'purchaser' || userRole === 'biller')) {
        params.userId = userId;
        params.userRole = userRole;
      }

      const response = await storeService.listStores(params);
      setStores(response.data || []);
    } catch (error: any) {
      console.error('Error deleting store:', error);
      const errorMessage = error?.message || 'Failed to delete store';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterReset = () => {
    setSearchQuery('');
    setStoreTypeFilter('all');
    setManagerFilter('all');
    setItemsPerPage(10);
    setCurrentPage(1);
    setSortConfig({ field: null, direction: null });
  };

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Main Table Card */}
          <Card className="min-h-[85vh] shadow-sm">
            <CardHeader className="rounded-t-lg border-b pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 shadow-sm">
                    <StoreIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Store Management</CardTitle>
                    <CardDescription className="mt-1">
                      View your store details and storage capacity
                      {userRole && userRole !== 'admin' && userRole !== 'superadmin' && (
                        <div className="mt-2 text-sm font-medium text-blue-600">
                          Showing {userRole} stores only
                        </div>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={exportStoresToCSV}
                    className="transition-colors me-2"
                    disabled={filteredAndSortedStores.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    className="transition-colors"
                    onClick={() => navigate('/dashboard/store/add')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Store
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-col items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search stores by name or ID..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full justify-between flex-wrap">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={storeTypeFilter} onValueChange={(v) => { setStoreTypeFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by store type" />
                      </SelectTrigger>
                      <SelectContent>
                        {storeTypes.map(t => (
                          <SelectItem key={t} value={t}>
                            {t === 'all' ? 'All Store Types' : t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={managerFilter} onValueChange={(v) => { setManagerFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((m: string) => (
                          <SelectItem key={m} value={m}>
                            {m === 'all' ? 'All Managers' : m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleFilterReset} className="px-3 py-2 text-sm">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg overflow-hidden border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-50 border-gray-200">
                      <TableHead className="font-semibold w-1/4">
                        <p className="h-8 flex items-center text-center gap-1 font-semibold cursor-pointer w-auto hover:text-blue-600 ps-2" onClick={() => handleSort('code')}>
                          Store ID {getSortIcon('code')}
                        </p>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <p className="h-8 flex items-center gap-1 font-semibold cursor-pointer w-auto hover:text-blue-600" onClick={() => handleSort('name')}>
                          Store Name {getSortIcon('name')}
                        </p>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <p className="h-8 flex items-center gap-1 font-semibold cursor-pointer w-auto hover:text-blue-600" onClick={() => handleSort('address')}>
                          Address {getSortIcon('address')}
                        </p>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <p className="h-8 flex items-center gap-1 font-semibold cursor-pointer w-auto hover:text-blue-600" onClick={() => handleSort('store_manager')}>
                          Role Assignment {getSortIcon('store_manager')}
                        </p>
                      </TableHead>
                      <TableHead className="text-center font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                            <p className="text-base font-medium">Loading stores...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center py-6">
                            <p className="text-base font-medium">No stores found</p>
                            <p className="text-sm text-gray-500">Try adjusting your search or filter</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStores.map((store) => {
                        // Since we're using role-based assignment, we don't need to check for parent/child relationships
                        const isDeleteDisabled = false;

                        return (
                          <TableRow key={store._id} className="hover:bg-gray-50">
                            <TableCell className="font-medium py-3"><p className='ps-2'>{store.code}</p></TableCell>
                            <TableCell className="font-medium">{store.name}</TableCell>
                            <TableCell className="min-w-[200px] whitespace-normal break-words" title={store.address || ''}>
                              {store.address || 'No address'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {store.purchaser === 'ROLE_PURCHASER' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Purchaser
                                  </span>
                                )}
                                {store.biller === 'ROLE_BILLER' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Biller
                                  </span>
                                )}
                                {!store.purchaser && !store.biller && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    None
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => navigate(`/dashboard/store/edit/${store._id}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {isDeleteDisabled ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 opacity-50" disabled>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        Cannot delete: Store is in use.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => openDeleteDialog(store)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-6 gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Show</p>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">entries</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center justify-center text-sm font-medium bg-gray-100 px-3 py-1 rounded">
                      Page {currentPage} of {totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages || 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Delete Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this store?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" onClick={() => setStoreToDelete(null)} disabled={isDeleting}>No</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDeleteStore} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </TooltipProvider>
  );
};