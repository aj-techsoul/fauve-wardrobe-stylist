'use client';
import React, { useState, useEffect } from 'react';
import { Share2, Clock, CheckCircle2, XCircle, Send, UserCheck, ShieldAlert } from 'lucide-react';

interface AccessManagerProps {
  currentUser: any;
  otherWardrobes: any[];
  sharedAccess: any[];
}

export function AccessManager({ currentUser, otherWardrobes, sharedAccess }: AccessManagerProps) {
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<{ [key: string]: number }>({});

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.incomingRequests) setIncomingRequests(data.incomingRequests);
      if (data.outgoingRequests) setOutgoingRequests(data.outgoingRequests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const sendAccessRequest = async (wardrobeId: string) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardrobeId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Access request sent successfully!');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      alert('Error sending request');
    }
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'reject' | 'limit', hours?: number) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, durationHours: hours })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Permission updated successfully!');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to update request');
      }
    } catch (err) {
      alert('Error updating request');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="font-serif text-2xl font-bold gold-gradient-text">Wardrobe Access & Sharing Studio</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Request access to wardrobes owned by friends, or manage permissions (accept, reject, or set timed access limits).
        </p>
      </div>

      {/* Incoming Requests Section (Owner Dashboard) */}
      <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
            Pending Access Requests for Your Wardrobe
          </h3>
        </div>

        {incomingRequests.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No pending access requests for your wardrobes.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req) => (
              <div key={req.id} className="glass-card p-4 rounded-xl border border-zinc-700/60 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{req.requester_name}</h4>
                    <p className="text-[10px] text-zinc-400">{req.requester_email}</p>
                    <p className="text-xs text-amber-400/90 mt-1">Requesting: {req.wardrobe_name}</p>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Pending
                  </span>
                </div>

                {/* Timed Access selector */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-zinc-400 text-[11px]">Set Timed Access:</span>
                  <select
                    value={selectedDuration[req.id] || 24}
                    onChange={(e) => setSelectedDuration({ ...selectedDuration, [req.id]: parseInt(e.target.value) })}
                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:border-amber-400"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={6}>6 Hours</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={72}>3 Days</option>
                    <option value={168}>7 Days</option>
                    <option value={0}>Unlimited</option>
                  </select>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      const hrs = selectedDuration[req.id] !== undefined ? selectedDuration[req.id] : 24;
                      respondToRequest(req.id, hrs > 0 ? 'limit' : 'accept', hrs);
                    }}
                    className="flex-1 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Grant Access</span>
                  </button>

                  <button
                    onClick={() => respondToRequest(req.id, 'reject')}
                    className="px-4 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explore & Request Other Wardrobes */}
      <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Share2 className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
            Explore Community Wardrobes
          </h3>
        </div>

        {otherWardrobes.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No external wardrobes available at this time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {otherWardrobes.map((wdb) => {
              const isGranted = wdb.request_status === 'accepted';
              const isPending = wdb.request_status === 'pending';

              return (
                <div key={wdb.id} className="glass-card p-4 rounded-xl border border-zinc-800 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-sm font-serif font-bold text-zinc-200">{wdb.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Owner: {wdb.owner_name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-2">{wdb.description || 'Collection of premium attire'}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80">
                    {isGranted ? (
                      <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                        <span className="flex items-center space-x-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Access Granted</span>
                        </span>
                        {wdb.granted_until && (
                          <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Until {new Date(wdb.granted_until).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    ) : isPending ? (
                      <span className="text-xs text-amber-400 font-medium flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Request Pending Owner Approval</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => sendAccessRequest(wdb.id)}
                        className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Access Request</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
