import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Package, Loader2 } from 'lucide-react';
import { fetchItemsService } from '../services/fetchItemsService';
import type { Item } from '../services/fetchItemsService';

interface DashboardProps {
  navigate: (page: string) => void;
}

export function Dashboard({ navigate }: DashboardProps) {
 const [userReports, setUserReports] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        const items = await fetchItemsService.fetchMyItems();
        if (isMounted) {
          setUserReports(items);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load your reports. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex-1 bg-[#FAF6EC] text-[#0E0D0B] min-h-screen">
      {/* Header Area */}
      <div className="border-b border-[#0E0D0B]/10 px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase tracking-widest mb-1">
            Campus Lost & Found Portal
          </div>
          <h1 className="text-3xl font-black text-[#0E0D0B]" style={{ fontFamily: 'Fraunces, serif' }}>
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('matches')}
            className="border border-[#0E0D0B]/20 px-4 py-2 font-mono text-xs uppercase tracking-wider bg-white hover:bg-[#0E0D0B]/5 transition-colors flex items-center gap-1.5"
          >
            <Search size={13} /> View Matches
          </button>
        </div>
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-8 py-6 border-b border-[#0E0D0B]/10">
        <div 
          onClick={() => navigate('report-lost')}
          className="border border-[#0E0D0B]/20 p-6 bg-[#FAF6EC] hover:border-[#D93B2B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#D93B2B] text-[#FAF6EC] font-bold uppercase">
              Lost Item
            </span>
            <PlusCircle size={16} className="text-[#0E0D0B]/65 group-hover:text-[#D93B2B] transition-colors" />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Report Something Lost</h3>
          <p className="text-xs text-[#0E0D0B]/70">Create a lost item entry with custom tags to automatically check against found items.</p>
        </div>

        <div 
          onClick={() => navigate('report-found')}
          className="border border-[#0E0D0B]/20 p-6 bg-[#FAF6EC] hover:border-[#06C167] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#06C167] text-[#0E0D0B] font-bold uppercase">
              Found Item
            </span>
            <PlusCircle size={16} className="text-[#0E0D0B]/65 group-hover:text-[#06C167] transition-colors" />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Report Something Found</h3>
          <p className="text-xs text-[#0E0D0B]/70">Turn in a found item safely through institutional verification and secure campus handovers.</p>
        </div>
      </div>

      {/* User's Active Reports Section */}
      <div className="px-8 py-6">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Your Active Reports</h2>
        
        {loading ? (
          <div className="border border-dashed border-[#0E0D0B]/20 p-12 text-center flex flex-col items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#0E0D0B]/65 mb-2" />
            <p className="font-mono text-xs text-[#0E0D0B]/65 uppercase tracking-widest">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="border border-dashed border-[#D93B2B]/40 p-6 text-center bg-[#D93B2B]/5">
            <p className="font-mono text-xs text-[#D93B2B] uppercase tracking-wider">{error}</p>
          </div>
        ) : userReports.length === 0 ? (
          <div className="border border-dashed border-[#0E0D0B]/20 p-12 text-center">
            <Package size={24} className="mx-auto text-[#0E0D0B]/40 mb-2" />
            <p className="font-mono text-xs text-[#0E0D0B]/65 uppercase tracking-widest">No active reports found.</p>
          </div>
        ) : (
          <div className="border border-[#0E0D0B]/20 divide-y divide-[#0E0D0B]/10 bg-white">
            {userReports.map(report => (
              <div key={report.id} className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-[10px] px-2 py-0.5 uppercase font-bold ${report.item_type === 'lost' ? 'bg-[#D93B2B] text-white' : 'bg-[#06C167] text-[#0E0D0B]'}`}>
                    {report.item_type}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm" style={{ fontFamily: 'Fraunces, serif' }}>{report.title}</h4>
                    <span className="font-mono text-[10px] text-[#0E0D0B]/65">
                      Location: {report.location_name} | Reported on: {new Date(report.event_timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] bg-[#0E0D0B]/5 px-2.5 py-1 text-[#0E0D0B] uppercase">
                    {report.category}
                  </span>
                  <button 
                    onClick={() => navigate('matches')}
                    className="font-mono text-[10px] uppercase underline text-[#0E0D0B] hover:text-[#D93B2B]"
                  >
                    View Matches →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}