import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Check, X, Trash2, Receipt, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatusBadge } from '@/components/common/status-badge'
import { StatCard } from '@/components/common/stat-card'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  getMyReimbursements, getAllReimbursements, getReimbursementAnalytics,
  createReimbursement, deleteReimbursement, approveReimbursement,
} from '@/api/reimbursement'
import type { ReimbursementOut, ReimbursementAnalytics } from '@/types'
import { useAuth } from '@/context/auth-context'

const REIMB_TYPES = ['travel', 'food', 'accommodation', 'medical', 'equipment', 'training', 'other']

export default function ReimbursementsPage() {
  const { isAdmin } = useAuth()
  const [myReimb, setMyReimb] = useState<ReimbursementOut[]>([])
  const [allReimb, setAllReimb] = useState<ReimbursementOut[]>([])
  const [analytics, setAnalytics] = useState<ReimbursementAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', date: '', type: '' })
  const [receipt, setReceipt] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ReimbursementOut | null>(null)
  const [approveTarget, setApproveTarget] = useState<{ r: ReimbursementOut; action: 'approved' | 'rejected' } | null>(null)
  const [approveRemarks, setApproveRemarks] = useState('')
  const [approveDialog, setApproveDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [my, all, analyt] = await Promise.all([
        getMyReimbursements(),
        isAdmin ? getAllReimbursements() : Promise.resolve([]),
        isAdmin ? getReimbursementAnalytics() : Promise.resolve(null),
      ])
      setMyReimb(my)
      setAllReimb(all)
      setAnalytics(analyt)
    } catch {
      toast.error('Failed to load reimbursements')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async () => {
    if (!receipt) { toast.error('Please attach a receipt'); return }
    setSaving(true)
    try {
      await createReimbursement({ amount: form.amount, description: form.description, date: form.date, type: form.type }, receipt)
      toast.success('Reimbursement submitted')
      setDialogOpen(false)
      setForm({ amount: '', description: '', date: '', type: '' })
      setReceipt(null)
      fetchAll()
    } catch (err: unknown) {
      toast.error((err as { detail?: string })?.detail ?? 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteReimbursement(deleteTarget.id)
      toast.success('Deleted successfully')
      setDeleteTarget(null)
      fetchAll()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      await approveReimbursement(approveTarget.r.id, {
        status: approveTarget.action,
        remarks: approveRemarks || undefined,
        date_approved: approveTarget.action === 'approved' ? format(new Date(), 'yyyy-MM-dd') : undefined,
      })
      toast.success(`Reimbursement ${approveTarget.action}`)
      setApproveTarget(null)
      setApproveRemarks('')
      setApproveDialog(false)
      fetchAll()
    } catch {
      toast.error('Action failed')
    }
  }

  const filteredAll = statusFilter === 'all' ? allReimb : allReimb.filter((r) => r.status === statusFilter)

  const myColumns: Column<ReimbursementOut>[] = [
    { key: 'type', header: 'Type', cell: (r) => <span className="font-medium capitalize">{r.type}</span> },
    { key: 'amount', header: 'Amount', cell: (r) => <span className="font-semibold">₹{Number(r.amount).toLocaleString()}</span> },
    { key: 'date', header: 'Date', cell: (r) => format(new Date(r.date), 'MMM d, yyyy') },
    { key: 'desc', header: 'Description', cell: (r) => <span className="text-sm text-muted-foreground truncate max-w-48 block">{r.description ?? '—'}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', className: 'w-12',
      cell: (r) => r.status === 'pending' ? (
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null,
    },
  ]

  const allColumns: Column<ReimbursementOut>[] = [
    { key: 'type', header: 'Type', cell: (r) => <span className="font-medium capitalize">{r.type}</span> },
    { key: 'amount', header: 'Amount', cell: (r) => <span className="font-semibold">₹{Number(r.amount).toLocaleString()}</span> },
    { key: 'date', header: 'Date', cell: (r) => format(new Date(r.date), 'MMM d, yyyy') },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: 'Actions', className: 'w-24',
      cell: (r) => r.status === 'pending' ? (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => { setApproveTarget({ r, action: 'approved' }); setApproveRemarks(''); setApproveDialog(true) }}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setApproveTarget({ r, action: 'rejected' }); setApproveRemarks(''); setApproveDialog(true) }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null,
    },
  ]

  return (
    <div>
      <PageHeader title="Reimbursements" description="Submit and manage expense claims">
        <Button onClick={() => { setForm({ amount: '', description: '', date: '', type: '' }); setReceipt(null); setDialogOpen(true) }} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Submit Claim
        </Button>
      </PageHeader>

      {isAdmin && analytics && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatCard title="Total Claims" value={analytics.total_claims} icon={Receipt} />
          <StatCard title="Approved" value={analytics.total_approved} icon={Check} />
          <StatCard title="Pending" value={analytics.total_pending} icon={Upload} />
          <StatCard title="Total Amount" value={`₹${Number(analytics.total_amount).toLocaleString()}`} icon={Receipt} />
        </div>
      )}

      <Tabs defaultValue="my">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="my">My Claims</TabsTrigger>
            {isAdmin && <TabsTrigger value="all">All Claims</TabsTrigger>}
          </TabsList>
          {isAdmin && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="my">
          <DataTable columns={myColumns} data={myReimb} isLoading={loading} rowKey={(r) => r.id} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="all">
            <DataTable columns={allColumns} data={filteredAll} isLoading={loading} rowKey={(r) => r.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Submit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Reimbursement Claim</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1500" />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {REIMB_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the expense..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Receipt *</Label>
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} className="flex-1" />
                {receipt && <Badge variant="outline" className="shrink-0 text-xs">{receipt.name.slice(0, 20)}…</Badge>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Submitting...' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={approveDialog} onOpenChange={(o) => { setApproveDialog(o); if (!o) setApproveTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{approveTarget?.action} Reimbursement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Amount: <strong>₹{Number(approveTarget?.r.amount ?? 0).toLocaleString()}</strong> | Type: <strong className="capitalize">{approveTarget?.r.type}</strong>
            </p>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={approveRemarks} onChange={(e) => setApproveRemarks(e.target.value)} rows={2} placeholder="Optional remarks..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveDialog(false); setApproveTarget(null) }}>Cancel</Button>
            <Button
              onClick={handleApprove}
              className={approveTarget?.action === 'rejected' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {approveTarget?.action === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Claim"
        description="Are you sure you want to delete this reimbursement claim?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
