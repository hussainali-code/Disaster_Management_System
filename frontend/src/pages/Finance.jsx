import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const txBadge = type => {
  const m = { Donation:'badge-donation', Expense:'badge-expense', Procurement:'badge-procurement', Distribution:'badge-distribution' };
  return <span className={`badge ${m[type]||'badge-closed'}`}>{type}</span>;
};

/* ── Record Transaction Modal ──────────────────── */
const RecordTransactionModal = ({ events, onClose, onRecorded }) => {
  const [form, setForm] = useState({ event_id:'', transaction_type:'Donation', amount:'', description:'', source_or_recipient:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/finance', { ...form, event_id: Number(form.event_id), amount: Number(form.amount) });
      onRecorded(); onClose();
    } catch(ex) { setErr(ex.response?.data?.message || 'Failed to record transaction'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{margin:0}}>Record Financial Transaction</h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Disaster Event <span>*</span></label>
            <select className="form-select" value={form.event_id} onChange={e=>setForm({...form,event_id:e.target.value})} required>
              <option value="">— Select event —</option>
              {events.map(ev=><option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Transaction Type <span>*</span></label>
              <select className="form-select" value={form.transaction_type} onChange={e=>setForm({...form,transaction_type:e.target.value})}>
                {['Donation','Expense','Procurement','Distribution'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (Rs.) <span>*</span></label>
              <input className="form-input" type="number" min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description <span>*</span></label>
            <textarea className="form-textarea" placeholder="Brief description of this transaction…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Source / Recipient</label>
            <input className="form-input" placeholder="Donor name, vendor, recipient org…" value={form.source_or_recipient} onChange={e=>setForm({...form,source_or_recipient:e.target.value})} />
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Recording…':'Record Transaction'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Finance Page ──────────────────────────── */
const Finance = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab]                 = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState([]);
  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [recordModal, setRecordModal]   = useState(false);
  const [typeFilter, setTypeFilter]     = useState('');

  const canRecord = ['Administrator','Finance_Officer'].includes(user?.role);

  const loadTransactions = () => {
    setLoading(true);
    api.get('/finance').then(r=>setTransactions(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };
  const loadSummary = () => {
    setLoading(true);
    api.get('/finance/summary').then(r=>setSummary(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(() => {
    if (tab==='transactions') loadTransactions();
    else loadSummary();
    api.get('/events').then(r=>setEvents(r.data.data||[])).catch(()=>setEvents([]));
  }, [tab]);

  const filtered = typeFilter ? transactions.filter(t=>t.transaction_type===typeFilter) : transactions;

  const totalDonations = transactions.filter(t=>t.transaction_type==='Donation').reduce((s,t)=>s+Number(t.amount),0);
  const totalExpenses  = transactions.filter(t=>['Expense','Procurement','Distribution'].includes(t.transaction_type)).reduce((s,t)=>s+Number(t.amount),0);
  const netBalance     = totalDonations - totalExpenses;

  return (
    <PageLayout
      title="Financial Management"
      subtitle="Track donations, expenses, procurements, and relief fund distribution"
      actions={canRecord && <button className="btn btn-primary" onClick={()=>setRecordModal(true)}><Plus size={16}/> Record Transaction</button>}
    >
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6" style={{marginBottom:'1.25rem'}}>
        <div className="stat-card" style={{'--accent-color':'#059669'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Total Donations</p>
              <p style={{fontSize:'1.6rem',fontWeight:800,margin:0,color:'#059669'}}>Rs {totalDonations.toLocaleString()}</p>
            </div>
            <div style={{padding:'0.75rem',background:'#D1FAE5',borderRadius:'10px',color:'#059669'}}><TrendingUp size={22}/></div>
          </div>
        </div>
        <div className="stat-card" style={{'--accent-color':'#C8102E'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Total Expenses</p>
              <p style={{fontSize:'1.6rem',fontWeight:800,margin:0,color:'#C8102E'}}>Rs {totalExpenses.toLocaleString()}</p>
            </div>
            <div style={{padding:'0.75rem',background:'#FEE2E2',borderRadius:'10px',color:'#C8102E'}}><TrendingDown size={22}/></div>
          </div>
        </div>
        <div className="stat-card" style={{'--accent-color': netBalance>=0?'#059669':'#C8102E'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{color:'#6B7280',fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',margin:'0 0 0.4rem'}}>Net Balance</p>
              <p style={{fontSize:'1.6rem',fontWeight:800,margin:0,color:netBalance>=0?'#059669':'#C8102E'}}>Rs {netBalance.toLocaleString()}</p>
            </div>
            <div style={{padding:'0.75rem',background: netBalance>=0?'#D1FAE5':'#FEE2E2',borderRadius:'10px',color:netBalance>=0?'#059669':'#C8102E'}}><DollarSign size={22}/></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${tab==='transactions'?' active':''}`} onClick={()=>setTab('transactions')}>Transactions</button>
        <button className={`tab-btn${tab==='summary'?' active':''}`} onClick={()=>setTab('summary')}>Event Summary</button>
      </div>

      {tab==='transactions' && (
        <div className="card" style={{marginBottom:'1rem',padding:'0.875rem 1.25rem'}}>
          <div className="filter-row" style={{marginBottom:0}}>
            <select className="form-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {['Donation','Expense','Procurement','Distribution'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner"/> : tab==='transactions' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Event</th><th>Type</th><th>Amount</th><th>Description</th><th>Source / Recipient</th><th>Recorded By</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map(t=>(
                  <tr key={t.transaction_id}>
                    <td><strong>#{t.transaction_id}</strong></td>
                    <td style={{fontSize:'0.8rem',color:'#6B7280'}}>{t.event_name}</td>
                    <td>{txBadge(t.transaction_type)}</td>
                    <td>
                      <strong style={{color: t.transaction_type==='Donation'?'#059669':'#C8102E'}}>
                        Rs {Number(t.amount).toLocaleString()}
                      </strong>
                    </td>
                    <td style={{maxWidth:'200px',fontSize:'0.8rem',color:'#6B7280'}}>{t.description}</td>
                    <td style={{fontSize:'0.8rem',color:'#6B7280'}}>{t.source_or_recipient||'—'}</td>
                    <td style={{fontSize:'0.8rem'}}>{t.recorded_by_name}</td>
                    <td style={{fontSize:'0.8rem',color:'#6B7280'}}>{new Date(t.transaction_date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>No transactions found.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Event</th><th>Type</th><th>Donations</th><th>Expenses</th><th>Procurement</th><th>Distribution</th><th>Net Balance</th><th>Transactions</th></tr>
              </thead>
              <tbody>
                {summary.map(s=>(
                  <tr key={s.event_id}>
                    <td style={{fontWeight:600}}>{s.event_name}</td>
                    <td><span style={{background:'#FEF3C7',color:'#92400E',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.75rem',fontWeight:700}}>{s.disaster_type}</span></td>
                    <td><strong style={{color:'#059669'}}>Rs {Number(s.total_donations||0).toLocaleString()}</strong></td>
                    <td><strong style={{color:'#C8102E'}}>Rs {Number(s.total_expenses||0).toLocaleString()}</strong></td>
                    <td>Rs {Number(s.total_procurement||0).toLocaleString()}</td>
                    <td>Rs {Number(s.total_distribution||0).toLocaleString()}</td>
                    <td>
                      <strong style={{color:Number(s.net_balance)>=0?'#059669':'#C8102E'}}>
                        Rs {Number(s.net_balance||0).toLocaleString()}
                      </strong>
                    </td>
                    <td>{s.transaction_count}</td>
                  </tr>
                ))}
                {summary.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>No financial data found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recordModal && <RecordTransactionModal events={events} onClose={()=>setRecordModal(false)} onRecorded={loadTransactions}/>}
    </PageLayout>
  );
};

export default Finance;
