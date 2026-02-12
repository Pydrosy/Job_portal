import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    resume: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // In a real app, fetch profile data from API
      setProfile({
        name: user.name,
        email: user.email,
        phone: '',
        skills: user.userType === 'jobseeker' ? '' : '',
        resume: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      alert('Profile updated successfully!');
      setIsEditing(false);
      setLoading(false);
    }, 1000);
  };

  if (!user) {
    return <div>Please login to view profile</div>;
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h4 className="mb-0">My Profile</h4>
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={profile.email}
                disabled
              />
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">User Type</label>
              <input
                type="text"
                className="form-control"
                value={user.userType === 'jobseeker' ? 'Job Seeker' : 'Employer'}
                disabled
              />
            </div>
          </div>
          
          {user.userType === 'jobseeker' && (
            <div className="mb-3">
              <label className="form-label">Skills</label>
              <textarea
                className="form-control"
                name="skills"
                rows="3"
                value={profile.skills}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your skills separated by commas"
              />
            </div>
          )}
          
          {user.userType === 'employer' && (
            <div className="mb-3">
              <label className="form-label">Company Description</label>
              <textarea
                className="form-control"
                name="skills" // Reusing skills field for company description
                rows="3"
                value={profile.skills}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Describe your company"
              />
            </div>
          )}
          
          {user.userType === 'jobseeker' && (
            <div className="mb-3">
              <label className="form-label">Resume/Cover Letter</label>
              <textarea
                className="form-control"
                name="resume"
                rows="4"
                value={profile.resume}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Paste your resume or cover letter here"
              />
            </div>
          )}
          
          {isEditing && (
            <div className="mt-4">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;