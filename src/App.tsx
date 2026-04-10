import { useState, useCallback, useMemo } from 'react';
import type {
  InvoiceData,
  Vendor,
  ExtractedRecord,
  VendorMatchResult,
  ApprovalState,
  AuditEntry,
  AppStep,
  UserRole,
} from './types';
import { extractInvoiceData } from './services/llm';
import { fuzzyMatchVendor } from './utils/fuzzyMatch';
import { determineApprovalLevel } from './utils/approval';
import { MASTER_VENDOR_LIST, DEFAULT_EXTRACTED_RECORDS } from './constants';
import { LoginScreen } from './components/LoginScreen';
import { ApiKeyInput } from './components/ApiKeyInput';
import { FileUpload } from './components/FileUpload';
import { FilePreview } from './components/FilePreview';
import { InvoiceTable } from './components/InvoiceTable';
import { VendorMatch } from './components/VendorMatch';
import { VendorManager } from './components/VendorManager';
import { ExtractedDataTab } from './components/ExtractedDataTab';
import type { ApprovalAction } from './components/ExtractedDataTab';
import { ApprovalWorkflow } from './components/ApprovalWorkflow';
import { AuditLog } from './components/AuditLog';
import './App.css';

const STEPS = ['upload', 'preview', 'extracted', 'approval'] as const;
const STEP_LABELS: Record<string, string> = { upload: 'Upload', preview: 'Preview', extracted: 'Review', approval: 'Approve' };

const ROLE_LABELS: Record<UserRole, string> = {
  manager: '👔 Manager',
  finance_head: '🏦 Finance Head',
  employee: '👤 Employee',
};

function App() {
  // Auth
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  // Config
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [configured, setConfigured] = useState(false);
  const [isReconfiguring, setIsReconfiguring] = useState(false);

  // Navigation
  const [activeView, setActiveView] = useState<'extracted' | 'vendors' | 'invoice'>('extracted');

  // Vendor state
  const [vendors, setVendors] = useState<Vendor[]>(MASTER_VENDOR_LIST);

  // Extracted records state
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[]>(DEFAULT_EXTRACTED_RECORDS);

  // App state
  const [step, setStep] = useState<AppStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Data state
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [vendorMatch, setVendorMatch] = useState<VendorMatchResult | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Derived: approval state from current record
  const approval = useMemo<ApprovalState | null>(() => {
    if (!currentRecordId) return null;
    return extractedRecords.find((r) => r.id === currentRecordId)?.approval ?? null;
  }, [currentRecordId, extractedRecords]);

  // Derived: count of invoices actionable by the current approver role
  const actionableCount = useMemo(() => {
    if (!userRole || userRole === 'employee') return extractedRecords.length;
    return extractedRecords.filter((r) => {
      const a = r.approval;
      if (!a || a.level === 'auto') return false;
      if (userRole === 'manager') return a.status === 'pending';
      if (userRole === 'finance_head') return a.status === 'pending' || a.status === 'manager_approved';
      return false;
    }).length;
  }, [userRole, extractedRecords]);

  const addAuditEntry = useCallback((action: string, details: string) => {
    setAuditLog((prev) => [
      ...prev,
      { id: crypto.randomUUID(), timestamp: new Date(), action, details, user: userRole ? ROLE_LABELS[userRole] : undefined },
    ]);
  }, [userRole]);

  const handleLogin = useCallback(
    (role: UserRole) => {
      setUserRole(role);
      addAuditEntry('Login', `User logged in as ${ROLE_LABELS[role]}`);
    },
    [addAuditEntry]
  );

  const handleLogout = useCallback(() => {
    addAuditEntry('Logout', `User (${userRole ? ROLE_LABELS[userRole] : ''}) logged out`);
    setUserRole(null);
    setActiveView('extracted');
    setIsReconfiguring(false);
    setStep('upload');
    setSelectedFile(null);
    setInvoiceData(null);
    setCurrentRecordId(null);
    setVendorMatch(null);
    setError(null);
  }, [userRole, addAuditEntry]);

  const handleApiKeySubmit = useCallback(
    (key: string, prov: 'openai' | 'gemini') => {
      setApiKey(key);
      setProvider(prov);
      setConfigured(true);
      setIsReconfiguring(false);
      addAuditEntry('Configuration', `LLM provider set to ${prov === 'openai' ? 'OpenAI' : 'Gemini'}`);
    },
    [addAuditEntry]
  );

  const handleReconfigure = useCallback(() => {
    setIsReconfiguring(true);
  }, []);

  const handleCancelReconfigure = useCallback(() => {
    setIsReconfiguring(false);
  }, []);

  const handleAddVendor = useCallback(
    (vendor: Vendor) => {
      setVendors((prev) => [...prev, vendor]);
      addAuditEntry('Vendor Added', `New vendor "${vendor.name}" added to master list`);
    },
    [addAuditEntry]
  );

  const handleUpdateVendor = useCallback(
    (updated: Vendor) => {
      setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      addAuditEntry('Vendor Updated', `Vendor "${updated.name}" details updated`);
    },
    [addAuditEntry]
  );

  const handleDeleteVendor = useCallback(
    (id: string) => {
      setVendors((prev) => {
        const vendor = prev.find((v) => v.id === id);
        if (vendor) addAuditEntry('Vendor Deleted', `Vendor "${vendor.name}" removed from master list`);
        return prev.filter((v) => v.id !== id);
      });
    },
    [addAuditEntry]
  );

  const handleRecordUpdate = useCallback((id: string, data: InvoiceData) => {
    setExtractedRecords((prev) => prev.map((r) => (r.id === id ? { ...r, data } : r)));
  }, []);

  const handleRecordDelete = useCallback(
    (id: string) => {
      setExtractedRecords((prev) => {
        const record = prev.find((r) => r.id === id);
        if (record) addAuditEntry('Record Removed', `Extracted record for "${record.fileName}" removed`);
        return prev.filter((r) => r.id !== id);
      });
    },
    [addAuditEntry]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setStep('preview');
      setError(null);
      addAuditEntry('Upload', `Document selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    },
    [addAuditEntry]
  );

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      const data = await extractInvoiceData(selectedFile, apiKey, provider);
      setInvoiceData(data);
      setStep('extracted');

      // Save to extracted records history
      const recordId = crypto.randomUUID();
      setCurrentRecordId(recordId);
      setExtractedRecords((prev) => [
        ...prev,
        { id: recordId, fileName: selectedFile.name, extractedAt: new Date(), data },
      ]);

      addAuditEntry(
        'Extraction',
        `AI extracted invoice #${data.invoiceNo} from ${data.vendorName}, total: ₹${data.total}`
      );

      // Auto-run fuzzy match
      const match = fuzzyMatchVendor(data.vendorName, vendors);
      setVendorMatch(match);
      addAuditEntry(
        'Vendor Match',
        match.matchedVendor
          ? `Matched "${data.vendorName}" → "${match.matchedVendor}" (${match.confidence}% confidence)`
          : `No match found for "${data.vendorName}"`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      setError(message);
      addAuditEntry('Error', message);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, apiKey, provider, vendors, addAuditEntry]);

  const handleInvoiceUpdate = useCallback((data: InvoiceData) => {
    setInvoiceData(data);
    if (currentRecordId) {
      setExtractedRecords((prev) =>
        prev.map((r) => (r.id === currentRecordId ? { ...r, data } : r))
      );
    }
  }, [currentRecordId]);

  const handleConfirmMatch = useCallback(() => {
    const current = vendorMatch;
    if (!current) return;
    setVendorMatch({ ...current, confirmed: true });
    addAuditEntry('Vendor Confirmed', `Vendor confirmed as "${current.matchedVendor}"`);
  }, [vendorMatch, addAuditEntry]);

  const handleOverrideVendor = useCallback(
    (vendor: string) => {
      if (!vendor) return;
      setVendorMatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matchedVendor: vendor,
          confidence: 100,
          confirmed: true,
          overridden: true,
        };
      });
      setInvoiceData((prev) => {
        if (!prev) return prev;
        return { ...prev, vendorName: vendor };
      });
      addAuditEntry('Vendor Override', `Vendor manually overridden to "${vendor}"`);
    },
    [addAuditEntry]
  );

  const invoiceTotal = invoiceData?.total ?? 0;

  const updateCurrentRecordApproval = useCallback(
    (updater: (prev: ApprovalState) => ApprovalState) => {
      if (!currentRecordId) return;
      setExtractedRecords((prev) =>
        prev.map((r) =>
          r.id === currentRecordId && r.approval
            ? { ...r, approval: updater(r.approval) }
            : r
        )
      );
    },
    [currentRecordId]
  );

  const handleProceedToApproval = useCallback(() => {
    if (!invoiceTotal || !currentRecordId) return;
    const level = determineApprovalLevel(invoiceTotal);
    const isAuto = level === 'auto';

    const state: ApprovalState = {
      level,
      status: isAuto ? 'approved' : 'pending',
      managerApproved: false,
      financeApproved: false,
    };

    setExtractedRecords((prev) =>
      prev.map((r) => (r.id === currentRecordId ? { ...r, approval: state } : r))
    );
    setStep('approval');

    if (isAuto) {
      addAuditEntry('Auto-Approved', 'Invoice auto-approved (total < ₹10,000)');
    } else {
      addAuditEntry(
        'Approval Required',
        level === 'manager'
          ? 'Sent for Manager approval'
          : 'Sent for Manager + Finance Head approval'
      );
    }
  }, [invoiceTotal, currentRecordId, addAuditEntry]);

  const handleManagerApprove = useCallback(() => {
    if (!approval) return;
    const isManagerOnly = approval.level === 'manager';
    updateCurrentRecordApproval((prev) => {
      if (isManagerOnly) {
        return { ...prev, managerApproved: true, status: 'approved' as const };
      }
      return { ...prev, managerApproved: true, status: 'manager_approved' as const };
    });
    if (isManagerOnly) {
      addAuditEntry('Approved', 'Invoice approved by Manager');
    } else {
      addAuditEntry('Manager Approved', 'Manager approval received, awaiting Finance Head');
    }
  }, [approval, updateCurrentRecordApproval, addAuditEntry]);

  const handleFinanceApprove = useCallback(() => {
    updateCurrentRecordApproval((prev) => ({
      ...prev, financeApproved: true, status: 'approved' as const,
    }));
    addAuditEntry('Approved', 'Invoice approved by Finance Head (final approval)');
  }, [updateCurrentRecordApproval, addAuditEntry]);

  const handleReject = useCallback(() => {
    updateCurrentRecordApproval((prev) => ({
      ...prev, status: 'rejected' as const,
    }));
    addAuditEntry('Rejected', 'Invoice has been rejected');
  }, [updateCurrentRecordApproval, addAuditEntry]);

  const handleApproveRecord = useCallback(
    (id: string, action: ApprovalAction) => {
      setExtractedRecords((prev) =>
        prev.map((r) => {
          if (r.id !== id || !r.approval) return r;
          const a = r.approval;
          let updated: typeof a;
          if (action === 'manager_approve') {
            updated = {
              ...a,
              managerApproved: true,
              status: a.level === 'manager' ? ('approved' as const) : ('manager_approved' as const),
            };
          } else if (action === 'finance_approve') {
            updated = { ...a, financeApproved: true, status: 'approved' as const };
          } else {
            updated = { ...a, status: 'rejected' as const };
          }
          return { ...r, approval: updated };
        })
      );

      const record = extractedRecords.find((r) => r.id === id);
      const invoiceNo = record?.data.invoiceNo ?? id;
      if (action === 'manager_approve') {
        addAuditEntry('Manager Approved', `Manager approved invoice #${invoiceNo}`);
      } else if (action === 'finance_approve') {
        addAuditEntry('Approved', `Finance Head gave final approval for invoice #${invoiceNo}`);
      } else {
        addAuditEntry('Rejected', `Invoice #${invoiceNo} rejected`);
      }
    },
    [extractedRecords, addAuditEntry]
  );

  const handleReset = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setInvoiceData(null);
    setCurrentRecordId(null);
    setVendorMatch(null);
    setError(null);
    addAuditEntry('Reset', 'Started new invoice processing');
  }, [addAuditEntry]);

  return (
    <>
      {!configured ? (
        <div className="api-key-screen">
          <ApiKeyInput onSubmit={handleApiKeySubmit} initialProvider={provider} />
        </div>
      ) : !userRole ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
    <div className="app">
      <header className="app-header">
        <h1>🧾 AI Invoice Processor</h1>
        <p>Upload invoices, extract data with AI, match vendors, and manage approvals</p>
        <div className="user-badge">
          <span className="user-badge-role">{ROLE_LABELS[userRole]}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
        {configured && !isReconfiguring && (
          <div>
            <button className="btn-reconfigure" onClick={handleReconfigure}>
              ⚙️ {provider === 'openai' ? 'OpenAI' : 'Gemini'} · Change API Key
            </button>
          </div>
        )}
      </header>

      {configured && !isReconfiguring && (
        <nav className="app-nav">
          <button
            className={`app-nav-item ${activeView === 'extracted' ? 'active' : ''}`}
            onClick={() => setActiveView('extracted')}
          >
            {userRole === 'employee' ? '📋 Extracted Data' : '📋 Pending Approvals'}
            {actionableCount > 0 && (
              <span className={`app-nav-badge${userRole !== 'employee' ? ' app-nav-badge--urgent' : ''}`}>
                {actionableCount}
              </span>
            )}
          </button>
          <button
            className={`app-nav-item ${activeView === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveView('vendors')}
          >
            🏢 Manage Vendors
          </button>
          {userRole === 'employee' && (
          <button
            className={`app-nav-item ${activeView === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveView('invoice')}
          >
            🧾 Process Invoice
          </button>
          )}
        </nav>
      )}

      <div className="app-layout">
        <main className="main-content">
          {isReconfiguring ? (
            <ApiKeyInput
              onSubmit={handleApiKeySubmit}
              initialProvider={provider}
              onCancel={handleCancelReconfigure}
            />
          ) : activeView === 'extracted' ? (
            <ExtractedDataTab
              records={extractedRecords}
              userRole={userRole}
              onUpdate={handleRecordUpdate}
              onDelete={handleRecordDelete}
              onApproveRecord={handleApproveRecord}
            />
          ) : activeView === 'vendors' ? (
            <VendorManager
              vendors={vendors}
              onAdd={handleAddVendor}
              onUpdate={handleUpdateVendor}
              onDelete={handleDeleteVendor}
            />
          ) : (
            <>
              {/* Step indicator */}
              <div className="step-indicator">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`step-item ${step === s ? 'current' : ''} ${
                      STEPS.indexOf(step as typeof STEPS[number]) > i ? 'done' : ''
                    }`}
                  >
                    <div className="step-number">{i + 1}</div>
                    <span>{STEP_LABELS[s]}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="error-banner">
                  <strong>Error:</strong> <span>{error}</span>
                  <button onClick={() => setError(null)} className="btn-close">✕</button>
                </div>
              )}

              {/* Upload section */}
              {step === 'upload' && (
                <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
              )}

              {/* File preview & confirmation */}
              {step === 'preview' && selectedFile && (
                <FilePreview
                  file={selectedFile}
                  isProcessing={isProcessing}
                  onConfirm={handleExtract}
                  onReupload={handleReset}
                />
              )}

              {/* Processing overlay */}
              {isProcessing && step === 'preview' && (
                <div className="extraction-loading">
                  <div className="spinner" />
                  <p>Extracting invoice data with AI…</p>
                </div>
              )}

              {/* Extracted data review */}
              {invoiceData && step === 'extracted' && (
                <div className="review-section">
                  <InvoiceTable data={invoiceData} onUpdate={handleInvoiceUpdate} editable={true} />

                  {vendorMatch && (
                    <VendorMatch
                      match={vendorMatch}
                      vendors={vendors}
                      onConfirm={handleConfirmMatch}
                      onOverride={handleOverrideVendor}
                    />
                  )}

                  <div className="review-actions">
                    <button className="btn btn-secondary" onClick={handleReset}>
                      ← Start Over
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleProceedToApproval}
                      disabled={vendorMatch ? !vendorMatch.confirmed : false}
                    >
                      Proceed to Approval →
                    </button>
                  </div>
                </div>
              )}

              {/* Approval section */}
              {invoiceData && approval && step === 'approval' && (
                <div className="approval-section">
                  <InvoiceTable data={invoiceData} onUpdate={handleInvoiceUpdate} editable={false} />
                  <ApprovalWorkflow
                    total={invoiceData.total}
                    approval={approval}
                    userRole={userRole}
                    onManagerApprove={handleManagerApprove}
                    onFinanceApprove={handleFinanceApprove}
                    onReject={handleReject}
                  />
                  {(approval.status === 'approved' || approval.status === 'rejected') && (
                    <div className="review-actions">
                      <button className="btn btn-primary" onClick={handleReset}>
                        Process New Invoice
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        <aside className="sidebar">
          <AuditLog entries={auditLog} />
        </aside>
      </div>
    </div>
      )}
    </>
  );
}

export default App;
