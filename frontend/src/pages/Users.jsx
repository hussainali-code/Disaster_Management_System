import React, { useState, useEffect, useContext } from 'react';
import PageLayout from '../components/PageLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, X, UserCheck, UserX, KeyRound, Edit, Users as UsersIcon } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'Administrator', label: 'Administrator', color: '#C8102E' },
  { value: 'Emergency_Operator', label: 'Emergency Operator', color: '#D97706' },
  { value: 'Field_Officer', label: 'Field Officer', color: '#059669' },
  { value: 'Warehouse_Manager', label: 'Warehouse Manager', color: '#2563EB' },
  { value: 'Finance_Officer', label: 'Finance Officer', color: '#7C3AED' },
];

const roleBadge = role => {
  const r = ROLE_OPTIONS.find(o => o.value === role) || { label: role, color: '#6B7280' };
  return <span style={{ background: `${r.color}18`, color: r.color, padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{r.label}</span>;
};

const statusBadge = isActive => isActive
  ? <span className="badge badge-resolved">Active</span>
  : <span className="badge badge-closed">Inactive</span>;

/* ── Create User Modal ──────────────────────────── */
const CreateUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Emergency_Operator' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/users', form);
      onCreated(); onClose();
    } catch (ex) { setErr(ex.response?.data?.message || 'Failed to create user'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Create New User</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Username <span>*</span></label>
            <input className="form-input" placeholder="e.g. rescue_ahmed" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span>*</span></label>
            <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Role <span>*</span></label>
              <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Edit User Modal ────────────────────────────── */
const EditUserModal = ({ user: editUser, onClose, onUpdated }) => {
  const [form, setForm] = useState({ email: editUser.email, role: editUser.role });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.patch(`/users/${editUser.user_id}`, form);
      onUpdated(); onClose();
    } catch (ex) { setErr(ex.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Edit User: {editUser.username}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Reset Password Modal ───────────────────────── */
const ResetPasswordModal = ({ user: targetUser, onClose, onReset }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.patch(`/users/${targetUser.user_id}/reset-password`, { new_password: newPassword });
      onReset(); onClose();
    } catch (ex) { setErr(ex.response?.data?.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '380px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Reset Password</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Set a new password for <strong style={{ color: '#111827' }}>{targetUser.username}</strong>
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">New Password <span>*</span></label>
            <input className="form-input" type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Resetting…' : 'Reset Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Users Page ────────────────────────────── */
const Users = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/users')
      .then(r => setUsers(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (u) => {
    const action = u.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${u.username}"?`)) return;
    try {
      await api.patch(`/users/${u.user_id}/toggle-status`);
      load();
    } catch (ex) { alert(ex.response?.data?.message || 'Toggle failed'); }
  };

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.is_active) return false;
    if (statusFilter === 'inactive' && u.is_active) return false;
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  return (
    <PageLayout
      title="User Management"
      subtitle="Create, edit, and manage system user accounts and roles"
      actions={<button className="btn btn-primary" onClick={() => setCreateModal(true)}><Plus size={16} /> Create User</button>}
    >
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Users', val: stats.total, color: '#2563EB' },
          { label: 'Active', val: stats.active, color: '#059669' },
          { label: 'Inactive', val: stats.inactive, color: '#C8102E' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
            <p style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.4rem' }}>{s.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: 0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div className="filter-row">
          <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.user_id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                    <td><strong>#{u.user_id}</strong></td>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td style={{ color: '#6B7280', fontSize: '0.875rem' }}>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td>{statusBadge(u.is_active)}</td>
                    <td style={{ color: '#6B7280', fontSize: '0.8rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(u)} title="Edit user">
                          <Edit size={13} /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setResetModal(u)} title="Reset password">
                          <KeyRound size={13} /> Password
                        </button>
                        {u.user_id !== user?.user_id && (
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleStatus(u)}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {u.is_active ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                    <UsersIcon size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.4 }} /> No users found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createModal && <CreateUserModal onClose={() => setCreateModal(false)} onCreated={load} />}
      {editModal && <EditUserModal user={editModal} onClose={() => setEditModal(null)} onUpdated={load} />}
      {resetModal && <ResetPasswordModal user={resetModal} onClose={() => setResetModal(null)} onReset={load} />}
    </PageLayout>
  );
};

export default Users;
