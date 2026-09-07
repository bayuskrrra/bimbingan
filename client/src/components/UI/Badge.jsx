import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    darkRed: 'bg-red-700 text-white border-red-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantClasses[variant] || variantClasses.default} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const ZoneBadge = ({ zoneInfo, size = 'md' }) => {
  if (!zoneInfo) return null;

  let variant = 'default';
  if (zoneInfo.zone === 'AMAN') variant = 'success';
  else if (zoneInfo.zone === 'PERINGATAN_1') variant = 'primary';
  else if (zoneInfo.zone === 'SANKSI_RINGAN' || zoneInfo.zone === 'SURAT_WALAS') variant = 'warning';
  else if (zoneInfo.zone === 'SURAT_BK' || zoneInfo.zone === 'SURAT_KEPSEK') variant = 'danger';
  else if (zoneInfo.zone === 'SKORSING_RUMAH' || zoneInfo.zone === 'DIKELUARKAN') variant = 'darkRed';

  return (
    <Badge variant={variant} size={size}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: zoneInfo.ringColor || '#64748b' }}
      />
      {zoneInfo.label}
    </Badge>
  );
};

export const StatusKasusBadge = ({ status, size = 'md' }) => {
  const map = {
    BARU: { label: 'Kasus Baru', variant: 'danger' },
    PROSES: { label: 'Dalam Pembinaan / Mediasi', variant: 'warning' },
    SELESAI: { label: 'Selesai / Ditutup', variant: 'success' },
  };

  const item = map[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={item.variant} size={size}>
      {item.label}
    </Badge>
  );
};

export const KategoriPelanggaranBadge = ({ kategori = '', size = 'md' }) => {
  if (kategori.includes('KERAJINAN') || kategori.includes('A.')) {
    return (
      <Badge variant="primary" size={size}>
        A. Kerajinan
      </Badge>
    );
  }
  if (kategori.includes('KELAKUAN') || kategori.includes('B.')) {
    return (
      <Badge variant="danger" size={size}>
        B. Kelakuan
      </Badge>
    );
  }
  if (kategori.includes('KERAPIAN') || kategori.includes('C.')) {
    return (
      <Badge variant="warning" size={size}>
        C. Kerapian
      </Badge>
    );
  }

  return (
    <Badge variant="default" size={size}>
      {kategori}
    </Badge>
  );
};
