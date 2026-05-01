import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import api from '../utils/api';
import { RefreshCw, Shield } from 'lucide-react';

const actionBadge = action => {
  const m = {
    INSERT: { bg:'#D1FAE5', color:'#065F46' },
    UPDATE: { bg:'#DBEAFE', color:'#1E40AF' },
    DELETE: { bg:'#FEE2E2', color:'#991B1B' },
    LOGIN:  { bg:'#EDE9FE', color:'#5B21B6' },
    LOGOUT: { bg:'#F3F4F6', color:'#374151' },
  };
  const s = m[action] || { bg:'#F3F4F6', color:'#374151' };
  return (
    <span style={{ background:s.bg, color:s.color, padding:'0.2rem 0.6rem', borderRadius:'6px', fontSize:'0.75rem', fontWeight:700 }}>
      {action}
    </span>
  );
};

const AuditTrail = () => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/dashboard/audit-trail')
      .then(r => setLogs(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const tables = [...new Set(logs.map(l => l.table_name))].sort();

  const filtered = logs.filter(l => {
    if (actionFilter && l.action     !== actionFilter) return false;
    if (tableFilter  && l.table_name !== tableFilter)  return false;
    return true;
  });

  const stats = {
    total:   logs.length,
    inserts: logs.filter(l => l.action === 'INSERT').length,
    updates: logs.filter(l => l.action === 'UPDATE').length,
    logins:  logs.filter(l => l.action === 'LOGIN').length,
  };

  return (
    <PageLayout
      title="Audit Trail"
      subtitle="Full system audit log — last 200 recorded actions across all modules"
      actions={
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <RefreshCw size={14}/> Refresh
        </button>
      }
    >
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6" style={{ marginBottom:'1.25rem' }}>
        {[
          { label:'Total Entries', val:stats.total,   color:'#6B7280' },
          { label:'Inserts',       val:stats.inserts,  color:'#059669' },
          { label:'Updates',       val:stats.updates,  color:'#2563EB' },
          { label:'Logins',        val:stats.logins,   color:'#7C3AED' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color':s.color }}>
            <p style={{ color:'#6B7280', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', margin:'0 0 0.4rem' }}>{s.label}</p>
            <p style={{ fontSize:'2rem', fontWeight:800, color:'#111827', margin:0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:'1.25rem', padding:'1rem 1.25rem' }}>
        <div className="filter-row">
          <select className="form-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            {['INSERT','UPDATE','DELETE','LOGIN','LOGOUT'].map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="form-select" value={tableFilter} onChange={e => setTableFilter(e.target.value)}>
            <option value="">All Tables</option>
            {tables.map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => { setActionFilter(''); setTableFilter(''); }}>
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
                  <th>Log ID</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record ID</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.log_id}>
                    <td><strong>#{l.log_id}</strong></td>
                    <td>{actionBadge(l.action)}</td>
                    <td>
                      <span style={{ background:'#F3F4F6', color:'#374151', padding:'0.2rem 0.5rem', borderRadius:'4px', fontSize:'0.75rem', fontFamily:'monospace' }}>
                        {l.table_name}
                      </span>
                    </td>
                    <td style={{ color:'#6B7280' }}>{l.record_id ?? '—'}</td>
                    <td style={{ fontWeight:600 }}>{l.username || <span style={{ color:'#9CA3AF' }}>System</span>}</td>
                    <td style={{ color:'#6B7280', fontSize:'0.8rem' }}>{l.role?.replace(/_/g,' ') || '—'}</td>
                    <td style={{ maxWidth:'150px', fontSize:'0.78rem', color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={l.old_value}>
                      {l.old_value || '—'}
                    </td>
                    <td style={{ maxWidth:'200px', fontSize:'0.78rem', color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={l.new_value}>
                      {l.new_value || '—'}
                    </td>
                    <td style={{ color:'#6B7280', fontSize:'0.78rem', whiteSpace:'nowrap' }}>
                      {new Date(l.logged_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:'3rem', color:'#9CA3AF' }}>
                    <Shield size={32} style={{ display:'block', margin:'0 auto 0.5rem', opacity:0.4 }}/>
                    No audit log entries found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AuditTrail;
