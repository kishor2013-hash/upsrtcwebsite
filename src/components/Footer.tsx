import React from 'react';
import { AppSettings } from '../types';
import { Phone, Globe, Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC<{ settings: AppSettings }> = ({ settings }) => {
  const partnerName = settings.partner_name || 'Grofasto Digital Solutions';
  const tagline = settings.partner_tagline || 'GROW | CONNECT | SUCCEED.';
  const phone = settings.partner_phone || '+91 9457690255';
  const website = settings.partner_website || 'www.grofasto.com';
  const cleanWebsite = website.startsWith('http') ? website : `https://${website}`;

  return (
    <footer className="mt-auto bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Government / Enterprise Portal Notice */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-300 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>उत्तर प्रदेश राज्य सड़क परिवहन निगम (UPSRCTC)</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Digital Duty Portal V4.0 • Enterprise Cloud Architecture • Hostinger Production
          </p>
        </div>

        {/* Technology Partner: Grofasto Digital Solutions */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Powered by <strong className="text-amber-400 font-bold">{partnerName}</strong></span>
          </div>
          <p className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold mt-0.5">
            {tagline}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
            <a 
              href={`tel:${phone.replace(/\s+/g, '')}`} 
              className="flex items-center gap-1 hover:text-amber-400 transition"
            >
              <Phone className="w-3 h-3 text-amber-500" />
              <span>{phone}</span>
            </a>
            <span className="text-slate-700">•</span>
            <a 
              href={cleanWebsite} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1 hover:text-amber-400 transition font-mono"
            >
              <Globe className="w-3 h-3 text-amber-500" />
              <span>{website.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
