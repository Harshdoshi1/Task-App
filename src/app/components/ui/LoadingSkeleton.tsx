import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
      <div className="h-6 bg-slate-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
        <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
        <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/3 mb-3"></div>
      <div className="h-8 bg-slate-700 rounded w-1/2"></div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-3.5"><div className="h-4 bg-slate-700 rounded w-3/4"></div></td>
      <td className="px-6 py-3.5"><div className="h-4 bg-slate-700 rounded w-24"></div></td>
      <td className="px-6 py-3.5"><div className="h-5 w-16 bg-slate-700 rounded"></div></td>
      <td className="px-6 py-3.5"><div className="h-5 w-20 bg-slate-700 rounded"></div></td>
      <td className="px-6 py-3.5"><div className="h-4 bg-slate-700 rounded w-20"></div></td>
    </tr>
  );
}