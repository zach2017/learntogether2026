import { useAuth } from './AuthContext';
import './SecurePage.css';
import InactivityTimer from './InactivityTimer';

const SecurePage = () => {
  const { userInfo, logout, getUserRoles } = useAuth();
  const roles = getUserRoles();

  return (
    <div className="secure-container">
      <div className="secure-card">
        <h1>Hello, {userInfo?.preferred_username || userInfo?.name || 'User'}! 👋</h1>
        
        <div className="info-section">
          <h2>Your Information</h2>
          <InactivityTimer/>
          {userInfo?.email && (
            <p><strong>Email:</strong> {userInfo.email}</p>
          )}
          {userInfo?.name && (
            <p><strong>Name:</strong> {userInfo.name}</p>
          )}
        </div>

        <div className="roles-section">
          <h2>Your Roles</h2>
          {roles.length > 0 ? (
            <div className="roles-list">
              {roles.map((role, index) => (
                <span key={index} className="role-badge">
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p>No roles assigned</p>
          )}
        </div>

        <div className="session-info">
          <p className="info-text">
            ⏱️ Your session will expire after 5 minutes of inactivity
          </p>
        </div>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default SecurePage;
