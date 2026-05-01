import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, CheckCircle, Users } from 'lucide-react';

const statusBadge = s => {
  const m = { Available:'badge-available', Assigned:'badge-assigned', Busy:'badge-critical', Completed:'badge-resolved', Offline:'badge-closed' };
  return <span className={`badge ${m[s]||'badge-closed'}`}>{s}</span>;
};
const typeBadge = t => {
  const colors = { Medical:'#059669', Fire:'#C8102E', Rescue:'#2563EB', Search:'#D97706' };
  const c = colors[t]||'#6B7280';
  return <span style={{background:`${c}18`,color:c,padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.75rem',fontWeight:700}}>{t}</span>;
};

/* ── Create Team Modal ─────────────────────────── */
const CreateTeamModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ team_name:'', team_type:'Medical', current_location:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/teams', form);
      onCreated(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Failed to create team'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Create New Rescue Team</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Team Name <span>*</span></label>
            <input className="form-input" placeholder="e.g. Echo Medical Unit" value={form.team_name} onChange={e=>setForm({...form,team_name:e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Team Type <span>*</span></label>
              <select className="form-select" value={form.team_type} onChange={e=>setForm({...form,team_type:e.target.value})}>
                {['Medical','Fire','Rescue','Search'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Current Location <span>*</span></label>
              <input className="form-input" placeholder="e.g. Islamabad Base" value={form.current_location} onChange={e=>setForm({...form,current_location:e.target.value})} required />
            </div>
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Creating…':'Create Team'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Assign to Incident Modal ──────────────────── */
const AssignToIncidentModal = ({ team, onClose, onAssigned }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/reports?status=Pending').then(r => setReports(r.data.data || [])).catch(()=>setReports([]));
  }, []);

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/teams/assign', { team_id: team.team_id, report_id: Number(selectedReport) });
      onAssigned(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Assignment failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Assign <em>{team.team_name}</em> to Incident</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Select Pending Report <span>*</span></label>
            {reports.length === 0
              ? <p style={{color:'#9CA3AF',fontSize:'0.875rem'}}>No pending reports available.</p>
              : <select className="form-select" value={selectedReport} onChange={e=>setSelectedReport(e.target.value)} required>
                  <option value="">— Select incident report —</option>
                  {reports.map(r=><option key={r.report_id} value={r.report_id}>#{r.report_id} — {r.location} ({r.severity})</option>)}
                </select>
            }
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading||!selectedReport}>{loading?'Assigning…':'Assign'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Complete Assignment Modal ─────────────────── */
const CompleteModal = ({ team, onClose, onCompleted }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/teams/status-board').then(r => {
      const active = (r.data.data || []).filter(a => a.team_id === team.team_id && a.assignment_id && ['Assigned','InProgress'].includes(a.assignment_status));
      setAssignments(active);
    }).catch(()=>setAssignments([]));
  }, []);

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.patch('/teams/complete', { assignment_id: Number(selectedAssignment) });
      onCompleted(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:'400px'}}>
        <div className="modal-header">
          <h3 style={{margin:0}}>Complete Assignment</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Select Assignment</label>
            {assignments.length === 0
              ? <p style={{color:'#9CA3AF',fontSize:'0.875rem'}}>No active assignments for this team.</p>
              : <select className="form-select" value={selectedAssignment} onChange={e=>setSelectedAssignment(e.target.value)} required>
                  <option value="">— Select —</option>
                  {assignments.map(a=><option key={a.assignment_id} value={a.assignment_id}>Assignment #{a.assignment_id} at {a.incident_location}</option>)}
                </select>
            }
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading||!selectedAssignment}>{loading?'Completing…':'Mark Complete'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Teams Page ────────────────────────────── */
const Teams = () => {
  const { user } = useContext(AuthContext);
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal]   = useState(false);
  const [assignModal, setAssignModal]   = useState(null);
  const [completeModal, setCompleteModal] = useState(null);

  const isAdmin    = user?.role === 'Administrator';
  const isOperator = user?.role === 'Emergency_Operator';
  const isField    = user?.role === 'Field_Officer';
  const canAssign  = isAdmin || isOperator;
  const canCreate  = isAdmin;
  const canComplete= isAdmin || isOperator || isField;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter)   params.append('team_type', typeFilter);
    if (statusFilter) params.append('status', statusFilter);
    api.get(`/teams?${params.toString()}`)
      .then(r => setTeams(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const stats = {
    total: teams.length,
    available: teams.filter(t=>t.availability_status==='Available').length,
    assigned: teams.filter(t=>t.availability_status==='Assigned').length,
    busy: teams.filter(t=>t.availability_status==='Busy').length,
  };

  return (
    <PageLayout
      title="Rescue Teams"
      subtitle="Manage and deploy rescue teams across active incidents"
      actions={canCreate && <button className="btn btn-primary" onClick={()=>setCreateModal(true)}><Plus size={16}/> New Team</button>}
    >
      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-6" style={{marginBottom:'1.25rem'}}>
        {[
          {label:'Total Teams',   val:stats.total,    color:'#6B7280'},
          {label:'Available',     val:stats.available, color:'#059669'},
          {label:'Assigned',      val:stats.assigned,  color:'#2563EB'},
          {label:'Busy',          val:stats.busy,      color:'#C8102E'},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{'--accent-color':s.color}}>
            <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>{s.label}</p>
            <p style={{fontSize:'2rem',fontWeight:800,color:'#111827',margin:0}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card" style={{marginBottom:'1.25rem',padding:'1rem 1.25rem'}}>
        <div className="filter-row">
          <select className="form-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {['Medical','Fire','Rescue','Search'].map(t=><option key={t}>{t}</option>)}
          </select>
          <select className="form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['Available','Assigned','Busy','Offline'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner"/> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Team Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.team_id}>
                    <td><strong>#{t.team_id}</strong></td>
                    <td><span style={{fontWeight:600}}>{t.team_name}</span></td>
                    <td>{typeBadge(t.team_type)}</td>
                    <td style={{color:'#6B7280',fontSize:'0.875rem'}}>{t.current_location}</td>
                    <td>{statusBadge(t.availability_status)}</td>
                    <td>
                      <div style={{display:'flex',gap:'0.4rem'}}>
                        {canAssign && t.availability_status === 'Available' && (
                          <button className="btn btn-primary btn-sm" onClick={()=>setAssignModal(t)}>Assign to Incident</button>
                        )}
                        {canComplete && ['Assigned','Busy'].includes(t.availability_status) && (
                          <button className="btn btn-success btn-sm" onClick={()=>setCompleteModal(t)}><CheckCircle size={13}/> Complete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>
                    <Users size={32} style={{display:'block',margin:'0 auto 0.5rem',opacity:0.4}}/> No teams found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createModal  && <CreateTeamModal         onClose={()=>setCreateModal(false)}   onCreated={load} />}
      {assignModal  && <AssignToIncidentModal   team={assignModal}  onClose={()=>setAssignModal(null)}   onAssigned={load} />}
      {completeModal && <CompleteModal           team={completeModal} onClose={()=>setCompleteModal(null)} onCompleted={load} />}
    </PageLayout>
  );
};

export default Teams;
