import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, UserCheck, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  listEmployees, createEmployee, updateEmployee, deleteEmployee,
  updateEmployeeStatus, getManagers, changeEmployeeRole,
} from '@/api/employee'
import { addUser } from '@/api/auth'
import { listDepartments } from '@/api/department'
import type { EmployeeOut, EmployeeCreate, DepartmentOut, EmployeeRole } from '@/types'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const EMPTY_FORM: EmployeeCreate = {
  full_name: '', email: '', phone: '', address: '',
  designation: '', department: '', dob: '', gender: '',
  date_joined: '', salary: '', manager_id: '',
}

const EMPLOYEE_ROLES: { value: EmployeeRole, label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
]

type EmployeeFormState = EmployeeCreate & { password?: string }

export default function EmployeesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EmployeeOut | null>(null)
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM)

  const [deleteTarget, setDeleteTarget] = useState<EmployeeOut | null>(null)

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => listEmployees(),
  })

  const {
    data: managers = [],
    isLoading: managersLoading,
    isError: managersError,
  } = useQuery({
    queryKey: ['employees', 'managers'],
    queryFn: getManagers,
  })

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  })

  const saveEmployeeMutation = useMutation({
    mutationFn: async (payload: EmployeeFormState) => {
      const { password, ...employee } = payload
      if (editTarget) return updateEmployee(editTarget.id, employee)

      if (password) {
        const user = await addUser({
          full_name: employee.full_name,
          email: employee.email,
          password,
          role: 'employee',
        })
        return createEmployee({ ...employee, user_id: user.id })
      }

      return createEmployee(employee)
    },
    onSuccess: () => {
      toast.success(editTarget ? 'Employee updated' : 'Employee created')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to save employee')
    },
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success('Employee deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: () => {
      toast.error('Failed to delete employee')
    },
  })

  const updateEmployeeStatusMutation = useMutation({
    mutationFn: (emp: EmployeeOut) =>
      updateEmployeeStatus(emp.id, { is_active: !emp.is_active }),
    onSuccess: (_data, emp) => {
      toast.success(`Employee ${emp.is_active ? 'deactivated' : 'activated'}`)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  const changeRoleMutation = useMutation({
    mutationFn: (emp: { id: string, role: EmployeeRole }) => changeEmployeeRole(emp.id, emp.role),
    onSuccess: (data) => {
      const roleLabel = EMPLOYEE_ROLES.find((role) => role.value === data.role)?.label ?? data.role
      toast.success(`${data.employee.full_name} role changed to ${roleLabel}`)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employees', 'managers'] })
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail ?? 'Failed to update role')
    },
  })

  const loading = employeesLoading || managersLoading || departmentsLoading
  const saving = saveEmployeeMutation.isPending

  useEffect(() => {
    if (employeesError || managersError || departmentsError) {
      toast.error('Failed to load employees')
    }
  }, [departmentsError, employeesError, managersError])

  const filtered = employees.filter((e) => {
    const matchStatus =
      activeFilter === 'all' ||
      (activeFilter === 'active' && e.is_active) ||
      (activeFilter === 'inactive' && !e.is_active)
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      e.full_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.department ?? '').toLowerCase().includes(q) ||
      (e.designation ?? '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (emp: EmployeeOut) => {
    setEditTarget(emp)
    setForm({
      full_name: emp.full_name, email: emp.email, phone: emp.phone ?? '',
      address: emp.address ?? '', designation: emp.designation ?? '',
      department: emp.department ?? '', dob: emp.dob ?? '',
      gender: emp.gender ?? '', date_joined: emp.date_joined ?? '',
      salary: emp.salary ?? '', manager_id: emp.manager_id ?? '',
      password: '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '')
    ) as EmployeeFormState
    saveEmployeeMutation.mutate(payload)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteEmployeeMutation.mutate(deleteTarget.id)
  }

  const toggleStatus = (emp: EmployeeOut) => {
    updateEmployeeStatusMutation.mutate(emp)
  }

  const columns: Column<EmployeeOut>[] = [
    {
      key: 'name',
      header: 'Employee',
      cell: (e) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(e.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{e.full_name}</p>
            <p className="text-xs text-muted-foreground">{e.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', header: 'Department', cell: (e) => <span className="text-sm">{e.department ?? '—'}</span> },
    { key: 'designation', header: 'Designation', cell: (e) => <span className="text-sm">{e.designation ?? '—'}</span> },
    { key: 'salary', header: 'Salary', cell: (e) => <span className="text-sm">{e.salary ?? '—'}</span> },
    {
      key: 'status',
      header: 'Status',
      cell: (e) => <StatusBadge status={e.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-56',
      cell: (e) => {
        const isManager = managers.some((m) => m.id === e.id)
        const currentRole = e.role ?? (isManager ? 'manager' : 'employee')

        return (
          <div className="flex items-center gap-1 justify-end">
            <Select
              value={currentRole}
              onValueChange={(role) => {
                const nextRole = role as EmployeeRole
                if (nextRole !== currentRole) {
                  changeRoleMutation.mutate({ id: e.id, role: nextRole })
                }
              }}
              disabled={changeRoleMutation.isPending}
            >
              <SelectTrigger size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Switch
              checked={e.is_active}
              onCheckedChange={() => toggleStatus(e)}
              className="scale-75"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(e)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader title="Employees" description="Manage your workforce">
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No employees found"
          description={searchQuery ? 'Try adjusting your search.' : 'Add your first employee to get started.'}
        >
          {!searchQuery && <Button onClick={openCreate} size="sm"><Plus className="mr-2 h-4 w-4" />Add Employee</Button>}
        </EmptyState>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={loading} rowKey={(e) => e.id} />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <EmployeeForm form={form} onChange={setForm} managers={managers} departments={departments} isEditing={!!editTarget} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Employee"
        description={`Are you sure you want to delete ${deleteTarget?.full_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}

interface EmployeeFormProps {
  form: EmployeeFormState
  onChange: (form: EmployeeFormState) => void
  managers: EmployeeOut[]
  departments: DepartmentOut[]
  isEditing: boolean
}

function EmployeeForm({ form, onChange, managers, departments, isEditing }: EmployeeFormProps) {
  const set = (key: keyof EmployeeFormState, value: string) =>
    onChange({ ...form, [key]: value })

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-2">
        <Label>Full Name *</Label>
        <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="John Doe" />
      </div>
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="john@example.com" />
      </div>
      {!isEditing && (
        <div className="space-y-2">
          <Label>Login Password</Label>
          <Input type="password" value={form.password ?? ''} onChange={(e) => set('password', e.target.value)} placeholder="Use existing email if blank" />
        </div>
      )}
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1234567890" />
      </div>
      <div className="space-y-2">
        <Label>Department</Label>
        <Select value={form.department ?? ''} onValueChange={(v) => set('department', v)}>
          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>
            {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Designation</Label>
        <Input value={form.designation ?? ''} onChange={(e) => set('designation', e.target.value)} placeholder="Software Engineer" />
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={form.gender ?? ''} onValueChange={(v) => set('gender', v)}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Salary</Label>
        <Input value={form.salary ?? ''} onChange={(e) => set('salary', e.target.value)} placeholder="5000" />
      </div>
      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Input type="date" value={form.dob ?? ''} onChange={(e) => set('dob', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Date Joined</Label>
        <Input type="date" value={form.date_joined ?? ''} onChange={(e) => set('date_joined', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Manager</Label>
        <Select value={form.manager_id || 'none'} onValueChange={(v) => set('manager_id', v === 'none' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="No manager" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {managers.map((m) => <SelectItem key={m.id} value={m.user_id}>{m.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-2">
        <Label>Address</Label>
        <Textarea value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St..." rows={2} />
      </div>
    </div>
  )
}
