import React, { useEffect, useState } from 'react';
import { PostType } from '@/types';
import api from '@/api/axios';
import { usePostStore } from '@/stores/post.store';
import toast from 'react-hot-toast';
import { RESOLUTIONS, RES_LABEL } from '@/lib/loopMeta';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postType: PostType;
  isUseCase?: boolean;
}

const inputStyle: React.CSSProperties = { border: '1.5px solid #e2e2e2' };

const ResolveModal: React.FC<Props> = ({ isOpen, onClose, postId, postType, isUseCase }) => {
  const [resolution, setResolution] = useState('');
  const [reason, setReason] = useState('');
  const [buildUrl, setBuildUrl] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchPost, fetchFeed } = usePostStore();

  useEffect(() => {
    if (!isOpen) { setResolution(''); setReason(''); setBuildUrl(''); setAnswer(''); setError(''); return; }
    // Use cases can only resolve one way — preselect it.
    setResolution(isUseCase ? 'RULE_DECIDED' : '');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isUseCase, onClose]);

  if (!isOpen) return null;

  const problemOrIdea = postType === 'PROBLEM' || postType === 'IDEA';
  const needsReason = resolution === 'PARKED' || resolution === 'DECLINED';
  const needsBuildUrl = problemOrIdea && (resolution === 'FIXED' || resolution === 'APPROVED');
  const isQuestion = postType === 'QUESTION';

  const hint = isUseCase
    ? 'This is a use case — it must resolve as “Rule decided”.'
    : isQuestion
      ? 'Answer the question and optionally pin a canonical answer.'
      : 'Choose an outcome. Some outcomes need extra info.';

  const submit = async () => {
    // Mirror the server-side validation for instant feedback.
    if (!resolution) { setError('Resolution is required when resolving.'); return; }
    if (needsReason && !reason.trim()) { setError('Resolution reason is required for PARKED or DECLINED.'); return; }
    if (isUseCase && resolution !== 'RULE_DECIDED') { setError('Use Cases must resolve with RULE_DECIDED.'); return; }
    if (needsBuildUrl && !buildUrl.trim()) { setError('A build/handoff URL is required when resolving a Problem or Idea as FIXED or APPROVED.'); return; }
    if (buildUrl.trim()) { try { new URL(buildUrl.trim()); } catch { setError('Build URL must be a valid URL.'); return; } }

    setError(''); setLoading(true);
    try {
      await api.patch(`/posts/${postId}/status`, {
        status: 'RESOLVED',
        resolution,
        resolutionReason: reason.trim() || undefined,
        buildIssueUrl: needsBuildUrl && buildUrl.trim() ? buildUrl.trim() : undefined,
        canonicalAnswer: isQuestion && answer.trim() ? answer.trim() : undefined,
      });
      toast.success('Resolved · ' + (RES_LABEL[resolution] ?? resolution));
      await fetchPost(postId, true);
      await fetchFeed();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not reach the server. Is the backend running?');
    } finally { setLoading(false); }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      style={{ background: 'rgba(36,27,46,.45)', backdropFilter: 'blur(3px)' }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[480px]" style={{ boxShadow: '0 24px 60px rgba(36,27,46,.3)' }} onClick={(e) => e.stopPropagation()}>
        <div className="px-[26px] py-[22px]" style={{ borderBottom: '1px solid #f0ecf7' }}>
          <h2 className="font-heading text-[22px] text-ink">Resolve post</h2>
          <p className="m-0 mt-1 text-[13.5px] text-ink-faint">{hint}</p>
        </div>

        <div className="px-[26px] py-[22px]">
          <label className="block text-[13px] font-semibold mb-2">Resolution</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {RESOLUTIONS.map((r) => {
              const on = resolution === r;
              const dis = !!isUseCase && r !== 'RULE_DECIDED';
              return (
                <button
                  key={r}
                  type="button"
                  disabled={dis}
                  onClick={() => { setResolution(r); setError(''); }}
                  className="p-2.5 rounded-[10px] text-[13.5px] font-semibold text-left transition-colors"
                  style={{
                    border: `1.5px solid ${on ? '#8018de' : '#e8e3f0'}`,
                    background: on ? '#f3ecfd' : '#fff',
                    color: on ? '#6a0fc0' : '#5a5266',
                    opacity: dis ? 0.4 : 1,
                    cursor: dis ? 'not-allowed' : 'pointer',
                  }}
                >
                  {RES_LABEL[r]}
                </button>
              );
            })}
          </div>

          {needsReason && (
            <>
              <label className="block text-[13px] font-semibold mb-1.5">Reason <span style={{ color: '#f15d24' }}>*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this being parked / declined?"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[14px] resize-y mb-3.5 focus:outline-none"
                style={inputStyle}
              />
            </>
          )}

          {needsBuildUrl && (
            <>
              <label className="block text-[13px] font-semibold mb-1.5">Build / handoff URL <span style={{ color: '#f15d24' }}>*</span></label>
              <input
                value={buildUrl}
                onChange={(e) => setBuildUrl(e.target.value)}
                placeholder="https://github.com/athwart/…/issues/42"
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[14px] mb-3.5 focus:outline-none"
                style={inputStyle}
              />
            </>
          )}

          {isQuestion && (
            <>
              <label className="block text-[13px] font-semibold mb-1.5">Canonical answer <span className="text-ink-whisper font-normal">(optional)</span></label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Post the definitive answer so it's pinned to this thread…"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[14px] resize-y mb-3.5 focus:outline-none"
                style={inputStyle}
              />
            </>
          )}

          {error && (
            <div className="rounded-[10px] px-3.5 py-2.5 text-[13.5px]" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-[26px] py-4 flex justify-end gap-2.5" style={{ borderTop: '1px solid #f0ecf7' }}>
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-[10px] font-semibold text-[14px] bg-white text-ink-muted" style={inputStyle}>Cancel</button>
          <button type="button" onClick={submit} disabled={loading} className="px-5 py-2.5 rounded-[10px] font-semibold text-[14px] text-white disabled:opacity-60" style={{ background: '#2ac25d' }}>
            {loading ? 'Resolving…' : 'Confirm resolve'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolveModal;
