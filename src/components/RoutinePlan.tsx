import React, { useState } from 'react';
import { Calendar, RefreshCw, Plus, CheckCircle, Clock, CalendarDays, BookOpen, Trash2, Sliders } from 'lucide-react';
import { Chapter, UserProfile, RoutineDay } from '../types';
import { synthesizeGameSound } from '../data';

interface RoutinePlanProps {
  userProfile: UserProfile;
  chapters: Chapter[];
  onUpdateUserProfile: (updates: Partial<UserProfile>) => void;
  onUpdateChaptersRoutine: (chapterIds: string[], dayIndex: number | null) => void;
  currentTheme: any;
}

export default function RoutinePlan({ userProfile, chapters, onUpdateUserProfile, onUpdateChaptersRoutine, currentTheme }: RoutinePlanProps) {
  // Input builders
  const [startInputDate, setStartInputDate] = useState(userProfile.startDate || new Date().toISOString().split('T')[0]);
  const [examInputDate, setExamInputDate] = useState(userProfile.examDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [bufferDaysInput, setBufferDaysInput] = useState(userProfile.reviseDays || 5);

  // Active assignment state
  const [activeAssigningDayIndex, setActiveAssigningDayIndex] = useState<number | null>(null);
  const [activeAssigningSubject, setActiveAssigningSubject] = useState<string | null>(null);

  // Parse total intervals
  const handleRecalculateRoutines = (e: React.FormEvent) => {
    e.preventDefault();
    const dStart = new Date(startInputDate);
    const dExam = new Date(examInputDate);
    
    if (isNaN(dStart.getTime()) || isNaN(dExam.getTime())) {
      alert("Invalid date parameters! Maintain standard formats.");
      return;
    }

    const diffTime = Math.abs(dExam.getTime() - dStart.getTime());
    const totalDays = Math.ceil(diffTime / (1024 * 60 * 60 * 24));
    
    if (totalDays <= bufferDaysInput) {
      alert("Buffer days cannot exceed or equal total study days up to the examination!");
      return;
    }

    const calculatedStudyDays = totalDays - bufferDaysInput;

    onUpdateUserProfile({
      startDate: startInputDate,
      examDate: examInputDate,
      studyDays: calculatedStudyDays,
      reviseDays: bufferDaysInput
    });

    synthesizeGameSound("chime");
    alert(`Routine calendar rebuilt! ${calculatedStudyDays} Focus study days + ${bufferDaysInput} Spaced revision buffer days.`);
  };

  // List of Day indices
  const totalDaysCount = userProfile.studyDays || 25;
  const daysArray = Array.from({ length: totalDaysCount }, (_, i) => i + 1);

  // Filter chapters unassigned 
  const unassignedChapters = chapters.filter(c => !c.routineDayIndex);

  const handleBindChapterToDay = (chapterId: string, dayIdx: number) => {
    onUpdateChaptersRoutine([chapterId], dayIdx);
    setActiveAssigningDayIndex(null);
    synthesizeGameSound("success");
  };

  const handleUnbindChapterFromDay = (chapterId: string) => {
    onUpdateChaptersRoutine([chapterId], null);
    synthesizeGameSound("chime");
  };

  const [aiInstruction, setAiInstruction] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Re-auto distributed unassigned chapters sequentially
  const handleAutoDistributeChapters = async () => {
    if (unassignedChapters.length === 0) {
      alert("All chapters are already bound to calendar routine days!");
      return;
    }

    setIsDistributing(true);
    try {
      const resp = await fetch("/api/gemini/auto-distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: aiInstruction,
          chapters: unassignedChapters.map(c => ({
            id: c.id, 
            chapterName: c.chapterName, 
            subject: c.subject, 
            estimatedHours: c.estimatedHours, 
            difficulty: c.difficulty 
          })),
          totalDays: totalDaysCount
        })
      });

      if (!resp.ok) throw new Error("API call failed");
      
      const distribution = await resp.json();
      
      // Batch updates per day to optimize calls if needed, but doing sequentially is fine for unassigned
      const dayGroups: Record<number, string[]> = {};
      distribution.forEach((item: any) => {
        if (!dayGroups[item.dayIdx]) dayGroups[item.dayIdx] = [];
        dayGroups[item.dayIdx].push(item.chapterId);
      });
      
      Object.entries(dayGroups).forEach(([dayIdx, ids]) => {
         onUpdateChaptersRoutine(ids, parseInt(dayIdx));
      });
      
      synthesizeGameSound("success");
      setAiInstruction("");
      // Add slight delay before alert so state update renders
      setTimeout(() => alert(`Successfully distributed ${unassignedChapters.length} study chapters!`), 200);

    } catch (err: any) {
      console.error(err);
      // Fallback distribution
      unassignedChapters.forEach((ch, idx) => {
        const assignedDay = (idx % totalDaysCount) + 1;
        onUpdateChaptersRoutine([ch.id], assignedDay);
      });
      synthesizeGameSound("success");
      alert(`Network error, used fallback basic distribution for ${unassignedChapters.length} chapters.`);
    } finally {
      setIsDistributing(false);
    }
  };

  const handleClearAllRoutines = () => {
    const scheduledChapterIds = chapters.filter(c => c.routineDayIndex !== null).map(c => c.id);
    if (scheduledChapterIds.length === 0) {
      alert("No chapters are currently scheduled.");
      return;
    }
    onUpdateChaptersRoutine(scheduledChapterIds, null);
    setShowClearConfirm(false);
    synthesizeGameSound("chime");
  };

  // Format date helper
  const dateAtDayIndex = (dayIdx: number) => {
    const baseDate = new Date(userProfile.startDate || startInputDate);
    baseDate.setDate(baseDate.getDate() + (dayIdx - 1));
    return baseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  return (
    <div id="routine-plan-workspace" className="space-y-6 animate-fade-in relative">
      <div className={`p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-3.5`}>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-500 shrink-0" />
          <h3 className="text-sm font-semibold font-display tracking-tight mt-1">Configure Focus Preparation Dates</h3>
        </div>

        <form onSubmit={handleRecalculateRoutines} className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end text-2xs">
          <div className="space-y-1">
            <label className="text-4xs font-mono font-bold uppercase block opacity-70">Preparation Start Date</label>
            <input
              type="date"
              value={startInputDate}
              onChange={(e) => setStartInputDate(e.target.value)}
              required
              className="w-full bg-slate-500/10 border border-slate-500/25 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-4xs font-mono font-bold uppercase block opacity-70">Pre-Test Exam Date</label>
            <input
              type="date"
              value={examInputDate}
              onChange={(e) => setExamInputDate(e.target.value)}
              required
              className="w-full bg-slate-500/10 border border-slate-500/25 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-4xs font-mono font-bold uppercase block opacity-70">Revision Buffers (Days)</label>
            <input
              type="number"
              min="1"
              max="15"
              value={bufferDaysInput}
              onChange={(e) => setBufferDaysInput(Number(e.target.value) || 5)}
              required
              className="w-full bg-slate-500/10 border border-slate-500/25 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-505 text-inherit font-mono text-center"
            />
          </div>
          <button
            type="submit"
            className="w-full h-8 px-4 py-1.5 font-bold rounded-xl bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Rebuild Routine
          </button>
        </form>

        <div className="flex flex-col border-t border-slate-500/10 pt-3 gap-3.5 text-2xs">
          <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
            <div>
              <span className="font-semibold text-inherit">Syllabus Overview: </span>
              <span className="opacity-80">
                {totalDaysCount} study modules + {userProfile.reviseDays} revision buffer days totaling {totalDaysCount + userProfile.reviseDays} calendar slots.
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 text-2xs">
              {showClearConfirm ? (
                <div className="flex items-center gap-2 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  <span className="text-rose-500 font-bold">Are you sure?</span>
                  <button onClick={handleClearAllRoutines} className="px-2 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700">Yes</button>
                  <button onClick={() => setShowClearConfirm(false)} className="px-2 py-1 bg-slate-500/20 rounded font-bold hover:bg-slate-500/30">No</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Routine
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {unassignedChapters.length > 0 && (
              <div className="flex flex-col gap-2">
                <textarea 
                  value={aiInstruction}
                  onChange={e => setAiInstruction(e.target.value)}
                  placeholder="AI Guide (e.g. 'Pack Math early, keep Sundays light...')"
                  className="w-full sm:w-64 bg-slate-500/10 border border-slate-500/20 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 resize-none h-12 text-3xs placeholder:opacity-50"
                />
                <button
                  onClick={handleAutoDistributeChapters}
                  disabled={isDistributing}
                  className="text-3xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:bg-slate-500"
                >
                  {isDistributing ? '🪄 Distributing...' : '🪄 Auto-Distribute Syllabus to Days'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {unassignedChapters.length > 0 && (
        <div id="unassigned-chapters-box" className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-2xs space-y-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="font-semibold font-display">Unscheduled Course Syllabus Units ({unassignedChapters.length})</h4>
          </div>
          <p className="text-3xs opacity-80">These chapters need to be assigned to routine calendar days so they populate your Home feed correctly:</p>
          <div className="flex flex-wrap gap-2 pt-1 max-h-[85px] overflow-y-auto">
            {unassignedChapters.map(ch => (
              <span key={ch.id} className="px-2 py-1 rounded bg-slate-500/10 border border-inherit text-3xs font-mono font-medium opacity-85 hover:opacity-100 flex items-center gap-1">
                📚 {ch.subject}: {ch.chapterName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Routine Grid listing calendar slots */}
      <div id="routine-days-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {daysArray.map((dayIdx) => {
          // Find chapters bound to this dayIdx
          const dayChapters = chapters.filter(c => c.routineDayIndex === dayIdx);
          const isCompleted = dayChapters.length > 0 && dayChapters.every(c => c.status === 'done');

          return (
            <div key={dayIdx} className={`p-4 rounded-xl border border-slate-500/15 bg-slate-500/5 text-2xs flex flex-col justify-between hover:scale-[1.01] transition-transform`}>
              <div className="space-y-2.5">
                {/* Day title */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold font-display text-indigo-500">Study Routine Day {dayIdx}</h4>
                    <span className="text-3xs opacity-60 font-mono block">{dateAtDayIndex(dayIdx)}</span>
                  </div>
                  {isCompleted ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold font-mono text-3xs select-none uppercase">Completed</span>
                  ) : dayChapters.length > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500 text-white font-mono text-3xs select-none">Active</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-500/20 text-inherit font-mono text-3xs select-none">Empty</span>
                  )}
                </div>

                {/* Chapters assigned to the day */}
                <div className="space-y-1.5 min-h-[60px]">
                  {dayChapters.map(ch => (
                    <div key={ch.id} className="flex items-center justify-between bg-slate-500/5 p-1.5 rounded border border-inherit leading-tight">
                      <span className="truncate flex-1 font-medium text-3xs pr-1" title={ch.chapterName}>
                        📚 {ch.subject}: {ch.chapterName}
                      </span>
                      <button
                        onClick={() => handleUnbindChapterFromDay(ch.id)}
                        title="Unbind chapter from this study day"
                        className="p-0.5 hover:bg-rose-500/15 text-rose-500 shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3" />
                      </button>
                    </div>
                  ))}
                  {dayChapters.length === 0 && (
                    <div className="text-center py-4 text-3xs opacity-50 border border-dashed border-inherit rounded">
                      No chapter tasks scheduled yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Assign manual triggers */}
              <div className="mt-3.5 pt-3 border-t border-slate-500/10 relative">
                {activeAssigningDayIndex === dayIdx ? (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-slate-800 rounded-lg text-white border border-slate-700 z-10 max-h-[160px] overflow-y-auto space-y-1 shadow-2xl leading-none">
                    <div className="text-4xs font-mono font-bold opacity-80 px-1 py-1 border-b border-slate-700 flex justify-between items-center bg-slate-800 sticky top-0 z-20">
                      <span>{activeAssigningSubject ? `Select from ${activeAssigningSubject}:` : "Select Course Subject:"}</span>
                      <div className="flex gap-2">
                         {activeAssigningSubject && (
                           <button onClick={(e) => { e.stopPropagation(); setActiveAssigningSubject(null); }} className="hover:underline text-indigo-400">Back</button>
                         )}
                         <button onClick={(e) => { e.stopPropagation(); setActiveAssigningDayIndex(null); }} className="hover:underline text-rose-400">Close</button>
                      </div>
                    </div>
                    {activeAssigningSubject ? (
                      unassignedChapters.filter(ch => ch.subject === activeAssigningSubject).map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => handleBindChapterToDay(ch.id, dayIdx)}
                          className="w-full text-left p-1.5 text-3xs hover:bg-indigo-650 rounded hover:bg-indigo-600 transition-colors text-slate-100 line-clamp-2"
                        >
                          {ch.chapterName}
                        </button>
                      ))
                    ) : (
                      Array.from(new Set(unassignedChapters.map(c => c.subject))).map(subj => (
                        <button
                          key={subj}
                          onClick={(e) => { e.stopPropagation(); setActiveAssigningSubject(subj); }}
                          className="w-full text-left p-1.5 flex justify-between items-center text-3xs hover:bg-slate-700 rounded transition-colors text-slate-100 font-bold"
                        >
                          <span className="truncate pr-2">{subj}</span>
                          <span className="opacity-50 text-[9px] shrink-0 font-mono">{unassignedChapters.filter(c => c.subject === subj).length} left</span>
                        </button>
                      ))
                    )}
                    {unassignedChapters.length === 0 && (
                      <p className="p-2 text-3xs opacity-60 text-center">No unassigned chapters remaining!</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveAssigningDayIndex(dayIdx); setActiveAssigningSubject(null); synthesizeGameSound("square"); }}
                    className="w-full py-1 rounded bg-slate-500/15 hover:bg-slate-500/25 text-inherit font-semibold text-3xs flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Schedule Chapter on this Day
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
