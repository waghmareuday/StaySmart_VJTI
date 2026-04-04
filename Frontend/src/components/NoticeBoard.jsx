const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString();
};

const NoticeBoard = ({ notices = [], loading = false, error = "", maxVisible = 0 }) => {
  if (loading) {
    return (
      <div className="notice-board bg-[#1f2937] p-4 sm:p-6 md:p-8 rounded-lg shadow-lg text-[#d1d5db]">
        Loading latest notices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="notice-board bg-[#1f2937] p-4 sm:p-6 md:p-8 rounded-lg shadow-lg text-red-300 border border-red-700">
        {error}
      </div>
    );
  }

  if (!Array.isArray(notices) || notices.length === 0) {
    return (
      <div className="notice-board bg-[#1f2937] p-4 sm:p-6 md:p-8 rounded-lg shadow-lg text-[#d1d5db]">
        No notices available right now.
      </div>
    );
  }

  return (
    <div className="notice-board bg-[#1f2937] p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">
      {maxVisible > 0 && (
        <p className="text-sm text-[#9ca3af] mb-4">Showing up to {maxVisible} latest notices</p>
      )}

      <ul className="space-y-4">
        {notices.map((notice, index) => (
          <li
            key={notice.id || notice._id || index}
            className="bg-[#2d3748] p-4 rounded-lg shadow-md hover:shadow-lg transition-transform duration-300 hover:scale-105"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg sm:text-xl font-semibold text-[#60a5fa]">{notice.title}</h3>
              {notice.isPinned && (
                <span className="text-xs px-2 py-1 rounded-full bg-[#1e3a8a] text-[#bfdbfe]">Pinned</span>
              )}
            </div>
            <p className="text-[#d1d5db] mt-2 whitespace-pre-wrap">{notice.description}</p>
            <p className="text-xs text-[#9ca3af] mt-3">Uploaded: {formatDateTime(notice.uploadedAt || notice.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoticeBoard;
