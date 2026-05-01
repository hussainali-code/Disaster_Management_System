import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, Building2, UserCheck } from 'lucide-react';

const bedColor = beds => beds < 10 ? '#C8102E' : beds < 50 ? '#D97706' : '#059669';

/* ── Admit Patient Modal ────────────────────────── */
const AdmitPatientModal = ({ hospitals, reports, onClose, onAdmitted }) => {
  const [form, setForm] = useState({ hospital_id:'', report_id:'', patient_name:'', condition_severity:'Stable', is_critical:false });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/hospitals/admit', { ...form, hospital_id: Number(form.hospital_id), report_id: form.report_id ? Number(form.report_id) : null });
      onAdmitted(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Admission failed'); }
    finally { setLoading(false); }
  };

  const selHosp = hospitals.find(h => h.hospital_id === Number(form.hospital_id));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Admit New Patient</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Hospital <span>*</span></label>
            <select className="form-select" value={form.hospital_id} onChange={e=>setForm({...form,hospital_id:e.target.value})} required>
              <option value="">— Select hospital —</option>
              {hospitals.map(h=><option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name} — {h.available_beds} beds free</option>)}
            </select>
          </div>
          {selHosp && (
            <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#1E40AF'}}>
              Available beds: <strong>{selHosp.available_beds}</strong> / {selHosp.total_beds} · {selHosp.location}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Patient Name <span>*</span></label>
            <input className="form-input" placeholder="Full name" value={form.patient_name} onChange={e=>setForm({...form,patient_name:e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Condition Severity <span>*</span></label>
              <select className="form-select" value={form.condition_severity} onChange={e=>setForm({...form,condition_severity:e.target.value})}>
                {['Stable','Serious','Critical'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Link to Report</label>
              <select className="form-select" value={form.report_id} onChange={e=>setForm({...form,report_id:e.target.value})}>
                <option value="">— Optional —</option>
                {reports.map(r=><option key={r.report_id} value={r.report_id}>#{r.report_id} — {r.location}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <input type="checkbox" id="is_critical" checked={form.is_critical} onChange={e=>setForm({...form,is_critical:e.target.checked})} style={{width:'18px',height:'18px',accentColor:'#C8102E'}}/>
            <label htmlFor="is_critical" style={{fontSize:'0.875rem',fontWeight:600,color:'#111827',cursor:'pointer'}}>Mark as Critical Patient</label>
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Admitting…':'Admit Patient'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Discharge Modal ───────────────────────────── */
const DischargeModal = ({ patient, onClose, onDischarged }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const confirm = async () => {
    setErr(''); setLoading(true);
    try {
      await api.patch(`/hospitals/discharge/${patient.patient_id}`);
      onDischarged(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Discharge failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:'380px'}}>
        <div className="modal-header">
          <h3 style={{margin:0}}>Discharge Patient</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <p style={{color:'#6B7280',marginBottom:'1.5rem'}}>
          Discharge <strong style={{color:'#111827'}}>{patient.patient_name}</strong> from <strong style={{color:'#111827'}}>{patient.hospital_name}</strong>? This will free up one bed.
        </p>
        <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={confirm} disabled={loading}>{loading?'Discharging…':'Confirm Discharge'}</button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Hospitals Page ────────────────────────── */
const Hospitals = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab]           = useState('hospitals');
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients]   = useState([]);
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [admitModal, setAdmitModal]     = useState(false);
  const [dischargeModal, setDischargeModal] = useState(null);

  const canManage = ['Administrator','Emergency_Operator'].includes(user?.role);

  const loadHospitals = () => {
    setLoading(true);
    api.get('/hospitals').then(r=>setHospitals(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };
  const loadPatients = () => {
    setLoading(true);
    api.get('/hospitals/patients').then(r=>setPatients(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(() => {
    if (tab === 'hospitals') loadHospitals();
    else loadPatients();
    api.get('/reports').then(r=>setReports(r.data.data||[])).catch(()=>setReports([]));
  }, [tab]);

  const totalBeds  = hospitals.reduce((s,h)=>s+h.total_beds,0);
  const availBeds  = hospitals.reduce((s,h)=>s+h.available_beds,0);
  const critical   = patients.filter(p=>p.is_critical).length;

  return (
    <PageLayout
      title="Hospitals & Facilities"
      subtitle="Monitor capacity, admissions, and patient management"
      actions={canManage && <button className="btn btn-primary" onClick={()=>setAdmitModal(true)}><Plus size={16}/> Admit Patient</button>}
    >
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6" style={{marginBottom:'1.25rem'}}>
        {[
          {label:'Total Hospitals', val:hospitals.length, color:'#2563EB'},
          {label:'Total Beds',      val:totalBeds,        color:'#6B7280'},
          {label:'Available Beds',  val:availBeds,        color:'#059669'},
          {label:'Critical Patients',val:critical,        color:'#C8102E'},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{'--accent-color':s.color}}>
            <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>{s.label}</p>
            <p style={{fontSize:'2rem',fontWeight:800,margin:0,color:s.label==='Critical Patients'&&s.val>0?'#C8102E':'#111827'}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${tab==='hospitals'?' active':''}`} onClick={()=>setTab('hospitals')}>Hospitals</button>
        <button className={`tab-btn${tab==='patients'?' active':''}`} onClick={()=>setTab('patients')}>Current Patients</button>
      </div>

      <div className="card">
        {loading ? <div className="spinner"/> : tab === 'hospitals' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Hospital Name</th><th>Location</th><th>Total Beds</th><th>Available</th><th>Occupancy</th><th>Contact</th></tr>
              </thead>
              <tbody>
                {hospitals.map(h=>(
                  <tr key={h.hospital_id}>
                    <td><strong>#{h.hospital_id}</strong></td>
                    <td style={{fontWeight:600}}>{h.hospital_name}</td>
                    <td style={{color:'#6B7280',fontSize:'0.875rem'}}>{h.location}</td>
                    <td>{h.total_beds}</td>
                    <td><strong style={{color:bedColor(h.available_beds)}}>{h.available_beds}</strong></td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                        <div className="progress-bar" style={{width:'80px'}}>
                          <div className="progress-fill" style={{width:`${h.occupancy_pct}%`, background: h.occupancy_pct>85?'#C8102E':h.occupancy_pct>60?'#D97706':'#059669'}} />
                        </div>
                        <span style={{fontSize:'0.8rem',color:'#6B7280'}}>{h.occupancy_pct}%</span>
                      </div>
                    </td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem'}}>{h.contact_number||'—'}</td>
                  </tr>
                ))}
                {hospitals.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}><Building2 size={32} style={{display:'block',margin:'0 auto 0.5rem',opacity:0.4}}/>No hospitals found.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Patient Name</th><th>Hospital</th><th>Condition</th><th>Critical</th><th>Admitted At</th>{canManage&&<th>Actions</th>}</tr>
              </thead>
              <tbody>
                {patients.map(p=>(
                  <tr key={p.patient_id}>
                    <td><strong>#{p.patient_id}</strong></td>
                    <td style={{fontWeight:600}}>{p.patient_name}</td>
                    <td style={{color:'#6B7280',fontSize:'0.875rem'}}>{p.hospital_name}</td>
                    <td>
                      <span className={`badge ${p.condition_severity==='Critical'?'badge-critical':p.condition_severity==='Serious'?'badge-high':'badge-low'}`}>
                        {p.condition_severity}
                      </span>
                    </td>
                    <td>{p.is_critical ? <span style={{color:'#C8102E',fontWeight:700,fontSize:'0.8rem'}}>⚠ Critical</span> : <span style={{color:'#9CA3AF',fontSize:'0.8rem'}}>—</span>}</td>
                    <td style={{color:'#6B7280',fontSize:'0.8rem'}}>{new Date(p.admitted_at).toLocaleString()}</td>
                    {canManage&&(
                      <td>
                        <button className="btn btn-success btn-sm" onClick={()=>setDischargeModal(p)}>
                          <UserCheck size={13}/> Discharge
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {patients.length===0&&<tr><td colSpan={canManage?7:6} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>No current patients.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {admitModal    && <AdmitPatientModal hospitals={hospitals} reports={reports} onClose={()=>setAdmitModal(false)}    onAdmitted={()=>{loadHospitals();loadPatients();}} />}
      {dischargeModal && <DischargeModal   patient={dischargeModal}               onClose={()=>setDischargeModal(null)} onDischarged={()=>{loadHospitals();loadPatients();}} />}
    </PageLayout>
  );
};

export default Hospitals;
