import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Award, Star, History, BarChart3, TrendingUp, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Chapter, UserProfile, SessionLog } from '../types';

interface StatsPanelProps {
  userProfile: UserProfile;
  chapters: Chapter[];
  sessionLogs: SessionLog[];
  currentTheme: any;
}

export default function StatsPanel({ userProfile, chapters, sessionLogs, currentTheme }: StatsPanelProps) {
  const [showSubjectGraphs, setShowSubjectGraphs] = useState(false);
  
  // High-level metrics calculation
  const totalWeight = chapters.reduce((acc, c) => acc + c.estimatedHours, 0) || 1;
  const currentWeight = chapters.reduce((acc, c) => {
    const p = c.phase === 'study' ? (c.studyProgress || 0) : (c.reviseProgress || 0);
    return acc + (c.estimatedHours * (p / 100));
  }, 0);
  const overallProgressPercentage = Math.round((currentWeight / totalWeight) * 100);

  // Time weight calculations
  const totalHours = totalWeight;
  const completedHours = currentWeight;
  const doneHoursPercentage = overallProgressPercentage;

  // Burnup calculations for SVG
  const totalDays = userProfile.studyDays + userProfile.reviseDays || 30;
  const startDate = new Date(userProfile.startDate);
  startDate.setHours(0,0,0,0);
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  const elapsedDaysReal = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(1, Math.min(totalDays, elapsedDaysReal + 1));

  // Graph styling
  const width = 500;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  const getX = (val: number) => paddingLeft + (val / totalDays) * graphWidth;
  const getY = (val: number) => paddingTop + graphHeight - (val / 100) * graphHeight;

  // Global Graph logic
  const actualPoints: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  const segments = 5;
  for (let i = 1; i <= segments; i++) {
     const day = Math.round((i / segments) * elapsedDays);
     const ratio = i / segments;
     const val = Math.min(overallProgressPercentage, Math.round(overallProgressPercentage * ratio));
     if (day > actualPoints[actualPoints.length-1].x) {
       actualPoints.push({ x: day, y: val });
     }
  }

  const averageRatePerDay = overallProgressPercentage / elapsedDays;
  let projectedEndpointY = Math.round(overallProgressPercentage + averageRatePerDay * (totalDays - elapsedDays));
  let projectedEndpointX = totalDays;

  if (projectedEndpointY > 100 && averageRatePerDay > 0) {
    projectedEndpointY = 100;
    projectedEndpointX = elapsedDays + ((100 - overallProgressPercentage) / averageRatePerDay);
  }
  
  const projectedPoints = [
    { x: elapsedDays, y: overallProgressPercentage },
    { x: projectedEndpointX, y: projectedEndpointY }
  ];

  const idealPath = `M ${getX(0)} ${getY(0)} L ${getX(totalDays)} ${getY(100)}`;
  let actualPath = "";
  if (actualPoints.length > 1) {
    actualPath = `M ${getX(actualPoints[0].x)} ${getY(actualPoints[0].y)} ` + 
      actualPoints.slice(1).map(p => `L ${getX(p.x)} ${getY(p.y)}`).join(" ");
  }
  const projectedPath = `M ${getX(projectedPoints[0].x)} ${getY(projectedPoints[0].y)} L ${getX(projectedPoints[1].x)} ${getY(projectedPoints[1].y)}`;

  // Subjects lists and individual graphs
  const uniqueSubjects = Array.from(new Set(chapters.map(c => c.subject)));
  const subjectsData = uniqueSubjects.map(sub => {
    const subChapters = chapters.filter(c => c.subject === sub);
    const subDone = subChapters.filter(c => c.status === 'done' || c.status === 'revised');
    
    const subProgressHours = subChapters.reduce((acc, c) => {
      const progress = c.phase === 'study' ? c.studyProgress : c.reviseProgress;
      return acc + (c.estimatedHours * (progress / 100));
    }, 0);
    const subTotalHours = subChapters.reduce((acc, c) => acc + c.estimatedHours, 0) || 1;
    const subPct = Math.round((subProgressHours / subTotalHours) * 100);

    // Subject graph paths
    const subActualPoints: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    for (let i = 1; i <= segments; i++) {
       const day = Math.round((i / segments) * elapsedDays);
       const ratio = i / segments;
       const val = Math.min(subPct, Math.round(subPct * ratio));
       if (day > subActualPoints[subActualPoints.length-1].x) {
         subActualPoints.push({ x: day, y: val });
       }
    }
    const subAvgRate = subPct / elapsedDays;
    let subProjY = Math.round(subPct + subAvgRate * (totalDays - elapsedDays));
    let subProjX = totalDays;
    if (subProjY > 100 && subAvgRate > 0) {
      subProjY = 100;
      subProjX = elapsedDays + ((100 - subPct) / subAvgRate);
    }
    
    let subActualPath = "";
    if (subActualPoints.length > 1) {
      subActualPath = `M ${getX(subActualPoints[0].x)} ${getY(subActualPoints[0].y)} ` + 
        subActualPoints.slice(1).map(p => `L ${getX(p.x)} ${getY(p.y)}`).join(" ");
    }
    const subProjPath = `M ${getX(elapsedDays)} ${getY(subPct)} L ${getX(subProjX)} ${getY(subProjY)}`;

    return {
      name: sub,
      total: subChapters.length,
      done: subDone.length,
      percentage: subPct,
      actualPath: subActualPath,
      projectedPath: subProjPath,
      projectedX: subProjX,
      projectedY: subProjY
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat detail 1 */}
        <div id="stat-card-total-time" className={`p-4 rounded-xl ${currentTheme.cardColor} flex items-center justify-between`}>
          <div className="space-y-1">
            <span className="text-2xs font-mono text-indigo-400 font-semibold uppercase">Total Hours Tracked</span>
            <p className="text-2xl font-display font-medium tracking-tight mt-0.5">{totalHours.toFixed(1)}h</p>
            <span className="text-3xs opacity-60">Estimated syllabus index</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Stat detail 2 */}
        <div id="stat-card-hours-studied" className={`p-4 rounded-xl ${currentTheme.cardColor} flex items-center justify-between`}>
          <div className="space-y-1">
            <span className="text-2xs font-mono text-emerald-400 font-semibold uppercase">Completed Syllabus</span>
            <p className="text-2xl font-display font-medium tracking-tight mt-0.5">{completedHours.toFixed(1)}h</p>
            <span className="text-3xs text-emerald-500 font-medium font-mono">+{doneHoursPercentage}% Hours Completed</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Stat detail 3 */}
        <div id="stat-card-experience" className={`p-4 rounded-xl ${currentTheme.cardColor} flex items-center justify-between`}>
          <div className="space-y-1">
            <span className="text-2xs font-mono text-amber-500 font-semibold uppercase">Level Milestone</span>
            <p className="text-2xl font-display font-medium tracking-tight mt-0.5">Lv. {userProfile.level}</p>
            <span className="text-3xs opacity-60">XP Progress: {userProfile.experience}/100</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Burnup Graph Card */}
      <div id="burnup-graph-card" className={`p-5 rounded-2xl ${currentTheme.cardColor}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold font-display tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Syllabus Burnup Chart (Active Progress)
            </h3>
            <p className="text-2xs opacity-70">Monitors your actual preparation pace vs ideal linear rate to Day {totalDays}</p>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-3xs font-mono">
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-sky-400 block border-t border-sky-400 border-dashed"></span> Ideal pace</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-indigo-500 block"></span> Current progress ({overallProgressPercentage}%)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-rose-400 block border-t border-rose-400 border-dashed"></span> Projected Trend</span>
          </div>
        </div>

        {/* Responsive inline SVG chart graph representation */}
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-mono text-2xs overflow-visible">
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map(tick => (
                <g key={tick} className="opacity-15">
                  <line 
                    x1={paddingLeft} 
                    y1={getY(tick)} 
                    x2={width - paddingRight} 
                    y2={getY(tick)} 
                    stroke="currentColor" 
                    strokeWidth="1"
                    strokeDasharray={tick !== 0 ? "3,3" : "none"}
                  />
                  <text x={paddingLeft - 8} y={getY(tick) + 3} textAnchor="end" className="fill-current text-3xs font-medium">
                    {tick}%
                  </text>
                </g>
              ))}

              {/* Vertical grids (Days) */}
              {[0, Math.round(totalDays / 4), Math.round(totalDays / 2), Math.round(totalDays * 0.75), totalDays].map(day => (
                <g key={day} className="opacity-15">
                  <line 
                    x1={getX(day)} 
                    y1={paddingTop} 
                    x2={getX(day)} 
                    y2={height - paddingBottom} 
                    stroke="currentColor" 
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <text x={getX(day)} y={height - paddingBottom + 14} textAnchor="middle" className="fill-current text-3xs">
                    Day {day}
                  </text>
                </g>
              ))}

              {/* DRAW LINES */}
              {/* Ideal rate line */}
              <path d={idealPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5,5" className="opacity-80" />

              {/* Projected curve */}
              <path d={projectedPath} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="3,3" className="opacity-70" />

              {/* Actual curve */}
              {actualPath && (
                <path d={actualPath} fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Current day indicator node */}
              <circle cx={getX(elapsedDays)} cy={getY(overallProgressPercentage)} r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              
              {/* Projected final point helper bubble */}
              <circle cx={getX(projectedEndpointX)} cy={getY(projectedEndpointY)} r="4" fill="#f43f5e" />
            </svg>
          </div>
        </div>

        {/* Projected review outcome warnings */}
        <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 text-2xs border border-inherit flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-inherit">Projection Status: </span>
            {projectedEndpointY >= 100 ? (
              <span className="text-emerald-500 font-medium">On track! Based on your current revision velocity, you are projected to complete 100% of the syllabus with {Math.round(totalDays - projectedEndpointX)} days remaining before your Pre-Test exam starts.</span>
            ) : (
              <span className="text-rose-500 font-medium">Action Needed! Your current study rate places your completion at {projectedEndpointY}% by start of pretest. Increase priority on modules to secure full coverage.</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Subject Progress Bars and Session Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject progress panel */}
        <div id="subject-progress-bars" className={`p-5 rounded-2xl ${currentTheme.cardColor} space-y-4`}>
          <div>
            <h3 className="text-sm font-semibold font-display tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Per Subject Progression Mapping
            </h3>
            <p className="text-3xs opacity-70">Chapters completed status of each tracked standard pre-test discipline</p>
          </div>

          <div className="space-y-4 pt-1">
            {subjectsData.map(sub => (
              <div key={sub.name} className="space-y-2">
                <div 
                  className="flex items-center justify-between text-2xs cursor-pointer group"
                  onClick={() => setShowSubjectGraphs(prev => prev === sub.name ? false : sub.name as any)}
                >
                  <div className="flex items-center gap-2">
                    <button className="p-0.5 rounded hover:bg-slate-500/10 transition-colors">
                      {showSubjectGraphs === sub.name ? <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />}
                    </button>
                    <span className="font-medium text-sm">{sub.name}</span>
                  </div>
                  <span className="text-3xs font-mono opacity-80">{sub.done} / {sub.total} chapters completed ({sub.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-500/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      sub.percentage === 100 ? 'bg-emerald-500' : sub.percentage > 50 ? 'bg-indigo-550' : 'bg-amber-500'
                    }`}
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
                
                <AnimatePresence>
                  {showSubjectGraphs === sub.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2"
                    >
                      <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-500/10 relative">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-3xs font-mono opacity-60 uppercase font-bold tracking-wider">{sub.name} Projection</span>
                          {sub.projectedY >= 100 ? <span className="text-3xs text-emerald-500 font-bold uppercase">On Track</span> : <span className="text-3xs text-rose-500 font-bold uppercase">Action Needed</span>}
                        </div>
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-mono text-2xs overflow-visible">
                          {/* Horizontal grid lines */}
                          {[0, 50, 100].map(tick => (
                            <g key={tick} className="opacity-15">
                              <line 
                                x1={paddingLeft} 
                                y1={getY(tick)} 
                                x2={width - paddingRight} 
                                y2={getY(tick)} 
                                stroke="currentColor" 
                                strokeWidth="1"
                                strokeDasharray={tick !== 0 ? "3,3" : "none"}
                              />
                              <text x={paddingLeft - 8} y={getY(tick) + 3} textAnchor="end" className="fill-current text-3xs font-medium">
                                {tick}%
                              </text>
                            </g>
                          ))}
                          
                          {/* Ideal rate line */}
                          <path d={idealPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5,5" className="opacity-40" />

                          {/* Projected curve */}
                          <path d={sub.projectedPath} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="3,3" className="opacity-70" />

                          {/* Actual curve */}
                          {sub.actualPath && (
                            <path d={sub.actualPath} fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                          )}

                          {/* Current day indicator node */}
                          <circle cx={getX(elapsedDays)} cy={getY(sub.percentage)} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                          
                          {/* Projected final point helper bubble */}
                          <circle cx={getX(sub.projectedX)} cy={getY(sub.projectedY)} r="4" fill="#f43f5e" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {subjectsData.length === 0 && (
              <div className="text-center py-8 text-2xs opacity-60">No subjects identified. Import or add subjects in Settings to inspect metrics.</div>
            )}
          </div>
        </div>

        {/* Study History Session Logs */}
        <div id="activity-session-logs" className={`p-5 rounded-2xl ${currentTheme.cardColor} flex flex-col justify-between`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold font-display tracking-tight flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Study Session Log Records
                </h3>
                <p className="text-3xs opacity-70">Recent session hours and logged duration details</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1 overflow-y-auto max-h-[220px]">
              {sessionLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-2.5 hover:bg-slate-500/5 rounded-xl border border-inherit text-2xs transition-all">
                  <div className="space-y-0.5">
                    <p className="font-medium font-display leading-tight">{log.chapterName}</p>
                    <span className="text-3xs opacity-60 font-mono inline-block">{log.subjectName} • {log.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-500 font-semibold">+{log.durationMinutes} min</span>
                    <p className="text-3xs opacity-50">Studied</p>
                  </div>
                </div>
              ))}
              {sessionLogs.length === 0 && (
                <div className="text-center py-8 text-2xs opacity-60">
                  <Calendar className="w-8 h-8 opacity-25 mx-auto mb-2 text-slate-400" />
                  No completed study sessions registered in history logs. Update a chapter status to Study/Done to record your first session!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
