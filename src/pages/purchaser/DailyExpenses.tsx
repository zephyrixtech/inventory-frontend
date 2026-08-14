import { useCallback, useEffect, useState } from 'react';
import { Receipt, Trash2, Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dailyExpenseService } from '@/services/dailyExpenseService';
import { inventoryService } from '@/services/inventoryService';
import { supplierService } from '@/services/supplierService';
import toast from 'react-hot-toast';
import type { Item, Supplier, PaginationMeta } from '@/types/backend';

export const DailyExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [_items, _setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [carriedForward, setCarriedForward] = useState(0);
  const [currentMonthCredit, setCurrentMonthCredit] = useState(0);
  const [balanceDescription, setBalanceDescription] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [formState, setFormState] = useState({
    supplierId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    type: 'purchase' as 'purchase' | 'petty',
    paymentType: 'cash' as 'cash' | 'card' | 'upi'
  });

  const fetchExpenses = useCallback(async (pageArg?: number, limitArg?: number) => {
    setLoading(true);
    const targetPage = pageArg ?? pagination.page;
    const targetLimit = limitArg ?? pagination.limit;
    try {
      const response = await dailyExpenseService.list({ 
        page: targetPage,
        limit: targetLimit,
        month: selectedMonth,
        year: selectedYear
      });
      setExpenses(response.data);
      if (response.meta) {
        setPagination({
          page: response.meta.page ?? targetPage,
          limit: response.meta.limit ?? targetLimit,
          total: response.meta.total ?? response.data.length,
          totalPages: response.meta.totalPages ?? 1,
          hasNextPage: response.meta.hasNextPage ?? false,
          hasPrevPage: response.meta.hasPrevPage ?? false
        });
      }
    } catch (error) {
      console.error('Failed to load expenses', error);
      toast.error('Unable to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await inventoryService.getItems({ limit: 100 });
      _setItems(response.data);
    } catch (error) {
      console.error('Failed to load items', error);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await supplierService.listSuppliers({ limit: 100, status: 'approved' });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to load suppliers', error);
    }
  }, []);

  const loadOpeningBalance = useCallback(async () => {
    try {
      const response = await dailyExpenseService.getCurrentOpeningBalance({
        month: selectedMonth,
        year: selectedYear
      });
      const data = response.data;
      setCarriedForward(data.carriedForward ?? 0);
      setCurrentMonthCredit(data.currentMonthCredit ?? data.amount);
      setBalanceDescription(data.description);
      setTotalExpenses(data.totalExpenses ?? 0);
      setRemainingBalance(data.remainingBalance ?? 0);
    } catch (error) {
      console.error('Failed to load opening balance', error);
      setCarriedForward(0);
      setCurrentMonthCredit(0);
      setBalanceDescription('');
      setTotalExpenses(0);
      setRemainingBalance(0);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchExpenses(1, pagination.limit);
    fetchItems();
    fetchSuppliers();
    loadOpeningBalance();
  }, [selectedMonth, selectedYear]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId) || null;
    setSelectedSupplier(supplier);
    setFormState(prev => ({ ...prev, supplierId }));
  };

  const handleCreateOrUpdateExpense = async () => {
    // Validate transaction ID for card and upi payments
    if ((formState.paymentType === 'card' || formState.paymentType === 'upi') && !transactionId) {
      toast.error('Transaction ID is required for card and UPI payments');
      return;
    }

    try {
      // Prepare the expense data
      const expenseData: any = {
        description: formState.description,
        amount: Number(formState.amount),
        date: formState.date,
        type: formState.type,
        paymentType: formState.paymentType,
        transactionId: transactionId
      };

      // Only include supplierId for purchase expenses when a supplier is selected
      if (formState.type === 'purchase' && formState.supplierId) {
        expenseData.supplierId = formState.supplierId;
      }

      if (editingId) {
        await dailyExpenseService.update(editingId, expenseData);
        toast.success('Expense updated');
      } else {
        await dailyExpenseService.create(expenseData);
        toast.success('Expense recorded');
      }

      setShowDialog(false);
      resetForm();
      await fetchExpenses();
      await loadOpeningBalance(); // Refresh balance to show updated remaining balance
    } catch (error) {
      console.error('Failed to save expense', error);
      toast.error('Unable to save expense');
    }
  };

  const resetForm = () => {
    setFormState({
      supplierId: '',
      description: '',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      type: 'purchase',
      paymentType: 'cash'
    });
    setTransactionId('');
    setSelectedSupplier(null);
    setEditingId(null);
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id ?? expense._id);
    setFormState({
      supplierId: expense.supplier?.id ?? expense.supplier?._id ?? '',
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date ? new Date(expense.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
      type: expense.type,
      paymentType: expense.paymentType || 'cash'
    });
    setTransactionId(expense.transactionId || '');
    if (expense.supplier) {
      const sId = expense.supplier.id ?? expense.supplier._id;
      const supplier = suppliers.find(s => s._id === sId) || null;
      setSelectedSupplier(supplier);
    } else {
      setSelectedSupplier(null);
    }
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dailyExpenseService.delete(id);
      toast.success('Expense removed');
      await fetchExpenses();
      await loadOpeningBalance(); // Refresh balance to show updated remaining balance
    } catch (error) {
      console.error('Failed to delete expense', error);
      toast.error('Unable to delete expense');
    }
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Daily Operational Expenses
            </CardTitle>
            <CardDescription>Track loading, logistics, and ancillary costs against purchases.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2">
              <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>

              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => 2024 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Log Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opening Balance Section - Read Only */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-lg">Current Balance Overview</CardTitle>
                {balanceDescription && <CardDescription className="mt-1">{balanceDescription}</CardDescription>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Carried Forward</div>
                  <div className="text-2xl font-bold text-purple-600">₹{carriedForward.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Monthly Credit Added</div>
                  <div className="text-2xl font-bold text-blue-600">₹{currentMonthCredit.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Expenses</div>
                  <div className="text-2xl font-bold text-red-600">-₹{totalExpenses.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Remaining Balance</div>
                  <div className={`text-2xl font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{remainingBalance.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Entries</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {loading ? '...' : pagination.total || expenses.length}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Expense Amount</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                ₹{totalAmount.toFixed(2)}
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading expenses...
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No expense entries recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => {
                    const expenseId = expense.id ?? expense._id;
                    return (
                      <TableRow key={expenseId ?? `expense-${expense.date}`}>
                        <TableCell>{expense.date ? new Date(expense.date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{expense.supplier?.name ?? 'Unassigned'}</TableCell>
                        <TableCell>{expense.type ? expense.type.charAt(0).toUpperCase() + expense.type.slice(1) + ' Expense' : '-'}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>₹{expense.amount?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              expenseId ? handleDelete(expenseId) : toast.error('Missing expense identifier')
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(val) => {
                  const newLimit = Number(val);
                  fetchExpenses(1, newLimit);
                }}
              >
                <SelectTrigger className="w-[70px] h-8 text-xs">
                  <SelectValue placeholder={String(pagination.limit)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-2">
                Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchExpenses(pagination.page - 1, pagination.limit)}
                disabled={!pagination.hasPrevPage || pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-xs">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchExpenses(pagination.page + 1, pagination.limit)}
                disabled={!pagination.hasNextPage || pagination.page >= pagination.totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { resetForm(); fetchExpenses(); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Daily Expense' : 'Log Daily Expense'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formState.date}
                  onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expenseType">Type</Label>
                <select
                  id="expenseType"
                  className="border rounded-md px-3 py-2 text-sm bg-background"
                  value={formState.type}
                  onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value as 'purchase' | 'petty' }))}
                >
                  <option value="purchase">Purchase Expense</option>
                  <option value="petty">Petty Expense</option>
                </select>
              </div>
            </div>

            {formState.type === 'purchase' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <select
                    id="supplierId"
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={formState.supplierId}
                    onChange={(event) => handleSupplierChange(event.target.value)}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSupplier && (
                  <div className="grid gap-2 p-3 bg-gray-50 rounded-md">
                    <h4 className="font-medium">Supplier Financial Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bank:</span>
                        <div>{selectedSupplier.bankName || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Account:</span>
                        <div>{selectedSupplier.bank_account_number || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IFSC:</span>
                        <div>{selectedSupplier.ifscCode || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <select
                  id="paymentType"
                  className="border rounded-md px-3 py-2 text-sm bg-background"
                  value={formState.paymentType}
                  onChange={(event) => setFormState((prev) => ({ ...prev, paymentType: event.target.value as 'cash' | 'card' | 'upi' }))}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              {(formState.paymentType === 'card' || formState.paymentType === 'upi') && (
                <div className="grid gap-2">
                  <Label htmlFor="transactionId">Transaction ID *</Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                    placeholder="Enter transaction ID"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Loading charges, warehousing, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formState.amount}
                  onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateOrUpdateExpense}
              disabled={
                !formState.description ||
                !formState.amount ||
                !formState.type ||
                (formState.type === 'purchase' && !formState.supplierId) ||
                ((formState.paymentType === 'card' || formState.paymentType === 'upi') && !transactionId)
              }
            >
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
