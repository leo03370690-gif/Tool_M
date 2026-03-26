import React, { useState } from 'react';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { 
  LayoutDashboard, 
  Box, 
  Settings, 
  Users, 
  LogOut, 
  ChevronRight,
  Cpu,
  Wrench,
  Clock,
  Database,
  ShieldCheck,
  DatabaseBackup,
  Layers
} from 'lucide-react';
import ProductInfo from './ProductInfo';
import SocketInfo from './SocketInfo';
import ChangeKitInfo from './ChangeKitInfo';
import PogoPinInfo from './PogoPinInfo';
import LifeTimeInfo from './LifeTimeInfo';
import LoadBoardInfo from './LoadBoardInfo';
import UserManagement from './UserManagement';
import SettingsTab from './Settings';
import DataManagement from './DataManagement';
import AuditLogs from './AuditLogs';

interface DashboardProps {
  user: FirebaseUser;
  role: string | null;
}

type Tab = 'product' | 'socket' | 'change-kit' | 'pogo-pin' | 'life-time' | 'load-board' | 'users' | 'settings' | 'data-management' | 'audit-logs';

export default function Dashboard({ user, role }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('product');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isAdmin = role === 'admin';

  const menuItems = [
    { id: 'product', label: 'Product Info', icon: Box, color: 'text-blue-500' },
    { id: 'socket', label: 'Socket Info', icon: Cpu, color: 'text-purple-500' },
    { id: 'change-kit', label: 'Change Kit', icon: Wrench, color: 'text-orange-500' },
    { id: 'pogo-pin', label: 'Pogo Pin', icon: Database, color: 'text-emerald-500' },
    { id: 'life-time', label: 'Life Time', icon: Clock, color: 'text-rose-500' },
    { id: 'load-board', label: 'Load Board', icon: Layers, color: 'text-indigo-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-zinc-500' },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'data-management', label: 'Data Management', icon: DatabaseBackup, color: 'text-zinc-500' });
    menuItems.push({ id: 'users', label: 'User Management', icon: Users, color: 'text-zinc-500' });
    menuItems.push({ id: 'audit-logs', label: 'Audit Logs', icon: Clock, color: 'text-zinc-500' });
  }

  const handleLogout = () => signOut(auth);

  return (
    <div className="flex h-screen bg-[#E4E3E0] font-sans text-[#141414]">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r border-zinc-200 bg-white transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-6">
          {isSidebarOpen ? (
            <h2 className="font-serif text-xl italic tracking-tight">Tooling Master</h2>
          ) : (
            <LayoutDashboard className="h-6 w-6" />
          )}
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                activeTab === item.id 
                  ? "bg-[#141414] text-white shadow-lg shadow-black/10" 
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-[#141414]"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", activeTab === item.id ? "text-white" : item.color)} />
              {isSidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              {isSidebarOpen && activeTab === item.id && <ChevronRight className="h-4 w-4 opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div className="mb-4 flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
              <Users className="h-4 w-4 text-zinc-500" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">{role || 'User'}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-all hover:bg-red-50",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto w-full max-w-[98%]">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-4xl italic tracking-tight">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 uppercase tracking-widest">
                System / {activeTab.replace('-', ' ')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 ring-1 ring-black/5">
                  <ShieldCheck className="h-4 w-4 text-zinc-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Admin Mode</span>
                </div>
              )}
              <div className="h-10 w-10 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
            </div>
          </header>

          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            {activeTab === 'product' && <ProductInfo isAdmin={isAdmin} />}
            {activeTab === 'socket' && <SocketInfo isAdmin={isAdmin} />}
            {activeTab === 'change-kit' && <ChangeKitInfo isAdmin={isAdmin} />}
            {activeTab === 'pogo-pin' && <PogoPinInfo isAdmin={isAdmin} />}
            {activeTab === 'life-time' && <LifeTimeInfo isAdmin={isAdmin} />}
            {activeTab === 'load-board' && <LoadBoardInfo isAdmin={isAdmin} />}
            {activeTab === 'data-management' && <DataManagement />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'audit-logs' && <AuditLogs />}
          </div>
        </div>
      </main>
    </div>
  );
}
