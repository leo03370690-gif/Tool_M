import React, { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc, query } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Upload, Trash2, Loader2, AlertTriangle, CheckCircle2, FileSpreadsheet, DatabaseBackup, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { logAuditAction } from '../lib/audit';

const COLLECTIONS = [
  { id: 'products', label: 'Product Info' },
  { id: 'sockets', label: 'Socket Info' },
  { id: 'changeKits', label: 'Change Kit' },
  { id: 'pogoPins', label: 'Pogo Pin' },
  { id: 'lifeTimes', label: 'Life Time' },
  { id: 'loadBoards', label: 'Load Board' },
];

const SHEET_MAPPING: Record<string, string> = {
  'Tooling_Matrix': 'products',
  'socket': 'sockets',
  'KIT': 'changeKits',
  'LB_status': 'loadBoards',
  'on-hand pogo pin': 'pogoPins',
  'Life time': 'lifeTimes'
};

const TEMPLATES: Record<string, string[]> = {
  products: [
    'facility', 'device', 'projectName', 'nickname', 'tester', 'handler', 'temperature',
    'insertion', 'siteNumber', 'ballCountDevice', 'changeKitGroup',
    'kitName1', 'kitName2', 'kitName3', 'kitName4', 'lbGroup',
    'socketName1', 'socketName2'
  ],
  sockets: [
    'facility', 'toolsId', 'package', 'pinBall', 'packageSize', 'project', 'status',
    'contactCountPin1', 'lifeCountPin1', 'contactLimitPin1', 'socketGroupPin1',
    'contactCountOver70Pin1', 'pogoPinPnPin1', 'socketPnPin1', 'usedFag',
    'contactCountPin2', 'lifeCountPin2', 'contactLimitPin2', 'contactCountOver70Pin2',
    'pogoPinPnPin2', 'contactCountPcb', 'lifeCountPcb', 'contactLimitPcb',
    'contactCountOver70Pcb', 'pnPcb', 'usedFlag'
  ],
  changeKits: [
    'facility', 'kind', 'toolsId', 'packageSize', 'changeKitGroup', 'status', 'idleTime', 'location'
  ],
  pogoPins: [
    'facility', 'pinPn', 'qty'
  ],
  lifeTimes: [
    'facility', 'socketGroup', 'pogoPin1Pn', 'pogoPinQty', 'lifeTime', 'loadBoardGroup', 'remark'
  ],
  loadBoards: [
    'facility', 'projectName', 'lbName', 'lbGroup', 'location', 'insertion',
    'availableQty', 'remark', 'sendBackDate', 'targetReturnDate'
  ]
};

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
}

export default function DataManagement() {
  const [clearTarget, setClearTarget] = useState<string>('all');
  const [importMode, setImportMode] = useState<'auto' | 'specific'>('auto');
  const [targetCollection, setTargetCollection] = useState<string>('products');
  const [clearBeforeImport, setClearBeforeImport] = useState<boolean>(false);
  const [globalFacility, setGlobalFacility] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    Object.entries(SHEET_MAPPING).forEach(([sheetName, collectionId]) => {
      const headers = TEMPLATES[collectionId];
      if (headers) {
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });
    
    XLSX.writeFile(wb, `Tooling_Management_Template.xlsx`);
  };

  const clearCollection = async (collectionName: string) => {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    const batches = [];
    let batch = writeBatch(db);
    let count = 0;
    let totalDeleted = 0;

    for (const document of snapshot.docs) {
      batch.delete(document.ref);
      count++;
      totalDeleted++;
      if (count === 490) {
        batches.push(batch.commit());
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      batches.push(batch.commit());
    }
    await Promise.all(batches);
    return totalDeleted;
  };

  const addDocuments = async (collectionName: string, data: any[]) => {
    const batches = [];
    let batch = writeBatch(db);
    let count = 0;
    let totalAdded = 0;

    for (const item of data) {
      const docRef = doc(collection(db, collectionName));
      batch.set(docRef, item);
      count++;
      totalAdded++;
      if (count === 490) {
        batches.push(batch.commit());
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      batches.push(batch.commit());
    }
    await Promise.all(batches);
    return totalAdded;
  };

  const processSheetData = (worksheet: XLSX.WorkSheet, targetCollection: string) => {
    const rawAoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    const expectedKeys = TEMPLATES[targetCollection] || [];
    
    const normalizedExpectedKeys = expectedKeys.reduce((acc, key) => {
      acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = key;
      return acc;
    }, {} as Record<string, string>);

    const fallbacks: Record<string, string[]> = {
      'facility': ['facility', 'fac', 'plant'],
      'lifeTime': ['life', 'lifecount', 'lifelimit', 'lifespan', 'lt', 'touchdown', 'td'],
      'pogoPinQty': ['qty', 'quantity', 'pinqty', 'pogopinqty', 'count'],
      'pogoPin1Pn': ['pinpn', 'pogopin', 'partnumber', 'pn', 'pin1pn'],
      'loadBoardGroup': ['loadboard', 'lbgroup', 'lb'],
      'remark': ['note', 'remarks', 'comment', 'comments'],
      'device': ['devicename', 'part', 'partno', 'pkg', 'package', 'product', 'ic'],
      'projectName': ['project', 'projectname'],
      'socketGroup': ['socket', 'group', 'socketname'],
      'tester': ['testername', 'platform', 'testerplatform'],
      'handler': ['handlername'],
      'temperature': ['temp'],
      'insertion': ['insert'],
      'siteNumber': ['site', 'sitenum', 'sites'],
      'changeKitGroup': ['kitgroup', 'changekit', 'kit'],
      'nickname': ['nick'],
      'ballCountDevice': ['ballcount', 'balls', 'ball'],
      'kitName1': ['kit1'],
      'kitName2': ['kit2'],
      'kitName3': ['kit3'],
      'kitName4': ['kit4'],
      'socketName1': ['socket1'],
      'socketName2': ['socket2'],
      'lbGroup': ['lbgroup', 'loadboardgroup'],
      'socketName': ['socket', 'name'],
      'status': ['stat', 'state'],
      'location': ['loc'],
      'kind': ['type'],
      'toolsId': ['toolid', 'tool'],
      'packageSize': ['pkgsize', 'size'],
      'idleTime': ['idle'],
      'pinPn': ['pin', 'pn', 'partnumber'],
      'lbName': ['lbname', 'loadboardname'],
      'availableQty': ['available', 'availqty'],
      'sendBackDate': ['sendback', 'returndate'],
      'targetReturnDate': ['targetreturn', 'targetdate'],
      'contactCountPin1': ['pogopincontactcount', 'contactcountpin1', 'down'],
      'contactLimitPin1': ['pogopincontactlimit', 'contactlimitpin1'],
      'socketPnPin1': ['socketpn', 'socketpnpin1'],
      'contactCountOver70Pin1': ['contactcountover70', 'contactcountover70pin1'],
      'package': ['pkg', 'package'],
      'pinBall': ['pinball', 'ball', 'balls'],
      'project': ['project', 'proj'],
      'usedFlag': ['usedflag', 'flag', 'usedfag', 'usedfag'],
      'contactCountPin2': ['contactcountpin2'],
      'lifeCountPin2': ['lifecountpin2'],
      'contactLimitPin2': ['contactlimitpin2'],
      'contactCountOver70Pin2': ['contactcountover70pin2'],
      'pogoPinPnPin2': ['pogopin1pn2', 'pogopinpn2', 'pin2pn'],
      'contactCountPcb': ['contactcountpcb'],
      'lifeCountPcb': ['lifecountpcb'],
      'contactLimitPcb': ['contactlimitpcb'],
      'contactCountOver70Pcb': ['contactcountover70pcb'],
      'pnPcb': ['pnpcb', 'pcbpn']
    };

    // Find the header row
    let headerRowIndex = 0;
    let maxMatches = 0;

    for (let i = 0; i < Math.min(20, rawAoa.length); i++) {
      const row = rawAoa[i];
      let matches = 0;
      for (const cell of row) {
        const cellStr = String(cell).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!cellStr) continue;
        
        if (normalizedExpectedKeys[cellStr]) {
          matches += 10;
        } else {
          let matched = false;
          for (const [orig, aliases] of Object.entries(fallbacks)) {
            if (expectedKeys.includes(orig) && aliases.includes(cellStr)) {
              matches += 8;
              matched = true;
              break;
            }
          }
          if (!matched) {
            for (const normKey of Object.keys(normalizedExpectedKeys)) {
              if (cellStr.includes(normKey)) {
                matches += 5;
                matched = true;
                break;
              }
            }
          }
          if (!matched) {
            for (const [orig, aliases] of Object.entries(fallbacks)) {
              if (expectedKeys.includes(orig) && aliases.some(a => cellStr.includes(a))) {
                matches += 3;
                break;
              }
            }
          }
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        headerRowIndex = i;
      }
    }

    if (maxMatches === 0) return [];

    const headers = rawAoa[headerRowIndex].map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Score-based mapping
    const headerMapping: Record<number, string> = {};
    const claimedCols = new Set<number>();

    // For each expected key, find the best matching column
    for (const expectedKey of expectedKeys) {
      const normKey = expectedKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      const aliases = fallbacks[expectedKey] || [];
      
      let bestColIndex = -1;
      let bestScore = 0;

      for (let j = 0; j < headers.length; j++) {
        if (claimedCols.has(j)) continue; // Column already assigned to another key
        
        const cellStr = headers[j];
        if (!cellStr) continue;

        let score = 0;
        if (cellStr === normKey) score = 100;
        else if (aliases.includes(cellStr)) score = 90;
        else if (cellStr.startsWith(normKey)) score = 80;
        else if (aliases.some(a => cellStr.startsWith(a))) score = 70;
        else if (cellStr.includes(normKey)) score = 60;
        else if (aliases.some(a => cellStr.includes(a))) score = 50;

        if (score > bestScore) {
          bestScore = score;
          bestColIndex = j;
        }
      }

      if (bestColIndex !== -1) {
        headerMapping[bestColIndex] = expectedKey;
        claimedCols.add(bestColIndex);
      }
    }

    const jsonData = [];
    for (let i = headerRowIndex + 1; i < rawAoa.length; i++) {
      const row = rawAoa[i];
      const mappedRow: any = {};
      let hasData = false;
      
      for (let j = 0; j < headers.length; j++) {
        const cellValue = row[j];
        const finalKey = headerMapping[j];
        
        if (finalKey) {
          if (cellValue !== "" && cellValue !== null && cellValue !== undefined) {
            hasData = true;
          }
          if (typeof cellValue === 'number') {
            mappedRow[finalKey] = cellValue;
          } else {
            mappedRow[finalKey] = String(cellValue ?? "");
          }
        }
      }
      if (hasData) {
        if (globalFacility && expectedKeys.includes('facility')) {
          mappedRow['facility'] = globalFacility;
        }
        jsonData.push(mappedRow);
      }
    }
    return jsonData;
  };

  const handleImportClick = () => {
    if (!files || files.length === 0) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Please select at least one Excel file to import.',
        type: 'danger',
        onConfirm: closeModal,
        confirmText: 'OK'
      });
      return;
    }

    setModal({
      isOpen: true,
      title: 'Confirm Batch Import',
      message: `You have selected ${files.length} file(s).\n\n${clearBeforeImport ? 'Existing data in the target sections will be CLEARED once before importing.' : 'Data will be APPENDED to existing records.'}\n\nDo you want to proceed?`,
      type: 'info',
      confirmText: 'Yes, Start Import',
      onCancel: closeModal,
      onConfirm: async () => {
        closeModal();
        setLoading(true);
        try {
          const clearedCollections = new Set<string>();
          const importStats: Record<string, number> = {};
          let totalDeleted = 0;
          let totalAdded = 0;

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (importMode === 'specific') {
              // Specific Page Mode: Try to find a matching sheet, otherwise use the first sheet
              let targetSheetName = workbook.SheetNames[0]; // Default to first sheet
              
              // Try to find the exact sheet for this collection
              const expectedSheetName = Object.keys(SHEET_MAPPING).find(key => SHEET_MAPPING[key] === targetCollection);
              if (expectedSheetName) {
                const normalizedExpected = expectedSheetName.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                // 1. Try exact match first
                const exactMatch = workbook.SheetNames.find(name => name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedExpected);
                if (exactMatch) {
                  targetSheetName = exactMatch;
                } else {
                  // 2. Try fuzzy match
                  for (const sheetName of workbook.SheetNames) {
                    const normalizedSheetName = sheetName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (normalizedSheetName.includes(normalizedExpected) || normalizedExpected.includes(normalizedSheetName)) {
                      targetSheetName = sheetName;
                      break;
                    }
                  }
                }
              }

              const worksheet = workbook.Sheets[targetSheetName];
              const jsonData = processSheetData(worksheet, targetCollection);
              
              if (jsonData.length > 0) {
                if (clearBeforeImport && !clearedCollections.has(targetCollection)) {
                  const deletedCount = await clearCollection(targetCollection);
                  totalDeleted += deletedCount;
                  clearedCollections.add(targetCollection);
                }
                const addedCount = await addDocuments(targetCollection, jsonData);
                importStats[targetCollection] = (importStats[targetCollection] || 0) + addedCount;
                totalAdded += addedCount;
              }
            } else {
              // Auto-Detect Mode
              let fileHasMatchingSheet = false;

              const normalizedSheetMapping = Object.entries(SHEET_MAPPING).reduce((acc, [key, value]) => {
                acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = value;
                return acc;
              }, {} as Record<string, string>);

              for (const sheetName of workbook.SheetNames) {
                const normalizedSheetName = sheetName.toLowerCase().replace(/[^a-z0-9]/g, '');
                const mappedCollection = normalizedSheetMapping[normalizedSheetName];
                if (mappedCollection) {
                  fileHasMatchingSheet = true;
                  const worksheet = workbook.Sheets[sheetName];
                  const jsonData = processSheetData(worksheet, mappedCollection);
                  
                  if (jsonData.length > 0) {
                    if (clearBeforeImport && !clearedCollections.has(mappedCollection)) {
                      const deletedCount = await clearCollection(mappedCollection);
                      totalDeleted += deletedCount;
                      clearedCollections.add(mappedCollection);
                    }
                    const addedCount = await addDocuments(mappedCollection, jsonData);
                    importStats[mappedCollection] = (importStats[mappedCollection] || 0) + addedCount;
                    totalAdded += addedCount;
                  }
                }
              }

              if (!fileHasMatchingSheet && workbook.SheetNames.length > 0) {
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = processSheetData(worksheet, targetCollection); // Fallback to selected target
                
                if (jsonData.length > 0) {
                  if (clearBeforeImport && !clearedCollections.has(targetCollection)) {
                    const deletedCount = await clearCollection(targetCollection);
                    totalDeleted += deletedCount;
                    clearedCollections.add(targetCollection);
                  }
                  const addedCount = await addDocuments(targetCollection, jsonData);
                  importStats[targetCollection] = (importStats[targetCollection] || 0) + addedCount;
                  totalAdded += addedCount;
                }
              }
            }
          }

          if (totalAdded === 0) {
            throw new Error("No data found to import in the selected files.");
          }

          const statsMessages = Object.entries(importStats).map(([colId, count]) => {
            const label = COLLECTIONS.find(c => c.id === colId)?.label || colId;
            return `${label}: ${count} records`;
          });

          await logAuditAction('Import Data', `Imported ${totalAdded} records across ${files.length} files. ${clearBeforeImport ? `Cleared ${totalDeleted} old records.` : ''}`);

          setModal({
            isOpen: true,
            title: 'Batch Import Successful',
            message: `Processed ${files.length} file(s).\n\n${clearBeforeImport ? `Cleared ${totalDeleted} old records.\n\n` : ''}Imported a total of ${totalAdded} records:\n${statsMessages.join('\n')}`,
            type: 'success',
            onConfirm: closeModal,
            confirmText: 'OK'
          });
          
          setFiles(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
          console.error(err);
          setModal({
            isOpen: true,
            title: 'Import Failed',
            message: err.message || 'An error occurred while parsing or uploading the data.',
            type: 'danger',
            onConfirm: closeModal,
            confirmText: 'OK'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleClearClick = () => {
    const targetLabel = clearTarget === 'all' ? 'ALL Collections' : COLLECTIONS.find(c => c.id === clearTarget)?.label;

    setModal({
      isOpen: true,
      title: 'Confirm Clear Data',
      message: `Are you absolutely sure you want to clear data in "${targetLabel}"? This action CANNOT be undone.`,
      type: 'danger',
      confirmText: 'Yes, Clear Data',
      onCancel: closeModal,
      onConfirm: async () => {
        closeModal();
        setLoading(true);
        try {
          let totalDeleted = 0;
          if (clearTarget === 'all') {
            for (const col of COLLECTIONS) {
              totalDeleted += await clearCollection(col.id);
            }
          } else {
            totalDeleted = await clearCollection(clearTarget);
          }

          await logAuditAction('Clear Data', `Cleared ${totalDeleted} records from ${targetLabel}`);

          setModal({
            isOpen: true,
            title: 'Clear Successful',
            message: `Successfully deleted ${totalDeleted} records from ${targetLabel}.`,
            type: 'success',
            onConfirm: closeModal,
            confirmText: 'OK'
          });
        } catch (err: any) {
          console.error(err);
          setModal({
            isOpen: true,
            title: 'Clear Failed',
            message: err.message || 'An error occurred while clearing data.',
            type: 'danger',
            onConfirm: closeModal,
            confirmText: 'OK'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Import Section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900">Import Data</h3>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Download className="h-3 w-3" />
                Download Template
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Upload multiple Excel files. Choose auto-detect or import to a specific page.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Import Mode
            </label>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as 'auto' | 'specific')}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="auto">Auto-Detect Sheets</option>
              <option value="specific">Import to Specific Page</option>
            </select>
            <p className="mt-1 text-[10px] text-zinc-400">
              {importMode === 'auto' ? 'System will auto-detect sheets and import them.' : 'System will import to the selected page.'}
            </p>
          </div>
          
          {importMode === 'specific' && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Target Page
              </label>
              <select
                value={targetCollection}
                onChange={(e) => setTargetCollection(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {COLLECTIONS.map(col => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-zinc-400">Select the page to import data into.</p>
            </div>
          )}

          <div className={importMode === 'auto' ? 'col-span-1' : 'md:col-span-2'}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Excel Files (.xlsx, .xls)
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv, .xlsm"
              multiple
              ref={fileInputRef}
              onChange={(e) => setFiles(e.target.files)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-1 file:text-xs file:font-bold file:text-blue-600 hover:file:bg-blue-100 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-zinc-400">Hold Ctrl/Cmd or Shift to select multiple files.</p>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Facility (Optional)
            </label>
            <input
              type="text"
              value={globalFacility}
              onChange={(e) => setGlobalFacility(e.target.value)}
              placeholder="Enter facility name to apply to all imported records"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-[10px] text-zinc-400">If provided, this will override the facility field in the imported data.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <input
            type="checkbox"
            id="clearBeforeImport"
            checked={clearBeforeImport}
            onChange={(e) => setClearBeforeImport(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="clearBeforeImport" className="text-sm font-medium text-zinc-700">
            Clear existing data before importing (Smart Clear: clears each target only once per batch)
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleImportClick}
            disabled={loading || !files || files.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? 'Processing...' : 'Import Files'}
          </button>
        </div>
      </div>

      {/* Clear Section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
            <DatabaseBackup className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">Clear Data</h3>
            <p className="text-xs text-zinc-500">Bulk delete records from sections</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Target Section to Clear
            </label>
            <select
              value={clearTarget}
              onChange={(e) => setClearTarget(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="all">⚠️ ALL SECTIONS (Clear Everything)</option>
              {COLLECTIONS.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClearClick}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {loading ? 'Processing...' : 'Clear Data'}
          </button>
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          * Note: To delete a single record, please navigate to the specific section and use the trash icon next to the record.
        </p>
      </div>

      {/* Custom Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              {modal.type === 'danger' && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"><AlertTriangle className="h-5 w-5" /></div>}
              {modal.type === 'success' && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"><CheckCircle2 className="h-5 w-5" /></div>}
              {modal.type === 'info' && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><AlertTriangle className="h-5 w-5" /></div>}
              <h3 className="text-lg font-bold text-zinc-900">{modal.title}</h3>
            </div>
            <p className="mb-8 text-sm leading-relaxed text-zinc-600 whitespace-pre-wrap">{modal.message}</p>
            <div className="flex justify-end gap-3">
              {modal.onCancel && (
                <button
                  onClick={modal.onCancel}
                  disabled={loading}
                  className="rounded-lg px-4 py-2 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={modal.onConfirm}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50",
                  modal.type === 'danger' ? "bg-red-600 hover:bg-red-700" : 
                  modal.type === 'success' ? "bg-green-600 hover:bg-green-700" : 
                  "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {modal.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
