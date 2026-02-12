import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, Button, Form, Card, Badge, ListGroup, 
  Spinner, Alert, Row, Col, ProgressBar 
} from 'react-bootstrap';

const JobSeekerDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [profileCv, setProfileCv] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchProfile();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs');
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/my-applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications');
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.resume) {
        setProfileCv(response.data.resume);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setCoverLetter('');
    setCvFile(null);
    setCvFileName('');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PDF or Word documents');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setCvFile(file);
      setCvFileName(file.name);
    }
  };

  const handleApply = async () => {
    if (!selectedJob) {
      alert('Please select a job');
      return;
    }

    if (!cvFile && !profileCv) {
      alert('Please upload your CV/Resume');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('jobId', selectedJob.id);
      formData.append('coverLetter', coverLetter);
      
      // Use uploaded CV if available, otherwise use profile CV
      if (cvFile) {
        formData.append('cv', cvFile);
      }

      const response = await axios.post('http://localhost:5000/api/apply', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      
      alert('Application submitted successfully!');
      setShowModal(false);
      setSelectedJob(null);
      setCoverLetter('');
      setCvFile(null);
      setCvFileName('');
      setUploadProgress(0);
      fetchApplications();
    } catch (error) {
      alert(error.response?.data?.error || 'Error submitting application');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('cv', file);

      await axios.put('http://localhost:5000/api/profile/cv', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('CV uploaded successfully!');
      fetchProfile();
    } catch (error) {
      alert('Failed to upload CV');
    }
  };

  const downloadCV = (cvFile) => {
    if (cvFile) {
      window.open(`http://localhost:5000/uploads/${cvFile}`, '_blank');
    }
  };

  const getStatusBadgeColor = (status) => {
    const variants = {
      pending: 'warning',
      reviewed: 'info',
      accepted: 'success',
      rejected: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Job Seeker Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Available Jobs</h4>
            </Card.Header>
            <Card.Body>
              {jobs.length === 0 ? (
                <p className="text-center text-muted">No jobs available at the moment</p>
              ) : (
                <ListGroup variant="flush">
                  {jobs.map(job => (
                    <ListGroup.Item key={job.id} className="mb-3 border rounded">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h5 className="mb-1">{job.title}</h5>
                          <p className="mb-1 text-muted">
                            <strong>{job.company_name}</strong> • {job.location || 'Not specified'}
                          </p>
                          <div className="mb-2">
                            <Badge bg="info" className="me-2">{job.job_type}</Badge>
                            {job.salary && job.salary !== 'Not specified' && (
                              <Badge bg="success">💰 {job.salary}</Badge>
                            )}
                          </div>
                          <p className="mb-2">{job.description.substring(0, 200)}...</p>
                          <small className="text-muted">
                            Posted: {new Date(job.created_at).toLocaleDateString()}
                          </small>
                        </div>
                        <Button 
                          variant="primary" 
                          size="sm"
                          className="ms-3"
                          onClick={() => handleApplyClick(job)}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          {/* Profile CV Section */}
          <Card className="mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">My Profile</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="h1 mb-2">👤</div>
                <h6>{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Job Seeker'}</h6>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Upload CV/Resume</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleProfileCVUpload}
                  />
                </div>
                <Form.Text className="text-muted">
                  PDF, DOC, DOCX (Max 5MB)
                </Form.Text>
              </Form.Group>
              
              {profileCv && (
                <Alert variant="success" className="mt-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      <i className="bi bi-file-pdf me-2"></i>
                      CV Uploaded
                    </span>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => downloadCV(profileCv)}
                    >
                      View CV
                    </Button>
                  </div>
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Applications Section */}
          <Card>
            <Card.Header className="bg-success text-white">
              <h4 className="mb-0">My Applications</h4>
            </Card.Header>
            <Card.Body>
              {applications.length === 0 ? (
                <p className="text-center text-muted">No applications yet</p>
              ) : (
                <ListGroup variant="flush">
                  {applications.map(app => (
                    <ListGroup.Item key={app.id} className="mb-2 border rounded">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{app.title}</h6>
                          <p className="mb-1 text-muted small">{app.company_name}</p>
                          {app.cv_file && (
                            <Badge 
                              bg="light" 
                              text="dark" 
                              className="mb-2"
                              style={{ cursor: 'pointer' }}
                              onClick={() => downloadCV(app.cv_file)}
                            >
                              <i className="bi bi-file-text me-1"></i> View CV
                            </Badge>
                          )}
                        </div>
                        <div className="text-end">
                          {getStatusBadgeColor(app.status)}
                          <div>
                            <small className="text-muted">
                              {new Date(app.applied_at).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
          
          {/* Stats Card */}
          <Card className="mt-4">
            <Card.Body>
              <h5>Quick Stats</h5>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Total Applications
                  <Badge bg="primary">{applications.length}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Pending Review
                  <Badge bg="warning">
                    {applications.filter(a => a.status === 'pending').length}
                  </Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Accepted
                  <Badge bg="success">
                    {applications.filter(a => a.status === 'accepted').length}
                  </Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Apply Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Apply for {selectedJob?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob && (
            <>
              <Alert variant="info">
                <strong>Company:</strong> {selectedJob.company_name}<br />
                <strong>Location:</strong> {selectedJob.location || 'Not specified'}<br />
                <strong>Job Type:</strong> {selectedJob.job_type}
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>Cover Letter</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Explain why you're a good fit for this position..."
                />
                <Form.Text className="text-muted">
                  Optional but recommended
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Upload CV/Resume *</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required={!profileCv}
                />
                <Form.Text className="text-muted">
                  {profileCv 
                    ? "You already have a CV uploaded. Upload a new one to update it for this application." 
                    : "PDF, DOC, DOCX (Max 5MB)"}
                </Form.Text>
              </Form.Group>
              
              {cvFileName && (
                <Alert variant="success">
                  <i className="bi bi-check-circle me-2"></i>
                  Selected file: {cvFileName}
                </Alert>
              )}
              
              {profileCv && !cvFile && (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Your existing CV will be used for this application
                </Alert>
              )}
              
              {uploading && (
                <div className="mb-3">
                  <ProgressBar 
                    now={uploadProgress} 
                    label={`${uploadProgress}%`} 
                    variant="success"
                  />
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleApply}
            disabled={uploading || (!cvFile && !profileCv)}
          >
            {uploading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bootstrap Icons */}
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" 
      />
    </div>
  );
};

export default JobSeekerDashboard;