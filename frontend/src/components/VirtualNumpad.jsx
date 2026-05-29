import React, { useEffect } from 'react';
import { Delete, CornerDownLeft, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VirtualNumpad({ value, onChange, onSubmit, disabled }) {
  
  // Handle physical keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;

      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        onChange(value + key);
      } else if (key === '-') {
        e.preventDefault();
        // Allow minus sign only at the beginning
        if (value === '') {
          onChange('-');
        }
      } else if (key === 'Backspace') {
        e.preventDefault();
        onChange(value.slice(0, -1));
      } else if (key === 'Enter') {
        e.preventDefault();
        if (value !== '' && value !== '-') {
          onSubmit();
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        onChange('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [value, onChange, onSubmit, disabled]);

  const handleKeyPress = (char) => {
    if (disabled) return;

    if (char === '⌫') {
      onChange(value.slice(0, -1));
    } else if (char === 'C') {
      onChange('');
    } else if (char === '-') {
      if (value === '') {
        onChange('-');
      }
    } else {
      // Append number digits
      onChange(value + char);
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['-', '0', '⌫']
  ];

  return (
    <div className="w-full max-w-sm mx-auto select-none no-select">
      <div className="grid grid-cols-3 gap-[1px] bg-white/10 p-[1px] rounded-2xl overflow-hidden shadow-2xl">
        {keys.map((row, rowIdx) => (
          <React.Fragment key={rowIdx}>
            {row.map((key) => {
              const isDelete = key === '⌫';
              const isMinus = key === '-';
              
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  disabled={disabled}
                  className={`h-16 flex items-center justify-center font-medium text-xl transition-colors ${
                    disabled
                      ? 'bg-black text-zinc-800'
                      : isDelete
                      ? 'bg-[#141414] hover:bg-[#1a1a1a] text-zinc-400 active:bg-zinc-800'
                      : isMinus
                      ? 'bg-[#141414] hover:bg-[#1a1a1a] text-indigo-400 active:bg-zinc-800'
                      : 'bg-[#1a1a1a] hover:bg-[#222222] text-white active:bg-zinc-800'
                  }`}
                >
                  {isDelete ? <Delete className="w-5 h-5" /> : key}
                </button>
              );
            })}
          </React.Fragment>
        ))}

        {/* Action Keys */}
        <button
          type="button"
          onClick={() => handleKeyPress('C')}
          disabled={disabled || value === ''}
          className="col-span-1 h-14 bg-[#141414] hover:bg-[#1a1a1a] flex items-center justify-center font-medium text-xs text-zinc-500 hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none active:bg-zinc-800"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Clear
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || value === '' || value === '-'}
          className="col-span-2 h-14 flex items-center justify-center font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:pointer-events-none active:bg-indigo-700"
        >
          Submit
          <CornerDownLeft className="w-4 h-4 ml-1.5 opacity-80" />
        </button>
      </div>
    </div>
  );
}
