import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, Clock, Wrench, AlertCircle, CheckCircle2, ChevronRight, Activity, CalendarDays, Loader2, PenTool, History } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface MaintenanceRecord {
  id: string;
  facility: string;
  lbNo: string;
  sniNo: string;
  lbType: string;
  insertion: string;
  vendor: string;
  status: string;
  site: string;
  issue: string;
  issueDate: string;
  repairDate: string;
  action: string;
  createdBy: string;
  createdAt: string;
}

export default function LoadBoardHistory({ lbNo, onBack }: { lbNo: string, onBack: () => void }) {
  const { loadBoards } = useData();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Find master data for this LB
  const lbDetails = loadBoards.find(lb => lb.lbName === lbNo) || loadBoards.find(lb => lb.lbNo === lbNo);

  useEffect(() => {
    if (!lbNo) return;

    const q = query(
      collection(db, 'maintenanceRecords'),
      where('lbNo', '==', lbNo)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaintenanceRecord[];
      
      // Sort in descending order (newest first)
      recordsData.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      
      setRecords(recordsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching LB history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [lbNo]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'On-going': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Returned': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'On-going': return <Activity className="h-5 w-5 text-amber-500 animate-pulse" />;
      case 'Returned': return <ArrowLeft className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-100/80 rounded-xl transition-colors text-zinc-400 hover:text-zinc-700 h-10 w-10 flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-3xl italic text-zinc-900 tracking-tight">Lifecycle History</h2>
            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-sm font-bold font-mono">
              {lbNo}
            </span>
          </div>
          <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] font-bold">
            Complete maintenance and repair timeline
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Timeline Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-8">
              <History className="h-5 w-5 text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Maintenance Timeline</h3>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12 surface-card border border-dashed border-zinc-200">
                <Wrench className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No maintenance records found for this Load Board.</p>
              </div>
            ) : (
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
                {records.map((record, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={record.id} 
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    {/* Icon marker */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-zinc-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                      {getStatusIcon(record.status)}
                    </div>
                    
                    {/* Card content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] surface-card p-5 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border", getStatusColor(record.status))}>
                          {record.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {record.issueDate}
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-bold text-zinc-900 mb-3">{record.issue || 'No issue description'}</h4>
                      
                      <div className="space-y-2">
                        {record.action && (
                          <div className="flex gap-2 items-start bg-zinc-50/80 p-3 rounded-lg border border-zinc-100">
                            <PenTool className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-600 leading-relaxed">{record.action}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Site</span>
                            <span className="text-xs text-zinc-700">{record.site || '-'}</span>
                          </div>
                          {record.repairDate && (
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Repaired On</span>
                              <span className="text-xs text-zinc-700">{record.repairDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar: LB Details */}
          <div className="space-y-6">
             <div className="sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-zinc-400" />
                  <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Board Details</h3>
                </div>
                
                <div className="surface-card p-6 space-y-5">
                  {lbDetails ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Project Name</span>
                        <p className="text-sm font-medium text-zinc-900">{lbDetails.projectName || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Facility</span>
                        <p className="text-sm font-medium text-zinc-900">{lbDetails.facility || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">LB Group</span>
                        <p className="text-sm font-medium text-zinc-900">{lbDetails.lbGroup || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Current Location</span>
                        <p className="text-sm font-medium text-zinc-900">{lbDetails.location || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Record Count</span>
                        <p className="text-sm font-medium text-zinc-900">{records.length}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-zinc-500 italic">No matching master record found in Load Board Inventory.</p>
                      <div className="mt-4 space-y-1 text-left">
                         <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Record Count</span>
                         <p className="text-sm font-medium text-zinc-900">{records.length}</p>
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
