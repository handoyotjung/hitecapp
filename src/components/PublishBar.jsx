import React from 'react';

export default function PublishBar({position = 'fixed', confirmCount = 0, onExport}) {
  const buttons = [
    {key: 'confirm', label: `Confirm (${confirmCount})`, icon: '✓'},
    {key: 'ppt', label: 'PPT', icon: 'P'},
    {key: 'word', label: 'Word', icon: 'W'},
    {key: 'excel', label: 'Excel', icon: 'X'},
  ];

  const isFixed = position === 'fixed';
  return (
    <div className={`w-full bg-[#1F2937]/90 backdrop-blur border-t border-[#2B2B2B] ${isFixed ? 'fixed bottom-0 left-0 right-0 z-50 pb-safe' : 'flex-shrink-0 mt-auto'}`}>
      <div className="flex h-14">
        {buttons.map(btn => (
          <button
            key={btn.key}
            type="button"
            onClick={() => onExport(btn.key)}
            className="flex-1 flex flex-col items-center justify-center text-[10px] md:text-xs hover:bg-[#2B2B2B] text-slate-200 transition active:scale-[0.98]"
          >
            <div className="text-lg font-bold">{btn.icon}</div>
            <div className="truncate">{btn.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
