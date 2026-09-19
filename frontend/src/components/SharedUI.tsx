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

export const ActionPointsManager = ({
  task,
  subtaskId,
  proj,
  users = [],
  updateTask,
  readOnly = false,
  className = ""
}: {
  task: any;
  subtaskId?: string | number;
  proj?: any;
  users?: any[];
  updateTask?: (taskId: string, updates: any) => void;
  readOnly?: boolean;
  className?: string;
}) => {
  // Calculate strict project team members (EXCLUDE Managing Director)
  const projectTeamMembers = React.useMemo(() => {
    const teamMap = new Map<string, any>();

    // 1. PM assigned to project
    if (proj?.pmId) {
      const pm = users.find((u: any) => String(u.id) === String(proj.pmId));
      if (pm && pm.role !== 'Managing Director' && pm.role !== ROLES.MANAGEMENT) {
        teamMap.set(String(pm.id), pm);
      }
    }

    // 2. Department Heads assigned to this task or project tasks
    const deptHeadIds = Array.isArray(task?.assignedTo) ? task.assignedTo : (task?.assignedTo ? [task.assignedTo] : []);
    deptHeadIds.forEach((dhId: any) => {
      const dh = users.find((u: any) => String(u.id) === String(dhId));
      if (dh && dh.role !== 'Managing Director' && dh.role !== ROLES.MANAGEMENT) {
        teamMap.set(String(dh.id), dh);
      }
    });

    // 3. Direct report employees under assigned Department Heads
    deptHeadIds.forEach((dhId: any) => {
      users.filter((u: any) => (u.managerId === dhId || u.manager_id === dhId) && u.role !== 'Managing Director' && u.role !== ROLES.MANAGEMENT).forEach((u: any) => {
        teamMap.set(String(u.id), u);
      });
    });

    // 4. Project explicitly assigned team members
    if (proj?.team_members && Array.isArray(proj.team_members)) {
      proj.team_members.forEach((tm: any) => {
        const u = typeof tm === 'object' ? tm : users.find((x: any) => String(x.id) === String(tm));
        if (u && u.role !== 'Managing Director' && u.role !== ROLES.MANAGEMENT) {
          teamMap.set(String(u.id || u.name), u);
        }
      });
    }

    // Fallback if list is empty: all Analysts/Chemists & PMs (excluding MD & management)
    if (teamMap.size === 0) {
      users.filter((u: any) => u.role !== 'Managing Director' && u.role !== ROLES.MANAGEMENT).forEach((u: any) => {
        teamMap.set(String(u.id), u);
      });
    }

    return Array.from(teamMap.values());
  }, [proj, task, users]);

  const isSubtask = Boolean(subtaskId !== undefined && subtaskId !== null);
  const currentSubtask = isSubtask ? (task?.subtasks || []).find((st: any) => String(st.id) === String(subtaskId)) : null;
  const targetObj = isSubtask ? currentSubtask : task;
  const actionPoints = targetObj?.actionPoints || targetObj?.action_points || [];

  const saveActionPoints = (newActionPoints: any[]) => {
    if (!updateTask || !task?.id) return;
    if (isSubtask) {
      const updatedSubtasks = (task?.subtasks || []).map((st: any) => {
        if (String(st.id) === String(subtaskId)) {
          return { ...st, actionPoints: newActionPoints };
        }
        return st;
      });
      updateTask(task.id, { subtasks: updatedSubtasks });
    } else {
      updateTask(task.id, { actionPoints: newActionPoints });
    }
  };

  const handleAddActionPoint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newAp = {
      id: `ap-${Date.now()}`,
      text: '',
      doneBy: '',
      doneByName: '',
      remarks: '',
      completed: false
    };
    const updated = [...actionPoints, newAp];
    saveActionPoints(updated);
  };

  const handleUpdateActionPoint = (apId: any, field: string, value: any) => {
    const updated = actionPoints.map((ap: any) => {
      if (String(ap.id) === String(apId)) {
        if (field === 'doneBy') {
          if (value === '__custom__') {
            return { ...ap, isCustomDoneBy: true };
          }
          const found = users.find((u: any) => String(u.id) === String(value));
          return {
            ...ap,
            doneBy: value,
            doneByName: found ? found.name : value,
            isCustomDoneBy: false
          };
        }
        return { ...ap, [field]: value };
      }
      return ap;
    });
    saveActionPoints(updated);
  };

  const handleDeleteActionPoint = (apId: any) => {
    const updated = actionPoints.filter((ap: any) => String(ap.id) !== String(apId));
    saveActionPoints(updated);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <span>Action Points</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {actionPoints.filter((ap: any) => ap.completed || ap.done).length}/{actionPoints.length} Done
          </span>
        </h4>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddActionPoint}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
          >
            + Add Action Point
          </button>
        )}
      </div>

      {actionPoints.length === 0 ? (
        <div className="text-xs text-gray-400 italic py-2 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          No action points added yet. {!readOnly && 'Click "+ Add Action Point" above.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {actionPoints.map((ap: any, idx: number) => {
            const isCompleted = ap.completed || ap.done;
            const isCustomDoneBy = ap.isCustomDoneBy || (ap.doneBy && !projectTeamMembers.some((u: any) => String(u.id) === String(ap.doneBy)));

            return (
              <div
                key={ap.id || idx}
                className={`p-3 rounded-xl border transition-all space-y-2 ${
                  isCompleted ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                {/* Row 1: Checkbox + Description Input */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={Boolean(isCompleted)}
                    disabled={readOnly}
                    onChange={(e) => handleUpdateActionPoint(ap.id, 'completed', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-[#1e3a5f]"
                  />
                  <input
                    type="text"
                    readOnly={readOnly}
                    placeholder={`Action Point ${idx + 1}...`}
                    value={ap.text || ap.title || ap.description || ''}
                    onChange={(e) => handleUpdateActionPoint(ap.id, 'text', e.target.value)}
                    className={`flex-1 text-xs font-bold bg-transparent outline-none border-b border-transparent focus:border-blue-400 transition-all ${
                      isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
                    }`}
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeleteActionPoint(ap.id)}
                      className="text-gray-400 hover:text-red-500 text-xs px-1"
                      title="Delete action point"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Row 2: Done by - [Select/Type] & Remarks - [Input/Type] */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-xs">
                  {/* Done by Field */}
                  <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                    <span className="font-extrabold text-gray-500 text-[11px] whitespace-nowrap">Done by:</span>
                    {readOnly ? (
                      <span className="font-bold text-gray-800 truncate">{ap.doneByName || ap.doneBy || 'Unassigned'}</span>
                    ) : isCustomDoneBy ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Type name..."
                          value={ap.doneByName || ap.doneBy || ''}
                          onChange={(e) => {
                            handleUpdateActionPoint(ap.id, 'doneByName', e.target.value);
                            handleUpdateActionPoint(ap.id, 'doneBy', e.target.value);
                          }}
                          className="w-full text-xs font-bold px-1.5 py-0.5 rounded border border-blue-300 bg-white text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateActionPoint(ap.id, 'isCustomDoneBy', false)}
                          className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
                          title="Switch to dropdown"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        value={ap.doneBy || ''}
                        onChange={(e) => handleUpdateActionPoint(ap.id, 'doneBy', e.target.value)}
                        className="flex-1 text-xs font-bold bg-white border border-gray-300 rounded px-1.5 py-0.5 text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">Select team member...</option>
                        {projectTeamMembers.map((m: any) => (
                          <option key={m.id || m.name} value={m.id || m.name}>
                            {m.name} ({m.role || 'Team Member'})
                          </option>
                        ))}
                        <option value="__custom__">✍️ Type custom name...</option>
                      </select>
                    )}
                  </div>

                  {/* Remarks Field */}
                  <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                    <span className="font-extrabold text-gray-500 text-[11px] whitespace-nowrap">Remarks:</span>
                    <input
                      type="text"
                      readOnly={readOnly}
                      placeholder="Add remarks/notes..."
                      value={ap.remarks || ''}
                      onChange={(e) => handleUpdateActionPoint(ap.id, 'remarks', e.target.value)}
                      className="flex-1 text-xs font-semibold bg-white border border-gray-300 rounded px-1.5 py-0.5 text-gray-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

