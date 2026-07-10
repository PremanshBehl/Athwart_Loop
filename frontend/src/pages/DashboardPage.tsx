import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { usePostStore } from '@/stores/post.store';
import PostCard from '@/components/posts/PostCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Loader from '@/components/shared/Loader';
import EmptyState from '@/components/shared/EmptyState';

// The standalone /dashboard route. Shows the same header the /feed landing
// uses, plus a "recent activity" preview and a link into the full board.
// /feed itself now includes the dashboard header too — this page is kept
// so bookmarks and the "Open board →" link have a canonical destination.
const DashboardPage: React.FC = () => {
  const { feed, loading, fetchFeed, reactToPost } = usePostStore();

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const recent = feed.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DashboardHeader />

      {/* Recent activity preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 font-heading text-lg">Recent activity</h3>
          <Link to="/feed" className="text-sm font-medium text-brand-primary hover:underline">
            Open board &rarr;
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<Inbox size={26} strokeWidth={1.5} className="text-brand-primary" />}
            title="The board is quiet"
            description="Post the first Question, Problem, or Idea to kick things off."
            action={<Link to="/feed" className="btn-primary text-sm px-5">Open board</Link>}
          />
        ) : (
          <div className="space-y-3">
            {recent.map((post) => (
              <PostCard key={post.id} post={post} onReact={(id, emoji) => reactToPost(id, emoji)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
