import React, { useState, useEffect } from 'react';
import './DiscussionManagement.css';
import AdminLayout from '../AdminLayout/AdminLayout';
import {
  FiMessageCircle,
  FiUsers,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiBarChart2,
  FiClock, 
  FiThumbsUp,
  FiThumbsDown,
  FiStar,
  FiMoreVertical,
  FiAlertTriangle,
  FiRefreshCw
} from 'react-icons/fi';

// ================= STATS OVERVIEW =================
const StatsOverview = ({ stats }) => (
  <div className="stats-overview">
    <div className="stat-card">
      <FiMessageCircle />
      <h3>{stats.total || 0}</h3>
      <p>Total Discussions</p>
    </div>
    <div className="stat-card">
      <FiClock />
      <h3>{stats.pending || 0}</h3>
      <p>Pending</p>
    </div>
    <div className="stat-card">
      <FiCheckCircle />
      <h3>{stats.approved || 0}</h3>
      <p>Approved</p>
    </div>
    <div className="stat-card">
      <FiUsers />
      <h3>{stats.totalReplies || 0}</h3>
      <p>Total Replies</p>
    </div>
  </div>
);

// ================= DISCUSSION CARD =================
const DiscussionCard = ({ discussion, onModerate, onDelete }) => (
  <div className="management-card">
    <div className="card-header">
      <h4>{discussion.title}</h4>
      <span className="status">{discussion.status}</span>
    </div>

    <p>{discussion.content?.substring(0, 200)}...</p>

    <div className="card-actions">
      {discussion.status === 'pending' && (
        <>
          <button onClick={() => onModerate(discussion._id, 'approve')}>
            <FiCheckCircle /> Approve
          </button>
          <button onClick={() => onModerate(discussion._id, 'reject')}>
            <FiXCircle /> Reject
          </button>
        </>
      )}

      <button onClick={() => onModerate(discussion._id, discussion.isPinned ? 'unpin' : 'pin')}>
        <FiStar /> {discussion.isPinned ? 'Unpin' : 'Pin'}
      </button>

      <button onClick={() => onDelete(discussion._id)}>
        <FiTrash2 /> Delete
      </button>
    </div>
  </div>
);

// ================= REPLY CARD =================
const ReplyCard = ({ reply, onModerate, onDelete }) => (
  <div className="management-card">
    <p>{reply.content}</p>
    <span className="status">{reply.status}</span>

    <div className="card-actions">
      {reply.status === 'pending' && (
        <>
          <button onClick={() => onModerate(reply._id, 'approve')}>
            <FiCheckCircle /> Approve
          </button>
          <button onClick={() => onModerate(reply._id, 'reject')}>
            <FiXCircle /> Reject
          </button>
        </>
      )}

      <button onClick={() => onDelete(reply._id)}>
        <FiTrash2 /> Delete
      </button>
    </div>
  </div>
);

const DiscussionManagement = () => {
  const [activeTab, setActiveTab] = useState('discussions');
  const [discussions, setDiscussions] = useState([]);
  const [replies, setReplies] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: 1,
        limit: 20,
        status: filters.status !== 'all' ? filters.status : '',
        category: filters.category !== 'all' ? filters.category : '',
        search: filters.search
      });

      const response = await fetch(`/api/discussions/admin/discussions?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) setDiscussions(data.discussions);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/discussions/admin/replies`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) setReplies(data.replies);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/discussions/admin/discussions/stats', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'discussions') fetchDiscussions();
    else if (activeTab === 'replies') fetchReplies();
  }, [activeTab, filters]);

  const moderateDiscussion = async (discussionId, action, moderationNote = '') => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/discussions/admin/discussions/${discussionId}/moderate`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action, moderationNote })
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchDiscussions();
        fetchStats();
      }
    } catch (error) {
      console.error('Error moderating discussion:', error);
    }
  };

  const moderateReply = async (replyId, action) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/discussions/admin/replies/${replyId}/moderate`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        }
      );

      const data = await response.json();
      if (data.success) fetchReplies();
    } catch (error) {
      console.error('Error moderating reply:', error);
    }
  };

  const deleteDiscussion = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/discussions/admin/discussions/${discussionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchDiscussions();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
    }
  };

  const deleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/discussions/admin/replies/${replyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) fetchReplies();
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="discussion-management">
        <div className="management-header">
          <h1>Discussion Management</h1>
          <button onClick={() => {
            if (activeTab === 'discussions') fetchDiscussions();
            else if (activeTab === 'replies') fetchReplies();
            fetchStats();
          }} className="refresh-btn">
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <StatsOverview stats={stats} />

        <div className="management-content">
          {!loading && activeTab === 'discussions' &&
            discussions.map(d => (
              <DiscussionCard
                key={d._id}
                discussion={d}
                onModerate={moderateDiscussion}
                onDelete={deleteDiscussion}
              />
            ))
          }

          {!loading && activeTab === 'replies' &&
            replies.map(r => (
              <ReplyCard
                key={r._id}
                reply={r}
                onModerate={moderateReply}
                onDelete={deleteReply}
              />
            ))
          }
        </div>
      </div>
    </AdminLayout>
  );
};

export default DiscussionManagement;
