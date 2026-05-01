import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { CheckCircle, XCircle, X, Clock, History } from 'lucide-react';

const statusBadge = s => {
  const m = { Pending:'badge-pending', Approved:'badge-approved', Rejected:'badge-rejected', Cancelled:'badge-closed' };
  return <span className={`badge ${m[s]||'badge-closed'}`}>{s}</span>;
};

const typeBadge = type => {
  const labels = {
    Resource_Distribution: { label:'Resource', color:'#2563EB' },
    Rescue_Deployment:     { label:'Rescue Deployment', color:'#C8102E' },
    Financial_Approval:    { label:'Financial', color:'#059669' },
  };
  const t = labels[type] || { label:type, color:'#6B7280' };
  return <span style={{background:`${t.color}18`,color:t.color,padding:'0.2rem 0.65rem',borderRadius:'6px',fontSize:'0.75rem',fontWeight:700}}>{t.label}</span>;
};

/* ── Decision Modal ─────────────────────────────── */
const DecisionModal = ({ request, onClose, onDecided }) => {
  const [decision, setDecision] = useState('Approved');
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post(`/approvals/${request.request_id}/decide`, { decision, notes });
      onDecided(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Decision failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:'460px'}}>
        <div className="modal-header">
          <h3 style={{margin:0}}>Process Request #{request.request_id}</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}

        {/* Request summary card */}
        <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1rem',marginBottom:'1.25rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',fontSize:'0.85rem'}}>
            <div><span style={{color:'#9CA3AF'}}>Type:</span> {typeBadge(request.request_type)}</div>
            <div><span style={{color:'#9CA3AF'}}>Ref ID:</span> <strong>#{request.reference_id}</strong></div>
            <div><span style={{color:'#9CA3AF'}}>Requested by:</span> <strong>{request.requested_by_user}</strong></div>
            <div><span style={{color:'#9CA3AF'}}>Role:</span> {request.requester_role?.replace(/_/g,' ')}</div>
            <div style={{gridColumn:'1/-1'}}><span style={{color:'#9CA3AF'}}>Submitted:</span> {new Date(request.requested_at).toLocaleString()}</div>
            {request.notes && <div style={{gridColumn:'1/-1'}}><span style={{color:'#9CA3AF'}}>Notes:</span> {request.notes}</div>}
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Your Decision <span>*</span></label>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button type="button"
                onClick={()=>setDecision('Approved')}
                style={{
                  flex:1, padding:'0.75rem', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit',
                  fontWeight:700, fontSize:'0.875rem', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                  border: decision==='Approved' ? '2px solid #059669' : '2px solid #E5E7EB',
                  background: decision==='Approved' ? '#D1FAE5' : '#F9FAFB',
                  color: decision==='Approved' ? '#065F46' : '#6B7280',
                }}
              >
                <CheckCircle size={18}/> Approve
              </button>
              <button type="button"
                onClick={()=>setDecision('Rejected')}
                style={{
                  flex:1, padding:'0.75rem', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit',
                  fontWeight:700, fontSize:'0.875rem', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                  border: decision==='Rejected' ? '2px solid #C8102E' : '2px solid #E5E7EB',
                  background: decision==='Rejected' ? '#FEE2E2' : '#F9FAFB',
                  color: decision==='Rejected' ? '#991B1B' : '#6B7280',
                }}
              >
                <XCircle size={18}/> Reject
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes / Reason</label>
            <textarea className="form-textarea" placeholder="Optional notes for this decision…" value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className={`btn ${decision==='Approved'?'btn-success':'btn-danger'}`}
              disabled={loading}
            >
              {loading ? 'Processing…' : `Confirm ${decision}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Approvals Page ────────────────────────── */
const Approvals = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab]               = useState('pending');
  const [pending, setPending]       = useState([]);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [decisionModal, setDecisionModal] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const isAdmin = user?.role === 'Administrator';

  const loadPending = () => {
    setLoading(true);
    api.get('/approvals/pending').then(r=>setPending(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };
  const loadHistory = () => {
    setLoading(true);
    api.get('/approvals/history').then(r=>setHistory(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(() => {
    if (tab==='pending') loadPending();
    else loadHistory();
  }, [tab]);

  const filteredPending = typeFilter ? pending.filter(p=>p.request_type===typeFilter) : pending;
  const filteredHistory = typeFilter ? history.filter(h=>h.request_type===typeFilter) : history;

  const pendingCount = pending.length;
  const approvedCount = history.filter(h=>h.status==='Approved').length;
  const rejectedCount = history.filter(h=>h.status==='Rejected').length;

  return (
    <PageLayout
      title="Approvals"
      subtitle="Review and process pending system requests across all modules"
    >
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6" style={{marginBottom:'1.25rem'}}>
        <div className="stat-card" style={{'--accent-color':'#D97706'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Pending Approvals</p>
              <p style={{fontSize:'2rem',fontWeight:800,margin:0,color:pendingCount>0?'#D97706':'#111827'}}>{pendingCount}</p>
            </div>
            <div style={{padding:'0.75rem',background:'#FEF3C7',borderRadius:'10px',color:'#D97706'}}><Clock size={22}/></div>
          </div>
        </div>
        <div className="stat-card" style={{'--accent-color':'#059669'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Approved (All Time)</p>
              <p style={{fontSize:'2rem',fontWeight:800,margin:0}}>{approvedCount}</p>
            </div>
            <div style={{padding:'0.75rem',background:'#D1FAE5',borderRadius:'10px',color:'#059669'}}><CheckCircle size={22}/></div>
          </div>
        </div>
        <div className="stat-card" style={{'--accent-color':'#C8102E'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Rejected (All Time)</p>
              <p style={{fontSize:'2rem',fontWeight:800,margin:0}}>{rejectedCount}</p>
            </div>
            <div style={{padding:'0.75rem',background:'#FEE2E2',borderRadius:'10px',color:'#C8102E'}}><XCircle size={22}/></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${tab==='pending'?' active':''}`} onClick={()=>setTab('pending')}>
          Pending {pendingCount > 0 && <span style={{background:'#C8102E',color:'#fff',borderRadius:'9999px',padding:'0.1rem 0.45rem',fontSize:'0.7rem',marginLeft:'0.35rem'}}>{pendingCount}</span>}
        </button>
        {isAdmin && <button className={`tab-btn${tab==='history'?' active':''}`} onClick={()=>setTab('history')}><History size={14} style={{marginRight:'0.3rem'}}/>History</button>}
      </div>

      {/* Filter */}
      <div className="card" style={{marginBottom:'1rem',padding:'0.875rem 1.25rem'}}>
        <div className="filter-row" style={{marginBottom:0}}>
          <select className="form-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="">All Request Types</option>
            <option value="Resource_Distribution">Resource Distribution</option>
            <option value="Rescue_Deployment">Rescue Deployment</option>
            <option value="Financial_Approval">Financial Approval</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner"/> : tab==='pending' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Ref ID</th>
                  <th>Requested By</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map(a=>(
                  <tr key={a.request_id}>
                    <td><strong>#{a.request_id}</strong></td>
                    <td>{typeBadge(a.request_type)}</td>
                    <td style={{color:'#6B7280'}}>#{a.reference_id}</td>
                    <td style={{fontWeight:600}}>{a.requested_by_user}</td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem'}}>{a.requester_role?.replace(/_/g,' ')}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem'}}>{new Date(a.requested_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={()=>setDecisionModal(a)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPending.length===0&&(
                  <tr><td colSpan={8} style={{textAlign:'center',padding:'3rem'}}>
                    <CheckCircle size={36} style={{display:'block',margin:'0 auto 0.75rem',color:'#A7F3D0'}}/>
                    <p style={{color:'#9CA3AF',margin:0}}>No pending approvals. All caught up!</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Ref ID</th>
                  <th>Requested By</th>
                  <th>Decided By</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Decided At</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(a=>(
                  <tr key={a.request_id}>
                    <td><strong>#{a.request_id}</strong></td>
                    <td>{typeBadge(a.request_type)}</td>
                    <td style={{color:'#6B7280'}}>#{a.reference_id}</td>
                    <td style={{fontWeight:600}}>{a.requested_by_name}</td>
                    <td style={{color:'#6B7280'}}>{a.approved_by_name||'—'}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem',maxWidth:'160px'}}>{a.notes||'—'}</td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem'}}>{a.decided_at ? new Date(a.decided_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {filteredHistory.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>No history found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {decisionModal && (
        <DecisionModal
          request={decisionModal}
          onClose={()=>setDecisionModal(null)}
          onDecided={()=>{ loadPending(); if(tab==='history') loadHistory(); }}
        />
      )}
    </PageLayout>
  );
};

export default Approvals;
