// package.json
{
  "name": "file-upload-client",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.6.0",
    "amazon-cognito-identity-js": "^6.3.6",
    "jwt-decode": "^4.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

// public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="File Upload Service" />
    <title>File Upload Service</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>

// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// src/index.css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthService } from './services/AuthService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;

// src/App.css
.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// src/services/AuthService.js
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export class AuthService {
  static async login(username, password) {
    // Mock authentication - in production, call Cognito
    const mockToken = this.generateMockToken(username);
    
    localStorage.setItem(TOKEN_KEY, mockToken);
    
    const userData = {
      username,
      token: mockToken,
      roles: this.getRolesFromToken(mockToken)
    };
    
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData;
  }

  static logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static async getCurrentUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);
    
    if (!token || !userData) {
      throw new Error('Not authenticated');
    }

    return JSON.parse(userData);
  }

  static getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getRolesFromToken(token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.roles || [];
    } catch (error) {
      return [];
    }
  }

  static hasRole(role) {
    try {
      const token = this.getToken();
      if (!token) return false;
      
      const roles = this.getRolesFromToken(token);
      return roles.includes(role);
    } catch (error) {
      return false;
    }
  }

  static hasAnyRole(requiredRoles) {
    try {
      const token = this.getToken();
      if (!token) return false;
      
      const roles = this.getRolesFromToken(token);
      return requiredRoles.some(role => roles.includes(role));
    } catch (error) {
      return false;
    }
  }

  // Mock token generator for demo purposes
  static generateMockToken(username) {
    // Determine roles based on username for demo
    let roles = ['view'];
    
    if (username === 'admin') {
      roles = ['admin', 'upload', 'download', 'view'];
    } else if (username === 'uploader') {
      roles = ['upload', 'view'];
    } else if (username === 'downloader') {
      roles = ['download', 'view'];
    } else if (username === 'viewer') {
      roles = ['view'];
    } else if (username === 'guest') {
      roles = ['guest'];
    }

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: username,
      username: username,
      roles: roles,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }));
    const signature = btoa('mock-signature');

    return `${header}.${payload}.${signature}`;
  }
}

// src/services/FileService.js
import axios from 'axios';
import { AuthService } from './AuthService';

const JAVA_API_URL = process.env.REACT_APP_JAVA_API_URL || 'http://localhost:8080';
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000';

class FileServiceClass {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = AuthService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async listFiles() {
    return this.api.get('/api/files/list');
  }

  async getFileMetadata(fileId) {
    return this.api.get(`/api/files/${fileId}`);
  }

  async downloadFile(fileId, fileName) {
    const response = await this.api.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async deleteFile(fileId) {
    return this.api.delete(`/api/files/${fileId}`);
  }
}

export const JavaFileService = new FileServiceClass(JAVA_API_URL);
export const PythonFileService = new FileServiceClass(PYTHON_API_URL);

// src/components/Login.js
import React, { useState } from 'react';
import { AuthService } from '../services/AuthService';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await AuthService.login(username, password);
      onLogin(userData);
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>File Upload Service</h1>
        <p className="subtitle">Sign in to manage your files</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-users">
          <p>Demo users:</p>
          <ul>
            <li><strong>admin</strong> - Full access</li>
            <li><strong>uploader</strong> - Upload + View</li>
            <li><strong>downloader</strong> - Download + View</li>
            <li><strong>viewer</strong> - View only</li>
            <li><strong>guest</strong> - Limited access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;

// src/components/Login.css
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
}

.login-card h1 {
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 1.8rem;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.login-button {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-users {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.demo-users p {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #555;
}

.demo-users ul {
  list-style: none;
}

.demo-users li {
  padding: 0.4rem 0;
  color: #666;
  font-size: 0.9rem;
}

// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { JavaFileService, PythonFileService } from '../services/FileService';
import FileUpload from './FileUpload';
import FileList from './FileList';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('java');
  const [error, setError] = useState('');

  const fileService = selectedService === 'java' ? JavaFileService : PythonFileService;

  useEffect(() => {
    loadFiles();
  }, [selectedService]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fileService.listFiles();
      setFiles(response.data);
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = () => {
    loadFiles();
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      await fileService.downloadFile(fileId, fileName);
    } catch (err) {
      if (err.response?.status === 403) {
        alert('You do not have permission to download files. View-only access.');
      } else {
        alert('Failed to download file');
      }
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await fileService.deleteFile(fileId);
      loadFiles();
    } catch (err) {
      if (err.response?.status === 403) {
        alert('You do not have permission to delete files. Admin access required.');
      } else {
        alert('Failed to delete file');
      }
    }
  };

  const canUpload = AuthService.hasAnyRole(['admin', 'upload']);
  const canDownload = AuthService.hasAnyRole(['admin', 'download']);
  const canDelete = AuthService.hasRole('admin');

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>File Management Dashboard</h1>
          <div className="user-info">
            <span className="username">{user.username}</span>
            <span className="roles">
              {user.roles.map(role => (
                <span key={role} className="role-badge">{role}</span>
              ))}
            </span>
            <button onClick={onLogout} className="logout-button">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="service-selector">
          <label>Service:</label>
          <button
            className={selectedService === 'java' ? 'active' : ''}
            onClick={() => setSelectedService('java')}
          >
            Java API
          </button>
          <button
            className={selectedService === 'python' ? 'active' : ''}
            onClick={() => setSelectedService('python')}
          >
            Python API
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {canUpload && (
          <FileUpload
            fileService={fileService}
            onFileUploaded={handleFileUploaded}
          />
        )}

        <FileList
          files={files}
          loading={loading}
          canDownload={canDownload}
          canDelete={canDelete}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRefresh={loadFiles}
        />
      </main>
    </div>
  );
}

export default Dashboard;

// src/components/Dashboard.css
.dashboard {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 1.75rem;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-weight: 600;
}

.roles {
  display: flex;
  gap: 0.5rem;
}

.role-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.logout-button {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.logout-button:hover {
  transform: translateY(-2px);
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.service-selector {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.service-selector label {
  font-weight: 600;
  color: #333;
}

.service-selector button {
  padding: 0.5rem 1.25rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.service-selector button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.error-banner {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

// src/components/FileUpload.js
import React, { useState } from 'react';
import './FileUpload.css';

function FileUpload({ fileService, onFileUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await fileService.uploadFile(selectedFile);
      setSuccess(`File "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      onFileUploaded();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-card">
      <h2>Upload File</h2>
      
      <div className="upload-area">
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          id="file-input"
        />
        <label htmlFor="file-input" className="file-input-label">
          {selectedFile ? selectedFile.name : 'Choose a file...'}
        </label>
        
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}
    </div>
  );
}

export default FileUpload;

// src/components/FileUpload.css
.file-upload-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.file-upload-card h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.upload-area {
  display: flex;
  gap: 1rem;
  align-items: center;
}

#file-input {
  display: none;
}

.file-input-label {
  flex: 1;
  padding: 0.75rem;
  border: 2px dashed #ddd;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.3s;
}

.file-input-label:hover {
  border-color: #667eea;
}

.upload-button {
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.upload-button:hover:not(:disabled) {
  background: #5568d3;
}

.upload-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
}

.message.error {
  background: #fee;
  color: #c33;
}

.message.success {
  background: #efe;
  color: #3c3;
}

// src/components/FileList.js
import React from 'react';
import './FileList.css';

function FileList({ files, loading, canDownload, canDelete, onDownload, onDelete, onRefresh }) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="file-list-card">
        <h2>Your Files</h2>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list-card">
      <div className="file-list-header">
        <h2>Your Files ({files.length})</h2>
        <button onClick={onRefresh} className="refresh-button">
          ↻ Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="file-table-container">
          <table className="file-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.fileId}>
                  <td className="file-name">{file.fileName}</td>
                  <td>{formatFileSize(file.fileSize)}</td>
                  <td>{file.contentType}</td>
                  <td>{formatDate(file.uploadedAt)}</td>
                  <td className="actions">
                    {canDownload && (
                      <button
                        onClick={() => onDownload(file.fileId, file.fileName)}
                        className="action-button download"
                      >
                        Download
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(file.fileId)}
                        className="action-button delete"
                      >
                        Delete
                      </button>
                    )}
                    {!canDownload && !canDelete && (
                      <span className="view-only">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FileList;

// src/components/FileList.css
.file-list-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.file-list-header h2 {
  color: #333;
  margin: 0;
}

.refresh-button {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.refresh-button:hover {
  background: #e0e0e0;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.file-table-container {
  overflow-x: auto;
}

.file-table {
  width: 100%;
  border-collapse: collapse;
}

.file-table thead {
  background: #f8f8f8;
}

.file-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
}

.file-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.file-name {
  font-weight: 500;
  color: #333;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.4rem 0.875rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s;
}

.action-button.download {
  background: #667eea;
  color: white;
}

.action-button.download:hover {
  background: #5568d3;
}

.action-button.delete {
  background: #dc3545;
  color: white;
}

.action-button.delete:hover {
  background: #c82333;
}

.view-only {
  color: #999;
  font-style: italic;
}

// Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

// .dockerignore
node_modules
build
.git
.env