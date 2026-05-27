import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chapter, TodoItem, Attachment } from '../types';
import { CheckSquare, Square, Trash, Upload, Plus, Trash2, Calendar, FileText, FileImage, ShieldAlert, X, Pencil } from 'lucide-react';
import { synthesizeGameSound } from '../data';

interface DetailsModalProps {
  chapter: Chapter;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  onDeleteChapter: (chapterId: string) => void;
  onTrackSessionTime: (chapter: Chapter, durationMinutes: number) => void; // log study activity
  currentTheme: any;
  onClose: () => void;
}

export default function DetailsModal({ chapter, onUpdateChapter, onDeleteChapter, onTrackSessionTime, currentTheme, onClose }: DetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'checklist' | 'attachments'>('status');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempChapterName, setTempChapterName] = useState(chapter.chapterName);
  
  // Local state controls for updating
  const [noteText, setNoteText] = useState(chapter.notes || '');

  // Todo check list state
  const [todoInputText, setTodoInputText] = useState('');

  // Attachments state
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentBody, setAttachmentBody] = useState('');
  const [attachmentType, setAttachmentType] = useState<'note' | 'text'>('note');

  const handleSaveName = () => {
    if (tempChapterName.trim() && tempChapterName.trim() !== chapter.chapterName) {
      onUpdateChapter(chapter.id, { chapterName: tempChapterName.trim() });
      synthesizeGameSound("success");
    }
    setIsEditingName(false);
  };

  const handlePhaseToggle = (newPhase: 'study' | 'revision') => {
    onUpdateChapter(chapter.id, { phase: newPhase });
    synthesizeGameSound("square");
  };

  const handleStatusChange = (newStatus: any) => {
    onUpdateChapter(chapter.id, { 
      status: newStatus,
      studyProgress: (newStatus === 'done') ? 100 : chapter.studyProgress,
      reviseProgress: (newStatus === 'revised') ? 100 : chapter.reviseProgress
    });
    synthesizeGameSound("square");
  };

  const handleProgressChange = (val: number) => {
    let updates: Partial<Chapter> = {};
    if (chapter.phase === 'study') {
      updates.studyProgress = val;
      if (val === 100) updates.status = 'done';
      else if (val > 0) updates.status = 'in progress';
      else updates.status = 'to study';
    } else {
      updates.reviseProgress = val;
      if (val === 100) updates.status = 'revised';
      else if (val > 0) updates.status = 'in revision';
      else updates.status = 'to revise';
    }
    onUpdateChapter(chapter.id, updates);
  };

  const handleUpdateNotes = () => {
    onUpdateChapter(chapter.id, { notes: noteText });
    synthesizeGameSound("sine");
  };

  // Add todo cell
  const handleAddTodoItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInputText.trim()) return;

    const newItem: TodoItem = {
      id: "todo_" + Date.now(),
      text: todoInputText.trim(),
      done: false
    };

    const updatedTodos = [...(chapter.todos || []), newItem];
    onUpdateChapter(chapter.id, { todos: updatedTodos });
    setTodoInputText('');
    synthesizeGameSound("sine");
  };

  const handleToggleTodoItem = (todoId: string) => {
    const updatedTodos = (chapter.todos || []).map(td => {
      if (td.id === todoId) {
        return { ...td, done: !td.done };
      }
      return td;
    });
    onUpdateChapter(chapter.id, { todos: updatedTodos });
    synthesizeGameSound("square");
  };

  const handleRemoveTodoItem = (todoId: string) => {
    const updatedTodos = (chapter.todos || []).filter(td => td.id !== todoId);
    onUpdateChapter(chapter.id, { todos: updatedTodos });
    synthesizeGameSound("triangle");
  };

  // Attachments notes insert
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentName.trim() || !attachmentBody.trim()) return;

    const newAttach: Attachment = {
      id: "attach_" + Date.now(),
      type: attachmentType,
      name: attachmentName.trim(),
      content: attachmentBody.trim()
    };

    const updatedAttachments = [...(chapter.attachments || []), newAttach];
    onUpdateChapter(chapter.id, { attachments: updatedAttachments });
    setAttachmentName('');
    setAttachmentBody('');
    synthesizeGameSound("chime");
  };

  const handleRemoveAttachment = (attachId: string) => {
    const updatedAttachments = (chapter.attachments || []).filter(at => at.id !== attachId);
    onUpdateChapter(chapter.id, { attachments: updatedAttachments });
    synthesizeGameSound("triangle");
  };

  return (
    <div id="details-modal-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative w-full max-w-lg p-5 sm:p-6 rounded-2xl ${currentTheme.cardColor} border border-inherit text-inherit space-y-4 shadow-2xl my-8`}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <span className="text-4xs font-mono text-indigo-400 font-bold uppercase leading-none">{chapter.subject} • {chapter.section}</span>
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={tempChapterName}
                  onChange={(e) => setTempChapterName(e.target.value)}
                  className="bg-slate-500/15 border border-slate-500/30 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 w-full text-inherit"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-emerald-500 text-xs font-bold px-2 py-1 hover:bg-slate-500/10 rounded">Save</button>
                <button onClick={() => setIsEditingName(false)} className="text-rose-500 text-xs font-bold px-2 py-1 hover:bg-slate-500/10 rounded">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h3 className="text-base font-bold font-display tracking-tight leading-none truncate">{chapter.chapterName}</h3>
                <button 
                  onClick={() => setIsEditingName(true)} 
                  className="opacity-50 hover:opacity-100 p-1 rounded hover:bg-slate-500/10 transition-opacity"
                  title="Rename chapter"
                >
                  <Pencil className="w-3 h-3 text-indigo-400" />
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-500/10 text-inherit hover:opacity-100 opacity-70 transition-all flex items-center gap-1 shrink-0"
            title="Close modal"
          >
            <span className="text-3xs font-semibold uppercase tracking-wider hidden sm:inline">Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal tabs */}
        <div className="flex border-b border-inherit p-0.5 bg-slate-500/5 rounded-lg text-2xs overflow-x-auto gap-0.5 no-scrollbar">
          <button
            onClick={() => setActiveTab('status')}
            className={`whitespace-nowrap flex-1 py-1.5 font-medium rounded transition-all ${
              activeTab === 'status' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-500/10'
            }`}
          >
            Study Tracker
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`whitespace-nowrap flex-1 py-1.5 font-medium rounded transition-all ${
              activeTab === 'checklist' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-500/10'
            }`}
          >
            Checklist ({chapter.todos?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`whitespace-nowrap flex-1 py-1.5 font-medium rounded transition-all ${
              activeTab === 'attachments' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-500/10'
            }`}
          >
            Attachments
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="pt-2">
          {activeTab === 'status' && (
            <div className="space-y-4 font-sans animate-fade-in text-2xs">
              {/* Phase Switcher */}
              <div className="p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-4xs font-mono font-bold uppercase block opacity-60">Study Phase</span>
                  <p className="font-bold text-xs uppercase tracking-tight text-indigo-500">{chapter.phase === 'study' ? 'Initial Study' : 'Active Revision'}</p>
                </div>
                <div className="flex bg-slate-500/10 p-1 rounded-lg">
                  <button 
                    onClick={() => handlePhaseToggle('study')}
                    className={`px-3 py-1 rounded-md text-3xs font-bold transition-all ${chapter.phase === 'study' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                  >
                    Study
                  </button>
                  <button 
                    onClick={() => handlePhaseToggle('revision')}
                    className={`px-3 py-1 rounded-md text-3xs font-bold transition-all ${chapter.phase === 'revision' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                  >
                    Revision
                  </button>
                </div>
              </div>

              {/* Status and Progress */}
              <div className="space-y-4">
                {chapter.phase === 'study' ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-4xs font-mono font-black uppercase opacity-60">Status Switcher</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handleStatusChange('to study')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${chapter.status === 'to study' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-500/5 border-slate-500/10 opacity-70 hover:opacity-100'}`}
                        >
                          Not Yet Studied
                        </button>
                        <button 
                          onClick={() => handleStatusChange('in progress')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${chapter.status === 'in progress' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-500/5 border-slate-500/10 opacity-70 hover:opacity-100'}`}
                        >
                          In Progress
                        </button>
                        <button 
                          onClick={() => handleStatusChange('done')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${chapter.status === 'done' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-500/5 border-slate-500/10 opacity-70 hover:opacity-100'}`}
                        >
                          Set to Done
                        </button>
                      </div>
                    </div>

                    {(chapter.status === 'in progress' || chapter.status === 'to study') && (
                      <div className="space-y-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <span className="text-4xs font-mono font-bold uppercase opacity-70">Slide to adjust progress</span>
                          <span className="font-mono text-xs font-black text-indigo-500">{chapter.studyProgress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={chapter.studyProgress}
                          onChange={(e) => handleProgressChange(Number(e.target.value))}
                          className="w-full accent-indigo-500 h-2 rounded-lg cursor-pointer bg-slate-500/20"
                        />
                        <p className="text-[10px] opacity-60 text-center italic">Tip: When you reach 100%, status will auto-shift to 'Done'</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-4xs font-mono font-black uppercase opacity-60">Revision Controller</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handleStatusChange('to revise')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${chapter.status === 'to revise' ? 'bg-amber-500 border-amber-500 text-black shadow-lg' : 'bg-slate-500/5 border-slate-500/10 opacity-70 hover:opacity-100'}`}
                        >
                          To Revise
                        </button>
                        <button 
                          onClick={() => handleStatusChange('in revision')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${chapter.status === 'in revision' ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-slate-500/5 border-slate-500/10 opacity-70 hover:opacity-100'}`}
                        >
                          In Revision
                        </button>
                        <button 
                          onClick={() => handleStatusChange('revised')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${chapter.status === 'revised' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-500/5 border-slate-500/10 opacity-70 hover:opacity-100'}`}
                        >
                          Put on Revised
                        </button>
                      </div>
                    </div>

                    {(chapter.status === 'in revision' || chapter.status === 'to revise') && (
                      <div className="space-y-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <span className="text-4xs font-mono font-bold uppercase opacity-70">Adjust revision bar</span>
                          <span className="font-mono text-xs font-black text-purple-500">{chapter.reviseProgress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={chapter.reviseProgress}
                          onChange={(e) => handleProgressChange(Number(e.target.value))}
                          className="w-full accent-purple-500 h-2 rounded-lg cursor-pointer bg-slate-500/20"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Editable Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-4xs font-mono font-bold uppercase opacity-60">Estimated Hours</label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    value={chapter.estimatedHours}
                    onChange={(e) => onUpdateChapter(chapter.id, { estimatedHours: Number(e.target.value) })}
                    className="w-full bg-slate-500/10 border border-slate-500/25 rounded px-2 py-1.5 font-bold text-xs focus:outline-none focus:border-indigo-500 text-inherit"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-4xs font-mono font-bold uppercase opacity-60">Subject Difficulty</label>
                  <select
                    value={chapter.difficulty}
                    onChange={(e) => onUpdateChapter(chapter.id, { difficulty: e.target.value as any })}
                    className="w-full bg-slate-500/10 border border-slate-500/25 rounded px-2 py-1.5 font-bold text-xs focus:outline-none focus:border-indigo-500 text-inherit"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Syllabus chapter note attachments */}
              <div className="space-y-1.5 pt-1.5">
                <span className="text-4xs font-mono font-bold uppercase block opacity-70">Study Notes Journal</span>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Insert details, textbook references, formula rules, or active recall review..."
                  rows={4}
                  className="w-full bg-slate-500/5 border border-slate-500/25 rounded-md p-2.5 text-2xs focus:outline-none focus:border-indigo-500 text-inherit leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleUpdateNotes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-3xs transition-all shadow-sm"
                >
                  Save Study Notes
                </button>
              </div>

            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4 animate-fade-in text-2xs">
              <span className="text-4xs font-mono font-bold uppercase block opacity-70">Study Checklist tracker</span>
              
              <form onSubmit={handleAddTodoItem} className="flex gap-2">
                <input
                  type="text"
                  value={todoInputText}
                  onChange={(e) => setTodoInputText(e.target.value)}
                  placeholder="Add target micro-task (e.g. read prose page 4, write summaries...)"
                  className="flex-1 bg-slate-500/5 border border-slate-500/25 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-505 text-inherit"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Checkboxes roster */}
              <div className="space-y-2 overflow-y-auto max-h-[220px] pt-1">
                {(chapter.todos || []).map(td => (
                  <div key={td.id} className="flex items-center justify-between p-2 hover:bg-slate-500/5 rounded-lg border border-inherit transition-all">
                    <button
                      type="button"
                      onClick={() => handleToggleTodoItem(td.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      {td.done ? (
                        <CheckSquare className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4.5 h-4.5 opacity-60 shrink-0" />
                      )}
                      <span className={`leading-snug text-3xs select-none truncate ${td.done ? 'line-through opacity-50' : ''}`}>
                        {td.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTodoItem(td.id)}
                      className="p-1 hover:bg-rose-500/15 text-rose-500/70 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!chapter.todos || chapter.todos.length === 0) && (
                  <div className="text-center py-8 text-3xs opacity-60">No micro-tasks created in checklist. Fast-track your study plan!</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4 animate-fade-in text-2xs">
              <span className="text-4xs font-mono font-bold uppercase block opacity-70">Syllabus item attachment notes</span>
              
              <form onSubmit={handleAddAttachment} className="p-3 bg-slate-500/5 border border-slate-500/10 rounded-xl space-y-2.5">
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Attachment Title (e.g. PDF page references or Web links...)"
                  className="w-full bg-slate-500/10 border border-slate-500/25 rounded px-2.5 py-1 text-inherit focus:outline-none text-2xs"
                />
                <textarea
                  value={attachmentBody}
                  onChange={(e) => setAttachmentBody(e.target.value)}
                  placeholder="Paste URL, link description details or notes payload..."
                  rows={2}
                  className="w-full bg-slate-500/10 border border-slate-500/25 rounded px-2.5 py-1 text-inherit focus:outline-none text-2xs"
                />
                <div className="flex justify-between items-center bg-slate-500/5 rounded-lg p-2">
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-4xs font-mono font-bold uppercase opacity-60">Or Upload a File (Max 700KB)</span>
                    <input 
                      type="file" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 700 * 1024) {
                            alert("File is too large! Please upload a file smaller than 700KB to prevent database sync errors.");
                            e.target.value = ""; // clear input
                            return;
                          }
                          setAttachmentName(file.name);
                          setAttachmentType('file' as any);
                          const reader = new FileReader();
                          reader.onload = (event) => setAttachmentBody(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-4xs"
                      accept="image/*,.pdf,.txt"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAttachmentType('note')}
                      className={`px-2 py-0.5 rounded text-4xs font-mono transition-all border ${attachmentType === 'note' ? 'bg-indigo-650 text-white' : 'bg-slate-500/5'}`}
                    >
                      Note link
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachmentType('text')}
                      className={`px-2 py-0.5 rounded text-4xs font-mono transition-all border ${attachmentType === 'text' ? 'bg-indigo-650 text-white' : 'bg-slate-500/5'}`}
                    >
                      Reference text
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-3xs flex items-center gap-1 transition-all"
                    disabled={!attachmentName.trim() || !attachmentBody.trim()}
                  >
                    <Plus className="w-3" /> Save Attachment
                  </button>
                </div>
              </form>

              {/* Attachments listing */}
              <div className="space-y-2 pt-1 overflow-y-auto max-h-[180px]">
                {((chapter.attachments || [])).map(at => (
                  <div key={at.id} className="p-2.5 hover:bg-slate-500/5 rounded-lg border border-inherit flex flex-col justify-start gap-2 transition-all">
                    <div className="flex items-start justify-between w-full">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="font-semibold text-3xs text-indigo-400 flex items-center gap-1 mb-1">
                          {at.type === 'file' ? <FileImage className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          {at.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(at.id)}
                        className="p-1 hover:bg-rose-500/15 text-rose-550 hover:text-rose-500 rounded shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {at.content.startsWith('data:') ? (
                      <div className="w-full">
                        {at.content.startsWith('data:image') ? (
                          <img src={at.content} alt={at.name} className="w-full h-auto rounded border border-slate-500/20 max-h-48 object-contain bg-black/10" />
                        ) : (
                          <a href={at.content} download={at.name} className="text-3xs text-indigo-500 hover:underline">Download File</a>
                        )}
                      </div>
                    ) : (
                      <p className="text-4xs opacity-80 break-words">{at.content}</p>
                    )}
                  </div>
                ))}
                {(!chapter.attachments || chapter.attachments.length === 0) && (
                  <div className="text-center py-8 text-3xs opacity-60">No attached study logs or PDF text elements. Attach notes above!</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Footer Controls */}
        <div className="pt-4 border-t border-slate-500/15 flex justify-between items-center text-3xs gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 bg-rose-500/5 p-1.5 rounded-lg border border-rose-550/20 animate-scale-in">
              <span className="text-rose-500 font-semibold font-mono text-3xs shrink-0">Confirm delete?</span>
              <button
                type="button"
                onClick={() => {
                  onDeleteChapter(chapter.id);
                  synthesizeGameSound("triangle");
                  onClose();
                }}
                className="px-2.5 py-1 text-4xs rounded bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shrink-0"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 text-4xs rounded bg-slate-500/10 hover:bg-slate-500/20 text-inherit transition-all shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true);
                synthesizeGameSound("square");
              }}
              className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-550 hover:bg-rose-500 hover:text-white transition-all font-semibold flex items-center gap-1 shrink-0"
              title="Delete this chapter entirely"
            >
              <Trash className="w-3.5 h-3.5" /> Delete Chapter
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-inherit font-bold text-xs transition-all tracking-tight flex items-center gap-1 shrink-0"
          >
            Close Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
