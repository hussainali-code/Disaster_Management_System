import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, Package, Truck, PlusCircle } from 'lucide-react';

const stockBadge = alert => alert === 'LOW STOCK'
  ? <span className="badge badge-critical">Low Stock</span>
  : <span className="badge badge-ok">OK</span>;

const allocationStatusBadge = s => {
  const m = { Pending:'badge-pending', Approved:'badge-approved', Dispatched:'badge-dispatched', Consumed:'badge-resolved', Rejected:'badge-rejected', Cancelled:'badge-closed' };
  return <span className={`badge ${m[s]||'badge-closed'}`}>{s}</span>;
};

/* ── Restock Modal ──────────────────────────────── */
const RestockModal = ({ resource, onClose, onRestocked }) => {
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.patch(`/resources/${resource.resource_id}/restock`, { quantity_to_add: Number(qty) });
      onRestocked(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Restock failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:'380px'}}>
        <div className="modal-header">
          <h3 style={{margin:0}}>Restock: {resource.resource_name}</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem',fontSize:'0.85rem',color:'#1E40AF'}}>
          Current stock: <strong>{resource.quantity_available.toLocaleString()} {resource.unit}</strong>
          &nbsp;·&nbsp; Threshold: {resource.low_stock_threshold.toLocaleString()}
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Quantity to Add <span>*</span></label>
            <input className="form-input" type="number" min="1" placeholder="e.g. 500" value={qty} onChange={e=>setQty(e.target.value)} required/>
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>{loading?'Restocking…':'Confirm Restock'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Add Resource Modal ─────────────────────────── */
const AddResourceModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ resource_name:'', resource_type:'Food', quantity_available:0, low_stock_threshold:50, unit:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/resources', form);
      onAdded(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Failed to add resource'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Add New Resource</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Resource Name <span>*</span></label>
            <input className="form-input" placeholder="e.g. Rice Bags" value={form.resource_name} onChange={e=>setForm({...form,resource_name:e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type <span>*</span></label>
              <select className="form-select" value={form.resource_type} onChange={e=>setForm({...form,resource_type:e.target.value})}>
                {['Food','Water','Medicine','Shelter','Equipment','Other'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit <span>*</span></label>
              <input className="form-input" placeholder="bags / liters / units" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity Available</label>
              <input className="form-input" type="number" min="0" value={form.quantity_available} onChange={e=>setForm({...form,quantity_available:Number(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input className="form-input" type="number" min="1" value={form.low_stock_threshold} onChange={e=>setForm({...form,low_stock_threshold:Number(e.target.value)})} />
            </div>
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Adding…':'Add Resource'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Request Allocation Modal ──────────────────── */
const RequestAllocationModal = ({ resources, events, onClose, onRequested }) => {
  const [form, setForm] = useState({ resource_id:'', event_id:'', quantity_requested:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/resources/request', {
        resource_id: Number(form.resource_id),
        event_id: Number(form.event_id),
        quantity_requested: Number(form.quantity_requested),
      });
      onRequested(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Request failed'); }
    finally { setLoading(false); }
  };

  const selectedRes = resources.find(r => r.resource_id === Number(form.resource_id));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Request Resource Allocation</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Resource <span>*</span></label>
            <select className="form-select" value={form.resource_id} onChange={e=>setForm({...form,resource_id:e.target.value})} required>
              <option value="">— Select resource —</option>
              {resources.map(r=><option key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.quantity_available} {r.unit} available)</option>)}
            </select>
          </div>
          {selectedRes && (
            <div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#065F46'}}>
              Available: <strong>{selectedRes.quantity_available} {selectedRes.unit}</strong> · Threshold: {selectedRes.low_stock_threshold}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Disaster Event <span>*</span></label>
            <select className="form-select" value={form.event_id} onChange={e=>setForm({...form,event_id:e.target.value})} required>
              <option value="">— Select event —</option>
              {events.map(ev=><option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity Requested <span>*</span></label>
            <input className="form-input" type="number" min="1" value={form.quantity_requested} onChange={e=>setForm({...form,quantity_requested:e.target.value})} required />
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Submitting…':'Submit Request'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Resources Page ────────────────────────── */
const Resources = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('inventory');
  const [resources, setResources] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal]         = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [restockModal, setRestockModal] = useState(null);  // resource object

  const isAdmin   = user?.role === 'Administrator';
  const isWH      = user?.role === 'Warehouse_Manager';
  const canAdd    = isAdmin || isWH;
  const canRequest= isAdmin || isWH || user?.role === 'Emergency_Operator';

  const loadResources = () => {
    setLoading(true);
    api.get('/resources').then(r=>setResources(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };
  const loadAllocations = () => {
    setLoading(true);
    api.get('/resources/allocations').then(r=>setAllocations(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(() => {
    if (tab === 'inventory') loadResources();
    else loadAllocations();
    api.get('/events').then(r=>setEvents(r.data.data||[])).catch(()=>setEvents([]));
  }, [tab]);

  const dispatchAllocation = async (id) => {
    if (!window.confirm('Dispatch this allocation? Stock will be deducted.')) return;
    try {
      await api.patch(`/resources/allocations/${id}/dispatch`);
      loadAllocations();
    } catch(ex) { alert(ex.response?.data?.message || 'Dispatch failed'); }
  };

  const lowCount = resources.filter(r=>r.stock_alert==='LOW STOCK').length;

  return (
    <PageLayout
      title="Resources & Inventory"
      subtitle="Manage warehouse stock and resource allocation requests"
      actions={
        <div style={{display:'flex',gap:'0.75rem'}}>
          {canRequest && <button className="btn btn-secondary" onClick={()=>setRequestModal(true)}><Plus size={16}/> Request Allocation</button>}
          {canAdd     && <button className="btn btn-primary"   onClick={()=>setAddModal(true)}><Plus size={16}/> Add Resource</button>}
        </div>
      }
    >
      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-6" style={{marginBottom:'1.25rem'}}>
        <div className="stat-card" style={{'--accent-color':'#2563EB'}}>
          <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Total Resources</p>
          <p style={{fontSize:'2rem',fontWeight:800,margin:0}}>{resources.length}</p>
        </div>
        <div className="stat-card" style={{'--accent-color':'#D97706'}}>
          <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Low Stock Alerts</p>
          <p style={{fontSize:'2rem',fontWeight:800,margin:0,color:lowCount>0?'#C8102E':'#059669'}}>{lowCount}</p>
        </div>
        <div className="stat-card" style={{'--accent-color':'#059669'}}>
          <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Pending Allocations</p>
          <p style={{fontSize:'2rem',fontWeight:800,margin:0}}>{allocations.filter(a=>a.status==='Pending').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${tab==='inventory'?' active':''}`} onClick={()=>setTab('inventory')}>Inventory</button>
        <button className={`tab-btn${tab==='allocations'?' active':''}`} onClick={()=>setTab('allocations')}>Allocation Requests</button>
      </div>

      <div className="card">
        {loading ? <div className="spinner"/> : tab === 'inventory' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Resource Name</th><th>Type</th><th>Qty Available</th><th>Threshold</th><th>Unit</th><th>Stock Status</th><th>Warehouse</th>{(isAdmin||isWH)&&<th>Actions</th>}</tr>
              </thead>
              <tbody>
                {resources.map(r=>(
                  <tr key={r.resource_id}>
                    <td><strong>#{r.resource_id}</strong></td>
                    <td style={{fontWeight:600}}>{r.resource_name}</td>
                    <td><span style={{background:'#EFF6FF',color:'#2563EB',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.75rem',fontWeight:700}}>{r.resource_type}</span></td>
                    <td><strong style={{color:r.stock_alert==='LOW STOCK'?'#C8102E':'#059669'}}>{r.quantity_available.toLocaleString()}</strong></td>
                    <td style={{color:'#9CA3AF'}}>{r.low_stock_threshold.toLocaleString()}</td>
                    <td style={{color:'#6B7280'}}>{r.unit}</td>
                    <td>{stockBadge(r.stock_alert)}</td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem'}}>{r.warehouse_name}</td>
                    {(isAdmin||isWH) && (
                      <td>
                        <button className="btn btn-success btn-sm" onClick={()=>setRestockModal(r)}>
                          <PlusCircle size={13}/> Restock
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {resources.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}><Package size={32} style={{display:'block',margin:'0 auto 0.5rem',opacity:0.4}}/>No resources found.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Resource</th><th>Event</th><th>Requested By</th><th>Qty Requested</th><th>Qty Dispatched</th><th>Status</th><th>Requested At</th>{(isAdmin||isWH)&&<th>Actions</th>}</tr>
              </thead>
              <tbody>
                {allocations.map(a=>(
                  <tr key={a.allocation_id}>
                    <td><strong>#{a.allocation_id}</strong></td>
                    <td style={{fontWeight:600}}>{a.resource_name}</td>
                    <td style={{fontSize:'0.8rem',color:'#6B7280'}}>{a.event_name}</td>
                    <td style={{fontSize:'0.8rem'}}>{a.requested_by_name}</td>
                    <td><strong>{a.quantity_requested.toLocaleString()}</strong></td>
                    <td>{a.quantity_dispatched.toLocaleString()}</td>
                    <td>{allocationStatusBadge(a.status)}</td>
                    <td style={{fontSize:'0.8rem',color:'#6B7280'}}>{new Date(a.requested_at).toLocaleDateString()}</td>
                    {(isAdmin||isWH)&&(
                      <td>
                        {a.status==='Approved' && (
                          <button className="btn btn-primary btn-sm" onClick={()=>dispatchAllocation(a.allocation_id)}>
                            <Truck size={13}/> Dispatch
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {allocations.length===0&&<tr><td colSpan={(isAdmin||isWH)?9:8} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>No allocation requests found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addModal     && <AddResourceModal        onClose={()=>setAddModal(false)}     onAdded={loadResources} />}
      {requestModal && <RequestAllocationModal  resources={resources} events={events} onClose={()=>setRequestModal(false)} onRequested={loadAllocations} />}
      {restockModal && <RestockModal            resource={restockModal}               onClose={()=>setRestockModal(null)}  onRestocked={loadResources} />}
    </PageLayout>
  );
};

export default Resources;
