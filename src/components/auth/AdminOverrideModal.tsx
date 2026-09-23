/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ShieldAlert, KeyRound, Eye, EyeOff, X, AlertCircle, Lock } from 'lucide-react';

export const AdminOverrideModal: React.FC = () => {
  const {
    adminOverrideModalOpen,
    setAdminOverrideModalOpen,
    confirmLogoutOrSwitchWithAdminPassword,
    currentRole,
    pendingTargetRole,
  } = useFarm();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!adminOverrideModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = confirmLogoutOrSwitchWithAdminPassword(password);
    if (res.success) {
      setPassword('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg(null);
    setAdminOverrideModalOpen(false);
  };

  const actionText = pendingTargetRole === 'LOGOUT' || !pendingTargetRole
    ? 'Log Out & Return to Gate'
    : `Switch Role to ${pendingTargetRole.toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                Enter Admin Password to Authorize Switch
              </h3>
              <p className="text-xs text-slate-400">Security Override Lock Active</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Session Hard-Lock Active</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Current active role is <strong className="text-slate-900 font-bold">{currentRole.toUpperCase()}</strong>. Action requested: <strong className="text-slate-900 font-bold">{actionText}</strong>. Enter Superuser Admin Password to authorize this change.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-heading">
              Superuser Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter Admin password (e.g. admin123)..."
                autoFocus
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel (Keep Logged In)
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Authorize & Continue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
