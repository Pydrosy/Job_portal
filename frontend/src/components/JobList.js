import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const JobList = ({ isDashboard = false }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const endpoint = isDashboard && user?.userType === 'employer' 
        ? '/employer/jobs' 
        : '/jobs';
      
      const response = await api.get(endpoint);
      setJobs(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      // Note: You'll need to add a DELETE endpoint in the backend
      // await api.delete(`/jobs/${jobId}`);
      alert('Delete functionality would be implemented here');
      // After successful deletion:
      // fetchJobs();
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-5">
        <h4>No jobs found</h4>
        <p className="text-muted">
          {isDashboard && user?.userType === 'employer'
            ? "You haven't posted any jobs yet."
            : "Check back later for new opportunities."}
        </p>
      </div>
    );
  }

  return (
    <div className="job-list">
      {jobs.map((job) => (
        <div key={job.id} className="card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5 className="card-title">{job.title}</h5>
                <h6 className="card-subtitle mb-2 text-muted">
                  {job.company_name}
                  {job.location && ` • ${job.location}`}
                </h6>
                <p className="card-text">{job.description}</p>
                
                <div className="d-flex gap-2 mb-3">
                  <span className="badge bg-primary">{job.job_type}</span>
                  {job.salary && (
                    <span className="badge bg-success">{job.salary}</span>
                  )}
                  {job.application_count > 0 && (
                    <span className="badge bg-info">
                      {job.application_count} application(s)
                    </span>
                  )}
                </div>
              </div>
              
              {isDashboard && user?.userType === 'employer' && (
                <div className="dropdown">
                  <button 
                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    Actions
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={() => {}}>
                        View Applications
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={() => {}}>
                        Edit
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            {!isDashboard && user?.userType === 'jobseeker' && (
              <button 
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#applyModal"
                onClick={() => {
                  // This would set the selected job in parent component
                }}
              >
                Apply Now
              </button>
            )}
          </div>
          
          <div className="card-footer text-muted">
            <small>
              Posted on {new Date(job.created_at).toLocaleDateString()}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobList;