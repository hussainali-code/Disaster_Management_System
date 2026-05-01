import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, RefreshCw, AlertTriangle } from 'lucide-react';

/* ── Helpers ──────────────────────────────────── */
const severityBadge = s => {
  const m = { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' };
  return <span className={`badge ${m[s]||'badge-low'}`}>{s}</span>;
};
const statusBadge = s => {
  const m = { Pending:'badge-pending', Assigned:'badge-assigned', InProgress:'badge-inprogress', Resolved:'badge-resolved', Closed:'badge-closed' };
  return <span className={`badge ${m[s]||'badge-closed'}`}>{s}</span>;
};

/* ── Create Report Modal ──────────────────────── */
const CreateReportModal = ({ events, onClose, onCreated }) => {
  const [form, setForm] = useState({ location:'', disaster_type:'Flood', severity:'Medium', reporter_contact:'', event_id:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/reports', form);
      onCreated();
      onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Failed to create report'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Log New Incident Report</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Location <span>*</span></label>
            <input className="form-input" placeholder="e.g. Sukkur, Sindh" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Disaster Type <span>*</span></label>
              <select className="form-select" value={form.disaster_type} onChange={e=>setForm({...form,disaster_type:e.target.value})}>
                {['Flood','Earthquake','Fire','Landslide','Cyclone','Other'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Severity <span>*</span></label>
              <select className="form-select" value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}>
                {['Low','Medium','High','Critical'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Link to Disaster Event</label>
            <select className="form-select" value={form.event_id} onChange={e=>setForm({...form,event_id:e.target.value})}>
              <option value="">— None —</option>
              {events.map(ev=><option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reporter Contact</label>
            <input className="form-input" placeholder="Phone number (optional)" value={form.reporter_contact} onChange={e=>setForm({...form,reporter_contact:e.target.value})} />
          </div>
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Submitting…':'Submit Report'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Assign Team Modal ────────────────────────── */
const AssignTeamModal = ({ reportId, onClose, onAssigned }) => {
  const [teams, setTeams]       = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  useEffect(() => {
    api.get('/teams?status=Available').then(r => setTeams(r.data.data || [])).catch(()=>setTeams([]));
  }, []);

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/teams/assign', { team_id: Number(selectedTeam), report_id: Number(reportId) });
      onAssigned();
      onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Assignment failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Assign Team to Report #{reportId}</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Select Available Team <span>*</span></label>
            {teams.length === 0
              ? <p style={{color:'#9CA3AF', fontSize:'0.875rem'}}>No available teams at the moment.</p>
              : <select className="form-select" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)} required>
                  <option value="">— Select team —</option>
                  {teams.map(t=><option key={t.team_id} value={t.team_id}>{t.team_name} ({t.team_type}) — {t.current_location}</option>)}
                </select>
            }
          </div>
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading||!selectedTeam}>{loading?'Assigning…':'Assign Team'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Update Status Modal ───────────────────────── */
const UpdateStatusModal = ({ report, onClose, onUpdated }) => {
  const [status, setStatus] = useState(report.status);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.patch(`/reports/${report.report_id}/status`, { status });
      onUpdated();
      onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:'380px'}}>
        <div className="modal-header">
          <h3 style={{margin:0}}>Update Report #{report.report_id} Status</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
              {['Pending','Assigned','InProgress','Resolved','Closed'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Updating…':'Update Status'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Incidents Page ────────────────────────── */
const Incidents = () => {
  const { user } = useContext(AuthContext);
  const [reports,  setReports]  = useState([]);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ severity:'', status:'', disaster_type:'' });
  const [showCreate, setShowCreate] = useState(false);
  const [assignModal, setAssignModal] = useState(null);  // report_id
  const [statusModal, setStatusModal] = useState(null);  // report obj

  const canManage   = ['Administrator','Emergency_Operator'].includes(user?.role);
  const canCreate   = true; // all roles can submit, even public

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.severity)     params.append('severity',     filter.severity);
    if (filter.status)       params.append('status',       filter.status);
    if (filter.disaster_type)params.append('disaster_type',filter.disaster_type);
    api.get(`/reports?${params.toString()}`)
      .then(r => setReports(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/events').then(r=>setEvents(r.data.data||[])).catch(()=>setEvents([]));
  }, [filter]);

  return (
    <PageLayout
      title="Incidents"
      subtitle="Emergency reports and active incident management"
      actions={
        canCreate && (
          <button className="btn btn-primary" onClick={()=>setShowCreate(true)}>
            <Plus size={16}/> Log New Report
          </button>
        )
      }
    >
      {/* Filters */}
      <div className="card" style={{marginBottom:'1.25rem', padding:'1rem 1.25rem'}}>
        <div className="filter-row">
          <select className="form-select" value={filter.severity} onChange={e=>setFilter({...filter,severity:e.target.value})}>
            <option value="">All Severities</option>
            {['Critical','High','Medium','Low'].map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="form-select" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>
            <option value="">All Statuses</option>
            {['Pending','Assigned','InProgress','Resolved','Closed'].map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="form-select" value={filter.disaster_type} onChange={e=>setFilter({...filter,disaster_type:e.target.value})}>
            <option value="">All Types</option>
            {['Flood','Earthquake','Fire','Landslide','Cyclone','Other'].map(t=><option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={()=>setFilter({severity:'',status:'',disaster_type:''})}><RefreshCw size={14}/> Reset</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assigned Team</th>
                  <th>Event</th>
                  <th>Reported At</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.report_id}>
                    <td><strong>#{r.report_id}</strong></td>
                    <td>{r.location}</td>
                    <td><span className={`badge badge-${r.disaster_type.toLowerCase()}`} style={{background:'#FEF3C7',color:'#92400E'}}>{r.disaster_type}</span></td>
                    <td>{severityBadge(r.severity)}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{r.team_name ? <span style={{color:'#2563EB',fontWeight:600}}>{r.team_name}</span> : <span style={{color:'#9CA3AF'}}>—</span>}</td>
                    <td style={{fontSize:'0.8rem',color:'#6B7280'}}>{r.event_name||'—'}</td>
                    <td style={{fontSize:'0.8rem',color:'#6B7280'}}>{new Date(r.reported_at).toLocaleString()}</td>
                    {canManage && (
                      <td>
                        <div style={{display:'flex',gap:'0.4rem'}}>
                          {r.status === 'Pending' && (
                            <button className="btn btn-primary btn-sm" onClick={()=>setAssignModal(r.report_id)}>Assign Team</button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={()=>setStatusModal(r)}>Status</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={canManage?9:8} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>
                    <AlertTriangle size={32} style={{marginBottom:'0.5rem',opacity:0.4,display:'block',margin:'0 auto 0.5rem'}}/> No incidents found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate   && <CreateReportModal    events={events}   onClose={()=>setShowCreate(false)}   onCreated={load} />}
      {assignModal  && <AssignTeamModal      reportId={assignModal} onClose={()=>setAssignModal(null)}  onAssigned={load} />}
      {statusModal  && <UpdateStatusModal    report={statusModal}   onClose={()=>setStatusModal(null)}  onUpdated={load} />}
    </PageLayout>
  );
};

export default Incidents;
