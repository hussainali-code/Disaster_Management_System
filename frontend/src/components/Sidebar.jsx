import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, AlertTriangle, Users, Package,
  DollarSign, LogOut, ShieldAlert, Building2, CheckSquare, ChevronRight,
  Globe, UserCog, Shield
} from 'lucide-react';

const ROLE_LABELS = {
  Administrator: 'Administrator',
  Emergency_Operator: 'Emergency Operator',
  Field_Officer: 'Field Officer',
  Warehouse_Manager: 'Warehouse Manager',
  Finance_Officer: 'Finance Officer',
};

const ROLE_COLORS = {
  Administrator:      '#C8102E',
  Emergency_Operator: '#D97706',
  Field_Officer:      '#059669',
  Warehouse_Manager:  '#2563EB',
  Finance_Officer:    '#7C3AED',
};

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard',       path: '/dashboard',    icon: <LayoutDashboard size={18} />, roles: ['Administrator','Emergency_Operator','Field_Officer','Warehouse_Manager','Finance_Officer'] },
    { name: 'Incidents',       path: '/incidents',    icon: <AlertTriangle size={18} />,   roles: ['Administrator','Emergency_Operator','Field_Officer'] },
    { name: 'Disaster Events', path: '/events',       icon: <Globe size={18} />,           roles: ['Administrator','Emergency_Operator','Field_Officer'] },
    { name: 'Teams',           path: '/teams',        icon: <Users size={18} />,           roles: ['Administrator','Emergency_Operator','Field_Officer'] },
    { name: 'Resources',       path: '/resources',    icon: <Package size={18} />,         roles: ['Administrator','Warehouse_Manager','Emergency_Operator'] },
    { name: 'Hospitals',       path: '/hospitals',    icon: <Building2 size={18} />,       roles: ['Administrator','Emergency_Operator','Field_Officer'] },
    { name: 'Finance',         path: '/finance',      icon: <DollarSign size={18} />,      roles: ['Administrator','Finance_Officer'] },
    { name: 'Approvals',       path: '/approvals',    icon: <CheckSquare size={18} />,     roles: ['Administrator','Emergency_Operator','Warehouse_Manager','Finance_Officer'] },
    { name: 'User Management', path: '/users',        icon: <UserCog size={18} />,         roles: ['Administrator'] },
    { name: 'Audit Trail',     path: '/audit-trail',  icon: <Shield size={18} />,          roles: ['Administrator'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user?.role));
  const roleColor = ROLE_COLORS[user?.role] || '#C8102E';
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{
      width: '260px',
      background: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo / Brand */}
      <div style={{
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid #F3F4F6',
        background: 'linear-gradient(135deg, #C8102E 0%, #A50D25 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#fff', lineHeight: 1.2 }}>Disaster MIS</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>Emergency Response</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
          Navigation
        </p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {allowedItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: isActive ? '#FFF0F2' : 'transparent',
                    color: isActive ? '#C8102E' : '#6B7280',
                    border: isActive ? '1px solid rgba(200,16,46,0.15)' : '1px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    position: 'relative',
                  }}
                  onMouseOver={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#FFF5F6';
                      e.currentTarget.style.color = '#C8102E';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  {isActive && (
                    <span style={{
                      position: 'absolute', left: 0, top: '25%', bottom: '25%',
                      width: '3px', background: '#C8102E', borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: roleColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: `0 2px 8px ${roleColor}55`,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username}
            </p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </p>
          </div>
        </div>
        <button
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280',
          }}
          onClick={handleLogout}
          onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#C8102E'; e.currentTarget.style.borderColor = 'rgba(200,16,46,0.3)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
