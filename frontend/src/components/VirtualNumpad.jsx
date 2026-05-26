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
      <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-850 shadow-inner">
        {keys.map((row, rowIdx) => (
          <React.Fragment key={rowIdx}>
            {row.map((key) => {
              const isDelete = key === '⌫';
              const isMinus = key === '-';
              
              return (
                <motion.button
                  key={key}
                  type="button"
                  whileTap={!disabled ? { scale: 0.94 } : {}}
                  onClick={() => handleKeyPress(key)}
                  disabled={disabled}
                  className={`h-14 rounded-xl flex items-center justify-center font-bold text-lg border transition-all ${
                    disabled
                      ? 'bg-slate-900 border-slate-900 text-slate-700'
                      : isDelete
                      ? 'bg-rose-950/20 border-rose-900/20 hover:border-rose-900/40 text-rose-400 active:bg-rose-950/40'
                      : isMinus
                      ? 'bg-slate-800 border-slate-750 text-cyan-400 hover:border-slate-600'
                      : 'bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-200 active:bg-slate-800'
                  }`}
                >
                  {isDelete ? <Delete className="w-5 h-5" /> : key}
                </motion.button>
              );
            })}
          </React.Fragment>
        ))}

        {/* Action Keys */}
        <motion.button
          type="button"
          whileTap={!disabled && value !== '' ? { scale: 0.96 } : {}}
          onClick={() => handleKeyPress('C')}
          disabled={disabled || value === ''}
          className="col-span-1 h-12 rounded-xl flex items-center justify-center font-semibold text-xs border border-slate-800/80 bg-slate-900 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Clear
        </motion.button>

        <motion.button
          type="button"
          whileTap={!disabled && value !== '' && value !== '-' ? { scale: 0.96 } : {}}
          onClick={onSubmit}
          disabled={disabled || value === '' || value === '-'}
          className="col-span-2 h-12 rounded-xl flex items-center justify-center font-bold text-sm bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 shadow-md shadow-cyan-950/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          Submit
          <CornerDownLeft className="w-4 h-4 ml-1.5" />
        </motion.button>
      </div>
    </div>
  );
}
