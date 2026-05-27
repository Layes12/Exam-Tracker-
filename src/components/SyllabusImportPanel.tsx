import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, Sparkles, AlertCircle, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Chapter } from '../types';
import { synthesizeGameSound } from '../data';

interface SyllabusImportPanelProps {
  onImportConfirmed: (chapters: Partial<Chapter>[]) => void;
  currentTheme: any;
}

export default function SyllabusImportPanel({ onImportConfirmed, currentTheme }: SyllabusImportPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number; base64: string; mimeType: string } | null>(null);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  // Preview extracted syllabus structure state
  const [previewSubjects, setPreviewSubjects] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setErrorText(null);
    if (!file) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/") && file.type !== "text/plain") {
      setErrorText("Unsupported file type! Please attach a study pretest PDF, a txt curriculum outline, or a picture of the written schedule.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultString = event.target.result as string;
        // Split data:application/pdf;base64, to get the actual inline raw base64 string
        const base64Data = resultString.split(',')[1];
        setFileDetails({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          base64: base64Data
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRunAIImport = async () => {
    if (!fileDetails && !promptText.trim()) {
      setErrorText("Provide a text syllabus outline descriptions or attach a syllabus PDF/Image first.");
      return;
    }

    setErrorText(null);
    setIsLoading(true);
    setPreviewSubjects(null);

    try {
      const response = await fetch("/api/gemini/generate-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: promptText,
          base64File: fileDetails?.base64 || null,
          mimeType: fileDetails?.mimeType || null
        })
      });

      if (!response.ok) {
        throw new Error("Syllabus service returned an operational issue. Please verify file content.");
      }

      const data = await response.json();
      if (!data.subjects || data.subjects.length === 0) {
        throw new Error("No structured subject files or chapters extracted. Check formatting.");
      }

      setPreviewSubjects(data.subjects);
      synthesizeGameSound("chime");
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "An error occurred during AI parsing. Ensure correct formatting of text documents.");
    } finally {
      setIsLoading(false);
    }
  };

  // Previews table modifications
  const handleRemoveChapter = (subjectIdx: number, sectionIdx: number, chapterIdx: number) => {
    if (!previewSubjects) return;
    const copied = JSON.parse(JSON.stringify(previewSubjects));
    copied[subjectIdx].sections[sectionIdx].chapters.splice(chapterIdx, 1);
    
    // Remove section if empty
    if (copied[subjectIdx].sections[sectionIdx].chapters.length === 0) {
      copied[subjectIdx].sections.splice(sectionIdx, 1);
    }
    // Remove subject if empty
    if (copied[subjectIdx].sections.length === 0) {
      copied.splice(subjectIdx, 1);
    }
    setPreviewSubjects(copied);
  };

  const handleAddPreviewChapter = (subjectIdx: number, sectionIdx: number) => {
    if (!previewSubjects) return;
    const copied = JSON.parse(JSON.stringify(previewSubjects));
    copied[subjectIdx].sections[sectionIdx].chapters.push({
      chapterName: "New Extracted Unit",
      estimatedHours: 1.5,
      difficulty: "medium"
    });
    setPreviewSubjects(copied);
  };

  const handleEditChapterName = (subjectIdx: number, sectionIdx: number, chapterIdx: number, val: string) => {
    if (!previewSubjects) return;
    const copied = JSON.parse(JSON.stringify(previewSubjects));
    copied[subjectIdx].sections[sectionIdx].chapters[chapterIdx].chapterName = val;
    setPreviewSubjects(copied);
  };

  const handleEditChapterHours = (subjectIdx: number, sectionIdx: number, chapterIdx: number, val: number) => {
    if (!previewSubjects) return;
    const copied = JSON.parse(JSON.stringify(previewSubjects));
    copied[subjectIdx].sections[sectionIdx].chapters[chapterIdx].estimatedHours = val;
    setPreviewSubjects(copied);
  };

  const handleEditChapterFreq = (subjectIdx: number, sectionIdx: number, chapterIdx: number, val: 'easy' | 'medium' | 'hard') => {
    if (!previewSubjects) return;
    const copied = JSON.parse(JSON.stringify(previewSubjects));
    copied[subjectIdx].sections[sectionIdx].chapters[chapterIdx].difficulty = val;
    setPreviewSubjects(copied);
  };

  const handleConfirmBulkSave = () => {
    if (!previewSubjects) return;
    const finalImportChapters: Partial<Chapter>[] = [];
    
    previewSubjects.forEach(sub => {
      sub.sections.forEach((sect: any) => {
        sect.chapters.forEach((ch: any) => {
          finalImportChapters.push({
            subject: sub.subjectName,
            section: sect.sectionName,
            chapterName: ch.chapterName,
            estimatedHours: Number(ch.estimatedHours) || 1.5,
            difficulty: ch.difficulty,
            status: 'to study',
            studyProgress: 0,
            reviseProgress: 0,
            todos: [],
            attachments: []
          });
        });
      });
    });

    onImportConfirmed(finalImportChapters);
    setPreviewSubjects(null);
    setFileDetails(null);
    setPromptText('');
    synthesizeGameSound("success");
  };

  return (
    <div id="syllabus-import-box" className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold font-display tracking-tight mt-1">Automatic AI PDF to Syllabus Ingestion</h3>
      </div>

      {!previewSubjects ? (
        <div className="space-y-4">
          <p className="text-2xs opacity-80 leading-relaxed">
            Have a Pre-Test school syllabus image, text document, or academic outline PDF? Wrap your plan instantly: Drag and drop the file below, and Gemini AI will parse the structure to build your checklist dashboard automatically.
          </p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleTriggerUpload}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : 'border-slate-500/25 hover:border-indigo-500/50 hover:bg-slate-500/5'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf,image/*,text/plain"
              className="hidden"
            />
            {fileDetails ? (
              <div className="space-y-2 max-w-xs mx-auto animate-scale-in">
                <FileText className="w-10 h-10 text-indigo-500 mx-auto" />
                <p className="text-xs font-semibold leading-tight truncate">{fileDetails.name}</p>
                <p className="text-3xs opacity-60">File size: {(fileDetails.size / 1024).toFixed(1)} KB • Click to replace</p>
              </div>
            ) : (
              <div className="space-y-2 max-w-sm mx-auto">
                <UploadCloud className="w-10 h-10 text-indigo-500/65 mx-auto" />
                <p className="text-xs font-semibold">Drop pre-test syllabus PDF or click to browse</p>
                <p className="text-3xs opacity-60 leading-none">Supports PDF, JPG, PNG, and plain Text</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-3xs font-mono font-bold uppercase block opacity-80">Manual description notes (Optional Guidance)</label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Include Prose chapter Ranar, prose Boi Pora and omit English writing paragraph..."
              rows={3}
              className="w-full bg-slate-500/5 border border-slate-500/25 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-inherit"
            />
          </div>

          {errorText && (
            <div className="p-3 bg-rose-500/10 rounded-xl flex items-start gap-2.5 text-rose-500 text-2xs border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-medium">{errorText}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleRunAIImport}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gemini Structuring Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Extract Pre-Test Syllabus
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Extracted preview schema editable tables
        <div className="space-y-4 animate-scale-in">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold font-display text-indigo-500">Preview Extracted Syllabus</h4>
              <p className="text-3xs opacity-70">Review suggested estimated hours and chapters, customize values, then click Confirm.</p>
            </div>
            <button 
              onClick={() => setPreviewSubjects(null)}
              className="text-2xs font-bold hover:underline"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-5 pt-1 overflow-y-auto max-h-[400px]">
            {previewSubjects.map((sub, sIdx) => (
              <div key={sIdx} className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={sub.subjectName}
                    onChange={(e) => {
                      const updated = [...previewSubjects];
                      updated[sIdx].subjectName = e.target.value;
                      setPreviewSubjects(updated);
                    }}
                    className="font-bold text-xs bg-transparent focus:underline border-none p-0 text-inherit"
                  />
                  <span className="text-3xs opacity-70 font-mono">Extracted Subject</span>
                </div>

                {sub.sections.map((sec: any, secIdx: number) => (
                  <div key={secIdx} className="pl-3 border-l border-indigo-500/30 space-y-2">
                    <input
                      type="text"
                      value={sec.sectionName}
                      onChange={(e) => {
                        const updated = [...previewSubjects];
                        updated[sIdx].sections[secIdx].sectionName = e.target.value;
                        setPreviewSubjects(updated);
                      }}
                      className="text-2xs font-semibold bg-transparent focus:underline border-none text-indigo-400 p-0"
                    />

                    <div className="space-y-2 pl-3">
                      {sec.chapters.map((ch: any, chIdx: number) => (
                        <div key={chIdx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-500/5 p-2 rounded-lg border border-inherit text-xs">
                          <input
                            type="text"
                            value={ch.chapterName}
                            onChange={(e) => handleEditChapterName(sIdx, secIdx, chIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none p-0 font-medium text-2xs focus:underline text-inherit"
                          />
                          
                          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end text-3xs">
                            {/* Hrs input */}
                            <div className="flex items-center gap-1">
                              <span className="opacity-70 font-mono">Hours:</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={ch.estimatedHours}
                                onChange={(e) => handleEditChapterHours(sIdx, secIdx, chIdx, Number(e.target.value))}
                                className="w-10 bg-slate-500/10 border border-slate-500/25 rounded px-1 text-center font-mono focus:outline-none text-inherit"
                              />
                            </div>
                            {/* Difficulty */}
                            <select
                              value={ch.difficulty}
                              onChange={(e) => handleEditChapterFreq(sIdx, secIdx, chIdx, e.target.value as any)}
                              className="bg-slate-500/10 border border-slate-500/25 rounded p-0 px-1 font-mono focus:outline-none text-inherit text-2xs"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                            {/* Remove row */}
                            <button
                              onClick={() => handleRemoveChapter(sIdx, secIdx, chIdx)}
                              className="p-1 hover:bg-rose-500/15 hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAddPreviewChapter(sIdx, secIdx)}
                      className="text-3xs font-semibold text-indigo-500 hover:underline pl-3 mt-1 block"
                    >
                      + Add Chapter
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3.5 pt-2">
            <button
              onClick={() => setPreviewSubjects(null)}
              className="px-4 py-2 hover:bg-slate-500/10 rounded-xl text-2xs text-inherit transition-all"
            >
              Discard Preset
            </button>
            <button
              onClick={handleConfirmBulkSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-2xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Import to Planner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
