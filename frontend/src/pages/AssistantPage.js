import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosConfig';
import './AssistantPage.css';

function Icon({ name, size = 20 }) {
  const paths = {
    microphone: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" /></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></>,
    muted: <><path d="m3 3 18 18M11 5 6 9H3v6h3l5 4v-5M15 9.5a5 5 0 0 1 1.4 3.5M18 6.5a9 9 0 0 1 2.2 5.5" /></>,
    replay: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    spark: <><path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4L12 3ZM19 17l-.6 2.4L16 20l2.4.6L19 23l.6-2.4L22 20l-2.4-.6L19 17Z" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function renderInlineMarkdown(text, keyPrefix) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={`${keyPrefix}-code-${index}`}>{part.slice(1, -1)}</code>;
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={`${keyPrefix}-strong-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function AssistantMessage({ text }) {
  const lines = text.split('\n');
  return (
    <div className="assistant-rich-text">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div className="rich-spacer" key={`space-${index}`} />;
        const heading = trimmed.match(/^#{1,3}\s+(.+)/);
        const bullet = trimmed.match(/^[-*+]\s+(.+)/);
        const number = trimmed.match(/^(\d+)[.)]\s+(.+)/);
        if (heading) return <h4 key={`heading-${index}`}>{renderInlineMarkdown(heading[1], `heading-${index}`)}</h4>;
        if (bullet) return <div className="rich-list-item" key={`bullet-${index}`}><span>•</span><span>{renderInlineMarkdown(bullet[1], `bullet-${index}`)}</span></div>;
        if (number) return <div className="rich-list-item" key={`number-${index}`}><span className="rich-number">{number[1]}.</span><span>{renderInlineMarkdown(number[2], `number-${index}`)}</span></div>;
        return <p key={`paragraph-${index}`}>{renderInlineMarkdown(trimmed, `paragraph-${index}`)}</p>;
      })}
    </div>
  );
}

export default function AssistantPage() {
  const MAX_STORED_MESSAGES = 40;
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const voiceEnabledRef = useRef(true);
  const [typedText, setTypedText] = useState('');
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState('Ready when you are');
  const [lastAiText, setLastAiText] = useState('');
  const [roleSummary, setRoleSummary] = useState(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const rolePrompts = {
    student: [
      'What should I focus on next?',
      'Show me my current progress and next milestone.',
      'Help me prepare for my next reflection.'
    ],
    mentor: [
      'Which students need attention today?',
      'Summarize pending approvals and blockers.',
      'What feedback should I give next?' 
    ],
    admin: [
      'Give me a platform health summary.',
      'What recent activity needs attention?',
      'Summarize houses and user activity.'
    ]
  };
  const audioChunks = useRef([]);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const assistantStorageKey = useRef(null);
  const messagesAreaRef = useRef(null);
  const shouldScrollToLatestRef = useRef(false);

  const addMessage = (sender, text) => {
    shouldScrollToLatestRef.current = true;
    setMessages(prev => [...prev, { sender, text }].slice(-MAX_STORED_MESSAGES));
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('pt_user') || '{}');
    const role = stored?.role || 'student';
    const userId = stored?._id || stored?.id || stored?.email || 'anonymous';
    assistantStorageKey.current = `pt_assistant_conversation_${userId}`;
    const summaryByRole = {
      student: 'I can help with your learning progress, current phase, and next steps in the curriculum.',
      mentor: 'I can help review student progress, approvals, and learning momentum across your cohort.',
      admin: 'I can help with platform-wide overview, user activity, and system-level insights.'
    };

    setRoleSummary({ role, summary: summaryByRole[role] || summaryByRole.student });
    try {
      const savedMessages = JSON.parse(localStorage.getItem(assistantStorageKey.current) || '[]');
      if (Array.isArray(savedMessages) && savedMessages.length) {
        setMessages(savedMessages.slice(-MAX_STORED_MESSAGES));
        setLastAiText([...savedMessages].reverse().find(message => message.sender === 'ai')?.text || '');
      } else {
        setMessages([{ sender: 'ai', text: `Welcome, ${stored?.name?.split(' ')[0] || role}. ${summaryByRole[role] || summaryByRole.student}` }]);
      }
    } catch {
      setMessages([{ sender: 'ai', text: `Welcome, ${role} assistant. ${summaryByRole[role] || summaryByRole.student}` }]);
    }
  }, []);

  useEffect(() => {
    if (!assistantStorageKey.current || !messages.length) return;
    localStorage.setItem(assistantStorageKey.current, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  }, [messages]);

  useEffect(() => {
    if (!shouldScrollToLatestRef.current || !messagesAreaRef.current) return;
    shouldScrollToLatestRef.current = false;
    requestAnimationFrame(() => {
      messagesAreaRef.current?.scrollTo({
        top: messagesAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [messages]);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const playAudioBlob = (blob) => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audioUrlRef.current = audioUrl;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => { setIsSpeaking(false); toast.error('The audio could not be played'); };
    audio.play().catch(() => setIsSpeaking(false));
  };

  const speakText = async (text, force = false) => {
    if (!voiceEnabledRef.current && !force) return;
    setStage('Preparing voice reply');
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        toast.error('Voice synthesis not supported in this browser');
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        console.error('Speech error:', e);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  const replayLastResponse = async (allowWhenDisabled = false) => {
    if (!lastAiText || isProcessing || (!voiceEnabled && !allowWhenDisabled)) return;
    try { await speakText(lastAiText, allowWhenDisabled); } catch (err) { toast.error('Could not replay the response'); console.error(err); }
  };

  const sendTextToAssistant = async userText => {
    const conversation = messages.slice(-10).map(message => ({
      role: message.sender === 'ai' ? 'assistant' : 'user',
      content: message.text,
    }));
    addMessage('user', userText);
    setStage('Thinking through your request');
    const chatRes = await axiosInstance.post('/api/assistant/chat', {
      text: userText,
      conversation
    });
    const aiText = chatRes.data.response;
    addMessage('ai', aiText);
    setLastAiText(aiText);
    if (voiceEnabledRef.current) await speakText(aiText); else setStage('Reply ready');
  };

  const toggleVoice = () => {
    const nextVoiceEnabled = !voiceEnabledRef.current;
    voiceEnabledRef.current = nextVoiceEnabled;
    setVoiceEnabled(nextVoiceEnabled);
    if (!nextVoiceEnabled) stopSpeaking();
  };

  const submitTypedText = async event => {
    event.preventDefault();
    const text = typedText.trim();
    if (!text || isProcessing) return;
    setIsProcessing(true);
    setTypedText('');
    try {
      await sendTextToAssistant(text);
    } catch (err) {
      setStage('Something went wrong');
      toast.error('Error processing your message', { id: 'voice-toast' });
      console.error(err);
    } finally { setIsProcessing(false); }
  };

  const sendRecordedAudio = async blob => {
    setIsProcessing(true);
    setStage('Transcribing your voice');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'voice.webm');
      const response = await fetch(`${process.env.REACT_APP_ASSISTANT_URL || 'http://localhost:8001'}/api/stt/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.text?.trim()) throw new Error(data.detail || 'No speech was detected');
      await sendTextToAssistant(data.text.trim());
    } catch (err) {
      setStage('Microphone unavailable');
      toast.error(err.message || 'Could not transcribe your recording');
      console.error('Audio transcription error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const startMediaRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error('Voice recording is not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setStage('Listening... Tap the mic to finish');
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      setIsRecording(false);
      if (chunks.length) await sendRecordedAudio(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
    };
    recorder.start();
  };

  const startRecording = async () => {
    stopSpeaking();
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => { setIsRecording(true); setStage('Listening...'); };
        recognition.onresult = async event => {
          const text = event.results[0][0].transcript;
          try { setIsProcessing(true); await sendTextToAssistant(text); }
          catch (err) { toast.error('Error processing your request'); console.error(err); }
          finally { setIsProcessing(false); }
        };
        recognition.onerror = async event => {
          setIsRecording(false);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'network') {
            try { await startMediaRecording(); return; } catch (fallbackError) { console.error(fallbackError); }
          }
          toast.error(event.error === 'not-allowed' ? 'Allow microphone access in your browser' : 'Could not hear your voice');
        };
        recognition.onend = () => { setIsRecording(false); recognitionRef.current = null; };
        recognition.start();
        return;
      }
      await startMediaRecording();
    } catch (err) {
      setIsRecording(false);
      toast.error(err.name === 'NotAllowedError' ? 'Allow microphone access in your browser' : err.message || 'Microphone access is unavailable');
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => () => {
    stopSpeaking();
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  return (
    <div className="assistant-page">
      <Navbar />
      <main className="assistant-shell">
        <header className="assistant-header">
          <div><div className="assistant-kicker"><span className="status-dot" /> VOICE WORKSPACE</div><h1>Talk it through.</h1><p>A focused space for quick questions, ideas, and useful next steps.</p></div>
          <div className="assistant-actions">
            <button className={`control-button ${voiceEnabled ? 'is-active' : ''}`} onClick={toggleVoice} aria-pressed={voiceEnabled} title={voiceEnabled ? 'Turn voice replies off' : 'Turn voice replies on'}><Icon name={voiceEnabled ? 'volume' : 'muted'} size={18} /><span>{voiceEnabled ? 'Voice on' : 'Voice off'}</span></button>
            <button className="icon-button" onClick={() => { setMessages([]); setLastAiText(''); if (assistantStorageKey.current) localStorage.removeItem(assistantStorageKey.current); }} disabled={!messages.length} title="Clear conversation" aria-label="Clear conversation"><Icon name="trash" size={18} /></button>
          </div>
        </header>
        <section className="assistant-grid">
          <div className="conversation-panel">
            <div className="conversation-topline"><span>Conversation</span><span className="conversation-count">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span></div>
            <div className="messages-area" ref={messagesAreaRef}>
              {messages.length === 0 ? <div className="empty-state"><div className="empty-icon"><Icon name="spark" size={25} /></div><h2>What is on your mind?</h2><p>Tap the microphone and speak naturally. Your transcript and my response will appear here.</p><div className="suggestion-row"><span>Ask a question</span><span>Explore an idea</span><span>Plan a task</span></div></div> : messages.map((message, index) => <div className={`message-row ${message.sender}`} key={`${message.sender}-${index}`}><div className="message-avatar">{message.sender === 'ai' ? <Icon name="spark" size={15} /> : 'You'}</div><div className="message-content"><span className="message-label">{message.sender === 'ai' ? 'Assistant' : 'You'}</span><div className="message-bubble">{message.sender === 'ai' ? <AssistantMessage text={message.text} /> : message.text}</div></div></div>)}
              {isProcessing && <div className="thinking-row"><span className="thinking-dots"><i /><i /><i /></span> {stage}</div>}
            </div>
            <div className="unified-composer"><form className="text-composer" onSubmit={submitTypedText}><input value={typedText} onChange={event => setTypedText(event.target.value)} disabled={isProcessing || isRecording} placeholder={isRecording ? 'Listening to your voice...' : 'Ask anything about your learning...'} aria-label="Type a message" /><button className="send-text-button" disabled={!typedText.trim() || isProcessing || isRecording} type="submit" aria-label="Send message">Send</button></form><div className={`record-button-wrap ${isRecording ? 'recording' : ''}`}><button className="record-button" onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing} aria-label={isRecording ? 'Stop recording' : 'Record voice message'}><Icon name={isRecording ? 'stop' : 'microphone'} size={24} /></button></div>{isSpeaking && <button className="stop-speaking" onClick={stopSpeaking}><Icon name="stop" size={15} /> Stop voice</button>}</div>
          </div>
          <aside className="assistant-side-panel">
            <div className="side-card status-card"><div className="side-card-heading"><span className="live-pulse" /> Assistant status</div><strong>{isSpeaking ? 'Speaking your reply' : isRecording ? 'Listening carefully' : isProcessing ? stage : 'Ready to help'}</strong><p>Personal learning workspace</p><p>{roleSummary?.summary || 'Ready to help with your questions and next steps.'}</p></div>
            <div className="side-card"><div className="side-card-heading">Quick prompts</div>
              {(rolePrompts[roleSummary?.role || 'student'] || rolePrompts.student).map(prompt => (
                <button key={prompt} className="side-action" onClick={() => setTypedText(prompt)}><Icon name="spark" size={17} /><span>{prompt}</span></button>
              ))}
            </div>
            <div className="side-card"><div className="side-card-heading">Quick controls</div><button className="side-action" onClick={replayLastResponse} disabled={!lastAiText || isProcessing || !voiceEnabled}><Icon name="replay" size={17} /><span>Replay last response</span><small>↵</small></button><button className="side-action" onClick={() => { setVoiceEnabled(true); replayLastResponse(true); }} disabled={!lastAiText || isProcessing}><Icon name="volume" size={17} /><span>Speak it again</span></button></div>
            <div className="side-note"><Icon name="spark" size={17} /><span>Keep your request conversational. The assistant is tuned for short, clear replies.</span></div>
          </aside>
        </section>
      </main>
    </div>
  );
}
