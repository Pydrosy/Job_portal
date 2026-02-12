import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jobs');
      setJobs(response.data.slice(0, 6)); // Show only 6 jobs on home page
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="jumbotron bg-primary text-white py-5 rounded mb-5">
        <div className="container">
          <h1 className="display-4">Find Your Dream Job</h1>
          <p className="lead">
            Connect with top employers or find the perfect candidate for your company
          </p>
          <div className="mt-4">
            <Link to="/register" className="btn btn-light btn-lg me-3">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="row mb-5">
        <div className="col-md-4 mb-4">
          <div className="card h-100 text-center">
            <div className="card-body">
              <div className="h1 mb-3">👨‍💼</div>
              <h3 className="card-title">For Job Seekers</h3>
              <p className="card-text">
                Browse thousands of job opportunities, apply with one click, and track your applications.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100 text-center">
            <div className="card-body">
              <div className="h1 mb-3">🏢</div>
              <h3 className="card-title">For Employers</h3>
              <p className="card-text">
                Post job openings, find qualified candidates, and manage applications all in one place.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100 text-center">
            <div className="card-body">
              <div className="h1 mb-3">⚡</div>
              <h3 className="card-title">Quick & Easy</h3>
              <p className="card-text">
                Simple registration process and intuitive dashboard for both job seekers and employers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Section */}
      <div className="mb-5">
        <h2 className="mb-4">Recent Job Openings</h2>
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-center">No jobs available at the moment.</p>
        ) : (
          <div className="row">
            {jobs.map(job => (
              <div key={job.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{job.title}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">
                      {job.company_name}
                    </h6>
                    <p className="card-text">
                      {job.description.substring(0, 100)}...
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-secondary">
                        {job.job_type}
                      </span>
                      <span className="text-primary fw-bold">
                        {job.salary || 'Salary not specified'}
                      </span>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent">
                    <small className="text-muted">
                      {job.location || 'Remote'}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-4">
          <Link to="/register" className="btn btn-primary btn-lg">
            View All Jobs & Apply
          </Link>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-light p-5 rounded">
        <h2 className="text-center mb-4">How It Works</h2>
        <div className="row text-center">
          <div className="col-md-4 mb-4">
            <div className="h1 mb-3">1️⃣</div>
            <h4>Create Account</h4>
            <p>Register as a Job Seeker or Employer</p>
          </div>
          <div className="col-md-4 mb-4">
            <div className="h1 mb-3">2️⃣</div>
            <h4>Explore Opportunities</h4>
            <p>Browse jobs or post job openings</p>
          </div>
          <div className="col-md-4 mb-4">
            <div className="h1 mb-3">3️⃣</div>
            <h4>Connect & Hire</h4>
            <p>Apply for jobs or find perfect candidates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;