import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, Button, Form, Card, Badge, ListGroup, 
  Dropdown, Spinner, Alert, Row, Col 
} from 'react-bootstrap';

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [showJobForm, setShowJobForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  
  // Salary range state
  const [salaryMin, setSalaryMin] = useState('50000');
  const [salaryMax, setSalaryMax] = useState('120000');
  const [salaryCurrency, setSalaryCurrency] = useState('$');

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: '',
    location_type: 'remote',
    salary_min: '',
    salary_max: '',
    salary_currency: '$',
    job_type: 'full-time'
  });

  const [editJob, setEditJob] = useState({
    title: '',
    description: '',
    location: '',
    location_type: '',
    salary_min: '',
    salary_max: '',
    salary_currency: '$',
    job_type: ''
  });

  // Job titles list (most common job titles)
  const jobTitles = [
    'Software Engineer',
    'Senior Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Data Analyst',
    'Product Manager',
    'Project Manager',
    'UI/UX Designer',
    'QA Engineer',
    'Sales Manager',
    'Marketing Manager',
    'HR Manager',
    'Accountant',
    'Financial Analyst',
    'Customer Support',
    'Administrative Assistant',
    'Graphic Designer',
    'Content Writer',
    'Business Analyst',
    'System Administrator',
    'Network Engineer',
    'Mobile Developer (iOS)',
    'Mobile Developer (Android)',
    'Cloud Architect',
    'Security Engineer',
    'Scrum Master',
    'Technical Lead',
    'CTO',
    'CEO',
    'COO',
    'Office Manager',
    'Receptionist',
    'Legal Counsel',
    'Sales Representative',
    'Account Executive',
    'Social Media Manager',
    'SEO Specialist',
    'Database Administrator',
    'IT Support',
    'Mechanical Engineer',
    'Civil Engineer',
    'Electrical Engineer',
    'Architect',
    'Teacher',
    'Nurse',
    'Doctor',
    'Pharmacist'
  ].sort();

  // Location types
  const locationTypes = [
    'Remote',
    'Onsite',
    'Hybrid',
    'Abroad',
    'Relocation Required'
  ];

  // Countries for abroad/relocation
  const countries = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Japan',
    'Singapore',
    'UAE (Dubai)',
    'Saudi Arabia',
    'Qatar',
    'Switzerland',
    'Netherlands',
    'Sweden',
    'Norway',
    'Denmark',
    'Ireland',
    'New Zealand',
    'China',
    'South Korea',
    'India',
    'Brazil',
    'Mexico',
    'South Africa','Zimbabwe'
  ];

  // Cities for onsite/hybrid
  const cities = [
    'New York',
    'San Francisco',
    'Los Angeles',
    'Chicago',
    'Boston',
    'Seattle',
    "Harare",
    'Austin',
    'London',
    'Manchester',
    'Toronto',
    'Vancouver',
    'Sydney',
    'Melbourne',
    'Berlin',
    'Munich',
    'Paris',
    'Tokyo',
    'Singapore',
    'Dubai',
    'Amsterdam',
    'Dublin',
    'Stockholm',
    'Copenhagen',
    'Zurich'
  ];

  // Currencies
  const currencies = [
    { code: '$', name: 'USD' },
    { code: '€', name: 'EUR' },
    { code: '£', name: 'GBP' },
    { code: '¥', name: 'JPY' },
    { code: 'C$', name: 'CAD' },
    { code: 'A$', name: 'AUD' },
    { code: 'S$', name: 'SGD' },
     { code: 'ZWG', name: 'Zimbabwe Dollar' },
    { code: 'AED', name: 'AED' },
    { code: 'SAR', name: 'SAR' },
    { code: 'QAR', name: 'QAR' },
    { code: 'CHF', name: 'CHF' },
    { code: 'CN¥', name: 'CNY' },
    { code: '₹', name: 'INR' }
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/employer/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/jobs/${jobId}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setApplications(prev => ({
        ...prev,
        [jobId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationTypeChange = (type) => {
    setNewJob(prev => ({
      ...prev,
      location_type: type.toLowerCase(),
      location: '' // Reset location when type changes
    }));
  };

  const handleLocationSelect = (location) => {
    setNewJob(prev => ({
      ...prev,
      location: location
    }));
  };

  const handleSalaryMinChange = (e) => {
    const value = e.target.value;
    setSalaryMin(value);
    setNewJob(prev => ({
      ...prev,
      salary_min: value
    }));
  };

  const handleSalaryMaxChange = (e) => {
    const value = e.target.value;
    setSalaryMax(value);
    setNewJob(prev => ({
      ...prev,
      salary_max: value
    }));
  };

  const handleSalaryCurrencyChange = (currency) => {
    setSalaryCurrency(currency.code);
    setNewJob(prev => ({
      ...prev,
      salary_currency: currency.code
    }));
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // Format salary string
      const salaryString = `${newJob.salary_currency}${newJob.salary_min} - ${newJob.salary_currency}${newJob.salary_max}`;
      
      // Format location string
      let locationString = newJob.location;
      if (newJob.location_type === 'remote') {
        locationString = 'Remote';
      } else if (newJob.location_type === 'abroad') {
        locationString = `Abroad - ${newJob.location}`;
      } else if (newJob.location_type === 'relocation') {
        locationString = `Relocation to ${newJob.location}`;
      } else if (newJob.location) {
        locationString = `${newJob.location} (${newJob.location_type})`;
      }

      const jobData = {
        title: newJob.title,
        description: newJob.description,
        location: locationString,
        salary: salaryString,
        job_type: newJob.job_type
      };

      await axios.post('http://localhost:5000/api/jobs', jobData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('Job posted successfully!');
      setShowJobForm(false);
      setNewJob({
        title: '',
        description: '',
        location: '',
        location_type: 'remote',
        salary_min: '',
        salary_max: '',
        salary_currency: '$',
        job_type: 'full-time'
      });
      fetchJobs();
    } catch (error) {
      alert(error.response?.data?.error || 'Error posting job');
    }
  };

  const handleEditSubmitJob = async (e) => {
    e.preventDefault();
    
    if (!editingJob) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Format salary string
      const salaryString = `${editJob.salary_currency}${editJob.salary_min} - ${editJob.salary_currency}${editJob.salary_max}`;

      const jobData = {
        title: editJob.title,
        description: editJob.description,
        location: editJob.location,
        salary: salaryString,
        job_type: editJob.job_type
      };

      await axios.put(`http://localhost:5000/api/jobs/${editingJob.id}`, jobData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('Job updated successfully!');
      setShowEditModal(false);
      setEditingJob(null);
      fetchJobs();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating job');
    }
  };

  const handleViewApplications = (job) => {
    setSelectedJob(job);
    fetchApplications(job.id);
    setShowApplicationsModal(true);
  };

  const handleViewCV = (cvUrl) => {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
  };

  const handleEditClick = (job) => {
    setEditingJob(job);
    
    // Parse salary string back to min/max
    let salaryMin = '', salaryMax = '', salaryCurrency = '$';
    if (job.salary && job.salary !== 'Not specified') {
      const salaryMatch = job.salary.match(/([^\d\s-]+)?\s*([\d,]+)\s*-\s*([^\d\s-]+)?\s*([\d,]+)/);
      if (salaryMatch) {
        salaryCurrency = salaryMatch[1] || '$';
        salaryMin = salaryMatch[2].replace(/,/g, '');
        salaryMax = salaryMatch[4].replace(/,/g, '');
      }
    }

    setEditJob({
      title: job.title,
      description: job.description,
      location: job.location,
      location_type: job.location?.toLowerCase().includes('remote') ? 'remote' : 
                    job.location?.toLowerCase().includes('abroad') ? 'abroad' :
                    job.location?.toLowerCase().includes('relocation') ? 'relocation' : 'onsite',
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: salaryCurrency,
      job_type: job.job_type
    });
    setShowEditModal(true);
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/applications/${applicationId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      alert('Application status updated!');
      if (selectedJob) {
        fetchApplications(selectedJob.id);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('Job deleted successfully!');
      fetchJobs();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting job');
    }
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/jobs/${jobId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      alert(response.data.message || 'Job status updated!');
      fetchJobs();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating job status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      filled: 'info',
      inactive: 'secondary',
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Employer Dashboard</h2>
        <Button 
          variant="primary"
          onClick={() => setShowJobForm(!showJobForm)}
        >
          {showJobForm ? 'Cancel' : 'Post New Job'}
        </Button>
      </div>

      {/* Job Posting Form */}
      {showJobForm && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Post a New Job</Card.Title>
            <Form onSubmit={handleSubmitJob}>
              {/* Job Title with Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Job Title *</Form.Label>
                <Form.Control
                  list="jobTitles"
                  type="text"
                  name="title"
                  value={newJob.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Type or select a job title"
                />
                <datalist id="jobTitles">
                  {jobTitles.map((title, index) => (
                    <option key={index} value={title} />
                  ))}
                </datalist>
              </Form.Group>
              
              {/* Location Type Selection */}
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Label>Location Type *</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    {locationTypes.map(type => (
                      <Button
                        key={type}
                        variant={newJob.location_type === type.toLowerCase() ? "primary" : "outline-primary"}
                        size="sm"
                        onClick={() => handleLocationTypeChange(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </Col>
              </Row>

              {/* Location Selection based on type */}
              <Form.Group className="mb-3">
                <Form.Label>
                  {newJob.location_type === 'remote' ? 'Remote Region' :
                   newJob.location_type === 'abroad' ? 'Select Country' :
                   newJob.location_type === 'relocation' ? 'Relocation Destination' :
                   'Select City'}
                </Form.Label>
                {newJob.location_type === 'remote' ? (
                  <Form.Control
                    list="remoteLocations"
                    type="text"
                    name="location"
                    value={newJob.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Worldwide, Americas, Europe, Asia"
                  />
                ) : newJob.location_type === 'abroad' || newJob.location_type === 'relocation' ? (
                  <>
                    <Form.Control
                      list="countries"
                      type="text"
                      name="location"
                      value={newJob.location}
                      onChange={handleInputChange}
                      placeholder="Select a country"
                    />
                    <datalist id="countries">
                      {countries.map((country, index) => (
                        <option key={index} value={country} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <>
                    <Form.Control
                      list="cities"
                      type="text"
                      name="location"
                      value={newJob.location}
                      onChange={handleInputChange}
                      placeholder="Select a city"
                    />
                    <datalist id="cities">
                      {cities.map((city, index) => (
                        <option key={index} value={city} />
                      ))}
                    </datalist>
                  </>
                )}
                <Form.Text className="text-muted">
                  {newJob.location_type === 'remote' ? 'You can specify Worldwide, specific regions, or leave empty for any location' :
                   newJob.location_type === 'abroad' ? 'Select the country where you want to hire' :
                   newJob.location_type === 'relocation' ? 'Select the destination country for relocation' :
                   'Select the city where the job is located'}
                </Form.Text>
              </Form.Group>
              
              {/* Job Description */}
              <Form.Group className="mb-3">
                <Form.Label>Job Description *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  value={newJob.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe the job responsibilities, requirements, and benefits..."
                />
              </Form.Group>
              
              {/* Salary Range with Slider */}
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Label>Salary Range *</Form.Label>
                  <Row>
                    <Col md={4}>
                      <Form.Select
                        value={salaryCurrency}
                        onChange={(e) => {
                          const currency = currencies.find(c => c.code === e.target.value);
                          handleSalaryCurrencyChange(currency);
                        }}
                      >
                        {currencies.map((currency, index) => (
                          <option key={index} value={currency.code}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="number"
                        placeholder="Min"
                        value={salaryMin}
                        onChange={handleSalaryMinChange}
                        min="0"
                        step="1000"
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="number"
                        placeholder="Max"
                        value={salaryMax}
                        onChange={handleSalaryMaxChange}
                        min="0"
                        step="1000"
                      />
                    </Col>
                  </Row>
                  <div className="mt-2">
                    <Form.Range
                      min="0"
                      max="300000"
                      step="5000"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                    />
                    <div className="d-flex justify-content-between">
                      <small>0</small>
                      <small>150k</small>
                      <small>300k+</small>
                    </div>
                  </div>
                  <Form.Text className="text-muted">
                    Displayed as: {newJob.salary_currency}{parseInt(salaryMin).toLocaleString()} - {newJob.salary_currency}{parseInt(salaryMax).toLocaleString()}
                  </Form.Text>
                </Col>
              </Row>
              
              {/* Job Type */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Job Type</Form.Label>
                    <Form.Select
                      name="job_type"
                      value={newJob.job_type}
                      onChange={handleInputChange}
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="temporary">Temporary</option>
                      <option value="freelance">Freelance</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-flex gap-2">
                <Button variant="success" type="submit">
                  Post Job
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowJobForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      <Row>
        <Col lg={8}>
          <h4 className="mb-3">My Job Listings</h4>
          {jobs.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <h5>No jobs posted yet</h5>
                <p className="text-muted mb-3">Click "Post New Job" to create your first job listing</p>
                <Button 
                  variant="primary"
                  onClick={() => setShowJobForm(true)}
                >
                  Post Your First Job
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <ListGroup>
              {jobs.map(job => (
                <ListGroup.Item key={job.id} className="mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h5 className="mb-0">{job.title}</h5>
                        {getStatusBadge(job.status)}
                      </div>
                      
                      <div className="mb-2">
                        <Badge bg="light" text="dark" className="me-2">
                          <i className="bi bi-geo-alt"></i> {job.location || 'Not specified'}
                        </Badge>
                        <Badge bg="light" text="dark" className="me-2">
                          <i className="bi bi-briefcase"></i> {job.job_type}
                        </Badge>
                        {job.salary && job.salary !== 'Not specified' && (
                          <Badge bg="light" text="dark">
                            <i className="bi bi-cash"></i> {job.salary}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted mb-2">
                        {job.description.substring(0, 150)}...
                      </p>
                      
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg="info">
                          <i className="bi bi-people"></i> {job.application_count || 0} applications
                        </Badge>
                        <small className="text-muted">
                          Posted: {new Date(job.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    
                    <Dropdown className="ms-3">
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleViewApplications(job)}>
                          <i className="bi bi-eye me-2"></i> View Applications
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => handleEditClick(job)}>
                          <i className="bi bi-pencil me-2"></i> Edit Job
                        </Dropdown.Item>
                        {job.status === 'active' && (
                          <Dropdown.Item onClick={() => handleUpdateJobStatus(job.id, 'filled')}>
                            <i className="bi bi-check-circle me-2"></i> Mark as Filled
                          </Dropdown.Item>
                        )}
                        {job.status !== 'inactive' && (
                          <Dropdown.Item onClick={() => handleUpdateJobStatus(job.id, 'inactive')}>
                            <i className="bi bi-pause-circle me-2"></i> Mark as Inactive
                          </Dropdown.Item>
                        )}
                        {job.status !== 'active' && (
                          <Dropdown.Item onClick={() => handleUpdateJobStatus(job.id, 'active')}>
                            <i className="bi bi-play-circle me-2"></i> Mark as Active
                          </Dropdown.Item>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-danger"
                        >
                          <i className="bi bi-trash me-2"></i> Delete Job
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Dashboard Summary</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col xs={6} className="mb-3">
                  <div className="h4 mb-1">{jobs.length}</div>
                  <div className="text-muted">Total Jobs</div>
                </Col>
                <Col xs={6} className="mb-3">
                  <div className="h4 mb-1">
                    {jobs.filter(j => j.status === 'active').length}
                  </div>
                  <div className="text-muted">Active Jobs</div>
                </Col>
                <Col xs={6}>
                  <div className="h4 mb-1">
                    {jobs.reduce((total, job) => total + (job.application_count || 0), 0)}
                  </div>
                  <div className="text-muted">Total Applications</div>
                </Col>
                <Col xs={6}>
                  <div className="h4 mb-1">
                    {jobs.filter(j => j.status === 'filled').length}
                  </div>
                  <div className="text-muted">Positions Filled</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Button 
                variant="primary" 
                className="w-100 mb-2"
                onClick={() => setShowJobForm(true)}
              >
                <i className="bi bi-plus-circle me-2"></i> Post New Job
              </Button>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={fetchJobs}
              >
                <i className="bi bi-arrow-clockwise me-2"></i> Refresh Jobs
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Applications Modal */}
      <Modal 
        show={showApplicationsModal} 
        onHide={() => setShowApplicationsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Applications for: {selectedJob?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob && applications[selectedJob.id]?.length > 0 ? (
            <ListGroup variant="flush">
              {applications[selectedJob.id].map(app => (
                <ListGroup.Item key={app.id} className="mb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">{app.applicant_name}</h6>
                          <p className="text-muted mb-1">{app.applicant_email}</p>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(app.status)}
                        </div>
                      </div>
                      
                      <p className="mb-1">
                        <small>Applied: {new Date(app.applied_at).toLocaleDateString()}</small>
                      </p>
                      
                      {/* CV View Button */}
                      {app.cv_url && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleViewCV(app.cv_url)}
                        >
                          <i className="bi bi-file-pdf me-2"></i>
                          View CV/Resume
                        </Button>
                      )}

                      {app.applicant_cv_url && !app.cv_url && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleViewCV(app.applicant_cv_url)}
                        >
                          <i className="bi bi-file-pdf me-2"></i>
                          View Profile CV
                        </Button>
                      )}

                      {app.cover_letter && (
                        <details className="mt-3">
                          <summary className="text-primary">Cover Letter</summary>
                          <div className="border p-3 mt-2 bg-light rounded">
                            {app.cover_letter}
                          </div>
                        </details>
                      )}
                    </div>
                    
                    <Dropdown className="ms-3">
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Update Status
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => updateApplicationStatus(app.id, 'reviewed')}>
                          Mark as Reviewed
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => updateApplicationStatus(app.id, 'accepted')}>
                          Accept Application
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => updateApplicationStatus(app.id, 'rejected')}>
                          Reject Application
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No applications yet for this job.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowApplicationsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Job Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingJob && (
            <Form onSubmit={handleEditSubmitJob}>
              <Form.Group className="mb-3">
                <Form.Label>Job Title *</Form.Label>
                <Form.Control
                  list="editJobTitles"
                  type="text"
                  name="title"
                  value={editJob.title}
                  onChange={handleEditInputChange}
                  required
                />
                <datalist id="editJobTitles">
                  {jobTitles.map((title, index) => (
                    <option key={index} value={title} />
                  ))}
                </datalist>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={editJob.location}
                  onChange={handleEditInputChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Job Description *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  value={editJob.description}
                  onChange={handleEditInputChange}
                  required
                />
              </Form.Group>
              
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Salary Min</Form.Label>
                    <Form.Control
                      type="number"
                      name="salary_min"
                      value={editJob.salary_min}
                      onChange={handleEditInputChange}
                      placeholder="Minimum salary"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Salary Max</Form.Label>
                    <Form.Control
                      type="number"
                      name="salary_max"
                      value={editJob.salary_max}
                      onChange={handleEditInputChange}
                      placeholder="Maximum salary"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      name="salary_currency"
                      value={editJob.salary_currency}
                      onChange={handleEditInputChange}
                    >
                      {currencies.map((currency, index) => (
                        <option key={index} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Job Type</Form.Label>
                    <Form.Select
                      name="job_type"
                      value={editJob.job_type}
                      onChange={handleEditInputChange}
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="temporary">Temporary</option>
                      <option value="freelance">Freelance</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-flex gap-2">
                <Button variant="primary" type="submit">
                  Update Job
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Bootstrap Icons */}
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" 
      />
    </div>
  );
};

export default EmployerDashboard;