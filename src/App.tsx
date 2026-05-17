import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Leaf, 
  Coffee, 
  Sun, 
  Sparkles, 
  Send, 
  User, 
  Bot,
  ChevronRight,
  RefreshCw,
  Wind,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  analysis?: {
    category: string;
    intensity: number;
    summary: string;
    solution?: string;
  };
}

const AFFIRMATIONS = [
  "선생님의 오늘 하루는 누군가의 인생을 바꾸는 씨앗이 되었습니다.",
  "잠시 멈춰서 심호흡을 해보세요. 당신은 충분히 잘하고 있습니다.",
  "완벽할 필요 없습니다. 선생님의 존재만으로도 아이들에게는 큰 힘입니다.",
  "오늘 하루도 애쓰셨습니다. 이제는 오직 선생님만을 위한 시간입니다.",
  "선생님의 따뜻한 눈빛 하나가 아이의 평생을 밝힐 수 있습니다.",
  "자신에게 조금 더 너그러워지셔도 됩니다. 당신도 누군가의 소중한 사람입니다.",
  "가장 좋은 교사는 가장 행복한 교사입니다. 오늘 선생님의 행복을 챙겨주세요."
];

const SELF_CARE_TIPS = [
  { title: "3분 명상", desc: "눈을 감고 호흡에만 집중해보세요.", icon: <Wind className="w-5 h-5 text-emerald-500" /> },
  { title: "따뜻한 차 한 잔", desc: "향기로운 차로 몸과 마음을 데워보세요.", icon: <Coffee className="w-5 h-5 text-amber-500" /> },
  { title: "좋아하는 음악", desc: "잔잔한 선율에 마음을 맡겨보세요.", icon: <Sparkles className="w-5 h-5 text-indigo-500" /> },
];

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  const [view, setView] = useState<'home' | 'chat' | 'analysis'>('home');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate or get persistent anonymous userId
    let id = localStorage.getItem('teacher_garden_uid');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('teacher_garden_uid', id);
    }
    setUserId(id);
    
    setCurrentAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  }, []);

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
    if (view === 'analysis') {
      fetchAnalysis();
    }
  }, [view, messages]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/analysis/${userId}`);
      const data = await response.json();
      setAnalysisData(data);
    } catch (e) {
      console.error("Analysis fetch error:", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId }),
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text,
        sender: 'bot',
        timestamp: new Date(),
        analysis: data.analysis
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "연결이 잠시 끊겼나 봐요. 마음을 가다듬고 다시 시도해 주세요.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAffirmation = () => {
    const others = AFFIRMATIONS.filter(a => a !== currentAffirmation);
    setCurrentAffirmation(others[Math.floor(Math.random() * others.length)]);
  };

  const getChartData = () => {
    if (!analysisData || !analysisData.categoryCounts) return [];
    return Object.entries(analysisData.categoryCounts).map(([name, value]) => ({ name, value }));
  };

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-stone-800 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-5xl mx-auto border-b border-stone-100">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setView('home')}
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Leaf className="w-6 h-6 text-emerald-700" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">교사의 정원</h1>
        </motion.div>
        
        <nav className="flex items-center gap-6">
          <button 
            onClick={() => setView('home')} 
            className={`text-sm font-medium ${view === 'home' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            홈
          </button>
          <button 
            onClick={() => setView('analysis')} 
            className={`flex items-center gap-1.5 text-sm font-medium ${view === 'analysis' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <BarChart3 className="w-4 h-4" /> 마음 리포트
          </button>
          {view === 'home' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('chat')}
              className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-medium"
            >
              상담 시작
            </motion.button>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-20 pt-10">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="space-y-16"
            >
              {/* Hero Section */}
              <section className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                    함께 걷는 마음의 숲
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold leading-[1.1] text-stone-900">
                    선생님의 고민을<br />분석하고 위로합니다.
                  </h2>
                  <p className="text-stone-500 text-lg leading-relaxed max-w-md">
                    정원사의 AI가 선생님의 고민이 어디에서 오는지 분석해 드려요. 이제 마음의 지도를 그려보세요.
                  </p>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setView('chat')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl shadow-emerald-700/20 transition-all flex items-center gap-2"
                    >
                      상담 시작하기 <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setView('analysis')}
                      className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 px-8 py-4 rounded-2xl font-semibold transition-all flex items-center gap-2"
                    >
                      데이터 분석 <BarChart3 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-50 flex items-center justify-center group border border-stone-100">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #333 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute w-[120%] h-[120%] bg-white/30 blur-[100px] rounded-full" />
                  <div className="relative z-10 text-center space-y-6">
                    <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity }}>
                      <Leaf className="w-32 h-32 text-emerald-600/40 mx-auto" />
                    </motion.div>
                    <p className="font-serif italic text-stone-400">"가장 좋은 위로는<br />나 자신을 아는 것입니다."</p>
                  </div>
                </div>
              </section>

              {/* Affirmation Card */}
              <section className="bg-stone-900 rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                <motion.div key={currentAffirmation} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 relative z-10">
                  <Sun className="w-10 h-10 text-amber-300 mx-auto opacity-50" />
                  <blockquote className="text-2xl md:text-3xl font-serif italic font-light leading-snug">
                    "{currentAffirmation}"
                  </blockquote>
                  <button onClick={refreshAffirmation} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors inline-flex items-center gap-2 text-xs">
                    <RefreshCw className="w-4 h-4" /> 다른 글귀 보기
                  </button>
                </motion.div>
              </section>
            </motion.div>
          )}

          {view === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto h-[78vh] flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">정원사와 상담하기</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Insight Mode</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                    </div>
                    <h4 className="text-xl font-bold text-stone-900">당신의 정원을 돌려주세요.</h4>
                    <p className="text-stone-500 max-w-xs mx-auto">
                      학교에서 속상했던 일, 학부모님과의 민원, <br />업무 고충을 편안하게 말씀해 보세요.
                    </p>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-stone-900' : 'bg-emerald-100'}`}>
                        {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-emerald-700" />}
                      </div>
                      <div className="space-y-2">
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user' 
                          ? 'bg-stone-900 text-white rounded-tr-none' 
                          : 'bg-stone-100 text-stone-800 rounded-tl-none border border-stone-200 shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        {msg.analysis && (
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-100">
                              #{msg.analysis.category}
                            </span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-bold border border-amber-100">
                              강도 {msg.analysis.intensity}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 rounded-tl-none">
                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="block w-8 h-2 bg-stone-200 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 bg-stone-50/50 border-t border-stone-100">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center shadow-lg rounded-2xl overflow-hidden"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="무슨 일이 있으셨나요?"
                    className="w-full bg-white px-6 py-4 pr-16 focus:outline-none text-stone-800"
                  />
                  <button
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 p-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-stone-900">선생님의 마음 리포트</h2>
                  <p className="text-stone-500">최근 상담 내용을 바탕으로 한 심리 데이터 분석 결과입니다.</p>
                </div>
                <button onClick={fetchAnalysis} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* distribution chart */}
                <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/50">
                  <div className="flex items-center gap-2 mb-6">
                    <PieChartIcon className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-lg">스트레스 요인 분포</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    {getChartData().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {getChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-stone-300">
                        <AlertCircle className="w-12 h-12 mb-2" />
                        <p>분석할 데이터가 아직 부족합니다.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* stats card */}
                <div className="space-y-6">
                  <div className="bg-emerald-700 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-700/20">
                    <h4 className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">상담 횟수</h4>
                    <p className="text-4xl font-bold">{analysisData?.logs?.length || 0}회</p>
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-xs opacity-70">꾸준한 상담이 마음 치유의 시작입니다.</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-stone-400" />
                      <h4 className="font-bold">주요 타임라인</h4>
                    </div>
                    <div className="space-y-4">
                      {analysisData?.logs?.slice(0, 5).map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 pb-4 border-b border-stone-50 last:border-0 last:pb-0">
                          <div className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${COLORS[i % COLORS.length]}`} />
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-bold text-stone-900">{log.category}</p>
                              <span className="text-[10px] text-stone-400">강도 {log.intensity}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 font-medium">{log.summary}</p>
                            {log.solution && (
                              <div className="mt-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                <p className="text-[10px] text-emerald-800 leading-relaxed italic">
                                  💡 {log.solution}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Intensity Bar Chart */}
              <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-md">
                 <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-lg">최근 스트레스 강도 추이</h3>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysisData?.logs?.slice().reverse() || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis hide />
                        <YAxis domain={[0, 5]} hide />
                        <Tooltip />
                        <Bar dataKey="intensity" fill="#10b981" radius={[4, 4, 0, 0]} name="스트레스 수치" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-center text-stone-400 mt-4">오른쪽으로 갈수록 최근 데이터입니다.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-100 text-center">
        <div className="flex justify-center gap-6 mb-4">
          <Leaf className="w-5 h-5 text-emerald-300" />
          <Heart className="w-5 h-5 text-rose-200" />
          <Wind className="w-5 h-5 text-stone-300" />
        </div>
        <p className="text-stone-400 text-sm font-medium tracking-tight">© 2026 교사의 정원. 모든 데이터는 선생님의 성장을 위해 분석됩니다.</p>
      </footer>
    </div>
  );
}
