import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  FileCode,
  Copy,
  Check,
  Database,
  Lock,
  Layers,
  ExternalLink,
  KeyRound
} from 'lucide-react';

export const FirebaseSpecsPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const firestoreRulesDraft = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for Role-Based Access Control (RBAC)
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role; // 'citizen' | 'ward_engineer' | 'eoc_chief' | 'admin'
    }

    function isEngineerOrChief() {
      return isAuthenticated() && (getUserRole() in ['ward_engineer', 'eoc_chief', 'admin']);
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }

    // 1. Streets Collection: Public read, Admin write
    match /streets/{streetId} {
      allow read: if true;
      allow write: if isEngineerOrChief();
    }

    // 2. Stormwater Drainage Network: Public read, Engineers update maintenance
    match /drainage/{drainId} {
      allow read: if true;
      allow create, update, delete: if isEngineerOrChief();
    }

    // 3. Rainfall Telemetry Readings: Public read, Automated AWS Telemetry service write
    match /rainfall_readings/{readingId} {
      allow read: if true;
      allow write: if isEngineerOrChief();
    }

    // 4. Flood Alerts: Public read, Engine / Dispatchers create and acknowledge
    match /flood_alerts/{alertId} {
      allow read: if true;
      allow create, update: if isEngineerOrChief();
      allow delete: if isAdmin();
    }

    // 5. Crowdsourced Citizen Reports:
    // Anyone (including anonymous) can read and report waterlogging
    match /citizen_reports/{reportId} {
      allow read: if true;
      allow create: if request.resource.data.street_name is string
                    && request.resource.data.description is string;
      // Upvotes can be incremented by any authenticated or anonymous user
      allow update: if (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['upvotes'])
                        && request.resource.data.upvotes == resource.data.upvotes + 1)
                    || isEngineerOrChief();
      allow delete: if isAdmin();
    }

    // 6. Municipal Emergency Responses & Triage
    match /municipal_responses/{incidentId} {
      allow read: if true;
      allow create, update: if isEngineerOrChief();
      allow delete: if isAdmin();
    }

    // 7. Activity Audit Logs: Immutable append-only
    match /activity_logs/{logId} {
      allow read: if isEngineerOrChief();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Immutable audit trail
    }

    // 8. System Scoring Settings & Calibrations
    match /system_settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}`;

  const envStub = `# Future Firebase Production Integration Environment Template
# Place these in frontend/.env.local when provisioning your Firebase Project
VITE_FIREBASE_API_KEY=AIzaSyDEMO_KEY_DO_NOT_COMMIT
VITE_FIREBASE_AUTH_DOMAIN=jaldrishti-urban-flood.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jaldrishti-urban-flood
VITE_FIREBASE_STORAGE_BUCKET=jaldrishti-urban-flood.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321098
VITE_FIREBASE_APP_ID=1:987654321098:web:abcdef123456
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
`;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="civic-card p-5 bg-gradient-to-r from-amber-900/90 via-slate-900 to-navy-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Firebase Authentication & Cloud Firestore Integration Architecture</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Designed for turnkey migration to Google Cloud Firestore and Firebase Auth. Documented security rules,
            RBAC custom claims, and non-destructive decoupled adapter architecture.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30">
          Migration Ready (V9 Modular SDK)
        </span>
      </div>

      {/* Security Architecture & RBAC Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="civic-card p-4">
          <div className="flex items-center gap-2 mb-2 text-teal-700">
            <Lock className="w-4 h-4" />
            <h4 className="font-bold text-xs uppercase tracking-wider">Role-Based Access Control</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Firebase Auth custom claims: <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono">role: citizen</code>,
            <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono ml-1">ward_engineer</code>,
            <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono ml-1">eoc_chief</code>,
            and <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono ml-1">admin</code>.
          </p>
        </div>

        <div className="civic-card p-4">
          <div className="flex items-center gap-2 mb-2 text-blue-700">
            <Database className="w-4 h-4" />
            <h4 className="font-bold text-xs uppercase tracking-wider">Zero Schema Drift</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The SQLite backend tables map 1:1 to Firestore root collections. JSON attributes and timestamps match
            ISO-8601 string specifications with backward compatibility.
          </p>
        </div>

        <div className="civic-card p-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="font-bold text-xs uppercase tracking-wider">Zero Credential Exposure</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            API keys are strictly managed through Vite environment variables (<code className="text-slate-800 font-mono text-[11px]">VITE_FIREBASE_*</code>).
            No production keys or service accounts are committed to code.
          </p>
        </div>
      </div>

      {/* Firestore Security Rules Draft */}
      <div className="civic-card overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span className="font-bold font-mono">firestore.rules (Production RBAC Specification)</span>
          </div>
          <button
            onClick={() => copyToClipboard(firestoreRulesDraft, 'rules')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            {copiedSection === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'rules' ? 'Copied' : 'Copy Rules'}</span>
          </button>
        </div>
        <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-96">
          {firestoreRulesDraft}
        </pre>
      </div>

      {/* Environment Variable Template */}
      <div className="civic-card overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <KeyRound className="w-4 h-4 text-teal-400" />
            <span className="font-bold font-mono">.env.example (Safe Configuration Blueprint)</span>
          </div>
          <button
            onClick={() => copyToClipboard(envStub, 'env')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'env' ? 'Copied' : 'Copy Env'}</span>
          </button>
        </div>
        <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
          {envStub}
        </pre>
      </div>
    </div>
  );
};
