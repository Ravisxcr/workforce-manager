import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, DollarSign, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatCard } from '@/components/common/stat-card'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
  listAllSalarySlips, createSalarySlip, deleteSalarySlip,
  getSalaryHistory, createSalaryHistory, deleteSalaryHistory, getSalaryAnalytics,
  getMySalaryHistory,
  getMySalarySlips,
} from '@/api/salary'
import { listEmployees } from '@/api/employee'
import type { SalarySlipOut, SalarySlipCreate, SalaryHistoryOut, SalaryHistoryCreate } from '@/types'
import { useAuth } from '@/context/auth-context'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function SalaryPage() {
  const now = new Date()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const queryClient = useQueryClient()

  const [slipDialog, setSlipDialog] = useState(false)
  const [slipForm, setSlipForm] = useState<SalarySlipCreate>({
    user_id: '', month: '', year: now.getFullYear(),
    basic: 0, hra: 0, allowances: 0, deductions: 0, net_pay: 0,
    date_generated: format(now, 'yyyy-MM-dd'),
  })

  const [historyDialog, setHistoryDialog] = useState(false)
  const [historyForm, setHistoryForm] = useState<SalaryHistoryCreate>({
    user_id: '', amount: 0, date: format(now, "yyyy-MM-dd'T'HH:mm"), remarks: '',
  })

  const [deleteSlip, setDeleteSlip] = useState<SalarySlipOut | null>(null)
  const [deleteHistory, setDeleteHistoryTarget] = useState<SalaryHistoryOut | null>(null)

  const {
    data: mySlips = [],
    isLoading: mySlipsLoading,
    isError: mySlipsError,
  } = useQuery({
    queryKey: ['salary', 'slips', 'my'],
    queryFn: getMySalarySlips,
  })

  const {
    data: myHistory = [],
    isLoading: myHistoryLoading,
    isError: myHistoryError,
  } = useQuery({
    queryKey: ['salary', 'history', 'my'],
    queryFn: getMySalaryHistory,
  })

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => listEmployees(),
    enabled: isAdmin,
  })

  const {
    data: slips = [],
    isLoading: slipsLoading,
    isError: slipsError,
  } = useQuery({
    queryKey: ['salary', 'slips', 'all'],
    queryFn: () => listAllSalarySlips(),
    enabled: isAdmin,
  })

  const {
    data: history = [],
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ['salary', 'history', 'all'],
    queryFn: getSalaryHistory,
    enabled: isAdmin,
  })

  const {
    data: analytics = null,
    isLoading: analyticsLoading,
    isError: analyticsError,
  } = useQuery({
    queryKey: ['salary', 'analytics'],
    queryFn: getSalaryAnalytics,
    enabled: isAdmin,
  })

  const createSalarySlipMutation = useMutation({
    mutationFn: createSalarySlip,
    onSuccess: () => {
      toast.success('Salary slip created')
      setSlipDialog(false)
      queryClient.invalidateQueries({ queryKey: ['salary'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to create slip')
    },
  })

  const createSalaryHistoryMutation = useMutation({
    mutationFn: createSalaryHistory,
    onSuccess: () => {
      toast.success('Salary history added')
      setHistoryDialog(false)
      queryClient.invalidateQueries({ queryKey: ['salary'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to add history')
    },
  })

  const deleteSalarySlipMutation = useMutation({
    mutationFn: deleteSalarySlip,
    onSuccess: () => {
      setDeleteSlip(null)
      queryClient.invalidateQueries({ queryKey: ['salary'] })
    },
    onError: () => {
      toast.error('Failed to delete salary slip')
    },
  })

  const deleteSalaryHistoryMutation = useMutation({
    mutationFn: deleteSalaryHistory,
    onSuccess: () => {
      setDeleteHistoryTarget(null)
      queryClient.invalidateQueries({ queryKey: ['salary'] })
    },
    onError: () => {
      toast.error('Failed to delete salary history')
    },
  })

  const loading =
    mySlipsLoading ||
    myHistoryLoading ||
    (isAdmin && (employeesLoading || slipsLoading || historyLoading || analyticsLoading))
  const saving = createSalarySlipMutation.isPending || createSalaryHistoryMutation.isPending

  useEffect(() => {
    if (
      mySlipsError ||
      myHistoryError ||
      (isAdmin && (employeesError || slipsError || historyError || analyticsError))
    ) {
      toast.error('Failed to load salary data')
    }
  }, [
    analyticsError,
    employeesError,
    historyError,
    isAdmin,
    myHistoryError,
    mySlipsError,
    slipsError,
  ])

  const empName = (id: string) => employees.find((e) => e.id === id)?.full_name ?? id.slice(0, 8)

  const saveSlip = () => {
    createSalarySlipMutation.mutate(slipForm)
  }

  const saveHistory = () => {
    createSalaryHistoryMutation.mutate(historyForm)
  }

  const handleDeleteSlip = () => {
    if (!deleteSlip) return
    deleteSalarySlipMutation.mutate(deleteSlip.id)
  }

  const handleDeleteHistory = () => {
    if (!deleteHistory) return
    deleteSalaryHistoryMutation.mutate(deleteHistory.id)
  }

  const slipColumns: Column<SalarySlipOut>[] = [
    { key: 'employee', header: 'Employee', cell: (s) => <span className="font-medium">{empName(s.user_id)}</span> },
    { key: 'period', header: 'Period', cell: (s) => <span>{s.month} {s.year}</span> },
    { key: 'basic', header: 'Basic', cell: (s) => `₹${s.basic.toLocaleString()}` },
    { key: 'hra', header: 'HRA', cell: (s) => `₹${s.hra.toLocaleString()}` },
    { key: 'allowances', header: 'Allowances', cell: (s) => `₹${s.allowances.toLocaleString()}` },
    { key: 'deductions', header: 'Deductions', cell: (s) => <span className="text-red-600">-₹{s.deductions.toLocaleString()}</span> },
    { key: 'net', header: 'Net Pay', cell: (s) => <span className="font-semibold text-green-700 dark:text-green-400">₹{s.net_pay.toLocaleString()}</span> },
    {
      key: 'actions', header: '', className: 'w-12',
      cell: (s) => (
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteSlip(s)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  const historyColumns: Column<SalaryHistoryOut>[] = [
    { key: 'employee', header: 'Employee', cell: (h) => <span className="font-medium">{empName(h.user_id)}</span> },
    { key: 'amount', header: 'Amount', cell: (h) => <span className="font-semibold">₹{h.amount.toLocaleString()}</span> },
    { key: 'date', header: 'Effective Date', cell: (h) => format(new Date(h.date), 'MMM d, yyyy') },
    { key: 'remarks', header: 'Remarks', cell: (h) => <span className="text-sm text-muted-foreground">{h.remarks ?? '—'}</span> },
    {
      key: 'actions', header: '', className: 'w-12',
      cell: (h) => (
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteHistoryTarget(h)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Salary" description="Manage salary slips and history" />

      {isAdmin && analytics && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <StatCard title="Total Employees" value={analytics.total_employees} icon={Users} />
          <StatCard title="Average Salary" value={`₹${analytics.avg_salary.toLocaleString()}`} icon={DollarSign} />
          <StatCard title="Salary Slips" value={slips.length} icon={TrendingUp} />
        </div>
      )}

      <Tabs defaultValue="slips">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="slips">Salary Slips</TabsTrigger>
            <TabsTrigger value="history">Salary History</TabsTrigger>
            {isAdmin && (
            <>
              <TabsTrigger value="tSlips">Team Slips</TabsTrigger>
              <TabsTrigger value="tHistory">Team History</TabsTrigger>
            </>
            )}
          </TabsList>

          {isAdmin && (  
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setHistoryForm({ user_id: '', amount: 0, date: format(now, "yyyy-MM-dd'T'HH:mm"), remarks: '' }); setHistoryDialog(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Add History
            </Button>
            <Button size="sm" onClick={() => { setSlipForm({ user_id: '', month: '', year: now.getFullYear(), basic: 0, hra: 0, allowances: 0, deductions: 0, net_pay: 0, date_generated: format(now, 'yyyy-MM-dd') }); setSlipDialog(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Slip
            </Button>
          </div>
          )}
        </div>

        <TabsContent value="slips">
          <DataTable columns={slipColumns} data={mySlips} isLoading={loading} rowKey={(s) => s.id} />
        </TabsContent>

        <TabsContent value="history">
          <DataTable columns={historyColumns} data={myHistory} isLoading={loading} rowKey={(h) => h.id} />
        </TabsContent>

        {isAdmin && (
        <>
          <TabsContent value="tSlips">
            <DataTable columns={slipColumns} data={slips} isLoading={loading} rowKey={(s) => s.id} />
          </TabsContent>

          <TabsContent value="tHistory">
            <DataTable columns={historyColumns} data={history} isLoading={loading} rowKey={(h) => h.id} />
          </TabsContent>
        </>
        )}
      </Tabs>

      {/* Salary Slip Dialog */}
      <Dialog open={slipDialog} onOpenChange={setSlipDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Salary Slip</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label>Employee *</Label>
              <Select value={slipForm.user_id} onValueChange={(v) => setSlipForm({ ...slipForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={slipForm.month} onValueChange={(v) => setSlipForm({ ...slipForm, month: v })}>
                <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" value={slipForm.year} onChange={(e) => setSlipForm({ ...slipForm, year: Number(e.target.value) })} />
            </div>
            {(['basic', 'hra', 'allowances', 'deductions', 'net_pay'] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label className="capitalize">{field.replace('_', ' ')}</Label>
                <Input type="number" value={slipForm[field]} onChange={(e) => setSlipForm({ ...slipForm, [field]: Number(e.target.value) })} />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Date Generated</Label>
              <Input type="date" value={slipForm.date_generated} onChange={(e) => setSlipForm({ ...slipForm, date_generated: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlipDialog(false)}>Cancel</Button>
            <Button onClick={saveSlip} disabled={saving}>{saving ? 'Creating...' : 'Create Slip'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Salary History</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={historyForm.user_id} onValueChange={(v) => setHistoryForm({ ...historyForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" value={historyForm.amount} onChange={(e) => setHistoryForm({ ...historyForm, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Input type="datetime-local" value={historyForm.date} onChange={(e) => setHistoryForm({ ...historyForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={historyForm.remarks ?? ''} onChange={(e) => setHistoryForm({ ...historyForm, remarks: e.target.value })} rows={2} placeholder="e.g. Annual increment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialog(false)}>Cancel</Button>
            <Button onClick={saveHistory} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteSlip}
        onOpenChange={(o) => !o && setDeleteSlip(null)}
        title="Delete Salary Slip"
        description="Are you sure you want to delete this salary slip?"
        confirmLabel="Delete"
        onConfirm={handleDeleteSlip}
        destructive
      />
      <ConfirmDialog
        open={!!deleteHistory}
        onOpenChange={(o) => !o && setDeleteHistoryTarget(null)}
        title="Delete Salary History"
        description="Are you sure you want to delete this record?"
        confirmLabel="Delete"
        onConfirm={handleDeleteHistory}
        destructive
      />
    </div>
  )
}
