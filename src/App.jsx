import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Calendar, Briefcase, DollarSign, Target, Code, Link, Info, Shield, ArrowLeft, Hourglass, HelpCircle, Building2 } from 'lucide-react';

const ADMIN_PASSWORD_HASH = "c4d670755cc1e0d9d7fa8c190144a1fac9751c1ee547ccc564e3274101db928d"; // SHA-256 of 'admin123'

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState({
    company_name: '', role: '', lpa: '', registration_deadline: '',
    drive_date: '', languages_required: '', required_cgpa: '',
    required_10th: '', required_12th: '', gender_specific: 'Open to All',
    bond_details: 'No Bond', registration_link: '', additional_links: '',
    logo_url: ''
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      if (path !== '/admin') {
        setIsAdminAuthenticated(false);
        setPasswordInput('');
        setPasswordError('');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    fetchDrives();
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  async function fetchDrives() {
    const { data, error } = await supabase
      .from('drives')
      .select('*')
      .order('drive_date', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setDrives(data);
    }
  }

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (path !== '/admin') {
      setIsAdminAuthenticated(false);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handleCardClick = (drive) => {
    if (selectedDrive?.id === drive.id) {
      setSelectedDrive(null);
    } else {
      setSelectedDrive(drive);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '', role: '', lpa: '', registration_deadline: '',
      drive_date: '', languages_required: '', required_cgpa: '',
      required_10th: '', required_12th: '', gender_specific: 'Open to All',
      bond_details: 'No Bond', registration_link: '', additional_links: '',
      logo_url: ''
    });
    setLogoFile(null);
    setEditingDriveId(null);
    setIsAdminFormOpen(false);
  };

  const handleEditClick = (drive) => {
    setFormData({
      company_name: drive.company_name || '',
      role: drive.role || '',
      lpa: drive.lpa ? String(drive.lpa) : '',
      registration_deadline: drive.registration_deadline ? drive.registration_deadline.substring(0, 16) : '',
      drive_date: drive.drive_date ? drive.drive_date.substring(0, 16) : '',
      languages_required: drive.languages_required ? drive.languages_required.join(', ') : '',
      required_cgpa: drive.required_cgpa ? String(drive.required_cgpa) : '',
      required_10th: drive.required_10th ? String(drive.required_10th) : '',
      required_12th: drive.required_12th ? String(drive.required_12th) : '',
      gender_specific: drive.gender_specific || 'Open to All',
      bond_details: drive.bond_details || 'No Bond',
      registration_link: drive.registration_link || '',
      additional_links: drive.additional_links && drive.additional_links.length > 1 ? drive.additional_links.slice(1).join(', ') : '',
      logo_url: drive.additional_links && drive.additional_links.length > 0 && (drive.additional_links[0].startsWith('http') || drive.additional_links[0].startsWith('data:image/')) ? drive.additional_links[0] : ''
    });
    setEditingDriveId(drive.id);
    setIsAdminFormOpen(true);
  };

  const handleDeleteClick = async (driveId, companyName) => {
    const confirmed = window.confirm(`Are you sure you want to delete the placement drive for "${companyName}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('drives')
      .delete()
      .eq('id', driveId);

    if (error) {
      alert(`Error deleting drive: ${error.message}`);
      return;
    }

    // Fetch the updated drives from Supabase to verify deletion
    const { data: latestData, error: fetchError } = await supabase
      .from('drives')
      .select('*')
      .order('drive_date', { ascending: true });

    if (fetchError) {
      console.error('Error fetching updated data:', fetchError);
      await fetchDrives();
      return;
    }

    // Check if the deleted drive is still present
    const stillExists = latestData.some(d => d.id === driveId);

    if (stillExists) {
      alert(`Delete completed, but the card was NOT removed from Supabase.

This happens when Row Level Security (RLS) is active on your 'drives' table but there is no policy permitting DELETE actions.

To fix this:
1. Go to your Supabase Dashboard -> Table Editor.
2. Select your 'drives' table and click "RLS Disabled" or add a DELETE policy for 'anon' / public roles.`);
    } else {
      alert('Placement drive deleted successfully!');
      if (selectedDrive?.id === driveId) {
        setSelectedDrive(null);
      }
      setDrives(latestData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let logoDataUrl = formData.logo_url;

    if (logoFile) {
      try {
        logoDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(logoFile);
        });
      } catch (err) {
        console.error("Error reading logo file:", err);
        alert("Failed to read logo file. Please try again.");
        return;
      }
    }

    const linksArray = [];
    if (logoDataUrl) linksArray.push(logoDataUrl.trim());
    if (formData.additional_links) {
      formData.additional_links.split(',').forEach(s => linksArray.push(s.trim()));
    }

    const formattedData = {
      company_name: formData.company_name,
      role: formData.role,
      lpa: parseFloat(formData.lpa),
      gender_specific: formData.gender_specific,
      drive_date: formData.drive_date,
      registration_deadline: formData.registration_deadline,
      bond_details: formData.bond_details,
      registration_link: formData.registration_link,
      required_cgpa: parseFloat(formData.required_cgpa) || 0,
      required_10th: parseInt(formData.required_10th) || 0,
      required_12th: parseInt(formData.required_12th) || 0,
      languages_required: formData.languages_required ? formData.languages_required.split(',').map(s => s.trim()) : [],
      additional_links: linksArray
    };

    if (editingDriveId) {
      const { error } = await supabase
        .from('drives')
        .update(formattedData)
        .eq('id', editingDriveId);
      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Placement drive updated successfully!');
        resetForm();
        await fetchDrives();
      }
    } else {
      const { error } = await supabase.from('drives').insert([formattedData]);
      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Placement drive broadcasted successfully!');
        resetForm();
        await fetchDrives();
      }
    }
  };
  const now = new Date();
  const activeDrives = drives.filter(d => !d.drive_date || new Date(d.drive_date) >= now);
  const completedDrives = [...drives.filter(d => d.drive_date && new Date(d.drive_date) < now)]
    .sort((a, b) => new Date(b.drive_date) - new Date(a.drive_date));

  const renderDriveCard = (drive) => {
    const isSelected = selectedDrive?.id === drive.id;
    const customLogoUrl = drive.additional_links && drive.additional_links.length > 0 && (drive.additional_links[0].startsWith('http') || drive.additional_links[0].startsWith('data:image/')) ? drive.additional_links[0] : null;
    const isAdmin = currentPath === '/admin';

    return (
      <div
        key={drive.id}
        onClick={() => !isAdmin && handleCardClick(drive)}
        className={`glass-card ${isSelected ? 'selected' : ''}`}
        style={isAdmin ? { cursor: 'default' } : {}}
      >
        {/* LOGO CONTAINER ROW (Full width of inner card) */}
        <div style={{
          height: '250px',
          width: '250px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '12px',
          boxSizing: 'border-box',
          marginBottom: '16px'
        }}>
          {customLogoUrl ? (
            <img
              src={customLogoUrl}
              alt={`${drive.company_name} logo`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <Building2
              size={70}
              style={{
                color: 'var(--text-dark)'
              }}
            />
          )}
        </div>

        {/* CENTRAL META AREA */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
              {drive.company_name}
            </h3>
            <span className={`glass-badge-lpa ${isSelected ? 'selected' : ''}`}>{drive.lpa} LPA</span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Briefcase size={14} style={{ color: 'var(--primary-cyan)' }} /> {drive.role}
          </p>
        </div>

        {/* BOTTOM TIMELINE BADGES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ ...premiumDateBadgeStyle, width: '100%', boxSizing: 'border-box', alignSelf: 'stretch' }}>
            <Hourglass size={13} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span style={{ fontSize: '11px' }}>
              <strong>Reg:</strong> {drive.registration_deadline ? new Date(drive.registration_deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}
            </span>
          </div>
          <div style={{ ...premiumDateBadgeStyle, width: '100%', boxSizing: 'border-box', alignSelf: 'stretch' }}>
            <Calendar size={13} style={{ color: '#059669', flexShrink: 0 }} />
            <span style={{ fontSize: '11px' }}>
              <strong>Drive:</strong> {drive.drive_date ? new Date(drive.drive_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}
            </span>
          </div>
        </div>

        {/* ADMIN ACTIONS ROW */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleEditClick(drive); }}
              className="glass-btn-secondary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: 'rgba(2, 132, 199, 0.05)', color: 'var(--primary-cyan)', border: '1px solid rgba(2, 132, 199, 0.2)', cursor: 'pointer' }}
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteClick(drive.id, drive.company_name); }}
              className="glass-btn-secondary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: 'rgba(220, 38, 38, 0.05)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)', cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 20px' }}>

      {/* HEADER BAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1
            onClick={() => navigateTo('/')}
            className="text-gradient"
            style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', margin: 0, cursor: 'pointer' }}
          >
            PLACEMENT DATABASE
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0', fontSize: '14px', letterSpacing: '0.5px' }}>
            {currentPath === '/admin' ? '❖ SECURE ADMINISTRATIVE DEPLOYMENT CONSOLE' : '❖ INTERACTIVE CAMPUS STREAM ORDERED BY CLOSEST DATE'}
          </p>
        </div>


      </header>

      {/* ======================================================== */}
      {/* 🔐 ADMINISTRATIVE CONSOLE VIEW LAYER                    */}
      {/*======================================================== */}
      {currentPath === '/admin' && !isAdminAuthenticated && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', width: '100%' }}>
          <div className="glass-pane" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center', boxSizing: 'border-box' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.08)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--primary-cyan)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
              <Shield size={30} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 8px 0', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Access Control Console
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px 0', lineHeight: '1.4' }}>
              Provide your deployment credentials to open the administrative configuration parameters.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const inputHash = await sha256(passwordInput);
              if (inputHash === ADMIN_PASSWORD_HASH) {
                setIsAdminAuthenticated(true);
                setPasswordError('');
              } else {
                setPasswordError('Invalid credential passcode. Access denied.');
              }
            }}>
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={labelStyle}>Security Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="glass-input"
                  style={{ textAlign: 'center', letterSpacing: passwordInput ? '4px' : '0' }}
                />
                {passwordError && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px', textAlign: 'center', fontWeight: '600' }}>
                    {passwordError}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button type="submit" className="glass-btn-primary" style={{ width: '100%', justifyContent: 'center', height: '44px' }}>
                  Unlock Console
                </button>
                <button type="button" onClick={() => navigateTo('/')} className="glass-btn-secondary" style={{ width: '100%', justifyContent: 'center', height: '44px' }}>
                  Return to Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentPath === '/admin' && isAdminAuthenticated && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* TOP ACTION ROW */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                Secure Deployment Console
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Manage live streams and campus recruitment drives.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { resetForm(); setIsAdminFormOpen(true); }}
                className="glass-btn-primary"
                style={{ padding: '12px 24px', fontSize: '14px' }}
              >
                + Add Card
              </button>
              <button onClick={() => navigateTo('/')} className="glass-btn-secondary" style={{ padding: '12px 24px', fontSize: '14px' }}>
                <ArrowLeft size={16} /> Dashboard
              </button>
            </div>
          </div>

          {/* ADD / EDIT DETAILS INPUT PANE */}
          {isAdminFormOpen && (
            <div className="glass-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--primary-cyan)', fontWeight: '800' }}>
                    {editingDriveId ? 'Edit Placement Parameters' : 'Deploy New Recruitment Parameters'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                    Configure the active database state parameters.
                  </p>
                </div>
                <button onClick={resetForm} className="glass-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Company Name *</label>
                    <input type="text" name="company_name" value={formData.company_name} placeholder="e.g. CTS" required onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>Role Description *</label>
                    <input type="text" name="role" value={formData.role} placeholder="e.g. Developer" required onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>Salary Package (LPA) *</label>
                    <input type="number" step="0.1" name="lpa" value={formData.lpa} placeholder="e.g. 10.0" required onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>Company Logo (Upload File)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="glass-input"
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                    />
                    <div style={{ textAlign: 'center', margin: '6px 0', fontSize: '11px', color: 'var(--text-muted)' }}>— OR —</div>
                    <input
                      type="url"
                      name="logo_url"
                      value={formData.logo_url}
                      placeholder="Paste Image URL (e.g. https://...)"
                      onChange={handleInputChange}
                      className="glass-input"
                      style={{ marginTop: 0 }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Gender Parameters</label>
                    <select name="gender_specific" value={formData.gender_specific} onChange={handleInputChange} className="glass-input">
                      <option value="Open to All">Open to All</option>
                      <option value="Females Only">Females Only</option>
                      <option value="Males Only">Males Only</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Official Drive Date & Time *</label>
                    <input type="datetime-local" name="drive_date" value={formData.drive_date} required onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>Registration Deadline *</label>
                    <input type="datetime-local" name="registration_deadline" value={formData.registration_deadline} required onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>Languages / Stack Cutoff</label>
                    <input type="text" name="languages_required" value={formData.languages_required} placeholder="e.g. Java, Python" onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>Minimum CGPA Criteria</label>
                    <input type="number" step="0.01" name="required_cgpa" value={formData.required_cgpa} placeholder="e.g. 7.0" onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>10th Percentage Cutoff</label>
                    <input type="number" name="required_10th" value={formData.required_10th} placeholder="e.g. 70" onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>12th Percentage Cutoff</label>
                    <input type="number" name="required_12th" value={formData.required_12th} placeholder="e.g. 70" onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div>
                    <label style={labelStyle}>Service Agreement Bond Details</label>
                    <input type="text" name="bond_details" value={formData.bond_details} placeholder="e.g. 2 Years / None" onChange={handleInputChange} className="glass-input" />
                  </div>
                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={labelStyle}>Primary Registration Link *</label>
                    <input type="url" name="registration_link" value={formData.registration_link} placeholder="https://..." required onChange={handleInputChange} className="glass-input" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '36px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                  <button type="button" onClick={resetForm} className="glass-btn-secondary">Cancel</button>
                  <button type="submit" className="glass-btn-primary">
                    {editingDriveId ? 'Save Parameters' : 'Broadcast Live to Batch Portal'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADMIN CARDS GRID */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-cyan)', display: 'inline-block' }}></span>
              Live Database Cards
            </h3>
            {drives.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '24px',
                  padding: '16px 0'
                }}
              >
                {drives.map((drive) => renderDriveCard(drive))}
              </div>
            ) : (
              <div className="glass-pane" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active placement drives found. Click "+ Add Card" to deploy a new card.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 👥 BATCH INTERACTIVE DASHBOARD VIEW                      */}
      {/* ======================================================== */}
      {currentPath !== '/admin' && (
        <>
          {/* UPCOMING & ONGOING RECRUITMENT DRIVES */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Upcoming & Ongoing Drives
            </h3>
            {activeDrives.length > 0 ? (
              <div
                className="horizontal-cards-container"
                style={{
                  display: 'flex',
                  gap: '24px',
                  overflowX: 'auto',
                  padding: '16px 6px'
                }}
              >
                {activeDrives.map((drive) => renderDriveCard(drive))}
              </div>
            ) : (
              <div className="glass-pane" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No upcoming or ongoing recruitment drives listed.
              </div>
            )}
          </div>

          {/* DYNAMIC HIDE/SHOW DETAILS SHEET AREA IN BETWEEN */}
          {selectedDrive && (
            <div style={{ marginBottom: '50px' }}>
              <div className="glass-pane">

                {/* Ordered Meta: Company, LPA, Timelines */}
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px', marginBottom: '30px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--primary-cyan)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>Live Stream Operational Profile</span>

                  <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '4px 0 8px 0', color: 'var(--text-main)', letterSpacing: '-1px' }}>{selectedDrive.company_name}</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: '500' }}>{selectedDrive.role}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                    <span style={{ fontSize: '20px', color: 'var(--primary-cyan)', fontWeight: '800' }}>{selectedDrive.lpa} LPA Package</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={profileTimestampStyle('#dc2626', 'rgba(220, 38, 38, 0.08)')}>
                      <Hourglass size={15} /> <strong>Registration Deadline:</strong> {new Date(selectedDrive.registration_deadline).toLocaleString([], { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={profileTimestampStyle('#059669', 'rgba(5, 150, 105, 0.08)')}>
                      <Calendar size={15} /> <strong>Official Drive Date:</strong> {new Date(selectedDrive.drive_date).toLocaleString([], { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Requirements & Skills Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '30px' }}>

                  <div className="inner-section-glass">
                    <h4 style={innerHeaderStyle}><Target size={15} style={{ color: 'var(--primary-cyan)' }} /> Candidate Cutoff Requirements</h4>
                    <ul style={listStyle}>
                      <li>Minimum Standard CGPA: <strong style={{ color: 'var(--text-main)' }}>{selectedDrive.required_cgpa || 'No Bar Limit'}</strong></li>
                      <li>Secondary Schooling (10th): <strong style={{ color: 'var(--text-main)' }}>{selectedDrive.required_10th || '0'}% Minimum</strong></li>
                      <li>Higher Secondary (12th): <strong style={{ color: 'var(--text-main)' }}>{selectedDrive.required_12th || '0'}% Minimum</strong></li>
                      <li>Gender Parameter Pool: <strong style={{ color: selectedDrive.gender_specific !== 'Open to All' ? '#dc2626' : 'var(--text-main)' }}>{selectedDrive.gender_specific}</strong></li>
                      <li>Organizational Bond commitment: <strong style={{ color: 'var(--text-main)' }}>{selectedDrive.bond_details || 'No Agreement'}</strong></li>
                    </ul>
                  </div>

                  <div className="inner-section-glass">
                    <h4 style={innerHeaderStyle}><Code size={15} style={{ color: 'var(--primary-cyan)' }} /> Evaluated Languages & Systems Stack</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Ensure your CV explicitly references these system parameters before submission:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {selectedDrive.languages_required && selectedDrive.languages_required.length > 0 && selectedDrive.languages_required[0] !== "" ? (
                        selectedDrive.languages_required.map((lang, i) => (
                          <span key={i} className="glass-tag">{lang}</span>
                        ))
                      ) : (
                        <span className="glass-tag">General Aptitude Criteria / Systems agnostic</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Action Dynamic Footer Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                  <a href={selectedDrive.registration_link} target="_blank" rel="noreferrer" className="glass-btn-primary">
                    <Link size={16} /> Access Complete Registration Link
                  </a>
                </div>

              </div>
            </div>
          )}

          {/* COMPLETED RECRUITMENT DRIVES */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
              Completed Drives
            </h3>
            {completedDrives.length > 0 ? (
              <div
                className="horizontal-cards-container"
                style={{
                  display: 'flex',
                  gap: '24px',
                  overflowX: 'auto',
                  padding: '16px 6px'
                }}
              >
                {completedDrives.map((drive) => renderDriveCard(drive))}
              </div>
            ) : (
              <div className="glass-pane" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No completed recruitment drives listed.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ======================================================== */
/* 🎨 INLINE STYLE TOKENS (GLASS CONFIGURED CSS COMPLEMENT)  */
/* ======================================================== */
const premiumDateBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(15, 23, 42, 0.04)',
  border: '1px solid var(--glass-border)',
  padding: '8px 14px',
  borderRadius: '12px',
  fontSize: '12px',
  color: 'var(--text-muted)',
  fontWeight: '600',
  letterSpacing: '0.25px',
  alignSelf: 'flex-start'
};

const profileTimestampStyle = (color, bg) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: bg,
  border: `1px solid ${color}33`,
  color: color,
  padding: '10px 16px',
  borderRadius: '14px',
  fontSize: '14px'
});

const innerHeaderStyle = {
  margin: '0 0 20px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: 'var(--text-main)',
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontWeight: '800'
};

const listStyle = {
  margin: 0,
  paddingLeft: '18px',
  lineHeight: '2.2',
  fontSize: '14px',
  color: 'var(--text-muted)'
};

const labelStyle = {
  fontSize: '13px',
  color: 'var(--text-muted)',
  fontWeight: '600',
  letterSpacing: '0.25px'
};