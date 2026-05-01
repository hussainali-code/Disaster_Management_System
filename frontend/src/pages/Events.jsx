import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, RefreshCw, Globe } from 'lucide-react';

const typeBadge = type => {
  const colors = { Flood: '#2563EB', Earthquake: '#C8102E', Fire: '#D97706', Landslide: '#059669', Cyclone: '#7C3AED', Other: '#6B7280' };
  const c = colors[type] || '#6B7280';
  return <span style={{ background:`${c}18`, color:c, padding:'0.2rem 0.6rem', borderRadius:'6px', fontSize:'0.75rem', fontWeight:700 }}>{type}</span>;
};

const statusBadge = s => {
  const m = { Active:'badge-critical', Contained:'badge-medium', Closed:'badge-closed' };
  return <span className={`badge ${m[s]||'badge-closed'}`}>{s}</span>;
};

/* ── Create Event Modal ────────────────────────── */
const CreateEventModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ event_name:'', disaster_type:'Flood', location:'', start_date:'', status:'Active' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/events', form);
      onCreated(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Failed to create event'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Declare New Disaster Event</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Event Name <span>*</span></label>
            <input className="form-input" placeholder="e.g. Punjab Floods 2026" value={form.event_name} onChange={e=>setForm({...form,event_name:e.target.value})} required/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Disaster Type <span>*</span></label>
              <select className="form-select" value={form.disaster_type} onChange={e=>setForm({...form,disaster_type:e.target.value})}>
                {['Flood','Earthquake','Fire','Landslide','Cyclone','Other'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date <span>*</span></label>
              <input className="form-input" type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} required/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location <span>*</span></label>
            <input className="form-input" placeholder="e.g. Sindh, Pakistan" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required/>
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Creating…':'Declare Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Update Status Modal ─────────────────────────── */
const UpdateStatusModal = ({ event, onClose, onUpdated }) => {
  const [status, setStatus] = useState(event.status);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.patch(`/events/${event.event_id}/status`, { status });
      onUpdated(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:'380px'}}>
        <div className="modal-header">
          <h3 style={{margin:0}}>Update Event Status</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1rem',marginBottom:'1rem'}}>
          <p style={{margin:'0 0 0.25rem',fontWeight:700,color:'#111827'}}>{event.event_name}</p>
          <p style={{margin:0,fontSize:'0.8rem',color:'#6B7280'}}>{event.location} · {event.disaster_type}</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
              {['Active','Contained','Closed'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Updating…':'Update Status'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Events Page ───────────────────────────── */
const Events = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal]   = useState(false);
  const [statusModal, setStatusModal]   = useState(null);

  const canCreate       = ['Administrator','Emergency_Operator'].includes(user?.role);
  const canUpdateStatus = ['Administrator','Emergency_Operator'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.get('/events').then(r=>setEvents(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const filtered = events.filter(ev => {
    if (typeFilter   && ev.disaster_type !== typeFilter)   return false;
    if (statusFilter && ev.status        !== statusFilter) return false;
    return true;
  });

  const stats = {
    total:     events.length,
    active:    events.filter(e=>e.status==='Active').length,
    contained: events.filter(e=>e.status==='Contained').length,
    closed:    events.filter(e=>e.status==='Closed').length,
  };

  return (
    <PageLayout
      title="Disaster Events"
      subtitle="Declare, track, and manage active disaster events across the country"
      actions={canCreate && <button className="btn btn-primary" onClick={()=>setCreateModal(true)}><Plus size={16}/> Declare Event</button>}
    >
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6" style={{marginBottom:'1.25rem'}}>
        {[
          {label:'Total Events', val:stats.total,     color:'#6B7280'},
          {label:'Active',       val:stats.active,     color:'#C8102E'},
          {label:'Contained',    val:stats.contained,  color:'#D97706'},
          {label:'Closed',       val:stats.closed,     color:'#059669'},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{'--accent-color':s.color}}>
            <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>{s.label}</p>
            <p style={{fontSize:'2rem',fontWeight:800,color:'#111827',margin:0}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:'1.25rem',padding:'1rem 1.25rem'}}>
        <div className="filter-row">
          <select className="form-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {['Flood','Earthquake','Fire','Landslide','Cyclone','Other'].map(t=><option key={t}>{t}</option>)}
          </select>
          <select className="form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['Active','Contained','Closed'].map(s=><option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setTypeFilter('');setStatusFilter('');}}>
            <RefreshCw size={14}/> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div className="spinner"/> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event Name</th>
                  <th>Disaster Type</th>
                  <th>Location</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  {canUpdateStatus && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev=>(
                  <tr key={ev.event_id}>
                    <td><strong>#{ev.event_id}</strong></td>
                    <td style={{fontWeight:600}}>{ev.event_name}</td>
                    <td>{typeBadge(ev.disaster_type)}</td>
                    <td style={{color:'#6B7280',fontSize:'0.875rem'}}>{ev.location}</td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem'}}>{new Date(ev.start_date).toLocaleDateString()}</td>
                    <td>{statusBadge(ev.status)}</td>
                    {canUpdateStatus && (
                      <td><button className="btn btn-ghost btn-sm" onClick={()=>setStatusModal(ev)}>Update Status</button></td>
                    )}
                  </tr>
                ))}
                {filtered.length===0 && (
                  <tr><td colSpan={canUpdateStatus?7:6} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>
                    <Globe size={32} style={{display:'block',margin:'0 auto 0.5rem',opacity:0.4}}/> No disaster events found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createModal && <CreateEventModal onClose={()=>setCreateModal(false)} onCreated={load}/>}
      {statusModal && <UpdateStatusModal event={statusModal} onClose={()=>setStatusModal(null)} onUpdated={load}/>}
    </PageLayout>
  );
};

export default Events;
