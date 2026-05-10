import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Building2, Briefcase } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listDesignations, createDesignation, updateDesignation, deleteDesignation,
} from '@/api/department'
import { getManagers } from '@/api/employee'
import type { DepartmentOut, DepartmentCreate, DesignationOut, DesignationCreate } from '@/types'

export default function DepartmentsPage() {
  const queryClient = useQueryClient()

  const [deptDialog, setDeptDialog] = useState(false)
  const [editDept, setEditDept] = useState<DepartmentOut | null>(null)
  const [deptForm, setDeptForm] = useState<DepartmentCreate>({ name: '', description: '', head_id: '' })

  const [desigDialog, setDesigDialog] = useState(false)
  const [editDesig, setEditDesig] = useState<DesignationOut | null>(null)
  const [desigForm, setDesigForm] = useState<DesignationCreate>({ name: '', department_id: '', level: undefined })

  const [deleteDeptTarget, setDeleteDeptTarget] = useState<DepartmentOut | null>(null)
  const [deleteDesigTarget, setDeleteDesigTarget] = useState<DesignationOut | null>(null)

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  })

  const {
    data: designations = [],
    isLoading: designationsLoading,
    isError: designationsError,
  } = useQuery({
    queryKey: ['designations'],
    queryFn: () => listDesignations(),
  })

  const {
    data: managers = [],
    isLoading: managersLoading,
    isError: managersError,
  } = useQuery({
    queryKey: ['employees', 'managers'],
    queryFn: getManagers,
  })

  const saveDepartmentMutation = useMutation({
    mutationFn: (payload: DepartmentCreate) =>
      editDept ? updateDepartment(editDept.id, payload) : createDepartment(payload),
    onSuccess: () => {
      toast.success(editDept ? 'Department updated' : 'Department created')
      setDeptDialog(false)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to save')
    },
  })

  const deleteDepartmentMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      toast.success('Department deleted')
      setDeleteDeptTarget(null)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['designations'] })
    },
    onError: () => {
      toast.error('Failed to delete department')
    },
  })

  const saveDesignationMutation = useMutation({
    mutationFn: (payload: DesignationCreate) =>
      editDesig ? updateDesignation(editDesig.id, payload) : createDesignation(payload),
    onSuccess: () => {
      toast.success(editDesig ? 'Designation updated' : 'Designation created')
      setDesigDialog(false)
      queryClient.invalidateQueries({ queryKey: ['designations'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to save')
    },
  })

  const deleteDesignationMutation = useMutation({
    mutationFn: deleteDesignation,
    onSuccess: () => {
      toast.success('Designation deleted')
      setDeleteDesigTarget(null)
      queryClient.invalidateQueries({ queryKey: ['designations'] })
    },
    onError: () => {
      toast.error('Failed to delete designation')
    },
  })

  const loading = departmentsLoading || designationsLoading || managersLoading
  const saving = saveDepartmentMutation.isPending || saveDesignationMutation.isPending

  useEffect(() => {
    if (departmentsError || designationsError || managersError) {
      toast.error('Failed to load data')
    }
  }, [departmentsError, designationsError, managersError])

  const openCreateDept = () => {
    setEditDept(null)
    setDeptForm({ name: '', description: '', head_id: '' })
    setDeptDialog(true)
  }

  const openEditDept = (d: DepartmentOut) => {
    setEditDept(d)
    setDeptForm({ name: d.name, description: d.description ?? '', head_id: d.head_id ?? '' })
    setDeptDialog(true)
  }

  const saveDept = () => {
    const payload = {
      ...deptForm,
      head_id: deptForm.head_id || undefined,
      description: deptForm.description || undefined,
    }
    saveDepartmentMutation.mutate(payload)
  }

  const handleDeleteDept = () => {
    if (!deleteDeptTarget) return
    deleteDepartmentMutation.mutate(deleteDeptTarget.id)
  }

  const openCreateDesig = () => {
    setEditDesig(null)
    setDesigForm({ name: '', department_id: '', level: undefined })
    setDesigDialog(true)
  }

  const openEditDesig = (d: DesignationOut) => {
    setEditDesig(d)
    setDesigForm({ name: d.name, department_id: d.department_id ?? '', level: d.level })
    setDesigDialog(true)
  }

  const saveDesig = () => {
    const payload = {
      name: desigForm.name,
      department_id: desigForm.department_id || undefined,
      level: desigForm.level,
    }
    saveDesignationMutation.mutate(payload)
  }

  const handleDeleteDesig = () => {
    if (!deleteDesigTarget) return
    deleteDesignationMutation.mutate(deleteDesigTarget.id)
  }

  const deptColumns: Column<DepartmentOut>[] = [
    {
      key: 'name', header: 'Department',
      cell: (d) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{d.name}</span>
        </div>
      ),
    },
    { key: 'description', header: 'Description', cell: (d) => <span className="text-sm text-muted-foreground">{d.description ?? '—'}</span> },
    {
      key: 'head', header: 'Head',
      cell: (d) => {
        const head = managers.find((m) => m.id === d.head_id)
        return <span className="text-sm">{head?.full_name ?? '—'}</span>
      },
    },
    {
      key: 'designations', header: 'Designations',
      cell: (d) => <Badge variant="secondary">{designations.filter((ds) => ds.department_id === d.id).length}</Badge>,
    },
    {
      key: 'actions', header: '', className: 'w-20',
      cell: (d) => (
        <div className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDept(d)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDeptTarget(d)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const desigColumns: Column<DesignationOut>[] = [
    {
      key: 'name', header: 'Designation',
      cell: (d) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{d.name}</span>
        </div>
      ),
    },
    {
      key: 'department', header: 'Department',
      cell: (d) => {
        const dept = departments.find((dep) => dep.id === d.department_id)
        return <span className="text-sm">{dept?.name ?? '—'}</span>
      },
    },
    { key: 'level', header: 'Level', cell: (d) => d.level ? <Badge variant="outline">L{d.level}</Badge> : '—' },
    {
      key: 'actions', header: '', className: 'w-20',
      cell: (d) => (
        <div className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDesig(d)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDesigTarget(d)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Departments" description="Manage departments and designations" />

      <Tabs defaultValue="departments">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="designations">Designations</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="departments">
          <div className="flex justify-end mb-4">
            <Button onClick={openCreateDept} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </div>
          {!loading && departments.length === 0 ? (
            <EmptyState icon={Building2} title="No departments" description="Create your first department.">
              <Button onClick={openCreateDept} size="sm"><Plus className="mr-2 h-4 w-4" />Add Department</Button>
            </EmptyState>
          ) : (
            <DataTable columns={deptColumns} data={departments} isLoading={loading} rowKey={(d) => d.id} />
          )}
        </TabsContent>

        <TabsContent value="designations">
          <div className="flex justify-end mb-4">
            <Button onClick={openCreateDesig} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Designation
            </Button>
          </div>
          {!loading && designations.length === 0 ? (
            <EmptyState icon={Briefcase} title="No designations" description="Create your first designation.">
              <Button onClick={openCreateDesig} size="sm"><Plus className="mr-2 h-4 w-4" />Add Designation</Button>
            </EmptyState>
          ) : (
            <DataTable columns={desigColumns} data={designations} isLoading={loading} rowKey={(d) => d.id} />
          )}
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editDept ? 'Edit Department' : 'Add Department'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Engineering" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={deptForm.description ?? ''} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} rows={2} placeholder="Department description..." />
            </div>
            <div className="space-y-2">
              <Label>Head</Label>
              <Select value={deptForm.head_id || 'none'} onValueChange={(v) => setDeptForm({ ...deptForm, head_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Select head" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialog(false)}>Cancel</Button>
            <Button onClick={saveDept} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={desigDialog} onOpenChange={setDesigDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editDesig ? 'Edit Designation' : 'Add Designation'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={desigForm.name} onChange={(e) => setDesigForm({ ...desigForm, name: e.target.value })} placeholder="Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={desigForm.department_id || 'none'} onValueChange={(v) => setDesigForm({ ...desigForm, department_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input
                type="number"
                value={desigForm.level ?? ''}
                onChange={(e) => setDesigForm({ ...desigForm, level: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g. 1"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesigDialog(false)}>Cancel</Button>
            <Button onClick={saveDesig} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteDeptTarget}
        onOpenChange={(o) => !o && setDeleteDeptTarget(null)}
        title="Delete Department"
        description={`Delete "${deleteDeptTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteDept}
        destructive
      />
      <ConfirmDialog
        open={!!deleteDesigTarget}
        onOpenChange={(o) => !o && setDeleteDesigTarget(null)}
        title="Delete Designation"
        description={`Delete "${deleteDesigTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteDesig}
        destructive
      />
    </div>
  )
}
