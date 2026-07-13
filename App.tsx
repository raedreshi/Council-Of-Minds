/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { THINKERS, DILEMMAS, PRELOADED_DEBATES } from "./data/preloaded";
import { PanelCategory, Thinker, Dilemma, Debate } from "./types";
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  PlusCircle, 
  Bookmark, 
  Sliders, 
  Cpu, 
  Flame, 
  CheckCircle2,
  Lock,
  Compass,
  FileText
} from "lucide-react";

export default function App() {
  // Navigation & Category States
  const [activeCategory, setActiveCategory] = useState<PanelCategory>(PanelCategory.MARKET);
  const [selectedDilemmaId, setSelectedDilemmaId] = useState<string>("automation");
  
  // Custom Dilemma Composer State
  const [customDilemmaText, setCustomDilemmaText] = useState("");
  const [customThinkerA, setCustomThinkerA] = useState("marx");
  const [customThinkerB, setCustomThinkerB] = useState("smith");

  // Customizer Overrides (allows users to change thinkers for preloaded debates too!)
  const [overrideThinkers, setOverrideThinkers] = useState(false);
  const [overrideThinkerA, setOverrideThinkerA] = useState("marx");
  const [overrideThinkerB, setOverrideThinkerB] = useState("smith");

  // Local saved debates list (persisted in state/localStorage)
  const [debates, setDebates] = useState<Record<string, Debate>>(() => {
    try {
      const saved = localStorage.getItem("chrono_debates");
      if (saved) {
        return { ...PRELOADED_DEBATES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load custom debates:", e);
    }
    return PRELOADED_DEBATES;
  });

  // activeDebate & Speech playback states
  const [activeDebate, setActiveDebate] = useState<Debate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);

  // Playback Animation States
  const [playbackState, setPlaybackState] = useState<"idle" | "intro" | "speechA" | "speechB" | "counters" | "complete">("idle");
  const [visibleCharsA, setVisibleCharsA] = useState(0);
  const [visibleCharsB, setVisibleCharsB] = useState(0);
  const [visibleCounterA, setVisibleCounterA] = useState(0);
  const [visibleCounterB, setVisibleCounterB] = useState(0);

  // Active debate info helpers
  const currentDilemma = DILEMMAS.find(d => d.id === selectedDilemmaId);
  
  // Resolve which thinker ID is active for display
  const thinkerAId = activeDebate 
    ? activeDebate.thinkerAId 
    : (selectedDilemmaId === "custom" 
        ? customThinkerA 
        : (overrideThinkers ? overrideThinkerA : (currentDilemma?.thinkerAId || "smith")));
        
  const thinkerBId = activeDebate 
    ? activeDebate.thinkerBId 
    : (selectedDilemmaId === "custom" 
        ? customThinkerB 
        : (overrideThinkers ? overrideThinkerB : (currentDilemma?.thinkerBId || "marx")));

  const thinkerA = THINKERS[thinkerAId] || THINKERS["smith"];
  const thinkerB = THINKERS[thinkerBId] || THINKERS["marx"];

  // Sync default override thinkers when dilemma changes
  useEffect(() => {
    if (currentDilemma) {
      setOverrideThinkerA(currentDilemma.thinkerAId);
      setOverrideThinkerB(currentDilemma.thinkerBId);
    }
  }, [selectedDilemmaId]);

  // Load the initial debate on mount
  useEffect(() => {
    const defaultDebate = debates["automation"];
    if (defaultDebate) {
      setActiveDebate(defaultDebate);
      setPlaybackState("complete"); // Preloaded debates start fully revealed
    }
  }, []);

  // Set active debate when selecting preloaded dilemma (if not overriding thinkers)
  useEffect(() => {
    if (!overrideThinkers && selectedDilemmaId && selectedDilemmaId !== "custom") {
      const existing = debates[selectedDilemmaId];
      if (existing) {
        setActiveDebate(existing);
        setPlaybackState("complete");
        setGenerationError(null);
      } else {
        // If somehow no preloaded debate is ready, reset
        setActiveDebate(null);
        setPlaybackState("idle");
      }
    }
  }, [selectedDilemmaId, overrideThinkers, debates]);

  // Typewriter simulated intervals
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (playbackState === "speechA" && activeDebate) {
      timer = setInterval(() => {
        setVisibleCharsA(prev => {
          if (prev >= activeDebate.speechA.length) {
            clearInterval(timer);
            // Move to next state after a small pause
            setTimeout(() => setPlaybackState("speechB"), 1500);
            return activeDebate.speechA.length;
          }
          return prev + 5; // Reveal chunk size
        });
      }, 15);
    } else if (playbackState === "speechB" && activeDebate) {
      timer = setInterval(() => {
        setVisibleCharsB(prev => {
          if (prev >= activeDebate.speechB.length) {
            clearInterval(timer);
            setTimeout(() => setPlaybackState("counters"), 1500);
            return activeDebate.speechB.length;
          }
          return prev + 5;
        });
      }, 15);
    } else if (playbackState === "counters" && activeDebate) {
      timer = setInterval(() => {
        let doneA = false;
        let doneB = false;

        setVisibleCounterA(prev => {
          if (prev >= activeDebate.counterA.length) {
            doneA = true;
            return activeDebate.counterA.length;
          }
          return prev + 3;
        });

        setVisibleCounterB(prev => {
          if (prev >= activeDebate.counterB.length) {
            doneB = true;
            return activeDebate.counterB.length;
          }
          return prev + 3;
        });

        if (doneA && doneB) {
          clearInterval(timer);
          setPlaybackState("complete");
        }
      }, 15);
    }

    return () => clearInterval(timer);
  }, [playbackState, activeDebate]);

  // Trigger typewriter effect from start
  const handlePlayDebate = () => {
    if (!activeDebate) return;
    setVisibleCharsA(0);
    setVisibleCharsB(0);
    setVisibleCounterA(0);
    setVisibleCounterB(0);
    setPlaybackState("speechA");
  };

  const handleSkipAnimation = () => {
    if (!activeDebate) return;
    setVisibleCharsA(activeDebate.speechA.length);
    setVisibleCharsB(activeDebate.speechB.length);
    setVisibleCounterA(activeDebate.counterA.length);
    setVisibleCounterB(activeDebate.counterB.length);
    setPlaybackState("complete");
  };

  // Launch the live debate calling the node express proxy server
  const handleConveneCouncil = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Determine debate variables
    let dilemmaText = "";
    let tAId = "";
    let tBId = "";
    let debateKey = "";

    if (selectedDilemmaId === "custom") {
      if (!customDilemmaText.trim()) {
        setGenerationError("Please describe your custom dilemma topic.");
        return;
      }
      dilemmaText = customDilemmaText.trim();
      tAId = customThinkerA;
      tBId = customThinkerB;
      debateKey = `custom_${tAId}_${tBId}_${encodeURIComponent(dilemmaText.substring(0, 30))}`;
    } else {
      dilemmaText = currentDilemma?.description || "";
      tAId = thinkerA.id;
      tBId = thinkerB.id;
      debateKey = `${selectedDilemmaId}_custom_${tAId}_${tBId}`;
    }

    if (tAId === tBId) {
      setGenerationError("A debater cannot hold debate with themselves! Please select two different historical figures.");
      return;
    }

    // Check if we already computed this custom configuration in our saved state
    if (debates[debateKey]) {
      setActiveDebate(debates[debateKey]);
      setGenerationError(null);
      setVisibleCharsA(0);
      setVisibleCharsB(0);
      setVisibleCounterA(0);
      setVisibleCounterB(0);
      setPlaybackState("speechA");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setActiveDebate(null);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemma: dilemmaText,
          thinkerAId: tAId,
          thinkerBId: tBId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If we get an error (such as missing key or 503 high demand), use the graceful fallback data if provided!
        if (data.fallbackData) {
          const fallback = data.fallbackData;
          setDebates(prev => {
            const updated = { ...prev, [debateKey]: fallback };
            localStorage.setItem("chrono_debates", JSON.stringify(updated));
            return updated;
          });
          setActiveDebate(fallback);
          setPlaybackState("speechA");
          
          if (data.error === "API_KEY_UNCONFIGURED") {
            setGenerationError("Notice: Running in local simulation mode. Configure your GEMINI_API_KEY for authentic, AI-generated insights!");
            setShowKeyInstructions(true);
          } else {
            setGenerationError(`Notice: The AI service is currently overloaded or experiencing high demand (${data.message || "UNAVAILABLE"}). Switched to local offline simulation to preserve your session!`);
          }
        } else {
          throw new Error(data.message || "An unexpected error occurred during synthesis.");
        }
      } else {
        // Successfully generated via Gemini
        setDebates(prev => {
          const updated = { ...prev, [debateKey]: data };
          try {
            // Save custom debates only
            const customs: Record<string, Debate> = {};
            Object.keys(updated).forEach(k => {
              if (updated[k].isCustom || k.includes("custom")) {
                customs[k] = updated[k];
              }
            });
            localStorage.setItem("chrono_debates", JSON.stringify(customs));
          } catch (storageErr) {
            console.warn("Storage write failed:", storageErr);
          }
          return updated;
        });

        setActiveDebate(data);
        setVisibleCharsA(0);
        setVisibleCharsB(0);
        setVisibleCounterA(0);
        setVisibleCounterB(0);
        setPlaybackState("speechA");
      }
    } catch (err: any) {
      console.error(err);
      
      // Super resilient client-side fallback if even the server or fetch fails entirely!
      const fallbackId = "fallback_client_" + Date.now();
      const clientFallback: Debate = {
        id: fallbackId,
        title: `Dialogue on "${dilemmaText.substring(0, 40)}..."`,
        category: activeCategory,
        thinkerAId: tAId,
        thinkerBId: tBId,
        speechA: `[Local Simulation Mode] ${thinkerA.name} addresses the dilemma: "${dilemmaText}". Guided by the principles of ${thinkerA.philosophy}, they argue that we must carefully prioritize human agency, moral duty, or systemic balance. They question any simplistic solution, emphasizing that true progress cannot ignore fundamental ethics. (To experience authentic, dynamic AI-generated responses, try again in a moment once the API high demand subsides!)`,
        speechB: `[Local Simulation Mode] ${thinkerB.name} responds with intense precision. Challenging ${thinkerA.name}, they analyze the dilemma from the perspective of ${thinkerB.philosophy}. They argue that the primary challenge lies not in abstract ideals, but in the material conditions, strategic realities, or practical outcomes of our actions.`,
        counterA: `${thinkerA.name} rebuts: The primary concern remains the preservation of ethical values and human dignity!`,
        counterB: `${thinkerB.name} retorts: True, but we must act upon real-world consequences and structural power dynamics first!`
      };
      
      setDebates(prev => {
        const updated = { ...prev, [debateKey]: clientFallback };
        localStorage.setItem("chrono_debates", JSON.stringify(updated));
        return updated;
      });
      setActiveDebate(clientFallback);
      setPlaybackState("speechA");
      setGenerationError(`Notice: Dynamic AI generation is temporarily unavailable due to high demand (${err.message || "Service Unavailable"}). Seamlessly switched to high-fidelity offline simulation mode to continue your debate!`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Switch category panel helper
  const handleCategorySwitch = (cat: PanelCategory) => {
    setActiveCategory(cat);
    setGenerationError(null);
    if (cat === PanelCategory.CUSTOM) {
      setSelectedDilemmaId("custom");
      setActiveDebate(null);
      setPlaybackState("idle");
    } else {
      const firstInCat = DILEMMAS.find(d => d.category === cat);
      if (firstInCat) {
        setSelectedDilemmaId(firstInCat.id);
        // Clear old active debate if in override/matchup customizer mode
        if (overrideThinkers) {
          setActiveDebate(null);
          setPlaybackState("idle");
        }
      }
    }
  };

  // Helper to instantly load and prepare a custom matchup challenge
  const loadQuickMatchup = (tA: string, tB: string, topic: string) => {
    setActiveCategory(PanelCategory.CUSTOM);
    setSelectedDilemmaId("custom");
    setCustomThinkerA(tA);
    setCustomThinkerB(tB);
    setCustomDilemmaText(topic);
    setGenerationError(null);
    setActiveDebate(null);
    setPlaybackState("idle");
  };

  return (
    <div className="min-h-screen bg-[#030307] text-slate-200 font-sans overflow-x-hidden relative selection:bg-blue-500/30">
      
      {/* Background Neon Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: "12s" }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-950/20 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "18s" }}></div>
        <div className="absolute top-[30%] right-[15%] w-[30vw] h-[30vw] bg-indigo-950/15 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-white/10 pb-4 gap-4">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-blue-400 font-bold mb-1 flex items-center gap-2">
              <Cpu className="w-3 h-3 text-blue-400 animate-spin" style={{ animationDuration: "4s" }} />
              Project ChronoDialectic // Session 842
            </p>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white flex items-center gap-3">
              The Council <span className="italic font-serif text-blue-100">Convenes</span>
            </h1>
          </div>
          
          <div className="text-left sm:text-right flex items-center gap-4">
            <div>
              <p className="text-[10px] tracking-widest uppercase text-slate-500">Subject Query Chamber</p>
              <p className="text-sm italic text-slate-300">
                {selectedDilemmaId === "custom" ? "User Custom Thesis" : currentDilemma?.title}
              </p>
            </div>
          </div>
        </header>

        {/* Global Key Status Info Banner */}
        {showKeyInstructions && (
          <div className="mb-6 backdrop-blur-md bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-300">Gemini Key Needed for Dynamic Dialectics</p>
                <p className="text-[11px] text-slate-400">
                  The application is currently utilizing pre-loaded historical dialogues and local offline simulation. To allow arbitrary debater matchups and customized dilemma debates, add your free key.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowKeyInstructions(false)}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer shrink-0"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Top Panel Category Selector */}
        <nav className="flex flex-wrap gap-2 mb-6" aria-label="Chamber Categories">
          {Object.values(PanelCategory).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySwitch(cat)}
              className={`px-4 py-2 text-xs uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                  : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Interactive Layout Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow items-start">
          
          {/* LEFT COLUMN: Control Deck (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Dilemma Selector Panel */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />
                  Select Dilemma Topic
                </h2>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                  {selectedDilemmaId === "custom" ? "Custom" : DILEMMAS.filter(d => d.category === activeCategory).length + " Preloaded"}
                </span>
              </div>

              {activeCategory === PanelCategory.CUSTOM ? (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-mono uppercase">State your philosophical dilemma:</label>
                    <textarea
                      value={customDilemmaText}
                      onChange={(e) => setCustomDilemmaText(e.target.value)}
                      placeholder="e.g., Should advanced androids with demonstrated emotional capacity be granted equal human rights under constitutional law?"
                      className="w-full h-28 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600 resize-none transition-all"
                    />
                  </div>

                  {/* Thinkers custom selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">Debater A:</label>
                      <select
                        value={customThinkerA}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === customThinkerB) {
                            setCustomThinkerB(customThinkerA);
                          }
                          setCustomThinkerA(val);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40"
                      >
                        {Object.values(THINKERS).map(t => (
                          <option key={t.id} value={t.id} className="bg-[#12121a] text-white">
                            {t.avatarEmoji} {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">Debater B:</label>
                      <select
                        value={customThinkerB}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === customThinkerA) {
                            setCustomThinkerA(customThinkerB);
                          }
                          setCustomThinkerB(val);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40"
                      >
                        {Object.values(THINKERS).map(t => (
                          <option key={t.id} value={t.id} className="bg-[#12121a] text-white">
                            {t.avatarEmoji} {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {DILEMMAS.filter(d => d.category === activeCategory).map((dil) => (
                    <button
                      key={dil.id}
                      onClick={() => {
                        setSelectedDilemmaId(dil.id);
                        setGenerationError(null);
                        // If overriding thinkers, clear previous debate so a fresh config begins
                        if (overrideThinkers) {
                          setActiveDebate(null);
                          setPlaybackState("idle");
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group relative overflow-hidden ${
                        selectedDilemmaId === dil.id
                          ? "bg-blue-500/10 border-blue-500/30 text-white"
                          : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <div className="mt-0.5">
                        <FileText className={`w-3.5 h-3.5 ${selectedDilemmaId === dil.id ? "text-blue-400" : "text-slate-500"}`} />
                      </div>
                      <div className="flex-grow space-y-1">
                        <p className="text-xs font-semibold leading-tight">{dil.title}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:text-slate-400">{dil.description}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-all shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customizer Matchup Controls (Only for preloaded dilemmas) */}
            {selectedDilemmaId !== "custom" && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Chamber Configuration
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">Custom Matchup</span>
                    <input
                      type="checkbox"
                      checked={overrideThinkers}
                      onChange={(e) => {
                        setOverrideThinkers(e.target.checked);
                        setGenerationError(null);
                      }}
                      className="rounded border-white/10 bg-black/40 text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                    />
                  </div>
                </div>

                {overrideThinkers ? (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="bg-purple-950/10 border border-purple-500/10 rounded-lg p-2.5 text-[11px] text-purple-300 leading-normal">
                      Matchup customizer enabled. You have overridden the default debaters! Convene the council to synthesize a dynamic new debate.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">Debater A:</label>
                        <select
                          value={overrideThinkerA}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === overrideThinkerB) {
                              setOverrideThinkerB(overrideThinkerA);
                            }
                            setOverrideThinkerA(val);
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40"
                        >
                          {Object.values(THINKERS).map(t => (
                            <option key={t.id} value={t.id} className="bg-[#12121a] text-white">
                              {t.avatarEmoji} {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">Debater B:</label>
                        <select
                          value={overrideThinkerB}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === overrideThinkerA) {
                              setOverrideThinkerA(overrideThinkerB);
                            }
                            setOverrideThinkerB(val);
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40"
                        >
                          {Object.values(THINKERS).map(t => (
                            <option key={t.id} value={t.id} className="bg-[#12121a] text-white">
                              {t.avatarEmoji} {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Currently using historical default disputants formulated for this panel.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono block">Debater A</span>
                        <span className="text-xs font-semibold text-white">{thinkerA.name}</span>
                      </div>
                      <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono block">Debater B</span>
                        <span className="text-xs font-semibold text-white">{thinkerB.name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons: Convene the Council */}
            <div className="space-y-3">
              {/* Convene Button */}
              <button
                onClick={() => handleConveneCouncil()}
                disabled={isGenerating}
                className={`w-full py-3.5 px-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 transform active:scale-[0.98] ${
                  isGenerating 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Synthesizing Dialectic...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    Convene the Council
                  </>
                )}
              </button>

              {/* Reset / Play controls */}
              {activeDebate && !isGenerating && (
                <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                  <button
                    onClick={handlePlayDebate}
                    className="py-2.5 px-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play className="w-3.5 h-3.5 text-blue-400" />
                    Play Dialogue
                  </button>
                  <button
                    onClick={handleSkipAnimation}
                    disabled={playbackState === "complete" || playbackState === "idle"}
                    className="py-2.5 px-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    Reveal Fully
                  </button>
                </div>
              )}

              {/* Dynamic Notification/Error States */}
              {generationError && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-tight">{generationError}</p>
                </div>
              )}
            </div>

            {/* Quick Debater Reference Panel */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Active Disputants
              </h4>
              <div className="space-y-3 pt-1">
                {/* Debater A Details */}
                <div className="flex items-start gap-3 p-2 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="text-2xl mt-1">{thinkerA.avatarEmoji}</span>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {thinkerA.name}
                      <span className="text-[9px] text-slate-500 font-mono font-normal">({thinkerA.era})</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">{thinkerA.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">{thinkerA.summary}</p>
                  </div>
                </div>

                {/* Debater B Details */}
                <div className="flex items-start gap-3 p-2 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="text-2xl mt-1">{thinkerB.avatarEmoji}</span>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {thinkerB.name}
                      <span className="text-[9px] text-slate-500 font-mono font-normal">({thinkerB.era})</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">{thinkerB.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">{thinkerB.summary}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: The Council Arena (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {isGenerating ? (
              /* High-fidelity custom loader */
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
                <div className="relative">
                  {/* Rotating cosmic orbits */}
                  <div className="w-16 h-16 rounded-full border border-blue-500/20 animate-spin" style={{ animationDuration: "3s" }}></div>
                  <div className="absolute inset-2 rounded-full border border-purple-500/30 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }}></div>
                  <div className="absolute inset-4 rounded-full border border-pink-500/40 animate-pulse"></div>
                  <Cpu className="absolute inset-0 m-auto w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif italic text-2xl text-white">Summoning Historical Conscience</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Connecting to the neural dialetic engine. We are synthesizing a sophisticated confrontation between <span className="text-blue-300 font-semibold">{thinkerA.name}</span> and <span className="text-purple-300 font-semibold">{thinkerB.name}</span> adhering to their exact classical syntax.
                  </p>
                </div>
                {/* Faux terminal lines */}
                <div className="w-full max-w-sm bg-black/60 rounded-lg p-3 text-left font-mono text-[9px] text-blue-500/70 border border-white/5 space-y-1">
                  <p>&gt; INITIALIZING TEMPORAL VECTOR PATHWAY...</p>
                  <p>&gt; MATCHING LINGUISTIC SCHEMA FOR {thinkerA.name.toUpperCase()}...</p>
                  <p>&gt; MATCHING CLASSICAL CONTEXTS FOR {thinkerB.name.toUpperCase()}...</p>
                  <p>&gt; RESOLVING SURPLUS VALUE AND INVISIBLE HAND EQUATIONS...</p>
                </div>
              </div>
            ) : activeDebate ? (
              /* The Active Debate Presentation Board */
              <div className="space-y-6 animate-fadeIn">
                
                {/* Topic Heading Banner */}
                <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono tracking-[0.2em] text-blue-400 uppercase">Debated Subject Matter</span>
                    <h2 className="text-lg font-bold text-white">
                      {selectedDilemmaId === "custom" 
                        ? (activeDebate ? activeDebate.title : (customDilemmaText || "Custom Philosophical Thesis")) 
                        : currentDilemma?.description}
                    </h2>
                  </div>
                  {/* Playing voice visualization simulation */}
                  {(playbackState === "speechA" || playbackState === "speechB" || playbackState === "counters") && (
                    <div className="flex items-center gap-1.5 shrink-0 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Active Dialogue</span>
                    </div>
                  )}
                </div>

                {/* Main Speech Columns (Side-by-Side) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Debater A Speech Panel */}
                  <section className={`backdrop-blur-xl border rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 ${
                    playbackState === "speechA" 
                      ? "bg-white/10 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20" 
                      : "bg-white/5 border-white/10 opacity-90"
                  }`}>
                    <div>
                      {/* Thinker Title Header */}
                      <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${thinkerA.bgGradient} flex items-center justify-center flex-shrink-0 border ${thinkerA.accentBorder} text-2xl shadow-lg`}>
                          {thinkerA.avatarEmoji}
                        </div>
                        <div>
                          <h3 className={`font-serif text-2xl font-normal italic ${thinkerA.color}`}>{thinkerA.name}</h3>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 leading-none mt-1">{thinkerA.philosophy.split(",")[0]}</p>
                        </div>
                      </div>

                      {/* Animated Speech Text Area */}
                      <div className="text-[13px] leading-relaxed text-slate-200 min-h-[220px] select-text">
                        {playbackState === "idle" ? (
                          <p className="text-slate-500 italic font-light">Awaiting assembly trigger. Click "Play Dialogue" to convene the session and hear their dynamic historical arguments.</p>
                        ) : (
                          <div className="space-y-3">
                            <p className="whitespace-pre-wrap">
                              {activeDebate.speechA.substring(0, visibleCharsA)}
                              {playbackState === "speechA" && <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5">|</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>ORIGIN: {thinkerA.era}</span>
                      {playbackState === "speechA" && <span className="text-blue-400 animate-pulse">SOCIOLOGICAL SYNTHESIS...</span>}
                    </div>
                  </section>

                  {/* Debater B Speech Panel */}
                  <section className={`backdrop-blur-xl border rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 ${
                    playbackState === "speechB" 
                      ? "bg-white/10 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20" 
                      : "bg-white/5 border-white/10 opacity-90"
                  }`}>
                    <div>
                      {/* Thinker Title Header */}
                      <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${thinkerB.bgGradient} flex items-center justify-center flex-shrink-0 border ${thinkerB.accentBorder} text-2xl shadow-lg`}>
                          {thinkerB.avatarEmoji}
                        </div>
                        <div>
                          <h3 className={`font-serif text-2xl font-normal italic ${thinkerB.color}`}>{thinkerB.name}</h3>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 leading-none mt-1">{thinkerB.philosophy.split(",")[0]}</p>
                        </div>
                      </div>

                      {/* Animated Speech Text Area */}
                      <div className="text-[13px] leading-relaxed text-slate-200 min-h-[220px] select-text">
                        {playbackState === "idle" || playbackState === "speechA" ? (
                          <p className="text-slate-500 italic font-light">
                            {playbackState === "speechA" ? `${thinkerA.name} is currently holding court. Once they conclude, ${thinkerB.name} will formulate their rebuttal.` : "Awaiting assembly trigger."}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <p className="whitespace-pre-wrap">
                              {activeDebate.speechB.substring(0, visibleCharsB)}
                              {playbackState === "speechB" && <span className="inline-block w-1 h-4 bg-purple-400 animate-pulse ml-0.5">|</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>ORIGIN: {thinkerB.era}</span>
                      {playbackState === "speechB" && <span className="text-purple-400 animate-pulse">STRUCTURAL DEFENSE...</span>}
                    </div>
                  </section>

                </div>

                {/* CROSS-EXAMINATION: Rebuttals Board */}
                <footer className="backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-blue-500 w-8"></div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-blue-400" />
                      Cross-Examination Counterpoint
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
                    
                    {/* Counter A */}
                    <div className="pl-4 border-l-2 border-blue-500/40 space-y-1">
                      <p className="text-slate-500 mb-1 font-bold uppercase text-[9px] tracking-widest">{thinkerA.name}'s Counter</p>
                      <p className="text-slate-200 text-xs italic leading-relaxed">
                        {playbackState === "idle" || playbackState === "speechA" || playbackState === "speechB" ? (
                          <span className="text-slate-600 font-light italic">Rebuttals formulate in the second phase...</span>
                        ) : (
                          `"${activeDebate.counterA.substring(0, visibleCounterA)}"`
                        )}
                      </p>
                    </div>

                    {/* Counter B */}
                    <div className="pl-4 border-l-2 border-purple-500/40 space-y-1">
                      <p className="text-slate-500 mb-1 font-bold uppercase text-[9px] tracking-widest">{thinkerB.name}'s Counter</p>
                      <p className="text-slate-200 text-xs italic leading-relaxed">
                        {playbackState === "idle" || playbackState === "speechA" || playbackState === "speechB" ? (
                          <span className="text-slate-600 font-light italic">Rebuttals formulate in the second phase...</span>
                        ) : (
                          `"${activeDebate.counterB.substring(0, visibleCounterB)}"`
                        )}
                      </p>
                    </div>

                  </div>
                </footer>

              </div>
            ) : (
              /* Intro Landing & About Chamber View */
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 min-h-[500px] flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-emerald-400 font-mono font-bold">Temporal Chamber Online</span>
                    <h3 className="font-serif italic text-3xl text-white">Let the Dialogue Begin</h3>
                  </div>
                  
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Welcome to <strong>ChronoDialectic</strong>! Throughout human history, brilliant minds have shaped how we understand our world. What happens when we bring these legendary historical figures together to discuss the future? 
                  </p>
                  
                  <p className="text-sm text-slate-300 leading-relaxed">
                    This interactive simulator lets you bridge time and space. Pick one of our pre-arranged panels on the left—exploring **the creativity of AI**, **space exploration**, **social media connections**, or **future lifestyles**—or create your own custom dream matchup!
                  </p>
                  
                  {/* Interactive Quick Matchups */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="animate-pulse">✨</span> Delightful Quick-Start Matchups:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        id="quick-match-oppenheimer-gandhi"
                        onClick={() => loadQuickMatchup("oppenheimer", "gandhi", "How do we balance exciting scientific breakthroughs with a peaceful world?")}
                        className="text-left p-3.5 bg-white/[0.02] hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all cursor-pointer group hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-blue-300">
                          <span>⚛️ Robert Oppenheimer</span>
                          <span className="text-slate-500 font-normal">vs</span>
                          <span>🪔 Mahatma Gandhi</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-200">
                          "How do we balance exciting scientific breakthroughs with a peaceful world?"
                        </p>
                      </button>

                      <button
                        id="quick-match-smith-marx"
                        onClick={() => loadQuickMatchup("smith", "marx", "How do we build a happy, fair, and prosperous workplace in the age of smart machines?")}
                        className="text-left p-3.5 bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-xl transition-all cursor-pointer group hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-purple-300">
                          <span>🎩 Adam Smith</span>
                          <span className="text-slate-500 font-normal">vs</span>
                          <span>⚒️ Karl Marx</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-200">
                          "How do we build a happy, fair, and prosperous workplace in the age of smart machines?"
                        </p>
                      </button>

                      <button
                        id="quick-match-machiavelli-aurelius"
                        onClick={() => loadQuickMatchup("machiavelli", "aurelius", "What are the most inspiring values for a great leader to practice today?")}
                        className="text-left p-3.5 bg-white/[0.02] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer group hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-emerald-300">
                          <span>🦊 Niccolò Machiavelli</span>
                          <span className="text-slate-500 font-normal">vs</span>
                          <span>🏛️ Marcus Aurelius</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-200">
                          "What are the most inspiring values for a great leader to practice today?"
                        </p>
                      </button>

                      <button
                        id="quick-match-galileo-aurelius"
                        onClick={() => loadQuickMatchup("galileo", "aurelius", "How can we encourage everyone to explore the universe and seek amazing truths?")}
                        className="text-left p-3.5 bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer group hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-cyan-300">
                          <span>🔭 Galileo Galilei</span>
                          <span className="text-slate-500 font-normal">vs</span>
                          <span>🏛️ Marcus Aurelius</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-200">
                          "How can we encourage everyone to explore the universe and seek amazing truths?"
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* How it works grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <span className="text-blue-400 font-mono">1.</span> Pick a Topic
                      </span>
                      <p className="text-[11px] text-slate-400">Choose from the preset scenarios on the left sidebar or define your own.</p>
                    </div>
                    <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <span className="text-purple-400 font-mono">2.</span> Pair the Debaters
                      </span>
                      <p className="text-[11px] text-slate-400">Adopt our default historical matchups or customize which debaters go head-to-head.</p>
                    </div>
                    <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <span className="text-amber-400 font-mono">3.</span> Engage Dialogue
                      </span>
                      <p className="text-[11px] text-slate-400">Click "Convene Debate" to listen to or read their fascinating conversations!</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>CHAMBER STATUS: 100% ONLINE</span>
                  <span>DIALOGUE PIPELINE: SECURED</span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer info line with subtle metadata */}
        <footer className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 font-mono gap-4">
          <div className="flex items-center gap-4">
            <span>STABILITY: 99.8%</span>
            <span>|</span>
            <span>NEURAL_LINK: ACTIVE</span>
            <span>|</span>
            <span>EPOCH: 2026.MODERNITY</span>
          </div>
          <div>
            <span>PRODUCED BY GOOGLE AI STUDIO BUILD &bull; POWERED BY GEMINI-3.5-FLASH</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
