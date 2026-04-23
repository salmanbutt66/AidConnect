import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import ProviderCard from '../../components/cards/ProviderCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { getAllProviders, verifyProvider, suspendProvider } from '../../api/provider.api.js';

export default function ManageProviders() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal State
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, providerId: null });
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProviders();
      setProviders(data.data || data);
    } catch (err) {
      console.error("Failed to fetch providers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleVerify = async (id) => {
    setActionLoading(true);
    try {
      await verifyProvider(id);
      setProviders(prev => prev.map(p => p._id === id ? { ...p, isVerified: true } : p));
    } catch (err) {
      alert("Verification failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await suspendProvider(suspendModal.providerId);
      setProviders(prev => prev.map(p => p._id === suspendModal.providerId ? { ...p, isAvailable: false } : p));
      setSuspendModal({ isOpen: false, providerId: null });
    } catch (err) {
      alert("Suspension failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.organizationName?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' 
      ? true 
      : filters.status === 'pending' ? !p.isVerified : p.isVerified;
    return matchesSearch && matchesStatus;
  });

  return (
    <Navbar title="Manage Organizations">
      <div className="page-wrapper" style={{ padding: '24px' }}>
        
        {/* ── Filter Bar ── */}
        <div className="filter-bar" style={{ marginBottom: '24px' }}>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="form-input search-input" 
              placeholder="Search by organization name..."
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
            <option value="all">All Providers</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Verification</option>
          </select>
        </div>

        {/* ── Content Grid ── */}
        {loading ? (
          <Loader variant="skeleton" count={4} />
        ) : filteredProviders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏥</div>
            <h3>No providers found</h3>
            <p>Adjust your filters or wait for new registrations.</p>
          </div>
        ) : (
          <div className="grid-3">
            {filteredProviders.map((provider, i) => (
              <ProviderCard 
                key={provider._id}
                provider={provider}
                variant="admin"
                loading={actionLoading}
                onVerify={handleVerify}
                onSuspend={(id) => setSuspendModal({ isOpen: true, providerId: id })}
              />
            ))}
          </div>
        )}

        {/* ── Suspension Modal ── */}
        <Modal
          isOpen={suspendModal.isOpen}
          title="Suspend Organization"
          icon="⚠️"
          confirmLabel="Suspend"
          confirmVariant="danger"
          loading={actionLoading}
          onClose={() => setSuspendModal({ isOpen: false, providerId: null })}
          onConfirm={handleSuspend}
        >
          Are you sure you want to suspend this organization? They will no longer be able to accept emergency requests until unsuspended.
        </Modal>

      </div>
    </Navbar>
  );
}