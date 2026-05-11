import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, DollarSign, TrendingUp, Users, Eye, Download } from 'lucide-react'
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
  const [viewSlip, setViewSlip] = useState<SalarySlipOut | null>(null)

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

  const empName = (id: string) => employees.find((e) => e.user_id === id)?.full_name ?? id.slice(0, 8)
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const downloadSalarySlip = (slip: SalarySlipOut) => {
    const employeeName = empName(slip.user_id)
    const grossPay = slip.basic + slip.hra + slip.allowances
    const fileName = `salary-slip-${employeeName.replace(/\s+/g, '-').toLowerCase()}-${slip.month}-${slip.year}.html`
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Salary Slip - ${escapeHtml(employeeName)} - ${escapeHtml(slip.month)} ${slip.year}</title>
  <style>
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, sans-serif; }
    .page { max-width: 820px; margin: 32px auto; background: #fff; border: 1px solid #e5e7eb; padding: 40px; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 20px; }
    .eyebrow { color: #6b7280; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 6px 0 0; font-size: 28px; }
    .meta { text-align: right; color: #374151; font-size: 14px; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin: 28px 0; }
    .box { border: 1px solid #e5e7eb; padding: 14px; }
    .label { color: #6b7280; font-size: 12px; margin-bottom: 6px; }
    .value { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
    th { background: #f9fafb; font-size: 12px; color: #6b7280; text-transform: uppercase; }
    td.amount { text-align: right; font-weight: 700; }
    .deduction { color: #dc2626; }
    .total { margin-top: 24px; display: flex; justify-content: flex-end; }
    .total-card { min-width: 300px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; }
    .net { color: #15803d; font-size: 28px; font-weight: 800; margin-top: 6px; }
    .footer { margin-top: 34px; color: #6b7280; font-size: 12px; text-align: center; }
    @media print { body { background: #fff; } .page { margin: 0; border: 0; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="header">
      <div>
        <div class="eyebrow">Salary Slip</div>
        <h1>${escapeHtml(slip.month)} ${slip.year}</h1>
      </div>
      <div class="meta">
        <div><strong>Generated:</strong> ${escapeHtml(format(new Date(slip.date_generated), 'MMM d, yyyy'))}</div>
        <div><strong>Slip ID:</strong> ${escapeHtml(slip.id)}</div>
      </div>
    </section>
    <section class="grid">
      <div class="box"><div class="label">Employee</div><div class="value">${escapeHtml(employeeName)}</div></div>
      <div class="box"><div class="label">Employee ID</div><div class="value">${escapeHtml(slip.user_id)}</div></div>
      <div class="box"><div class="label">Pay Period</div><div class="value">${escapeHtml(slip.month)} ${slip.year}</div></div>
      <div class="box"><div class="label">Gross Pay</div><div class="value">${formatCurrency(grossPay)}</div></div>
    </section>
    <table>
      <thead><tr><th>Component</th><th>Type</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Basic Salary</td><td>Earning</td><td class="amount">${formatCurrency(slip.basic)}</td></tr>
        <tr><td>House Rent Allowance</td><td>Earning</td><td class="amount">${formatCurrency(slip.hra)}</td></tr>
        <tr><td>Allowances</td><td>Earning</td><td class="amount">${formatCurrency(slip.allowances)}</td></tr>
        <tr><td>Deductions</td><td>Deduction</td><td class="amount deduction">-${formatCurrency(slip.deductions)}</td></tr>
      </tbody>
    </table>
    <section class="total">
      <div class="total-card">
        <div class="label">Net Pay</div>
        <div class="net">${formatCurrency(slip.net_pay)}</div>
      </div>
    </section>
    <div class="footer">This is a system-generated salary slip.</div>
  </main>
</body>
</html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

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
      key: 'actions', header: '', className: isAdmin ? 'w-28' : 'w-20',
      cell: (s) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" title="View salary slip" onClick={() => setViewSlip(s)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Download salary slip" onClick={() => downloadSalarySlip(s)}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete salary slip" onClick={() => setDeleteSlip(s)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const historyColumns: Column<SalaryHistoryOut>[] = [
    { key: 'employee', header: 'Employee', cell: (h) => <span className="font-medium">{empName(h.user_id)}</span> },
    { key: 'amount', header: 'Amount', cell: (h) => <span className="font-semibold">₹{h.amount.toLocaleString()}</span> },
    { key: 'date', header: 'Effective Date', cell: (h) => format(new Date(h.date), 'MMM d, yyyy') },
    { key: 'remarks', header: 'Remarks', cell: (h) => <span className="text-sm text-muted-foreground">{h.remarks ?? '—'}</span> },
    ...(isAdmin
      ? [{
          key: 'actions',
          header: '',
          className: 'w-12',
          cell: (h: SalaryHistoryOut) => (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteHistoryTarget(h)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ),
        }]
      : []),
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
                  {employees.map((e) => <SelectItem key={e.id} value={e.user_id}>{e.full_name}</SelectItem>)}
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
                  {employees.map((e) => <SelectItem key={e.id} value={e.user_id}>{e.full_name}</SelectItem>)}
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

      {/* Salary Slip Preview */}
      <Dialog open={!!viewSlip} onOpenChange={(o) => !o && setViewSlip(null)}>
        <DialogContent className="max-w-3xl">
          {viewSlip && (
            <>
              <DialogHeader>
                <DialogTitle>Salary Slip</DialogTitle>
              </DialogHeader>
              <div className="overflow-hidden rounded-md border bg-background">
                <div className="border-b bg-muted/40 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pay statement</p>
                      <h2 className="mt-1 text-2xl font-semibold">{viewSlip.month} {viewSlip.year}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{empName(viewSlip.user_id)}</p>
                    </div>
                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p><span className="font-medium text-foreground">Generated:</span> {format(new Date(viewSlip.date_generated), 'MMM d, yyyy')}</p>
                      <p><span className="font-medium text-foreground">Slip ID:</span> {viewSlip.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Gross Pay</p>
                    <p className="mt-1 font-semibold">{formatCurrency(viewSlip.basic + viewSlip.hra + viewSlip.allowances)}</p>
                  </div>
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
                    <p className="text-xs text-green-700 dark:text-green-400">Net Pay</p>
                    <p className="mt-1 text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(viewSlip.net_pay)}</p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="overflow-hidden rounded-md border">
                    <div className="grid grid-cols-3 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      <span>Component</span>
                      <span>Type</span>
                      <span className="text-right">Amount</span>
                    </div>
                    {[
                      ['Basic Salary', 'Earning', viewSlip.basic],
                      ['House Rent Allowance', 'Earning', viewSlip.hra],
                      ['Allowances', 'Earning', viewSlip.allowances],
                    ].map(([label, type, amount]) => (
                      <div key={label} className="grid grid-cols-3 border-t px-4 py-3 text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">{type}</span>
                        <span className="text-right font-medium">{formatCurrency(Number(amount))}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 border-t px-4 py-3 text-sm">
                      <span className="font-medium">Deductions</span>
                      <span className="text-muted-foreground">Deduction</span>
                      <span className="text-right font-medium text-red-600">-{formatCurrency(viewSlip.deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewSlip(null)}>Close</Button>
                <Button onClick={() => downloadSalarySlip(viewSlip)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DialogFooter>
            </>
          )}
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
