import React from 'react';
import { ROLES, TASK_STATUS } from '../constants';

export const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div 
    className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
  <Card className="p-0">
    <div className="p-6 flex items-start gap-5">
      <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2">{title}</div>
        <div className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{value}</div>
        {subtitle && <div className="text-[13px] text-gray-400 mt-2 font-medium">{subtitle}</div>}
      </div>
    </div>
    <div className={`h-1 w-full ${colorClass.includes('blue') ? 'bg-blue-400' : colorClass.includes('amber') ? 'bg-amber-400' : colorClass.includes('emerald') || colorClass.includes('green') ? 'bg-emerald-400' : 'bg-gray-300'} opacity-40`}></div>
  </Card>
);

export const TaskAssigneeControl = ({
  task,
  users = [],
  currentUser,
  updateTask,
  className = ""
}: {
  task: any;
  users?: any[];
  currentUser?: any;
  updateTask?: (taskId: string, updates: any) => void;
  className?: string;
}) => {
  const isDeptHead = currentUser?.role === ROLES.DEPT_HEAD;
  const isPMOrAdmin = currentUser?.role === ROLES.PM || currentUser?.role === ROLES.MANAGEMENT || currentUser?.role === 'Managing Director' || currentUser?.role === 'Vice President (R&D)';
  const canModify = Boolean(updateTask && (isDeptHead || isPMOrAdmin));

  const subEmployees = React.useMemo(() => {
    let reports = users.filter((u: any) => u.managerId === currentUser?.id || u.manager_id === currentUser?.id);
    if (reports.length > 0) return reports;

    const deptHeadIds = Array.isArray(task?.assignedTo) ? task.assignedTo : [task?.assignedTo];
    if (deptHeadIds.length > 0 && deptHeadIds[0]) {
      reports = users.filter((u: any) => deptHeadIds.includes(u.managerId) || deptHeadIds.includes(u.manager_id));
      if (reports.length > 0) return reports;
    }

    return users.filter((u: any) => u.role === ROLES.EMPLOYEE || u.role === 'Analysts/Chemists');
  }, [users, currentUser, task]);

  const isPlanningPhase = task?.status === 'Planning' || task?.status === 'Planning Phase' || task?.status === 'Unassigned' || task?.status === TASK_STATUS.PENDING_START;
  
  let assignedEmployeeName = task?.assignedEmployeeName || task?.assignedEmployee?.name;
  if (!assignedEmployeeName && task?.assignedEmployeeId) {
    const found = users.find((u: any) => String(u.id) === String(task.assignedEmployeeId));
    if (found) assignedEmployeeName = found.name;
  }

  const isAssigned = !isPlanningPhase && Boolean(assignedEmployeeName);
  const displayText = isAssigned ? `Assigned to - ${assignedEmployeeName}` : 'Assigned to - None';

  const [isCustomTyping, setIsCustomTyping] = React.useState(false);
  const [customNameValue, setCustomNameValue] = React.useState(assignedEmployeeName || '');

  React.useEffect(() => {
    setCustomNameValue(assignedEmployeeName || '');
  }, [assignedEmployeeName]);

  const handleSaveCustomName = () => {
    const trimmed = customNameValue.trim();
    if (!trimmed) {
      updateTask!(task.id, {
        assignedEmployeeId: null,
        assignedEmployeeName: null,
        assignedEmployee: null
      });
    } else {
      updateTask!(task.id, {
        assignedEmployeeId: `custom-${Date.now()}`,
        assignedEmployeeName: trimmed,
        assignedEmployee: { id: `custom-${Date.now()}`, name: trimmed, role: 'Employee' }
      });
    }
    setIsCustomTyping(false);
  };

  if (!canModify) {
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border shadow-sm ${
        isAssigned
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-gray-100 text-gray-600 border-gray-200'
      } ${className}`}>
        {displayText}
      </span>
    );
  }

  if (isCustomTyping) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-blue-50/80 px-2 py-1 rounded-lg border border-blue-300 shadow-sm ${className}`}>
        <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Assigned to -</span>
        <input
          type="text"
          autoFocus
          placeholder="Type employee name..."
          value={customNameValue}
          onChange={(e) => setCustomNameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveCustomName();
            if (e.key === 'Escape') setIsCustomTyping(false);
          }}
          onBlur={handleSaveCustomName}
          className="text-xs font-bold px-2 py-0.5 rounded border border-blue-400 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[130px]"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsCustomTyping(false);
          }}
          className="text-xs font-bold text-gray-400 hover:text-gray-700 px-1"
          title="Cancel typing"
        >
          ✕
        </button>
      </div>
    );
  }

  const isMatchedEmployee = subEmployees.some((emp: any) => String(emp.id) === String(task?.assignedEmployeeId));
  const selectValue = isPlanningPhase ? '' : (isMatchedEmployee ? String(task?.assignedEmployeeId) : (assignedEmployeeName ? '__custom__' : ''));

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <select
        value={selectValue}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '__custom__') {
            setCustomNameValue(assignedEmployeeName || '');
            setIsCustomTyping(true);
          } else if (!val) {
            setIsCustomTyping(false);
            updateTask!(task.id, {
              assignedEmployeeId: null,
              assignedEmployeeName: null,
              assignedEmployee: null
            });
          } else {
            setIsCustomTyping(false);
            const selectedUser = users.find((u: any) => String(u.id) === String(val));
            updateTask!(task.id, {
              assignedEmployeeId: val,
              assignedEmployeeName: selectedUser ? selectedUser.name : '',
              assignedEmployee: selectedUser ? { id: selectedUser.id, name: selectedUser.name, role: selectedUser.role } : null
            });
          }
        }}
        className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-all shadow-sm ${
          isAssigned
            ? 'bg-blue-50 text-[#1e3a5f] border-blue-300 focus:ring-2 focus:ring-blue-500'
            : 'bg-gray-50 text-gray-600 border-gray-300 focus:ring-2 focus:ring-blue-500'
        }`}
      >
        <option value="">Assigned to - None</option>
        {subEmployees.map((emp: any) => (
          <option key={emp.id} value={emp.id}>
            Assigned to - {emp.name}
          </option>
        ))}
        {!isMatchedEmployee && assignedEmployeeName && (
          <option value="__custom__">Assigned to - {assignedEmployeeName}</option>
        )}
        <option value="__custom__">✍️ Type custom name...</option>
      </select>
    </div>
  );
};

