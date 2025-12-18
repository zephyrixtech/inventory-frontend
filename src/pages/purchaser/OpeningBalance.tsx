import { useCallback, useEffect, useState } from 'react';
import { Wallet, Trash2, Plus, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { dailyExpenseService, type OpeningBalance } from '@/services/dailyExpenseService';
import toast from 'react-hot-toast';

export const OpeningBalancePage = () => {
  const [balances, setBalances] = useState<OpeningBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    amount: '',
    description: ''
  });

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dailyExpenseService.listOpeningBalances({ limit: 100 });
      setBalances(response.data);
    } catch (error) {
      console.error('Failed to load opening balances', error);
      toast.error('Unable to load opening balances');
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleCreateOrUpdate = async () => {
    const amount = parseFloat(formState.amount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      if (editingId) {
        await dailyExpenseService.updateOpeningBalance(editingId, {
          amount,
          description: formState.description
        });
        toast.success('Opening balance updated');
      } else {
        await dailyExpenseService.createOpeningBalance({
          amount,
          description: formState.description
        });
        toast.success('Opening balance created');
      }

      setShowDialog(false);
      resetForm();
      fetchBalances();
    } catch (error) {
      console.error('Failed to save opening balance', error);
      toast.error('Unable to save opening balance');
    }
  };

  const resetForm = () => {
    setFormState({
      amount: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleEdit = (balance: OpeningBalance) => {
    setEditingId(balance._id || '');
    setFormState({
      amount: String(balance.amount),
      description: balance.description
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opening balance?')) {
      return;
    }

    try {
      await dailyExpenseService.deleteOpeningBalance(id);
      toast.success('Opening balance deleted');
      fetchBalances();
    } catch (error) {
      console.error('Failed to delete opening balance', error);
      toast.error('Unable to delete opening balance');
    }
  };

  const totalOpeningBalance = balances.reduce((sum, balance) => sum + (balance.amount ?? 0), 0);
  const latestBalance = balances.length > 0 ? balances[0] : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Credit Management
            </CardTitle>
            <CardDescription>Manage opening balances for daily expense tracking.</CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Credit Balance
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Opening Balance</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-blue-600">
                ₹{totalOpeningBalance.toFixed(2)}
              </CardContent>
            </Card>
            {latestBalance && (
              <>
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-semibold text-red-600">
                    ₹{latestBalance.totalExpenses.toFixed(2)}
                  </CardContent>
                </Card>
                <Card className={latestBalance.remainingBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Remaining Balance</CardTitle>
                  </CardHeader>
                  <CardContent className={`text-3xl font-semibold ${latestBalance.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{latestBalance.remainingBalance.toFixed(2)}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Total Expenses</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading opening balances...
                    </TableCell>
                  </TableRow>
                ) : balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No opening balance records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  balances.map((balance) => {
                    const balanceId = balance._id;
                    const createdByName = balance.createdBy
                      ? `${balance.createdBy.firstName || ''} ${balance.createdBy.lastName || ''}`.trim() || 'Unknown'
                      : 'Unknown';

                    return (
                      <TableRow key={balanceId ?? `balance-${balance.date}`}>
                        <TableCell>{balance.date ? new Date(balance.date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{balance.description || '-'}</TableCell>
                        <TableCell className="font-semibold text-blue-600">₹{balance.amount?.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">₹{balance.totalExpenses?.toFixed(2)}</TableCell>
                        <TableCell className={balance.remainingBalance >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          ₹{balance.remainingBalance?.toFixed(2)}
                        </TableCell>
                        <TableCell>{createdByName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(balance)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => (balanceId ? handleDelete(balanceId) : toast.error('Missing balance identifier'))}
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Opening Balance' : 'Add Opening Balance'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.01}
                value={formState.amount}
                onChange={(e) => setFormState((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter opening balance amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Daily cash allocation, Monthly budget"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdate} disabled={!formState.amount}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
