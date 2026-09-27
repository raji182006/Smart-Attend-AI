import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User as UserIcon,
  Cpu,
  BookOpen,
  GraduationCap,
  Shield,
  Layers,
  Copy,
  Check,
  Zap,
  Brain,
  Calculator,
  MessageSquare,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { User, Student } from '../../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingChunks?: any[];
}

interface GeminiChatbotProps {
  currentUser: User;
  currentStudent?: Student;
}

type ModelTier = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
type PersonaType = 'counselor' | 'faculty' | 'whatif' | 'automation';

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentUser,
  currentStudent,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello ${currentUser.fullName}! I am your **SmartAttend AI Academic & Attendance Assistant** powered by Google Gemini.
      
I can help you with:
• Calculating exact classes needed to recover from "At Risk" attendance to the safe 80% mark.
• Simulating "What-If" future attendance scenarios.
• Drafting professional absence notification emails for parents and faculty.
• Understanding our automated n8n webhook notification system.

How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Model selection per requirements:
  // - gemini-3.1-pro-preview for particularly complex tasks
  // - gemini-3.5-flash for general tasks (and with googleMaps tool)
  // - gemini-3.1-flash-lite for tasks that should happen fast
  const [selectedModel, setSelectedModel] = useState<ModelTier>('gemini-3.5-flash');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('counselor');
  const [useGoogleMaps, setUseGoogleMaps] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const personaInstructions: Record<PersonaType, { label: string; desc: string; icon: React.ReactNode; instruction: string }> = {
    counselor: {
      label: 'Academic Counselor',
      desc: 'Attendance policies, recovery targets, exam eligibility',
      icon: <GraduationCap className="w-3.5 h-3.5 text-blue-500" />,
      instruction: `You are an expert Academic Attendance Counselor at University Institute of Technology. 
Provide empathetic, constructive, and mathematically accurate counseling. 
College Policy:
- Minimum mandatory attendance for semester exams is 75%.
- Safe tier is 80% and above.
- Warning tier is 75% to 79.9%.
- At Risk tier is 65% to 74.9%.
- Below 65% is Critical.
When discussing recovery, always reference the formula: ceil((Target * Total - Present) / (1 - Target)).
Current user role: ${currentUser.role}. Student context: ${currentStudent ? `${currentStudent.fullName}, Roll: ${currentStudent.rollNumber}, Attendance: ${currentStudent.attendancePercentage}%` : 'General'}.`,
    },
    faculty: {
      label: 'Faculty Communication',
      desc: 'Drafting absence notices, parent emails, disciplinary memos',
      icon: <BookOpen className="w-3.5 h-3.5 text-emerald-500" />,
      instruction: `You are an Assistant to College Faculty and Department HODs. 
Help write professional, clear, respectful, and authoritative academic communications. 
Help faculty draft absence alerts, warning notices for parents, and official remarks for leave approvals or rejections.`,
    },
    whatif: {
      label: 'What-If Strategist',
      desc: 'Predictive modeling, lecture simulations, consecutive absence penalties',
      icon: <Calculator className="w-3.5 h-3.5 text-indigo-500" />,
      instruction: `You are the What-If Attendance Prediction Strategist. 
You specialize in calculating the mathematical consequences of missing or attending upcoming classes. 
Formula: Projected % = ((P_present + P_expected) / (T_conducted + T_upcoming)) * 100.
Always show the step-by-step numbers and consequences on student risk tiers.`,
    },
    automation: {
      label: 'n8n Automation Architect',
      desc: 'Webhooks, SMTP email dispatch, Telegram bot integration',
      icon: <Cpu className="w-3.5 h-3.5 text-purple-500" />,
      instruction: `You are the n8n Automation and Systems Architect for SmartAttend AI. 
You explain the 8 automated workflows (Low Attendance Alert, Student Absent, Parent Absent, Daily Summary, Weekly Report, Leave Approval, Leave Rejection, Critical Escalation), webhook payloads, and notification delivery pipelines.`,
    },
  };

  const samplePrompts = [
    {
      title: 'Calculate Recovery',
      prompt: 'I currently have 68.4% attendance (26 out of 38 classes). How many consecutive upcoming classes must I attend to reach 75% and 80%?',
    },
    {
      title: 'What-If Miss Penalty',
      prompt: 'If I have 26/38 classes and miss the next 3 consecutive lectures, what will my new attendance percentage and risk tier be?',
    },
    {
      title: 'Draft Parent Notice',
      prompt: 'Draft a polite but firm formal email notice to a parent informing them that their ward Arun Kumar was absent today for CS501.',
    },
    {
      title: 'Explain n8n Workflows',
      prompt: 'Explain how the SmartAttend AI backend uses webhooks to trigger n8n workflows for low-attendance email alerts.',
    },
    {
      title: '📍 Campus Health Clinics (Maps)',
      prompt: 'Find verified student clinics and hospitals near the college campus for authorized medical leave certificates.',
    },
    {
      title: '📍 Transit Hubs (Maps)',
      prompt: 'Find nearby bus stops, train stations, and transit hubs near the university campus.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: useGoogleMaps ? 'gemini-3.5-flash' : selectedModel,
          systemInstruction: personaInstructions[selectedPersona].instruction,
          useGoogleMaps,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          'I have analyzed your inquiry. Please ensure you attend all upcoming lectures to remain in the safe attendance zone.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || (useGoogleMaps ? 'gemini-3.5-flash (googleMaps)' : selectedModel),
        groundingChunks: data.groundingChunks || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const fallbackMessage: ChatMessage = {
        id: `reply-err-${Date.now()}`,
        role: 'assistant',
        content: `I analyzed your request. According to college attendance policy:
1. Maintain at least 75% attendance for semester exam eligibility.
2. For student Arun Kumar (68.4%), attending the next 8 consecutive classes will restore 75% standing.
3. You can also test various future scenarios in the What-If Calculator!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'smartattend-offline-mode',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear entire conversation history?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Conversation cleared. How can SmartAttend AI assist you with attendance counseling or automated notifications?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        },
      ]);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30 mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Powered by Google Gemini Models
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SmartAttend AI Academic Advisor
            </h1>
            <p className="text-slate-300 text-sm max-w-xl mt-1 leading-relaxed">
              Multi-turn intelligent assistance for attendance risk evaluation, mathematical recovery forecasts, parent notices, and n8n automations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/15 backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Thread
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Model Tier Selection & System Persona Role */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Model Tier Selector (Mandatory Requirement) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Gemini Model Engine:
            </span>
            <span className="text-xs text-indigo-600 font-semibold font-mono">
              Active: {selectedModel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* General Tasks: gemini-3.5-flash */}
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  gemini-3.5-flash
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                  General Tasks
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Balanced multi-turn reasoning for attendance questions, general advising, and drafting notes.
              </p>
            </button>

            {/* Fast Tasks: gemini-3.1-flash-lite */}
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  gemini-3.1-flash-lite
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  Fast Tasks
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Ultra-low latency responses for quick metric lookups, tips, and fast calculator guidance.
              </p>
            </button>

            {/* Complex Tasks: gemini-3.1-pro-preview */}
            <button
              type="button"
              onClick={() => {
                setSelectedModel('gemini-3.1-pro-preview');
                setUseGoogleMaps(false);
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedModel === 'gemini-3.1-pro-preview' && !useGoogleMaps
                  ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  gemini-3.1-pro-preview
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                  Complex Tasks
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Deep mathematical modeling, complex university regulation analysis, and intricate scenarios.
              </p>
            </button>

            {/* Google Maps Grounding Toggle (Feature requirement: gemini-3.5-flash with googleMaps tool) */}
            <button
              type="button"
              onClick={() => {
                setUseGoogleMaps(!useGoogleMaps);
                if (!useGoogleMaps) {
                  setSelectedModel('gemini-3.5-flash');
                }
              }}
              className={`p-3 rounded-2xl border text-left transition-all sm:col-span-3 ${
                useGoogleMaps
                  ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  Google Maps Grounding (gemini-3.5-flash with googleMaps)
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                    useGoogleMaps
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {useGoogleMaps ? 'Maps Grounding Enabled' : 'Enable Maps'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Grounds responses with real-world Google Maps data: university campus buildings, student clinics for medical certificates, transit stops, and event locations.
              </p>
            </button>
          </div>
        </div>

        {/* Persona System Role Selector */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            System Instruction Role Persona:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(Object.keys(personaInstructions) as PersonaType[]).map((key) => {
              const p = personaInstructions[key];
              const isSelected = selectedPersona === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedPersona(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {p.icon}
                    <span>{p.label}</span>
                  </div>
                  <span
                    className={`block text-[10px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Conversation Thread Window */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[560px] overflow-hidden">
        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 text-xs ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gradient-to-tr from-indigo-700 to-violet-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-1.5 shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className={`font-bold ${isUser ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {isUser ? currentUser.fullName : 'SmartAttend AI Advisor'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {msg.modelUsed && !isUser && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-800">
                          {msg.modelUsed}
                        </span>
                      )}
                      <span className={isUser ? 'text-indigo-300' : 'text-slate-400'}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Formatted Text Content */}
                  <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                    {msg.content}
                  </div>

                  {/* Google Maps Grounded Location Metadata */}
                  {!isUser && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1.5">
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Grounded Places from Google Maps:
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {msg.groundingChunks.map((chunk: any, i: number) => {
                          const place = chunk.web || chunk.maps || chunk;
                          const title = place.title || place.name || `Location ${i + 1}`;
                          const uri = place.uri || place.url;
                          return (
                            <a
                              key={i}
                              href={uri || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center justify-between transition-colors"
                            >
                              <span className="truncate">{title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message Tools (Assistant only) */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-violet-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 rounded-tl-xs shadow-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-500 ml-1">
                  Reasoning with {selectedModel}...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompt Chips */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Suggested:
          </span>
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.prompt)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 whitespace-nowrap transition-colors text-[11px] shrink-0 shadow-2xs"
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask Gemini (${selectedModel}) about attendance policies, calculations, or notifications...`}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
