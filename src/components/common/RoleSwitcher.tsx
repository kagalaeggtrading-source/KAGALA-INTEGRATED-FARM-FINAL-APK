/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { USER_ROLES } from '../../constants';
import { UserRole } from '../../types';
import { Shield, ChevronDown, Check, Eye, Lock } from 'lucide-react';

interface RoleSwitcherProps {
  compact?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ compact = false }) => {
  const { currentRole, setRole, activeRoleConfig } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: UserRole[] = ['owner', 'manager', 'collector', 'sales_clerk', 'auditor'];

  const getRoleBg = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'manager':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'collector':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'sales_clerk':
        return 'bg-purple-50 text-purple-900 border-purple-300';
      case 'auditor':
        return 'bg-indigo-50 text-indigo-900 border-indigo-300';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${getRoleBg(
          currentRole
        )} hover:opacity-90`}
        title={`Active Role: ${activeRoleConfig.title} - Click to test boundaries or switch roles`}
      >
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[120px] sm:max-w-none">{activeRoleConfig.badge}</span>
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
              Select Active Farm Role
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch roles to experience role boundaries & dashboard permissions live.
            </p>
          </div>

          <div className="p-1 space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
            {rolesList.map(rKey => {
              const r = USER_ROLES[rKey];
              const isSelected = rKey === currentRole;

              return (
                <button
                  key={rKey}
                  onClick={() => {
                    setRole(rKey);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-heading flex items-center gap-1.5">
                      <span>{r.badge}</span>
                      {isSelected && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {r.boundarySummary}
                  </p>

                  <div className="flex items-center gap-3 pt-0.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>{r.allowedTabs.length} tabs open</span>
                    </span>
                    {!r.permissions.viewFinancialMetrics && (
                      <span className="flex items-center gap-1 text-rose-500">
                        <Lock className="w-3 h-3" />
                        <span>Financials Hidden</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {currentRole !== 'owner' && (
            <div className="px-3 py-2 border-t border-slate-100 bg-amber-50/50 flex items-center justify-between">
              <span className="text-[11px] text-amber-800 font-medium">Previewing limited role</span>
              <button
                onClick={() => {
                  setRole('owner');
                  setIsOpen(false);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Reset to Owner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
