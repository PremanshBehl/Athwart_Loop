import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import { usePostStore } from '@/stores/post.store';
import { MentionsInput, Mention } from 'react-mentions';
import { fetchUsersForMention } from '@/lib/mentions';
import { Post } from '@/types';
import { validateFile, parseUploadError } from '@/lib/uploads';
import AttachmentList from './AttachmentList';
import toast from 'react-hot-toast';
import { X, Paperclip, Sparkles, Trash2, ExternalLink } from 'lucide-react';
import { LINKED_ENTITY_PATTERNS, isLinkedEntityFormatValid, linkedEntityHint, LinkedEntityType } from '@/lib/linkedEntity';
import { TYPE_META, SECTIONS, SECTION_LABEL } from '@/lib/loopMeta';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  post?: Post | null;
}

const TYPE_ORDER: Array<'QUESTION' | 'PROBLEM' | 'IDEA'> = ['QUESTION', 'PROBLEM', 'IDEA'];

interface ActiveCampaign { id: number; title: string; themeTag?: string | null }

const emptyForm = {
  title: '',
  description: '',
  type: 'QUESTION',
  section: 'GENERAL',
  isUseCase: false,
  linkedEntityType: '' as '' | 'BILL' | 'CASE' | 'PARTNER',
  linkedEntityId: '',
  campaignId: '' as '' | string,
  assigneeId: '' as '' | string,
};

const inputStyle: React.CSSProperties = { border: '1.5px solid #e2e2e2' };

const CreatePostModal: React.FC<Props> = ({ isOpen, onClose, post }) => {
  const isEditMode = Boolean(post);
  const { fetchFeed, updatePost } = usePostStore();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState<{ title?: string; description?: string }>({});
  const [file, setFile] = useState<File | null>(null);
  const [existingAttachments, setExistingAttachments] = useState(post?.attachments ?? []);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([]);

  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaign[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [autoTag, setAutoTag] = useState<{
    type: string | null; section: string | null;
    confidence: 'high' | 'medium' | 'low' | 'none'; reasoning: string | null;
  } | null>(null);
  const [autoTagChecking, setAutoTagChecking] = useState(false);
  const [userTouchedType, setUserTouchedType] = useState(false);
  const [userTouchedSection, setUserTouchedSection] = useState(false);

  useEffect(() => {
    if (isEditMode || !form.title || form.title.trim().length < 3) { setDuplicateMatches([]); return; }
    const timer = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const { data } = await api.post('/intelligence/duplicate-check', { title: form.title, body: form.description });
        setDuplicateMatches(data?.found && data.matches ? data.matches : []);
      } catch { setDuplicateMatches([]); }
      finally { setCheckingDuplicate(false); }
    }, 700);
    return () => clearTimeout(timer);
  }, [form.title, form.description, isEditMode]);

  useEffect(() => {
    if (isOpen && post) {
      setForm({
        title: post.title, description: post.description, type: post.type, section: post.section,
        isUseCase: post.isUseCase, linkedEntityType: (post.linkedEntityType as any) || '',
        linkedEntityId: post.linkedEntityId || '', campaignId: post.campaignId ? String(post.campaignId) : '',
        assigneeId: post.assigneeId ? String(post.assigneeId) : '',
      });
      setExistingAttachments(post.attachments ?? []);
      setRemovedAttachmentIds([]); setFile(null); setError(''); setFieldErr({});
    } else if (isOpen && !post) {
      setForm(emptyForm); setExistingAttachments([]); setRemovedAttachmentIds([]);
      setFile(null); setError(''); setFieldErr({});
    }
  }, [isOpen, post]);

  useEffect(() => {
    if (!isOpen || isEditMode) return;
    api.get('/campaigns', { params: { status: 'ACTIVE' } })
      .then((res) => setActiveCampaigns((res.data as unknown as ActiveCampaign[]) ?? []))
      .catch(() => setActiveCampaigns([]));
  }, [isOpen, isEditMode]);

  useEffect(() => {
    if (!isOpen) return;
    api.get('/auth/users', { params: { limit: 100 } })
      .then((res) => setUsers((res.data as any) ?? []))
      .catch(() => setUsers([]));
  }, [isOpen]);

  useEffect(() => {
    if (isEditMode) return;
    const titleTrim = form.title.trim();
    if (titleTrim.length < 10 || (userTouchedType && userTouchedSection)) return;
    const timer = setTimeout(async () => {
      setAutoTagChecking(true);
      try {
        const { data } = await api.post('/intelligence/classify', { title: form.title, body: form.description });
        setAutoTag(data ?? null);
      } catch { setAutoTag(null); }
      finally { setAutoTagChecking(false); }
    }, 1200);
    return () => clearTimeout(timer);
  }, [form.title, form.description, isEditMode, userTouchedType, userTouchedSection]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      const validationError = validateFile(selected);
      if (validationError) { setError(validationError); e.target.value = ''; return; }
    }
    setError(''); setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fe: typeof fieldErr = {};
    if (form.title.trim().length < 3) fe.title = 'Title must be at least 3 characters';
    if (form.description.trim().length < 1) fe.description = 'Description is required';
    if (Object.keys(fe).length) { setFieldErr(fe); return; }
    setFieldErr({}); setError(''); setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('type', form.type);
      payload.append('section', form.section);
      payload.append('isUseCase', String(form.isUseCase));
      if (form.linkedEntityType) payload.append('linkedEntityType', form.linkedEntityType);
      if (form.linkedEntityId) payload.append('linkedEntityId', form.linkedEntityId);
      if (form.campaignId) payload.append('campaignId', form.campaignId);
      if (form.assigneeId) payload.append('assigneeId', form.assigneeId);
      if (file) payload.append('attachment', file);

      if (isEditMode && post) {
        for (const attId of removedAttachmentIds) payload.append('removeAttachmentId', String(attId));
        await updatePost(post.id, payload);
        toast.success('Post updated');
      } else {
        await api.post('/posts', payload);
        await fetchFeed();
        toast.success('Posted to the loop');
      }
      onClose(); setForm(emptyForm); setFile(null); setRemovedAttachmentIds([]);
    } catch (err: any) {
      const msg = parseUploadError(err);
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const visibleAttachments = existingAttachments.filter((a) => !removedAttachmentIds.includes(a.id));

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(36,27,46,.45)', backdropFilter: 'blur(3px)', padding: '48px 20px' }}
    >
      <div className="bg-white rounded-[18px] w-full max-w-[560px]" style={{ boxShadow: '0 24px 60px rgba(36,27,46,.3)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-[26px] py-[22px] flex items-center justify-between" style={{ borderBottom: '1px solid #f0ecf7' }}>
          <h2 className="font-heading text-[22px] text-ink">{isEditMode ? 'Edit post' : 'New post'}</h2>
          <button onClick={onClose} className="text-ink-whisper hover:text-ink text-[22px] leading-none">×</button>
        </div>

        <div className="px-[26px] py-[22px]">
          {/* Type picker */}
          <div className="flex gap-2 mb-[18px]">
            {TYPE_ORDER.map((t) => {
              const m = TYPE_META[t];
              const on = form.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setForm({ ...form, type: t }); setUserTouchedType(true); }}
                  className="flex-1 py-3 px-2 rounded-xl text-center transition-colors"
                  style={{ border: `1.5px solid ${on ? m.color : '#e8e3f0'}`, background: on ? m.bg : '#fff' }}
                >
                  <div className="text-[14px] font-bold" style={{ color: on ? m.color : '#5a5266' }}>{m.label}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: '#8a8194' }}>{m.hint}</div>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <label className="block text-[13px] font-semibold mb-1.5 flex items-center justify-between">
            <span>Title</span>
            {checkingDuplicate && <span className="text-[11px] text-brand-primary animate-pulse font-normal">Searching Loop…</span>}
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Short, specific summary"
            className="w-full px-3.5 py-2.5 rounded-[10px] text-[15px] focus:outline-none"
            style={inputStyle}
          />
          <div className="h-[18px] text-[12px] mb-1.5" style={{ color: '#f15d24' }}>{fieldErr.title || ''}</div>

          {duplicateMatches.length > 0 && !isEditMode && (
            <div className="mb-3 p-3.5 rounded-xl" style={{ background: '#faf7ff', border: '1px solid #d3c4ee' }}>
              <div className="flex items-center gap-2 text-[13px] font-bold mb-2" style={{ color: '#6a0fc0' }}>
                <Sparkles size={15} /> These may already answer your question.
              </div>
              <ul className="m-0 pl-0 flex flex-col gap-2" style={{ listStyle: 'none' }}>
                {duplicateMatches.map((match: any) => (
                  <li key={match.id} className="text-[13px] text-ink-soft leading-[1.4]">
                    <span className="font-heading font-semibold" style={{ color: '#8018de' }}>{match.postNumber || 'Post'}</span>
                    {' — '}<span className="italic">"{match.title}"</span>{'. '}
                    {match.url && (
                      <a href={match.url} target="_blank" rel="noreferrer" className="font-semibold underline inline-flex items-center gap-1" style={{ color: '#8018de' }}>
                        Read it <ExternalLink size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <label className="block text-[13px] font-semibold mb-1.5">Description</label>
          <div className="rounded-[10px] overflow-hidden" style={inputStyle}>
            <MentionsInput
              className="mentions-input w-full text-[14.5px] outline-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Give context, steps, and what a good resolution looks like… use @ to mention"
              style={{
                control: { minHeight: 96 },
                input: { margin: 0, padding: 12, border: 'none', outline: 'none', lineHeight: 1.5 },
                highlighter: { padding: 12, border: 'none' },
                suggestions: {
                  list: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
                  item: { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', color: '#1f2937' },
                },
              }}
            >
              <Mention trigger="@" data={fetchUsersForMention} displayTransform={(_id, display) => `@${display}`} style={{ backgroundColor: '#ede3ff', color: '#8018de', borderRadius: '4px', padding: '0 2px' }} />
            </MentionsInput>
          </div>
          <div className="h-[18px] text-[12px] mb-1.5" style={{ color: '#f15d24' }}>{fieldErr.description || ''}</div>

          {/* AI auto-tag suggestion */}
          {!isEditMode && autoTag && autoTag.confidence !== 'none' && (autoTag.type || autoTag.section) && (() => {
            const canApplyType = autoTag.type && !userTouchedType && autoTag.type !== form.type;
            const canApplySection = autoTag.section && !userTouchedSection && autoTag.section !== form.section;
            if (!canApplyType && !canApplySection) return null;
            return (
              <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5" style={{ background: '#faf7ff', border: '1px solid #d3c4ee' }}>
                <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: '#8018de' }} />
                <div className="flex-1 min-w-0 text-[12px] text-ink-soft">
                  <div className="font-semibold mb-0.5" style={{ color: '#6a0fc0' }}>
                    Loop AI suggests
                    {canApplyType && <> · {TYPE_META[autoTag.type!]?.label ?? autoTag.type}</>}
                    {canApplySection && <> · {SECTION_LABEL[autoTag.section!] ?? autoTag.section}</>}
                    <span className="ml-1 text-[10px] text-ink-whisper">({autoTag.confidence})</span>
                  </div>
                  {autoTag.reasoning && <div className="text-ink-faint italic">{autoTag.reasoning}</div>}
                </div>
                <button type="button" onClick={() => {
                  setForm((f) => ({ ...f, type: canApplyType ? (autoTag.type as typeof f.type) : f.type, section: canApplySection ? (autoTag.section as typeof f.section) : f.section }));
                  setAutoTag(null);
                }} className="text-[11px] font-semibold shrink-0" style={{ color: '#8018de' }}>Apply</button>
                <button type="button" onClick={() => setAutoTag(null)} className="text-[11px] text-ink-whisper hover:text-ink shrink-0">Dismiss</button>
              </div>
            );
          })()}
          {!isEditMode && autoTagChecking && !autoTag && (
            <p className="text-[11px] text-ink-whisper italic mb-3 animate-pulse -mt-1">Loop AI is guessing type…</p>
          )}

          {/* Section + Assignee + use-case */}
          <div className="flex gap-3.5 mb-4">
            <div className="flex-1">
              <label className="block text-[13px] font-semibold mb-1.5">Section</label>
              <select
                value={form.section}
                onChange={(e) => { setForm({ ...form, section: e.target.value }); setUserTouchedSection(true); }}
                className="w-full px-3 py-2.5 rounded-[10px] text-[14px] bg-white focus:outline-none"
                style={inputStyle}
              >
                {SECTIONS.map((s) => <option key={s} value={s}>{SECTION_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[13px] font-semibold mb-1.5">Assignee <span className="text-ink-whisper font-normal">(optional)</span></label>
              <select
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-[10px] text-[14px] bg-white focus:outline-none"
                style={inputStyle}
              >
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex-1 flex items-end">
              <label className="flex items-center gap-2.5 text-[14px] text-ink-soft cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  checked={form.isUseCase}
                  onChange={(e) => setForm({ ...form, isUseCase: e.target.checked })}
                  style={{ width: 17, height: 17, accentColor: '#8018de' }}
                />
                Mark as use case
              </label>
            </div>
          </div>

          {/* CRM link (optional) */}
          <div className="flex gap-3.5 mb-4">
            <div className="flex-1">
              <label className="block text-[13px] font-semibold mb-1.5">Link a CRM record <span className="text-ink-whisper font-normal">(optional)</span></label>
              <select
                value={form.linkedEntityType}
                onChange={(e) => setForm({ ...form, linkedEntityType: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-[10px] text-[14px] bg-white focus:outline-none"
                style={inputStyle}
              >
                <option value="">None</option>
                <option value="BILL">Bill</option>
                <option value="CASE">Case</option>
                <option value="PARTNER">Partner</option>
              </select>
            </div>
            {form.linkedEntityType && (
              <div className="flex-1">
                <label className="block text-[13px] font-semibold mb-1.5">Record ID</label>
                <input
                  value={form.linkedEntityId}
                  onChange={(e) => setForm({ ...form, linkedEntityId: e.target.value })}
                  placeholder={LINKED_ENTITY_PATTERNS[form.linkedEntityType as LinkedEntityType]?.example || 'Enter record ID…'}
                  className="w-full px-3 py-2.5 rounded-[10px] text-[14px] focus:outline-none"
                  style={inputStyle}
                />
              </div>
            )}
          </div>
          {form.linkedEntityType && form.linkedEntityId && !isLinkedEntityFormatValid(form.linkedEntityType as LinkedEntityType, form.linkedEntityId) && (
            <p className="text-[12px] rounded-lg px-3 py-2 mb-4" style={{ background: '#fff6df', color: '#8a6d1a', border: '1px solid #f4d78a' }}>
              This doesn't look like a standard {form.linkedEntityType.toLowerCase()} ID ({linkedEntityHint(form.linkedEntityType as LinkedEntityType)}). You can still post.
            </p>
          )}

          {/* Campaign tag (Ideas only) */}
          {form.type === 'IDEA' && !isEditMode && activeCampaigns.length > 0 && (
            <div className="mb-4">
              <label className="block text-[13px] font-semibold mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} style={{ color: '#8018de' }} /> Tag to a campaign <span className="text-ink-whisper font-normal">(optional)</span>
              </label>
              <select
                value={form.campaignId}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-[10px] text-[14px] bg-white focus:outline-none"
                style={inputStyle}
              >
                <option value="">None — post outside any campaign</option>
                {activeCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}{c.themeTag ? `  ·  #${c.themeTag}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Attachments */}
          {visibleAttachments.length > 0 && (
            <div className="mb-4">
              <label className="block text-[13px] font-semibold mb-1.5">Current attachments</label>
              <div className="flex flex-col gap-2">
                {visibleAttachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl" style={{ background: '#f8f6fc', border: '1px solid #eae5f2' }}>
                    <AttachmentList attachments={[att]} compact />
                    <button type="button" onClick={() => setRemovedAttachmentIds((prev) => [...prev, att.id])} className="p-1 text-ink-whisper hover:text-[#f15d24] shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-2">
            <div className="relative">
              <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
              <div className="flex items-center justify-center gap-2 px-4 py-5 rounded-xl text-ink-faint" style={{ border: '2px dashed #d9d2e6', background: '#faf8fd' }}>
                <Paperclip size={18} />
                <span className="text-[13.5px] font-medium">{isEditMode ? 'Add a file' : 'Attach a file'} (optional)</span>
              </div>
            </div>
            {file && (
              <div className="mt-2.5 flex items-center gap-3 text-[13px] px-3.5 py-2.5 rounded-xl" style={{ background: '#faf7ff', border: '1px solid #d3c4ee', color: '#6a0fc0' }}>
                <Paperclip size={15} />
                <span className="truncate flex-1 font-medium">{file.name}</span>
                <span className="text-[11px] font-semibold">{(file.size / 1024).toFixed(1)} KB</span>
                <button type="button" onClick={() => setFile(null)} className="hover:text-[#f15d24]"><X size={14} /></button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-[10px] px-3.5 py-2.5 text-[13.5px] mt-2" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-[26px] py-4 flex justify-end gap-2.5" style={{ borderTop: '1px solid #f0ecf7' }}>
          <button type="button" onClick={onClose} className="px-4.5 px-5 py-2.5 rounded-[10px] font-semibold text-[14px] bg-white text-ink-muted" style={inputStyle}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-[10px] font-semibold text-[14px] text-white disabled:opacity-60" style={{ background: '#8018de' }}>
            {loading ? (isEditMode ? 'Saving…' : 'Posting…') : (isEditMode ? 'Save changes' : 'Post to the loop')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
