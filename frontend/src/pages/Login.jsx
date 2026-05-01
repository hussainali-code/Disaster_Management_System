import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, KeyRound, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login }  = useContext(AuthContext);
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const demoAccounts = [
    { user: 'admin_sara',   role: 'Administrator',       pw: 'Admin@123'     },
    { user: 'op_khalid',    role: 'Emergency Operator',  pw: 'Operator@123'  },
    { user: 'field_ali',    role: 'Field Officer',       pw: 'Field@123'     },
    { user: 'wm_fatima',    role: 'Warehouse Manager',   pw: 'Warehouse@123' },
    { user: 'finance_omar', role: 'Finance Officer',     pw: 'Finance@123'   },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #C8102E 0%, #8B0000 40%, #1a0005 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-15%', left:'-8%', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />

      <div style={{ display:'flex', gap:'2.5rem', width:'100%', maxWidth:'900px', alignItems:'stretch', flexWrap:'wrap', justifyContent:'center' }}>
        
        {/* Left branding panel */}
        <div style={{ flex:'1', minWidth:'280px', display:'flex', flexDirection:'column', justifyContent:'center', padding:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'2rem' }}>
            <div style={{ width:'52px', height:'52px', background:'rgba(255,255,255,0.15)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.25)' }}>
              <ShieldAlert size={28} color="#fff" />
            </div>
            <div>
              <p style={{ color:'#fff', fontWeight:800, fontSize:'1.5rem', margin:0, lineHeight:1.2 }}>Disaster MIS</p>
              <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.8rem', margin:0 }}>Smart Emergency Response System</p>
            </div>
          </div>
          <h2 style={{ color:'#fff', fontSize:'2.25rem', fontWeight:800, lineHeight:1.2, marginBottom:'1rem' }}>
            Coordinating<br/>relief, saving<br/>lives.
          </h2>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.95rem', lineHeight:1.7 }}>
            A centralized Management Information System for tracking disasters, deploying rescue teams, and managing humanitarian resources.
          </p>
        </div>

        {/* Right login card */}
        <div style={{ flex:'1', minWidth:'320px', maxWidth:'420px' }}>
          <div className="glass-panel" style={{ padding:'2.5rem' }}>
            <h3 style={{ margin:'0 0 0.25rem', fontSize:'1.375rem', fontWeight:800, color:'#111827' }}>Sign in to your account</h3>
            <p style={{ color:'#6B7280', fontSize:'0.875rem', marginBottom:'1.75rem' }}>Enter your credentials to continue</p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom:'1.25rem' }}>
                <AlertCircle size={16} style={{ flexShrink:0 }} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <div style={{ position:'relative' }}>
                  <User size={16} style={{ position:'absolute', top:'50%', left:'0.875rem', transform:'translateY(-50%)', color:'#9CA3AF', pointerEvents:'none' }} />
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft:'2.5rem' }}
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div style={{ position:'relative' }}>
                  <KeyRound size={16} style={{ position:'absolute', top:'50%', left:'0.875rem', transform:'translateY(-50%)', color:'#9CA3AF', pointerEvents:'none' }} />
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft:'2.5rem' }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width:'100%', marginTop:'0.5rem', padding:'0.875rem', fontSize:'0.95rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating…' : 'Sign In'}
              </button>
            </form>

            {/* Demo accounts */}
            <div style={{ marginTop:'1.75rem', paddingTop:'1.5rem', borderTop:'1px solid #F3F4F6' }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.75rem' }}>Demo Accounts</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                {demoAccounts.map(a => (
                  <button
                    key={a.user}
                    type="button"
                    onClick={() => { setUsername(a.user); setPassword(a.pw); }}
                    style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'0.5rem 0.75rem', borderRadius:'8px', border:'1px solid #F3F4F6',
                      background:'#FAFAFA', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor='rgba(200,16,46,0.3)'; e.currentTarget.style.background='#FFF5F6'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor='#F3F4F6'; e.currentTarget.style.background='#FAFAFA'; }}
                  >
                    <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#111827' }}>{a.user}</span>
                    <span style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>{a.role}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize:'0.72rem', color:'#9CA3AF', marginTop:'0.5rem', textAlign:'center' }}>Click any row to auto-fill credentials</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
