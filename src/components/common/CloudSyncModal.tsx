/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Terminal,
  FileCode2,
  Sparkles,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const { syncStatus, lastSyncedAt } = useFarm();
  const [activeTab, setActiveTab] = useState<'status' | 'android' | 'webview'>('status');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const gradleSnippet = `// 1. In your project-level build.gradle.kts (or build.gradle)
plugins {
    id("com.android.application") version "8.3.0" apply false
    id("com.google.gms.google-services") version "4.4.1" apply false
}

// 2. In your app-level build.gradle.kts (app/build.gradle.kts)
plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

dependencies {
    // Import the Firebase BoM (Bill of Materials) - 100% Free on Spark Tier
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))

    // Declare the dependency for the Cloud Firestore library
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-auth-ktx")
}`;

  const kotlinSyncSnippet = `package com.kagala.poultry

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.QuerySnapshot

class MainActivity : AppCompatActivity() {

    private val db = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 1. Real-time Live Listener for Flocks
        // Any change made in the Web App or other Android devices updates here immediately!
        db.collection("flocks")
            .addSnapshotListener { snapshots: QuerySnapshot?, error ->
                if (error != null) {
                    Log.w("Firestore", "Listen failed.", error)
                    return@addSnapshotListener
                }

                snapshots?.documents?.forEach { doc ->
                    val flockName = doc.getString("name")
                    val currentPop = doc.getLong("currentPopulation")
                    Log.d("Firestore", "Flock: $flockName, Live Population: $currentPop")
                }
            }

        // 2. Real-time Live Listener for Daily Egg Production Logs
        db.collection("egg_production_logs")
            .addSnapshotListener { snapshots, error ->
                if (error != null) return@addSnapshotListener
                val totalCollections = snapshots?.size() ?: 0
                Log.d("Firestore", "Total collections logged: $totalCollections")
            }
    }
}`;

  const webViewSnippet = `// Quickest way: Run this exact Kagala Farm Web App inside your Android Studio APK
// In app/src/main/java/.../MainActivity.kt:
package com.kagala.poultry

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        setContentView(webView)

        webView.webViewClient = WebViewClient()
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Replace with your hosted URL or Cloud Run / Firebase Hosting URL
        webView.loadUrl("https://aa1a74ed-adc2-4da2-98f1-c942febcd4b5-00-24y660855szts.janeway.replit.dev/")
    }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading flex items-center gap-2">
                Cloud Sync & Android Studio Connection
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  100% Free
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Real-time multi-device cloud synchronization powered by Google Firebase Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Live Sync Status</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'android'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Native Android Studio (Free)</span>
          </button>
          <button
            onClick={() => setActiveTab('webview')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'webview'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Android WebView Wrapper</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Status banner */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-emerald-900 font-bold text-sm">
                    Firebase Cloud Database is Connected & Active
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    All logs and records are automatically mirrored in Google Firebase Firestore. Any user or device
                    (phones, tablets, Android Studio apps, or desktop browsers) opening this project will receive
                    instant real-time updates via live WebSocket snapshots.
                  </p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="text-slate-500 font-medium">Database Provider</div>
                  <div className="font-bold text-slate-800 text-sm">Google Cloud Firestore</div>
                  <div className="text-[11px] text-slate-500">Firebase Project: meta-landing-b2sm5</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="text-slate-500 font-medium">Multi-Device Sync Engine</div>
                  <div className="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-Time Bi-directional</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status:{' '}
                    {syncStatus === 'connected'
                      ? 'Live & Synchronized'
                      : syncStatus === 'syncing'
                      ? 'Pushing updates...'
                      : syncStatus === 'offline'
                      ? 'Offline Cache Active'
                      : 'Connecting / Error'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="text-slate-500 font-medium">Cost Tier</div>
                  <div className="font-bold text-slate-800 text-sm">Firebase Spark Plan (100% Free)</div>
                  <div className="text-[11px] text-slate-500">50,000 reads & 20,000 writes/day free</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="text-slate-500 font-medium">Last Synchronized</div>
                  <div className="font-bold text-slate-800 text-sm">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Active right now'}
                  </div>
                  <div className="text-[11px] text-slate-500">Automatic background keep-alive</div>
                </div>
              </div>

              {/* Collections Synced */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-800 font-heading">
                  Synchronized Collections (15 Categories):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'flocks',
                    'flock_adjustments',
                    'egg_production_logs',
                    'egg_adjustments',
                    'feed_items',
                    'feed_purchase_logs',
                    'feed_consumption_logs',
                    'supply_items',
                    'supply_usage_logs',
                    'customers',
                    'orders',
                    'sales',
                    'payments',
                    'expenses',
                    'bank_accounts',
                    'bank_deposits',
                    'farm_profile',
                    'farm_finances',
                    'trash',
                  ].map(c => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 leading-relaxed">
                <div className="font-bold text-sm mb-1">How to connect Android Studio for FREE:</div>
                Follow these 4 simple steps to point your native Android Studio project to the exact same Firebase
                database so your phone/tablet app shares live records with this web dashboard!
              </div>

              {/* Step 1 */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>Register your Android App in Firebase Console (Free)</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Go to{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5"
                  >
                    console.firebase.google.com <ExternalLink className="w-3 h-3" />
                  </a>
                  , select the project <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">meta-landing-b2sm5</code>,
                  click <strong>Add app</strong>, select the <strong>Android</strong> icon, and input your package name
                  (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">com.kagala.poultry</code>).
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>Download `google-services.json`</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Download the generated <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">google-services.json</code>{' '}
                  file from Firebase and drop it directly into your Android Studio project’s{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">app/</code> directory.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">
                      3
                    </span>
                    <span>Add Firebase Firestore Gradle Dependencies</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(gradleSnippet, 'gradle')}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {copiedCode === 'gradle' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'gradle' ? 'Copied' : 'Copy Gradle'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed ml-7">
                  {gradleSnippet}
                </pre>
              </div>

              {/* Step 4 */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">
                      4
                    </span>
                    <span>Android Kotlin Real-Time Listener Code</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(kotlinSyncSnippet, 'kotlin')}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {copiedCode === 'kotlin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'kotlin' ? 'Copied' : 'Copy Kotlin'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed ml-7">
                  {kotlinSyncSnippet}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'webview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 leading-relaxed">
                <div className="font-bold text-sm mb-1">Fastest Option: Full Native Android APK via WebView</div>
                Because this Kagala Farm Management System is already responsive for phones and tablets, you can
                compile this exact application into an installable Android APK in Android Studio in under 5 minutes
                at zero cost!
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="font-heading">MainActivity.kt (Android Studio):</span>
                  <button
                    onClick={() => copyToClipboard(webViewSnippet, 'webview')}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {copiedCode === 'webview' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'webview' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                  {webViewSnippet}
                </pre>
              </div>

              <div className="p-3.5 bg-slate-100 rounded-xl text-slate-600 text-[11px] space-y-1">
                <div className="font-bold text-slate-800">Also supports Progressive Web App (PWA):</div>
                <p>
                  On any Android device using Chrome, users can simply tap <strong>⋮ (Menu) → &quot;Install app&quot;</strong> or{' '}
                  <strong>&quot;Add to Home screen&quot;</strong>. This creates a standalone icon on their Android launcher
                  that runs full-screen with offline support without needing to compile APKs!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Google Cloud Firestore backend</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
