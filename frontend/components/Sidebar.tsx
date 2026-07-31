"use client";

import { useState } from "react";
import { FileStack, LayoutGrid, Package, User, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { clearToken } from "@/lib/api";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <aside className={`flex shrink-0 flex-col gap-6 border-r border-slate-200 bg-ink-950 py-4 transition-all duration-300 ${isExpanded ? 'w-64 px-3 items-stretch' : 'w-14 items-center'}`}>
      <div
        className={`mb-4 flex items-center ${isExpanded ? 'justify-start px-2' : 'justify-center'}`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500 font-mono text-xs font-bold text-white">
          3M
        </div>
        {isExpanded && <span className="ml-3 truncate font-bold text-white">Three Way Match</span>}
      </div>

      <SidebarItem Icon={LayoutGrid} title="Purchase Orders" active={pathname === '/' } onClick={() => router.push('/')} isExpanded={isExpanded} />
      <SidebarItem Icon={FileStack} title="Documents" active={pathname.startsWith('/documents')} onClick={() => router.push('/documents')} isExpanded={isExpanded} />
      <SidebarItem Icon={Package} title="SKU Master" active={pathname.startsWith('/masters')} onClick={() => router.push('/masters')} isExpanded={isExpanded} />

      <div className="mt-auto flex flex-col gap-1">
        <SidebarItem Icon={User} title="Profile" active={pathname.startsWith('/profile')} onClick={() => router.push('/profile')} isExpanded={isExpanded} />
        <SidebarItem Icon={LogOut} title="Log out" onClick={logout} isExpanded={isExpanded} />
      </div>
    </aside>
  );
}

function SidebarItem({
  Icon,
  title,
  active,
  onClick,
  isExpanded,
}: {
  Icon: typeof LayoutGrid;
  title: string;
  active?: boolean;
  onClick?: () => void;
  isExpanded?: boolean;
}) {
  return (
    <button
      title={isExpanded ? undefined : title}
      onClick={onClick}
      className={`flex h-9 items-center rounded-md transition-colors ${isExpanded ? 'w-full px-2 justify-start' : 'w-9 justify-center'} ${
        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      {isExpanded && <span className="ml-3 truncate text-sm font-medium">{title}</span>}
    </button>
  );
}
