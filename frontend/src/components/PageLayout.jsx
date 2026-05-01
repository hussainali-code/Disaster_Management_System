import React from 'react';
import Sidebar from './Sidebar';

const PageLayout = ({ title, subtitle, children, actions }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-header animate-fade-in">
          <div className="page-header-title">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {actions}
            </div>
          )}
        </div>
        <div className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
