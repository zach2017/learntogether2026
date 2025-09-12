// frontend/src/App.jsx
import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setMessage('Please select a file first!')
      return
    }

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setMessage(`File uploaded successfully! Key: ${response.data.key}`)
      setFile(null)
      document.getElementById('file-input').value = ''
      fetchUploadedFiles()
    } catch (error) {
      setMessage(`Upload failed: ${error.response?.data?.error || error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const fetchUploadedFiles = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/files`)
      setUploadedFiles(response.data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const downloadFile = async (key) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/download/${encodeURIComponent(key)}`,
        { responseType: 'blob' }
      )
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', key.split('/').pop())
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      setMessage(`Download failed: ${error.message}`)
    }
  }

  const deleteFile = async (key) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/delete/${encodeURIComponent(key)}`)
      setMessage(`File ${key} deleted successfully!`)
      fetchUploadedFiles()
    } catch (error) {
      setMessage(`Delete failed: ${error.message}`)
    }
  }

  // Load files on component mount
  useState(() => {
    fetchUploadedFiles()
  }, [])

  return (
    <div className="App">
      <div className="container">
        <h1>File Upload to LocalStack S3</h1>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-input-container">
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={uploading || !file}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="files-section">
          <div className="section-header">
            <h2>Uploaded Files</h2>
            <button onClick={fetchUploadedFiles} className="refresh-button">
              Refresh
            </button>
          </div>
          
          {uploadedFiles.length > 0 ? (
            <div className="files-list">
              {uploadedFiles.map((fileObj, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <span className="file-name">{fileObj.Key}</span>
                    <span className="file-size">{Math.round(fileObj.Size / 1024)} KB</span>
                    <span className="file-date">{new Date(fileObj.LastModified).toLocaleString()}</span>
                  </div>
                  <div className="file-actions">
                    <button 
                      onClick={() => downloadFile(fileObj.Key)}
                      className="download-button"
                    >
                      Download
                    </button>
                    <button 
                      onClick={() => deleteFile(fileObj.Key)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-files">No files uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App