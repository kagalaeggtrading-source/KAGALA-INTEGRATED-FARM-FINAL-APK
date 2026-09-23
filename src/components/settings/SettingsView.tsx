/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Settings,
  Upload,
  Image as ImageIcon,
  Trash2,
  Save,
  Download,
  Database,
  RefreshCw,
  AlertTriangle,
  Building,
  Check,
  CheckCircle2,
  Cloud,
  Smartphone,
  ExternalLink,
  Lock,
  KeyRound,
} from 'lucide-react';
import { FarmProfile } from '../../types';
import { CloudSyncModal } from '../common/CloudSyncModal';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    uploadLogo,
    removeLogo,
    exportDatabaseJson,
    importDatabaseJson,
    resetToZeroData,
    syncStatus,
    lastSyncedAt,
    currentRole,
    changeUserPassword,
  } = useFarm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FarmProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoPreviewDark, setLogoPreviewDark] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleLogoUpload = (file: File) => {
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      uploadLogo(result);
      setFormData(prev => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    const jsonString = exportDatabaseJson();
    const blob = new Blob([jsonString], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kagala_farm_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (confirm('Restoring this backup will replace current local database. Proceed?')) {
          const success = importDatabaseJson(text);
          if (success) {
            alert('Database restored successfully.');
            window.location.reload();
          } else {
            alert('Failed to parse database backup file.');
          }
        }
      } catch (err) {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to Zero
  const handleClearAllData = () => {
    if (
      confirm(
        'CRITICAL WARNING: This will purge all flocks, egg production logs, orders, expenses, and bank records back to absolute zero. This action is irreversible. Proceed?'
      )
    ) {
      resetToZeroData();
      alert('System reset to zero baseline successfully.');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Farm Profile, Branding & System Administration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure official business metadata, manage high-fidelity farm logo, and manage database snapshots.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Saved</span>
          </div>
        )}
      </div>

      {/* SECTION 1: FARM LOGO & BRANDING */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <span>Official Farm Logo & Watermark</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your exact farm logo will be displayed on reports, delivery receipts, invoices, and system headers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Logo Preview Stage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Aspect Ratio & Legibility Preview:</span>
              <button
                type="button"
                onClick={() => setLogoPreviewDark(!logoPreviewDark)}
                className="text-[11px] underline cursor-pointer text-slate-600 hover:text-slate-900"
              >
                Switch to {logoPreviewDark ? 'Light' : 'Dark'} Background
              </button>
            </div>

            <div
              className={`h-40 rounded-xl border border-dashed flex flex-col items-center justify-center p-4 transition-colors ${
                logoPreviewDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-600'
              }`}
            >
              {profile.logoUrl ? (
                <div className="relative group max-h-full flex items-center justify-center">
                  <img
                    src={profile.logoUrl}
                    alt="Kagala Integrated Farm Logo"
                    className="max-h-28 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <Building className="w-10 h-10 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold">No logo uploaded yet</p>
                  <p className="text-[11px] text-slate-400">Default farm emblem will be used</p>
                </div>
              )}
            </div>

            {profile.logoUrl && (
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => removeLogo()}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              </div>
            )}
          </div>

          {/* Upload Dropzone */}
          <div className="flex flex-col justify-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleLogoUpload(e.target.files[0]);
                }
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  handleLogoUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800">
                Click or drag & drop to upload Farm Logo
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports PNG, JPG, JPEG, WEBP, or SVG. Transparent PNG recommended.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FARM PROFILE DETAILS */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-700" />
            <span>Farm Legal & Operational Details</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            These details appear on official delivery receipts, invoices, and management reports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Farm / Business Name *</label>
            <input
              type="text"
              required
              value={formData.farmName}
              onChange={e => setFormData(prev => ({ ...prev, farmName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tagline / Subtitle</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={e => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Owner / Manager Name</label>
            <input
              type="text"
              value={formData.ownerManager}
              onChange={e => setFormData(prev => ({ ...prev, ownerManager: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
            <input
              type="text"
              value={formData.contactNumber}
              onChange={e => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Facebook Page / Socials</label>
            <input
              type="text"
              value={formData.facebookPage}
              onChange={e => setFormData(prev => ({ ...prev, facebookPage: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Physical Farm Address / Location</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={formData.currency}
              onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Standard Tray Capacity (Eggs/Tray)</label>
            <input
              type="number"
              min="1"
              value={formData.trayCapacity}
              onChange={e =>
                setFormData(prev => ({ ...prev, trayCapacity: parseInt(e.target.value) || 30 }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Farm Profile</span>
          </button>
        </div>
      </form>

      {/* SECTION 3: CLOUD SYNC & ANDROID STUDIO INTEGRATION */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-xl border border-emerald-800 text-white shadow-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <span>Real-Time Cloud Synchronization & Android Integration</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                  Firebase Spark (Free)
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                All farm records automatically sync across devices and users via Google Cloud Firestore.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCloudModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open Android Studio Guide</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-slate-400 font-medium text-[11px]">Database Provider</div>
            <div className="text-white font-bold text-sm mt-0.5">Google Cloud Firestore</div>
            <div className="text-[11px] text-emerald-400 mt-1">Project: meta-landing-b2sm5</div>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-slate-400 font-medium text-[11px]">Real-Time Sync Engine</div>
            <div className="text-emerald-300 font-bold text-sm mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bi-directional Snapshots</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">19 data collections live</div>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-slate-400 font-medium text-[11px]">Connected Platforms</div>
            <div className="text-white font-bold text-sm mt-0.5">Web + Android APK / PWA</div>
            <div className="text-[11px] text-emerald-400 mt-1">Zero monthly hosting cost</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: SECURITY & PIN MANAGEMENT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>Security & PIN Management ({currentRole.toUpperCase()})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your account security PIN. You must enter your current working PIN first to verify identity.
          </p>
        </div>

        {pinMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              pinMessage.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {pinMessage.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{pinMessage.text}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPinMessage(null);
            if (newPin !== confirmPin) {
              setPinMessage({ success: false, text: 'New PIN and Confirm PIN do not match!' });
              return;
            }
            const res = changeUserPassword(currentRole, currentPin, newPin);
            if (res.success) {
              setPinMessage({ success: true, text: res.message });
              setCurrentPin('');
              setNewPin('');
              setConfirmPin('');
            } else {
              setPinMessage({ success: false, text: res.message });
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Working PIN / Password *
            </label>
            <input
              type="password"
              required
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Enter current PIN..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New PIN / Password *</label>
            <input
              type="password"
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter new PIN..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New PIN *</label>
            <input
              type="password"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Re-enter new PIN..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
            />
          </div>

          <div className="sm:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              * If a Manager or Staff member forgets their password, they must ask the Farm Owner to reset it via the Admin Dashboard.
            </p>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              <KeyRound className="w-4 h-4" />
              <span>Update My PIN</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: DATABASE BACKUP & RESTORE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Offline Backup, Restore & Reset</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Export a complete JSON snapshot of all farm transactions, restore an existing backup, or reset to zero.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Export */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 text-xs font-heading">Export Database Snapshot</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Save an offline JSON file containing all flocks, production logs, egg stocks, sales, and accounts.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="mt-4 w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 text-xs font-heading">Restore Database</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Restore previously exported JSON backup to replace existing farm state.
              </p>
            </div>

            <input
              type="file"
              ref={backupInputRef}
              accept="application/json"
              className="hidden"
              onChange={handleImportBackup}
            />

            <button
              onClick={() => backupInputRef.current?.click()}
              className="mt-4 w-full flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select File to Restore</span>
            </button>
          </div>

          {/* Reset Zero */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col justify-between">
            <div>
              <div className="font-bold text-rose-900 text-xs font-heading flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Zero-Data Purge</span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-1">
                Wipe all operational records back to absolute zero baseline for clean farm initialization.
              </p>
            </div>
            <button
              onClick={handleClearAllData}
              className="mt-4 w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Clean Zero</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Sync & Android Setup Guide Modal */}
      <CloudSyncModal isOpen={cloudModalOpen} onClose={() => setCloudModalOpen(false)} />
    </div>
  );
};
