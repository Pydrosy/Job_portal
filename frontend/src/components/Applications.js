import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const endpoint = user?.userType === 'jobseeker' 
        ? '/my-applications' 
        : '/employer/applications'; // Note: You need to create this endpoint
      
      // For now, using jobseeker endpoint as example
      const response = await api.get('/my-applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      // Note: You'll need to create an endpoint for this
      // await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      alert(`Status would be updated to: ${newStatus}`);
      fetchApplications();
    } catch (error) {
      alert('Failed to update status');
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

  if (applications.length === 0) {
    return (
      <div className="text-center py-5">
        <h4>No applications found</h4>
        <p className="text-muted">
          {user?.userType === 'jobseeker'
            ? "You haven't applied to any jobs yet."
            : "You haven't received any applications yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="applications">
      <h4 className="mb-4">
        {user?.userType === 'jobseeker' ? 'My Applications' : 'Job Applications'}
      </h4>
      
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>
                  <strong>{app.title}</strong>
                  {app.cover_letter && (
                    <small className="d-block text-muted mt-1">
                      {app.cover_letter.substring(0, 50)}...
                    </small>
                  )}
                </td>
                <td>{app.company_name || app.employer_company}</td>
                <td>
                  {new Date(app.applied_at).toLocaleDateString()}
                </td>
                <td>
                  <span className={`badge ${
                    app.status === 'pending' ? 'bg-warning' :
                    app.status === 'reviewed' ? 'bg-info' :
                    app.status === 'accepted' ? 'bg-success' :
                    'bg-danger'
                  }`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="dropdown">
                    <button 
                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      Options
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedJob(app);
                            // You can show details in a modal
                          }}
                        >
                          View Details
                        </button>
                      </li>
                      
                      {user?.userType === 'employer' && (
                        <>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                            >
                              Mark as Reviewed
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item text-success"
                              onClick={() => updateApplicationStatus(app.id, 'accepted')}
                            >
                              Accept Application
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item text-danger"
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            >
                              Reject Application
                            </button>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Application Details Modal */}
      {selectedJob && (
        <div className="modal fade" id="applicationModal" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Application Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body">
                <h5>{selectedJob.title}</h5>
                <p><strong>Company:</strong> {selectedJob.company_name}</p>
                <p><strong>Applicant:</strong> {selectedJob.applicant_name || user?.name}</p>
                <p><strong>Email:</strong> {selectedJob.applicant_email || user?.email}</p>
                <p><strong>Applied Date:</strong> {new Date(selectedJob.applied_at).toLocaleDateString()}</p>
                
                <div className="mt-3">
                  <h6>Cover Letter:</h6>
                  <div className="border p-3 rounded bg-light">
                    {selectedJob.cover_letter || 'No cover letter provided.'}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;