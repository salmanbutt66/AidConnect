import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Building, Wrench, FileText, Phone, MapPin,
  Calendar, Sunrise, Sunset, Star, BarChart2, ShieldCheck,
  Edit2, Save, X, CheckCircle2, AlertTriangle, BadgeCheck,
  Clock, Hash, ArrowRight,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import { getProviderProfile, updateProviderProfile, registerProvider } from '../../api/provider.api.js';
import { formatPhone, formatDate } from '../../utils/formatters.js';
import { SERVICE_TYPES, PAKISTAN_CITIES } from '../../utils/constants.js';

const EMPTY_FORM = {
  organizationName: '',
  serviceType:      '',
  licenseNumber:    '',
  contactNumber:    '',
  address:          '',
  servicesOffered:  '',
  operatingHours: { open: '08:00', close: '22:00' },
};

const STYLES = `
  .pp-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .pp-details-grid,
  .pp-cred-grid {
    display: grid;
    gap: 20px;
  }

  .pp-details-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .pp-cred-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  @media (max-width: 720px) {
    .pp-form-grid,
    .pp-details-grid,
    .pp-cred-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default function ProviderProfile() {
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState(false);
  const [registering, setRegistering] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError   = (msg) => setError(msg);

  const buildForm = (p) => ({
    organizationName: p.organizationName || '',
    serviceType:      p.serviceType      || '',
    licenseNumber:    p.licenseNumber    || '',
    contactNumber:    p.contactNumber    || '',
    address:          p.address          || '',
    servicesOffered:  p.servicesOffered?.join(', ') || '',
    operatingHours: {
      open:  p.operatingHours?.open  || '08:00',
      close: p.operatingHours?.close || '22:00',
    },
  });

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      const provider = data.provider || data.data || data;
      setProfile(provider);
      setForm(buildForm(provider));
      setRegistering(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setRegistering(true);
        setForm(EMPTY_FORM);
      } else {
        showError('Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  }, [error]);

  const handleRegister = useCallback(async () => {
    if (!form.organizationName?.trim()) { showError('Organization name is required.'); return; }
    if (!form.serviceType)              { showError('Service type is required.');       return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        servicesOffered: form.servicesOffered
          ? form.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await registerProvider(payload);
      showSuccess('Organization registered! Awaiting admin verification.');
      await fetchProfile();
    } catch (err) {
      showError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSaving(false);
    }
  }, [form, fetchProfile]);

  const handleSave = useCallback(async () => {
    if (!form.organizationName?.trim()) { showError('Organization name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        servicesOffered: form.servicesOffered
          ? form.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const data = await updateProviderProfile(payload);
      const updated = data.provider || data.data || data;
      setProfile(updated);
      setForm(buildForm(updated));
      setEditing(false);
      showSuccess('Profile updated successfully.');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }, [form]);

  const serviceTypeLabel  = SERVICE_TYPES.find((s) => s.value === profile?.serviceType);
  const credibilityScore  = profile?.credibilityScore ?? 50;

  if (loading) {
    return (
      <Navbar title="My Profile">
        <div className="page-wrapper">
          <Loader variant="card" message="Loading profile..." />
        </div>
      </Navbar>
    );
  }

  
  const renderFormFields = (showServiceType = false) => (
    <>
      <div className="pp-form-grid">

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={13} color="var(--green-700)" />
            Organization Name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text" className="form-input"
            value={form.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
            placeholder="e.g. Edhi Foundation"
          />
        </div>

        {showServiceType && (
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={13} color="var(--green-700)" />
              Service Type <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              className="form-select"
              value={form.serviceType}
              onChange={(e) => handleChange('serviceType', e.target.value)}
            >
              <option value="">Select service type</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hash size={13} color="var(--green-700)" />
            License Number
          </label>
          <input
            type="text" className="form-input"
            value={form.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            placeholder="e.g. LIC-2024-001"
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={13} color="var(--green-700)" />
            Contact Number
          </label>
          <input
            type="text" className="form-input"
            value={form.contactNumber}
            onChange={(e) => handleChange('contactNumber', e.target.value)}
            placeholder="e.g. 03001234567"
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={13} color="var(--green-700)" />
            City / Address
          </label>
          <select
            className="form-select"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
          >
            <option value="">Select city</option>
            {PAKISTAN_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sunrise size={13} color="var(--green-700)" />
            Opening Time
          </label>
          <input
            type="time" className="form-input"
            value={form.operatingHours?.open}
            onChange={(e) => setForm((prev) => ({ ...prev, operatingHours: { ...prev.operatingHours, open: e.target.value } }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sunset size={13} color="var(--green-700)" />
            Closing Time
          </label>
          <input
            type="time" className="form-input"
            value={form.operatingHours?.close}
            onChange={(e) => setForm((prev) => ({ ...prev, operatingHours: { ...prev.operatingHours, close: e.target.value } }))}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={13} color="var(--green-700)" />
          Services Offered
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' }}>(comma separated)</span>
        </label>
        <input
          type="text" className="form-input"
          value={form.servicesOffered}
          onChange={(e) => handleChange('servicesOffered', e.target.value)}
          placeholder="e.g. oxygen, ICU, blood storage, ambulance"
        />
        <div className="form-hint">Separate each service with a comma</div>
      </div>
    </>
  );

  return (
    <Navbar title="My Profile">
      <style>{STYLES}</style>
      <div className="page-wrapper">
<div className="page-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
              background: 'var(--green-100)', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 size={18} color="var(--green-700)" strokeWidth={2.5} />
            </span>
            My Profile
          </h1>
          <p>
            {registering
              ? 'Complete your organization profile to start receiving emergency requests.'
              : "Manage your organization's information and service details."}
          </p>
        </div>
{error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px', display: 'flex', alignItems: 'center' }}>
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            {successMsg}
          </div>
        )}
{registering ? (
          <div className="card anim-fade-up">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Building2 size={18} color="var(--green-700)" />
                <span className="section-title">Complete Your Organization Profile</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                Fill in your organization details. An admin will verify your account before you can accept requests.
              </p>
              {renderFormFields(true)}
              <button className="btn btn-primary" onClick={handleRegister} disabled={saving} style={{ gap: '8px' }}>
                {saving
                  ? <><span className="spinner" /> Registering…</>
                  : <><ArrowRight size={15} strokeWidth={2.5} /> Register Organization</>
                }
              </button>
            </div>
          </div>

        ) : (
          <>
<div className="card anim-fade-up" style={{ marginBottom: '20px' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{
                      width: '68px', height: '68px', borderRadius: 'var(--radius-md)',
                      background: 'var(--green-100)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: '2px solid var(--green-200)',
                    }}>
                      <Building2 size={30} color="var(--green-700)" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)' }}>
                        {profile?.organizationName}
                      </h2>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Badge color={profile?.isVerified ? 'green' : 'orange'} dot>
                          {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                        </Badge>
                        <Badge color={profile?.isAvailable ? 'green' : 'stone'}>
                          {profile?.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Badge color={
                          credibilityScore >= 85 ? 'green'
                          : credibilityScore >= 70 ? 'blue'
                          : credibilityScore >= 55 ? 'orange'
                          : 'red'
                        }>
                          Credibility {credibilityScore}/100
                        </Badge>
                        {serviceTypeLabel && (
                          <Badge color="blue">{serviceTypeLabel.label}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!editing && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditing(true); setError(''); }}
                      style={{ gap: '6px' }}
                    >
                      <Edit2 size={13} strokeWidth={2.5} /> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
{!editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
<div className="card anim-fade-up" style={{ animationDelay: '60ms' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <Building size={15} color="var(--green-700)" />
                      <span className="section-title">Organization Details</span>
                    </div>
                    <div className="pp-details-grid">
                      {[
                        { label: 'Organization Name', value: profile?.organizationName,                   Icon: Building    },
                        { label: 'Service Type',       value: serviceTypeLabel?.label,                    Icon: Wrench      },
                        { label: 'License Number',     value: profile?.licenseNumber || '—',              Icon: Hash        },
                        { label: 'Contact Number',     value: formatPhone(profile?.contactNumber) || '—', Icon: Phone       },
                        { label: 'Address',            value: profile?.address || '—',                    Icon: MapPin      },
                        { label: 'Member Since',       value: formatDate(profile?.createdAt),             Icon: Calendar    },
                      ].map((item) => (
                        <div key={item.label}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px',
                          }}>
                            <item.Icon size={11} />
                            {item.label}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>
                            {item.value || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
<div className="card anim-fade-up" style={{ animationDelay: '120ms' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <Clock size={15} color="var(--green-700)" />
                      <span className="section-title">Operating Hours</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Opens At',  value: profile?.operatingHours?.open  || '—', Icon: Sunrise },
                        { label: 'Closes At', value: profile?.operatingHours?.close || '—', Icon: Sunset  },
                      ].map((item) => (
                        <div key={item.label} style={{
                          flex: 1, minWidth: '140px',
                          padding: '20px 22px',
                          background: 'var(--green-50)',
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid var(--green-100)',
                        }}>
                          <div style={{ marginBottom: '10px' }}>
                            <item.Icon size={20} color="var(--green-600)" strokeWidth={2} />
                          </div>
                          <div className="stat-label">{item.label}</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px', marginTop: '4px' }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
<div className="card anim-fade-up" style={{ animationDelay: '180ms' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <ShieldCheck size={15} color="var(--green-700)" />
                      <span className="section-title">Credibility</span>
                    </div>
                    <div className="pp-cred-grid">
                      {[
                        { label: 'Average Rating',   value: profile?.averageRating ? Number(profile.averageRating).toFixed(1) : '—', Icon: Star      },
                        { label: 'Total Ratings',    value: profile?.totalRatings ?? 0,                                               Icon: BarChart2 },
                        { label: 'Credibility Score', value: `${credibilityScore}/100`,                                               Icon: ShieldCheck },
                      ].map((item) => (
                        <div key={item.label} style={{
                          padding: '20px 22px', background: 'var(--green-50)',
                          borderRadius: 'var(--radius-md)', border: '1.5px solid var(--green-100)',
                        }}>
                          <div style={{ marginBottom: '10px' }}>
                            <item.Icon size={20} color="var(--green-600)" strokeWidth={2} />
                          </div>
                          <div className="stat-label">{item.label}</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px', marginTop: '4px' }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
<div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <span>Score</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{credibilityScore}/100</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--stone-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${credibilityScore}%`,
                          background: credibilityScore >= 70 ? 'linear-gradient(90deg, var(--green-600), var(--green-400))' : 'linear-gradient(90deg, var(--warning), #f0c040)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
{profile?.servicesOffered?.length > 0 && (
                  <div className="card anim-fade-up" style={{ animationDelay: '240ms' }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <FileText size={15} color="var(--green-700)" />
                        <span className="section-title">Services Offered</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {profile.servicesOffered.map((service) => (
                          <Badge key={service} color="blue">
                            {service.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            ) : (
              
              <div className="card anim-fade-up">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <Edit2 size={15} color="var(--green-700)" />
                    <span className="section-title">Edit Profile</span>
                  </div>
                  {renderFormFields(false)}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: '8px' }}>
                      {saving
                        ? <><span className="spinner" /> Saving…</>
                        : <><Save size={14} strokeWidth={2.5} /> Save Changes</>
                      }
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setEditing(false); setError(''); }} disabled={saving} style={{ gap: '6px' }}>
                      <X size={14} strokeWidth={2.5} /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Navbar>
  );
}