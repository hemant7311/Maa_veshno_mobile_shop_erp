import React from 'react'

const ComingSoon = ({ title, description }) => (
  <div>
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
    <div className="table-wrapper">
      <div className="empty-state" style={{ padding: '80px 20px' }}>
        <div className="empty-state-icon">🚧</div>
        <h3>Coming Soon</h3>
        <p>Yeh module jald tayyar hoga...</p>
      </div>
    </div>
  </div>
)

export default ComingSoon
