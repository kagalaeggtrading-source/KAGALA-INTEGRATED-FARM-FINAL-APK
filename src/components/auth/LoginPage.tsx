/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Building2,
  UserCheck,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { profile, loginSession } = useFarm();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [passwordOrPin, setPasswordOrPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginSession(selectedRole, passwordOrPin);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'owner':
        return {
          title: 'Superuser Admin',
          badge: '👑 Admin (Superuser)',
          desc: 'Full administrative authority, Access Control Panel & settings.',
          color: 'emerald',
          hint: 'Password: admin123 or PIN 8888',
        };
      case 'manager':
        return {
          title: 'Farm Manager',
          badge: '📋 Manager',
          desc: 'Daily farm coops, inventory management, sales & expenses.',
          color: 'blue',
          hint: 'Default PIN: 1234',
        };
      case 'staff':
      case 'collector':
      case 'sales_clerk':
      case 'auditor':
        return {
          title: 'Farm Staff',
          badge: '🧑‍🌾 Staff',
          desc: 'Field worker - egg harvest, mortality, orders & stock logs.',
          color: 'amber',
          hint: 'Default PIN: 0000',
        };
    }
  };

  const activeBadge = getRoleBadge(selectedRole);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 md:p-8 font-sans relative overflow-hidden select-none">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="pt-6 pb-2 text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          {profile.logoUrl ? (
            <div className="w-14 h-14 bg-white rounded-2xl p-1.5 flex items-center justify-center border border-slate-700 shadow-xl overflow-hidden">
              <img
                src={profile.logoUrl}
                alt="Farm Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl border border-emerald-400/30">
              <Building2 className="w-7 h-7" />
            </div>
          )}
        </div>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-white tracking-tight">
          {profile.farmName}
        </h1>
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-0.5">
          {profile.tagline || 'Grow Raise Sustain'} • Command Center Gate
        </p>
      </div>

      {/* Central Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 z-10 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>SESSION AUTHENTICATION REQUIRED</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold font-heading text-white">
            Select Role & Sign In
          </h2>
          <p className="text-xs text-slate-400">
            Enter credentials to access authorized farm modules
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedRole === 'admin'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('manager');
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedRole === 'manager'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Manager</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('staff');
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedRole === 'staff'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Staff</span>
          </button>
        </div>

        {/* Selected Role Description Banner */}
        <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-xs space-y-1">
          <div className="font-bold text-white flex items-center justify-between">
            <span>{activeBadge.badge}</span>
            <span className="text-[10px] text-slate-400 font-mono">{activeBadge.hint}</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">{activeBadge.desc}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-heading">
              {selectedRole === 'admin' ? 'Admin Password or PIN' : 'Security PIN'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordOrPin}
                onChange={e => setPasswordOrPin(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'Enter admin password...' : 'Enter PIN...'}
                autoFocus
                className="w-full pl-9 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg hover:shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Unlock Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Footer Credentials Info */}
      <div className="pb-4 pt-4 text-center text-slate-500 text-[11px] z-10 space-y-1">
        <div className="flex items-center justify-center gap-2 font-mono">
          <span>Enterprise Security v2.0</span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Session Lock Active
          </span>
        </div>
        <p>{profile.address}</p>
      </div>
    </div>
  );
};
