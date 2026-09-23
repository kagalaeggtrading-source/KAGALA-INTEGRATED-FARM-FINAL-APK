/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ShieldCheck, Lock, Eye, EyeOff, X, KeyRound, AlertCircle } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { adminLoginModalOpen, setAdminLoginModalOpen, loginAsAdmin } = useFarm();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!adminLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginAsAdmin(password);
    if (res.success) {
      setPassword('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg(null);
    setAdminLoginModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">Superuser Admin Login</h3>
              <p className="text-xs text-slate-400">Enter Admin password to access RBAC control panel</p>
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
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-heading">
              Admin Password or Superuser PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
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

          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
              <Lock className="w-3.5 h-3.5" />
              <span>Default Admin Credential</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Superuser Admin Credential: <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">admin123</code> or PIN <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">8888</code>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authenticate Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
