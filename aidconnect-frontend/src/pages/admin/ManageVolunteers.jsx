import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import VolunteerCard from '../../components/cards/VolunteerCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { 
  getAllVolunteers, 
  approveVolunteer, 
  suspendVolunteer, 
  unsuspendVolunteer 
} from '../../api/volunteer.api.js';

export default function ManageVolunteers() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filtering & Search
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  // Modals
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, volunteerId: null, reason: '' });

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllVolunteers();
      // Supporting both { data: [...] } and direct array structures
      setVolunteers(response.data || response);
    } catch (err) {
      console.error("Failed to load volunteers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveVolunteer(id);
      setVolunteers(prev => prev.map(v => v._id === id ? { ...v, isApproved: true } : v));
    } catch (err) {
      alert("Approval failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendModal.reason.trim()) return alert("Please provide a reason for suspension.");
    setActionLoading(true);
    try {
      await suspendVolunteer(suspendModal.volunteerId, suspendModal.reason);
      setVolunteers(prev => prev.map(v => v._id === suspendModal.volunteerId 
        ? { ...v, isSuspended: true, suspendedReason: suspendModal.reason } 
        : v
      ));
      setSuspendModal({ isOpen: false, volunteerId: null, reason: '' });
    } catch (err) {
      alert("Failed to suspend volunteer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (id) => {
    setActionLoading(true);
    try {
      await unsuspendVolunteer(id);
      setVolunteers(prev => prev.map(v => v._id === id ? { ...v, isSuspended: false, suspendedReason: null } : v));
    } catch (err) {
      alert("Failed to lift suspension.");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Local Filtering ───────────────────────────────────────────────────────
  const filteredVolunteers = volunteers.filter(v => {
    const name = v.user?.name || '';
    const matchesSearch = name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' 
      ? true 
      : filters.status === 'pending' ? !v.isApproved : v.isApproved;
    return matchesSearch && matchesStatus;
  });

  return (
    <Navbar title="Manage Volunteers">
      <div className="page-wrapper" style={{ padding: '24px' }}>
        
        {/* ── Filter Bar ── */}
        <div className="filter-bar" style={{ marginBottom: '24px' }}>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="form-input search-input" 
              placeholder="Search volunteers by name..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto' }}
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Volunteers</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>

        {/* ── Content Grid ── */}
        {loading ? (
          <Loader variant="skeleton" count={4} />
        ) : filteredVolunteers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <h3>No volunteers found</h3>
            <p>Adjust your search filters or wait for new applications.</p>
          </div>
        ) : (
          <div className="grid-3">
            {filteredVolunteers.map((volunteer) => (
              <VolunteerCard 
                key={volunteer._id}
                volunteer={volunteer}
                variant="admin"
                loading={actionLoading}
                onApprove={handleApprove}
                onUnsuspend={handleUnsuspend}
                onSuspend={(id) => setSuspendModal({ isOpen: true, volunteerId: id, reason: '' })}
              />
            ))}
          </div>
        )}

        {/* ── Suspension Reason Modal ── */}
        <Modal
          isOpen={suspendModal.isOpen}
          title="Suspend Volunteer"
          icon="🚫"
          confirmLabel="Confirm Suspension"
          confirmVariant="danger"
          loading={actionLoading}
          onClose={() => setSuspendModal({ isOpen: false, volunteerId: null, reason: '' })}
          onConfirm={handleSuspend}
        >
          <div className="form-group">
            <label className="form-label">Reason for suspension</label>
            <textarea 
              className="form-input" 
              rows="3"
              placeholder="e.g. Inactivity or community policy violation..."
              value={suspendModal.reason}
              onChange={(e) => setSuspendModal(p => ({ ...p, reason: e.target.value }))}
            />
            <div className="form-hint">This reason will be shown to the volunteer.</div>
          </div>
        </Modal>

      </div>
    </Navbar>
  );
}