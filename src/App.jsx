import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Calendar, Briefcase, DollarSign, Target, Code, Link, Info, Shield, ArrowLeft, Hourglass, HelpCircle, Building2 } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  
  const [formData, setFormData] = useState({
    company_name: '', role: '', lpa: '', registration_deadline: '',
    drive_date: '', languages_required: '', required_cgpa: '',
    required_10th: '', required_12th: '', gender_specific: 'Open to All',
    bond_details: 'No Bond', registration_link: '', additional_links: '',
    logo_url: '' 
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
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

    const { error } = await supabase.from('drives').insert([formattedData]);
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert('Placement drive broadcasted successfully!');
      e.target.reset();
      setLogoFile(null);
      await fetchDrives();
      navigateTo('/');
    }
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
          <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '14px', letterSpacing: '0.5px' }}>
            {currentPath === '/admin' ? '❖ SECURE ADMINISTRATIVE DEPLOYMENT CONSOLE' : '❖ INTERACTIVE CAMPUS STREAM ORDERED BY CLOSEST DATE'}
          </p>
        </div>
        

      </header>

      {/* ======================================================== */}
      {/* 🔐 ADMINISTRATIVE CONSOLE VIEW LAYER                    */}
      {/*======================================================== */}
      {currentPath === '/admin' && (
        <div className="glass-pane">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '22px', margin: 0, color: '#38bdf8', letterSpacing: '-0.5px' }}>Deploy New Recruitment Parameters</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Populate the real-time student tracking terminal.</p>
            </div>
            <button onClick={() => navigateTo('/')} className="glass-btn-secondary">
              <ArrowLeft size={16} /> Dashboard
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input type="text" name="company_name" placeholder="e.g. CTS" required onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>Role Description *</label>
                <input type="text" name="role" placeholder="e.g. Developer" required onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>Salary Package (LPA) *</label>
                <input type="number" step="0.1" name="lpa" placeholder="e.g. 10.0" required onChange={handleInputChange} className="glass-input" />
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
                <div style={{ textAlign: 'center', margin: '6px 0', fontSize: '11px', color: '#64748b' }}>— OR —</div>
                <input 
                  type="url" 
                  name="logo_url" 
                  placeholder="Paste Image URL (e.g. https://...)" 
                  onChange={handleInputChange} 
                  className="glass-input" 
                  style={{ marginTop: 0 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Gender Parameters</label>
                <select name="gender_specific" onChange={handleInputChange} className="glass-input">
                  <option value="Open to All">Open to All</option>
                  <option value="Females Only">Females Only</option>
                  <option value="Males Only">Males Only</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Official Drive Date & Time *</label>
                <input type="datetime-local" name="drive_date" required onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>Registration Deadline *</label>
                <input type="datetime-local" name="registration_deadline" required onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>Languages / Stack Cutoff</label>
                <input type="text" name="languages_required" placeholder="e.g. Java, Python" onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>Minimum CGPA Criteria</label>
                <input type="number" step="0.01" name="required_cgpa" placeholder="e.g. 7.0" onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>10th Percentage Cutoff</label>
                <input type="number" name="required_10th" placeholder="e.g. 70" onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>12th Percentage Cutoff</label>
                <input type="number" name="required_12th" placeholder="e.g. 70" onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label style={labelStyle}>Service Agreement Bond Details</label>
                <input type="text" name="bond_details" placeholder="e.g. 2 Years / None" onChange={handleInputChange} className="glass-input" />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={labelStyle}>Primary Registration Link *</label>
                <input type="url" name="registration_link" placeholder="https://..." required onChange={handleInputChange} className="glass-input" />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '36px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
              <button type="submit" className="glass-btn-primary">Broadcast Live to Batch Portal</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 👥 BATCH INTERACTIVE DASHBOARD VIEW                      */}
      {/* ======================================================== */}
      {currentPath !== '/admin' && (
        <>
          {/* CAROUSEL TRACK */}
          <div 
            className="horizontal-cards-container" 
            style={{ 
              display: 'flex', 
              gap: '24px', 
              overflowX: 'auto', 
              padding: '16px 6px', 
              marginBottom: '40px'
            }}
          >
            {drives.map((drive) => {
              const isSelected = selectedDrive?.id === drive.id;
              const customLogoUrl = drive.additional_links && drive.additional_links.length > 0 && (drive.additional_links[0].startsWith('http') || drive.additional_links[0].startsWith('data:image/')) ? drive.additional_links[0] : null;

              return (
                <div 
                  key={drive.id} 
                  onClick={() => handleCardClick(drive)}
                  className={`glass-card ${isSelected ? 'selected' : ''}`}
                >
                  {/* LOGO CONTAINER ROW (Full width of inner card) */}
                  <div style={{ 
                    height: '250px',
                    width: '250px', 
                    borderRadius: '20px', 
                    background: 'rgba(255, 255, 255, 0.98)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
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
                          color: '#0f172a' 
                        }} 
                      />
                    )}
                  </div>

                  {/* CENTRAL META AREA */}
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
                        {drive.company_name}
                      </h3>
                      <span className={`glass-badge-lpa ${isSelected ? 'selected' : ''}`}>{drive.lpa} LPA</span>
                    </div>
                    <p style={{ color: '#cbd5e1', margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                      <Briefcase size={14} style={{ color: '#38bdf8' }} /> {drive.role}
                    </p>
                  </div>

                  {/* BOTTOM TIMELINE BADGE */}
                  <div style={premiumDateBadgeStyle}>
                    <Calendar size={13} style={{ color: '#38bdf8' }} /> {drive.drive_date ? new Date(drive.drive_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC HIDE/SHOW DETAILS SHEET AREA */}
          {selectedDrive ? (
            <div className="glass-pane">
              
              {/* Ordered Meta: Company, LPA, Timelines */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px', marginBottom: '30px' }}>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>Live Stream Operational Profile</span>
                
                <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '4px 0 8px 0', color: '#ffffff', letterSpacing: '-1px' }}>{selectedDrive.company_name}</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '500' }}>{selectedDrive.role}</span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#64748b' }}></span>
                  <span style={{ fontSize: '20px', color: '#38bdf8', fontWeight: '800' }}>{selectedDrive.lpa} LPA Package</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={profileTimestampStyle('#ef4444', 'rgba(239, 68, 68, 0.08)')}>
                    <Hourglass size={15} /> <strong>Registration Deadline:</strong> {new Date(selectedDrive.registration_deadline).toLocaleString([], { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={profileTimestampStyle('#10b981', 'rgba(16, 185, 129, 0.08)')}>
                    <Calendar size={15} /> <strong>Official Drive Date:</strong> {new Date(selectedDrive.drive_date).toLocaleString([], { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Requirements & Skills Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                
                <div className="inner-section-glass">
                  <h4 style={innerHeaderStyle}><Target size={15} style={{ color: '#38bdf8' }} /> Candidate Cutoff Requirements</h4>
                  <ul style={listStyle}>
                    <li>Minimum Standard CGPA: <strong style={{ color: '#fff' }}>{selectedDrive.required_cgpa || 'No Bar Limit'}</strong></li>
                    <li>Secondary Schooling (10th): <strong style={{ color: '#fff' }}>{selectedDrive.required_10th || '0'}% Minimum</strong></li>
                    <li>Higher Secondary (12th): <strong style={{ color: '#fff' }}>{selectedDrive.required_12th || '0'}% Minimum</strong></li>
                    <li>Gender Parameter Pool: <strong style={{ color: selectedDrive.gender_specific !== 'Open to All' ? '#f43f5e' : '#fff' }}>{selectedDrive.gender_specific}</strong></li>
                    <li>Organizational Bond commitment: <strong style={{ color: '#fff' }}>{selectedDrive.bond_details || 'No Agreement'}</strong></li>
                  </ul>
                </div>

                <div className="inner-section-glass">
                  <h4 style={innerHeaderStyle}><Code size={15} style={{ color: '#38bdf8' }} /> Evaluated Languages & Systems Stack</h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', opacity: 0.7, lineHeight: '1.5' }}>Ensure your CV explicitly references these system parameters before submission:</p>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <a href={selectedDrive.registration_link} target="_blank" rel="noreferrer" className="glass-btn-primary">
                  <Link size={16} /> Access Complete Registration Link
                </a>
              </div>

            </div>
          ) : (
            <div className="glass-pane" style={{ textAlign: 'center', padding: '60px' }}>
              <HelpCircle size={32} style={{ marginBottom: '12px', color: '#94a3b8' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>No Active Selection</div>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#64748b' }}>Click an incoming card node to inspect eligibility criteria maps, core languages, and portal parameters.</p>
            </div>
          )}
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
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '8px 14px',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#cbd5e1',
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
  color: '#f8fafc',
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
  color: '#cbd5e1'
};

const labelStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  fontWeight: '600',
  letterSpacing: '0.25px'
};