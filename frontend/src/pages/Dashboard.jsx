import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import {
  Activity, AlertCircle, CheckCircle, Package, Building2,
  DollarSign, TrendingUp, TrendingDown, Users, Shield
} from 'lucide-react';

/* ── Stat Card ────────────────────────────────── */
const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="stat-card" style={{ '--accent-color': color }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{ color:'#6B7280', fontSize:'0.78rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 0.5rem' }}>{label}</p>
        <p style={{ fontSize:'2rem', fontWeight:800, color:'#111827', margin:0, lineHeight:1 }}>{value ?? '—'}</p>
        {sub && <p style={{ fontSize:'0.75rem', color:'#9CA3AF', margin:'0.3rem 0 0' }}>{sub}</p>}
      </div>
      <div style={{ padding:'0.75rem', background:`${color}18`, borderRadius:'10px', color }}>
        {icon}
      </div>
    </div>
  </div>
);

/* ── Quick Action Card ─────────────────────────── */
const QuickAction = ({ to, label, desc, icon, color }) => (
  <Link to={to} style={{ textDecoration:'none' }}>
    <div className="card" style={{ display:'flex', alignItems:'center', gap:'1rem', cursor:'pointer', border:`1px solid ${color}22` }}
      onMouseOver={e=>e.currentTarget.style.borderColor=`${color}55`}
      onMouseOut={e=>e.currentTarget.style.borderColor=`${color}22`}
    >
      <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontWeight:700, fontSize:'0.9rem', margin:0, color:'#111827' }}>{label}</p>
        <p style={{ fontSize:'0.78rem', color:'#9CA3AF', margin:0 }}>{desc}</p>
      </div>
    </div>
  </Link>
);

/* ── Alert Row ─────────────────────────────────── */
const AlertRow = ({ label, value, color }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1rem', background:`${color}10`, borderRadius:'8px', border:`1px solid ${color}25`, marginBottom:'0.5rem' }}>
    <span style={{ color:`${color}cc`, fontSize:'0.875rem', fontWeight:500 }}>{label}</span>
    <strong style={{ color, fontSize:'1.1rem', fontWeight:800 }}>{value ?? 0}</strong>
  </div>
);

/* ─── Role Dashboards ──────────────────────────── */
const AdminDashboard = ({ overview }) => {
  const r = overview?.reports  || {};
  const t = overview?.teams    || {};
  const h = overview?.hospitals|| {};
  const f = overview?.finance  || {};
  const res = overview?.resources || {};
  return (
    <>
      <div className="grid md:grid-cols-4 gap-6" style={{ marginBottom:'1.5rem' }}>
        <StatCard label="Total Reports"    value={r.total_reports} icon={<AlertCircle size={22}/>}  color="#C8102E" sub={`${r.critical||0} critical`} />
        <StatCard label="Pending"          value={r.pending}       icon={<Activity size={22}/>}     color="#D97706" sub="awaiting action" />
        <StatCard label="Teams Available"  value={t.available}     icon={<Users size={22}/>}        color="#059669" sub={`of ${t.total_teams||0} total`} />
        <StatCard label="Hospital Beds"    value={h.available_beds}icon={<Building2 size={22}/>}   color="#2563EB" sub="available now" />
      </div>
      <div className="grid md:grid-cols-3 gap-6" style={{ marginBottom:'1.5rem' }}>
        <StatCard label="Resolved Reports"  value={r.resolved}           icon={<CheckCircle size={22}/>} color="#059669" />
        <StatCard label="Low Stock Items"   value={res.low_stock_items}  icon={<Package size={22}/>}    color="#D97706" />
        <StatCard label="Total Donations"   value={`Rs ${Number(f.total_donations||0).toLocaleString()}`} icon={<DollarSign size={22}/>} color="#7C3AED" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 style={{margin:0}}>Financial Overview</h3></div>
          <AlertRow label="Total Donations" value={`Rs ${Number(f.total_donations||0).toLocaleString()}`} color="#059669" />
          <AlertRow label="Total Expenses"  value={`Rs ${Number(f.total_expenses||0).toLocaleString()}`}  color="#DC2626" />
        </div>
        <div className="card">
          <div className="card-header"><h3 style={{margin:0}}>Team Status Board</h3></div>
          <AlertRow label="Teams Available" value={t.available} color="#059669" />
          <AlertRow label="Teams Assigned"  value={t.assigned}  color="#2563EB" />
          <AlertRow label="Teams Busy"      value={t.busy}      color="#D97706" />
        </div>
      </div>
    </>
  );
};

const OperatorDashboard = ({ overview }) => (
  <>
    <div className="grid md:grid-cols-3 gap-6" style={{ marginBottom:'1.5rem' }}>
      <StatCard label="Total Reports"   value={overview?.reports?.total_reports} icon={<AlertCircle size={22}/>} color="#C8102E" />
      <StatCard label="Pending"         value={overview?.reports?.pending}        icon={<Activity size={22}/>}   color="#D97706" />
      <StatCard label="Teams Available" value={overview?.teams?.available}        icon={<Users size={22}/>}      color="#059669" />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Quick Actions</h3></div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <QuickAction to="/incidents" label="Manage Incidents" desc="Log and track emergency reports" icon={<AlertCircle size={20}/>} color="#C8102E" />
          <QuickAction to="/teams"     label="Deploy Teams"     desc="Assign rescue teams to incidents" icon={<Users size={20}/>}      color="#2563EB" />
          <QuickAction to="/hospitals" label="Hospital Status"  desc="View capacity & admit patients"   icon={<Building2 size={20}/>}  color="#059669" />
          <QuickAction to="/approvals" label="Approvals Queue"  desc="Review pending requests"          icon={<CheckCircle size={20}/>} color="#D97706" />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Live Alerts</h3></div>
        <AlertRow label="Critical Reports Pending" value={overview?.reports?.critical} color="#C8102E" />
        <AlertRow label="High Severity Reports"    value={overview?.reports?.assigned}  color="#D97706" />
        <AlertRow label="Teams in Deployment"      value={overview?.teams?.assigned}    color="#2563EB" />
      </div>
    </div>
  </>
);

const WarehouseDashboard = ({ overview }) => (
  <>
    <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom:'1.5rem' }}>
      <StatCard label="Low Stock Items"   value={overview?.resources?.low_stock_items} icon={<Package size={22}/>}    color="#D97706" sub="need restocking" />
      <StatCard label="Hospital Beds Free" value={overview?.hospitals?.available_beds}  icon={<Building2 size={22}/>}  color="#2563EB" />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Quick Actions</h3></div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <QuickAction to="/resources" label="Manage Inventory"      desc="View and update warehouse stock"   icon={<Package size={20}/>}     color="#2563EB" />
          <QuickAction to="/approvals" label="Review Allocations"    desc="Approve/reject resource requests"  icon={<CheckCircle size={20}/>}  color="#059669" />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Stock Alerts</h3></div>
        <AlertRow label="Items Low on Stock" value={overview?.resources?.low_stock_items} color="#D97706" />
      </div>
    </div>
  </>
);

const FinanceDashboard = ({ overview }) => (
  <>
    <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom:'1.5rem' }}>
      <StatCard label="Total Donations" value={`Rs ${Number(overview?.finance?.total_donations||0).toLocaleString()}`} icon={<TrendingUp size={22}/>}   color="#059669" />
      <StatCard label="Total Expenses"  value={`Rs ${Number(overview?.finance?.total_expenses||0).toLocaleString()}`}  icon={<TrendingDown size={22}/>} color="#C8102E" />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Quick Actions</h3></div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <QuickAction to="/finance"   label="Record Transaction" desc="Log donations or expenses"      icon={<DollarSign size={20}/>}  color="#059669" />
          <QuickAction to="/approvals" label="Approve Expenses"   desc="Review financial approvals"    icon={<CheckCircle size={20}/>} color="#2563EB" />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Budget Summary</h3></div>
        <AlertRow label="Total Donations" value={`Rs ${Number(overview?.finance?.total_donations||0).toLocaleString()}`} color="#059669" />
        <AlertRow label="Total Expenses"  value={`Rs ${Number(overview?.finance?.total_expenses||0).toLocaleString()}`}  color="#C8102E" />
      </div>
    </div>
  </>
);

const FieldOfficerDashboard = ({ overview }) => (
  <>
    <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom:'1.5rem' }}>
      <StatCard label="Active Deployments" value={overview?.teams?.assigned} icon={<Users size={22}/>}       color="#2563EB" />
      <StatCard label="Hospitals Nearby"   value={overview?.hospitals?.available_beds} icon={<Building2 size={22}/>} color="#059669" sub="beds available" />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Field Actions</h3></div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <QuickAction to="/teams"     label="Update Team Status"  desc="Mark assignments complete"        icon={<Users size={20}/>}       color="#2563EB" />
          <QuickAction to="/incidents" label="View Assignments"    desc="See active incident reports"      icon={<AlertCircle size={20}/>}  color="#C8102E" />
          <QuickAction to="/hospitals" label="Hospital Capacity"   desc="Check available beds"             icon={<Building2 size={20}/>}    color="#059669" />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 style={{margin:0}}>Situational Overview</h3></div>
        <AlertRow label="Teams Deployed"   value={overview?.teams?.assigned}       color="#2563EB" />
        <AlertRow label="Critical Reports" value={overview?.reports?.critical}     color="#C8102E" />
        <AlertRow label="Pending Reports"  value={overview?.reports?.pending}      color="#D97706" />
      </div>
    </div>
  </>
);

/* ─── Main Dashboard ──────────────────────────── */
const Dashboard = () => {
  const { user }   = useContext(AuthContext);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/dashboard/overview')
      .then(r => setOverview(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const renderDashboard = () => {
    if (loading) return <div className="spinner" />;
    switch (user?.role) {
      case 'Administrator':      return <AdminDashboard    overview={overview} />;
      case 'Emergency_Operator': return <OperatorDashboard overview={overview} />;
      case 'Warehouse_Manager':  return <WarehouseDashboard overview={overview} />;
      case 'Finance_Officer':    return <FinanceDashboard  overview={overview} />;
      case 'Field_Officer':      return <FieldOfficerDashboard overview={overview} />;
      default: return <p>No dashboard defined for this role.</p>;
    }
  };

  return (
    <PageLayout
      title={`${(user?.role || '').replace(/_/g,' ')} Dashboard`}
      subtitle={`Welcome back, ${user?.username} · ${new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`}
    >
      {renderDashboard()}
    </PageLayout>
  );
};

export default Dashboard;
