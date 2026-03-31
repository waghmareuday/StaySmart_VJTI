import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const DEFAULT_FORM = {
  title: '',
  description: '',
  publishAt: '',
  expiresAt: '',
  isPinned: false,
  isActive: true
};

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '-';
  return date.toLocaleString();
};

const getNoticeLifecycle = (notice) => {
  const now = new Date();
  const publishAt = notice.publishAt ? new Date(notice.publishAt) : null;
  const expiresAt = notice.expiresAt ? new Date(notice.expiresAt) : null;

  if (!notice.isActive) return 'INACTIVE';
  if (publishAt && publishAt > now) return 'SCHEDULED';
  if (expiresAt && expiresAt <= now) return 'EXPIRED';
  return 'LIVE';
};

export default function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [maxVisible, setMaxVisible] = useState(3);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingNoticeId, setEditingNoticeId] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const fetchNotices = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.ADMIN_NOTICES}?includeInactive=true`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch notices');
    }

    setNotices(data.data || []);
  };

  const fetchConfig = async () => {
    const res = await apiFetch(API_ENDPOINTS.ADMIN_NOTICE_CONFIG);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch notice settings');
    }

    const visibleCount = Number(data.data?.maxVisible || 3);
    setMaxVisible(Number.isInteger(visibleCount) ? visibleCount : 3);
  };

  const refreshData = async () => {
    setLoading(true);
    clearMessages();
    try {
      await Promise.all([fetchNotices(), fetchConfig()]);
    } catch (err) {
      setError(err.message || 'Unable to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const aTime = new Date(a.publishAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.publishAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [notices]);

  const livePreviewNotices = useMemo(() => {
    const now = new Date();

    return sortedNotices
      .filter((notice) => {
        if (!notice.isActive) return false;

        const publishAt = notice.publishAt ? new Date(notice.publishAt) : null;
        const expiresAt = notice.expiresAt ? new Date(notice.expiresAt) : null;

        if (publishAt && publishAt > now) return false;
        if (expiresAt && expiresAt <= now) return false;

        return true;
      })
      .slice(0, maxVisible);
  }, [maxVisible, sortedNotices]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingNoticeId('');
  };

  const startEdit = (notice) => {
    setEditingNoticeId(notice._id);
    setForm({
      title: notice.title || '',
      description: notice.description || '',
      publishAt: toInputDateTime(notice.publishAt),
      expiresAt: toInputDateTime(notice.expiresAt),
      isPinned: Boolean(notice.isPinned),
      isActive: Boolean(notice.isActive)
    });
    clearMessages();
  };

  const saveNotice = async (e) => {
    e.preventDefault();
    clearMessages();

    const title = String(form.title || '').trim();
    const description = String(form.description || '').trim();

    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }

    const publishAt = toIsoOrNull(form.publishAt);
    const expiresAt = toIsoOrNull(form.expiresAt);

    if (form.publishAt && !publishAt) {
      setError('Publish time is invalid.');
      return;
    }

    if (form.expiresAt && !expiresAt) {
      setError('Expiry time is invalid.');
      return;
    }

    if (publishAt && expiresAt && new Date(expiresAt) <= new Date(publishAt)) {
      setError('Expiry must be after publish time.');
      return;
    }

    const payload = {
      title,
      description,
      publishAt: publishAt || new Date().toISOString(),
      expiresAt,
      isPinned: Boolean(form.isPinned),
      isActive: Boolean(form.isActive)
    };

    setSaving(true);
    try {
      const endpoint = editingNoticeId
        ? API_ENDPOINTS.ADMIN_NOTICE_BY_ID(editingNoticeId)
        : API_ENDPOINTS.ADMIN_NOTICES;

      const method = editingNoticeId ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save notice');
      }

      setSuccess(editingNoticeId ? 'Notice updated successfully.' : 'Notice created successfully.');
      resetForm();
      await fetchNotices();
    } catch (err) {
      setError(err.message || 'Unable to save notice');
    } finally {
      setSaving(false);
    }
  };

  const toggleNoticeActive = async (notice) => {
    clearMessages();
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NOTICE_BY_ID(notice._id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !notice.isActive })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update notice status');
      }

      setSuccess(`Notice ${notice.isActive ? 'disabled' : 'enabled'} successfully.`);
      await fetchNotices();
    } catch (err) {
      setError(err.message || 'Unable to update notice status');
    }
  };

  const deleteNotice = async (noticeId) => {
    if (!window.confirm('Delete this notice permanently?')) return;

    clearMessages();
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NOTICE_BY_ID(noticeId), {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete notice');
      }

      setSuccess('Notice deleted successfully.');
      if (editingNoticeId === noticeId) {
        resetForm();
      }
      await fetchNotices();
    } catch (err) {
      setError(err.message || 'Unable to delete notice');
    }
  };

  const saveVisibleLimit = async () => {
    clearMessages();

    if (!Number.isInteger(maxVisible) || maxVisible < 1 || maxVisible > 20) {
      setError('Visible count must be an integer between 1 and 20.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NOTICE_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxVisible })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update notice settings');
      }

      setSuccess('Notice display count updated successfully.');
      await fetchConfig();
    } catch (err) {
      setError(err.message || 'Unable to update notice settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Notice Board Management</h1>
          <p className="text-gray-400 mt-1">Create, schedule, and control homepage notices dynamically.</p>
        </div>

        {(error || success) && (
          <div className="space-y-2">
            {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>}
            {success && <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg">{success}</div>}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editingNoticeId ? 'Edit Notice' : 'Create Notice'}</h2>
              {editingNoticeId && (
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={saveNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  maxLength={140}
                  placeholder="Exam schedule update"
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={1500}
                  rows={4}
                  placeholder="Share important details for students."
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Publish At</label>
                  <input
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, publishAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                  />
                  Pin this notice to top
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Active (visible when schedule allows)
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-600"
              >
                {saving ? 'Saving...' : editingNoticeId ? 'Update Notice' : 'Publish Notice'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-3">Homepage Display Settings</h2>
              <p className="text-sm text-gray-400 mb-3">Choose how many notices students can see on the landing page.</p>

              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxVisible}
                  onChange={(e) => setMaxVisible(Number(e.target.value))}
                  className="w-28 px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                />
                <button
                  onClick={saveVisibleLimit}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-600"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Allowed range: 1 to 20 notices.</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-3">Live Homepage Preview</h2>
              {livePreviewNotices.length === 0 ? (
                <p className="text-sm text-gray-400">No active notices available for students right now.</p>
              ) : (
                <ul className="space-y-3">
                  {livePreviewNotices.map((notice) => (
                    <li key={notice._id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <p className="font-medium text-sm text-gray-100">{notice.title}</p>
                      <p className="text-xs text-gray-400 mt-1">Uploaded: {formatDateTime(notice.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">All Notices</h2>

          {loading ? (
            <div className="text-gray-400">Loading notices...</div>
          ) : sortedNotices.length === 0 ? (
            <div className="text-gray-400">No notices found. Create one to get started.</div>
          ) : (
            <div className="space-y-4">
              {sortedNotices.map((notice) => {
                const lifecycle = getNoticeLifecycle(notice);
                return (
                  <div key={notice._id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">{notice.title}</h3>
                      {notice.isPinned && <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded-full">Pinned</span>}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          lifecycle === 'LIVE'
                            ? 'bg-green-900/40 text-green-300'
                            : lifecycle === 'SCHEDULED'
                            ? 'bg-yellow-900/40 text-yellow-300'
                            : lifecycle === 'EXPIRED'
                            ? 'bg-red-900/40 text-red-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {lifecycle}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap">{notice.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-400 mb-3">
                      <p>Uploaded: {formatDateTime(notice.createdAt)}</p>
                      <p>Publish At: {formatDateTime(notice.publishAt)}</p>
                      <p>Expires At: {formatDateTime(notice.expiresAt)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(notice)}
                        className="px-3 py-1.5 text-sm bg-indigo-900/40 text-indigo-300 rounded-lg hover:bg-indigo-900/60"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleNoticeActive(notice)}
                        className="px-3 py-1.5 text-sm bg-yellow-900/40 text-yellow-300 rounded-lg hover:bg-yellow-900/60"
                      >
                        {notice.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteNotice(notice._id)}
                        className="px-3 py-1.5 text-sm bg-red-900/40 text-red-300 rounded-lg hover:bg-red-900/60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
