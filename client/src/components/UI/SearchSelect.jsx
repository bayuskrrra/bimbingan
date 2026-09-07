import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, User } from 'lucide-react';
import { ZoneBadge } from './Badge';

export const SearchSelectSiswa = ({
  options = [],
  value,
  onChange,
  placeholder = 'Ketik nama atau NIS siswa...',
  label = 'Pilih Siswa',
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const selectedItem = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>}

      {selectedItem && !isOpen ? (
        <div className="flex items-center justify-between p-3 border border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
              {selectedItem.nama.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{selectedItem.nama}</div>
              <div className="text-xs text-slate-500">
                NIS: {selectedItem.nis} | Kelas: {selectedItem.kelas} | Total Poin: {selectedItem.totalPoin || 0}
              </div>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSearchTerm('');
                setIsOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              disabled={disabled}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                error ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 focus:border-primary-500'
              } focus:ring-2 focus:ring-primary-100 text-sm outline-none transition`}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {isOpen && (
            <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Tidak ditemukan siswa dengan kata kunci "{searchTerm}"
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.id === value;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        onChange(opt.id);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`flex items-center justify-between p-3 cursor-pointer transition text-sm ${
                        isSelected ? 'bg-primary-50 text-primary-900 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="font-medium text-slate-900">{opt.nama}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            ({opt.kelas} - {opt.nis})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {opt.zoneInfo && <ZoneBadge zoneInfo={opt.zoneInfo} size="sm" />}
                        {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
    </div>
  );
};
