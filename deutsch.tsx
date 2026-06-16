import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  Layers,
  ChevronRight,
  User,
  MapPin,
  Compass
} from 'lucide-react';

// --- CONSTANTS & DATA ---
const SUBJECTS = [
  { id: 'du', label: 'du (きみ)', pronoun: 'du', verbEnding: 'st', isFormal: false },
  { id: 'Sie', label: 'Sie (あなた/敬称)', pronoun: 'Sie', verbEnding: 'en', isFormal: true },
  { id: 'ihr', label: 'ihr (きみたち)', pronoun: 'ihr', verbEnding: 't', isFormal: false },
  { id: 'er', label: 'er (彼)', pronoun: 'er', verbEnding: 't', isFormal: false },
  { id: 'sie_sg', label: 'sie (彼女)', pronoun: 'sie', verbEnding: 't', isFormal: false },
  { id: 'Maria', label: 'Maria (マリア)', pronoun: 'Maria', verbEnding: 't', isFormal: false },
  { id: 'wir', label: 'wir (私たち)', pronoun: 'wir', verbEnding: 'en', isFormal: false }
];

const THEMES = [
  { 
    id: 'Herkunft', 
    label: 'Herkunft (出身)', 
    qWord: 'Woher', 
    verb: 'kommen', 
    preposition: 'aus',
    jpLabel: '出身について質問する',
    hint: '「Woher + kommen + 主語?」の形。前置詞は「aus」を使います。'
  },
  { 
    id: 'Wohnort', 
    label: 'Wohnort (居住地)', 
    qWord: 'Wo', 
    verb: 'wohnen', 
    preposition: 'in',
    jpLabel: '住んでいる場所について質問する',
    hint: '「Wo + wohnen + 主語?」の形。前置詞は「in」を使います。'
  },
  { 
    id: 'Name', 
    label: 'Name (名前)', 
    qWord: 'Wie', 
    verb: 'heißen', 
    preposition: '',
    jpLabel: '名前について質問する',
    hint: '「Wie + heißen + 主語?」の形。'
  }
];

const CITIES = [
  { name: 'Bonn', country: 'Deutschland' },
  { name: 'Tokio', country: 'Japan' },
  { name: 'Berlin', country: 'Deutschland' },
  { name: 'Kyoto', country: 'Japan' },
  { name: 'München', country: 'Deutschland' },
  { name: 'Hamburg', country: 'Deutschland' }
];

// Conjugation Helper Function
function conjugate(verb, subjectId) {
  if (verb === 'kommen') {
    if (subjectId === 'du') return 'kommst';
    if (subjectId === 'Sie' || subjectId === 'wir') return 'kommen';
    if (subjectId === 'ihr' || subjectId === 'er' || subjectId === 'sie_sg' || subjectId === 'Maria') return 'kommt';
  }
  if (verb === 'wohnen') {
    if (subjectId === 'du') return 'wohnst';
    if (subjectId === 'Sie' || subjectId === 'wir') return 'wohnen';
    if (subjectId === 'ihr' || subjectId === 'er' || subjectId === 'sie_sg' || subjectId === 'Maria') return 'wohnt';
  }
  if (verb === 'heißen') {
    if (subjectId === 'du') return 'heißt'; // Note: already ends with ß, so only 't' is added, not 'st'
    if (subjectId === 'Sie' || subjectId === 'wir') return 'heißen';
    if (subjectId === 'ihr' || subjectId === 'er' || subjectId === 'sie_sg' || subjectId === 'Maria') return 'heißt';
  }
  return verb;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('practice-q'); // 'practice-q', 'practice-a', 'grammar'
  
  // States for Round 1 & 2 (Question Building)
  const [themeCard, setThemeCard] = useState(THEMES[0]);
  const [subjectCard, setSubjectCard] = useState(SUBJECTS[0]);
  const [userQuestion, setUserQuestion] = useState('');
  const [qFeedback, setQFeedback] = useState(null); // { isCorrect: boolean, correctAnswer: string, explanation: string }
  const [isFlipped, setIsFlipped] = useState(false);
  
  // States for Round 3 (Answering Mode)
  const [q3Theme, setQ3Theme] = useState(THEMES[0]); // Herkunft or Wohnort
  const [q3Subject, setQ3Subject] = useState(SUBJECTS[0]);
  const [q3City, setQ3City] = useState(CITIES[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [aFeedback, setAFeedback] = useState(null); // { isCorrect: boolean, correctAnswer: string }
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // German Text-To-Speech function
  const speakGerman = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Round 1 & 2 Setup ---
  const drawQuestionCards = () => {
    setIsFlipped(false);
    setQFeedback(null);
    setUserQuestion('');
    
    // Pick random theme and subject
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const randomSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    
    setThemeCard(randomTheme);
    setSubjectCard(randomSubject);
  };

  const checkQuestionAnswer = () => {
    const correctVerb = conjugate(themeCard.verb, subjectCard.id);
    const correctSubj = subjectCard.pronoun;
    const correctAnswer = `${themeCard.qWord} ${correctVerb} ${correctSubj}?`;
    
    // Normalize input for lenient checking (ignore trailing/leading spaces, extra question marks, capitalization)
    const normalizedInput = userQuestion.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\?+$/, '');
    const normalizedAnswer = correctAnswer.toLowerCase().replace(/\?+$/, '');

    const isCorrect = normalizedInput === normalizedAnswer;
    
    // Explanation creation
    let verbExplanation = `動詞 ${themeCard.verb} は、主語が ${subjectCard.label} のとき「${correctVerb}」に変化します。`;
    if (themeCard.verb === 'heißen' && subjectCard.id === 'du') {
      verbExplanation += `（※語幹が ß で終わるため、du の時も -t のみをつけます）`;
    }

    setQFeedback({
      isCorrect,
      correctAnswer,
      explanation: verbExplanation
    });
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  // --- Round 3 Setup ---
  const drawAnswerQuestion = () => {
    setAFeedback(null);
    setUserAnswer('');
    
    // Pick Wohnort or Herkunft randomly (since Name isn't typically tied to Bonn/Tokio in the same way, though we focus on Bonn-style sheet)
    const availableThemes = THEMES.filter(t => t.id !== 'Name');
    const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
    const randomSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
    
    setQ3Theme(randomTheme);
    setQ3Subject(randomSubject);
    setQ3City(randomCity);
  };

  // Formulate the teacher's question text
  const getTeacherQuestionText = () => {
    const correctVerb = conjugate(q3Theme.verb, q3Subject.id);
    return `${q3Theme.qWord} ${correctVerb} ${q3Subject.pronoun}?`;
  };

  const getCorrectAnswers = () => {
    const isWohnort = q3Theme.id === 'Wohnort';
    const prep = isWohnort ? 'in' : 'aus';
    const city = q3City.name;
    const vName = isWohnort ? 'wohnen' : 'kommen';

    let options = [];

    // Map subject of the question to subject of the answer
    // e.g. "Wo wohnst du?" -> "Ich wohne in Bonn."
    // e.g. "Wo wohnt Maria?" -> "Sie wohnt in Bonn." / "Maria wohnt in Bonn."
    // e.g. "Wo wohnt ihr?" -> "Wir wohnen in Bonn."
    // e.g. "Wo wohnen Sie?" -> "Ich wohne in Bonn." (or "Wir wohnen..." if formal plural, but typically "Ich")
    if (q3Subject.id === 'du') {
      const v = conjugate(vName, 'ich'); // wohne / komme
      options.push(`Ich ${v} ${prep} ${city}.`);
    } else if (q3Subject.id === 'Sie') {
      const vSingular = conjugate(vName, 'ich');
      const vPlural = conjugate(vName, 'wir');
      options.push(`Ich ${vSingular} ${prep} ${city}.`);
      options.push(`Wir ${vPlural} ${prep} ${city}.`);
    } else if (q3Subject.id === 'ihr') {
      const v = conjugate(vName, 'wir'); // wohnen / kommen
      options.push(`Wir ${v} ${prep} ${city}.`);
    } else if (q3Subject.id === 'er') {
      const v = conjugate(vName, 'er'); // wohnt / kommt
      options.push(`Er ${v} ${prep} ${city}.`);
    } else if (q3Subject.id === 'sie_sg') {
      const v = conjugate(vName, 'sie_sg'); // wohnt / kommt
      options.push(`Sie ${v} ${prep} ${city}.`);
    } else if (q3Subject.id === 'Maria') {
      const v = conjugate(vName, 'Maria'); // wohnt / kommt
      options.push(`Maria ${v} ${prep} ${city}.`);
      options.push(`Sie ${v} ${prep} ${city}.`);
    } else if (q3Subject.id === 'wir') {
      const v = conjugate(vName, 'ihr'); // wohnt / kommt (Where do we live? -> You live...)
      const vWir = conjugate(vName, 'wir'); // Or answering together: We live...
      options.push(`Ihr ${v} ${prep} ${city}.`);
      options.push(`Wir ${vWir} ${prep} ${city}.`);
    }

    return options;
  };

  const checkAnswerMode = () => {
    const correctOptions = getCorrectAnswers();
    const cleanInput = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.+$/, '');
    
    const isCorrect = correctOptions.some(opt => {
      const cleanOpt = opt.toLowerCase().replace(/\.+$/, '');
      return cleanInput === cleanOpt;
    });

    setAFeedback({
      isCorrect,
      correctAnswers: correctOptions,
      explanation: `質問の主語「${q3Subject.pronoun}」に対する適切な応答主語を選び、動詞「${q3Theme.verb}」を正しく変化させて、前置詞「${q3Theme.preposition}」を付けます。`
    });

    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  // Initialize first cards
  useEffect(() => {
    drawQuestionCards();
    drawAnswerQuestion();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* --- HEADER --- */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-md sticky top-0 z-10 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-yellow-500 via-red-500 to-black rounded-xl shadow-lg border border-slate-600">
              <span className="text-xl font-black text-white tracking-widest">DE</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                ドイツ語初級 口頭試験シミュレーター
              </h1>
              <p className="text-xs text-slate-400 font-medium">1学期期末・2026年対応版対策サイト</p>
            </div>
          </div>

          {/* Quick Score Counter */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700/60 backdrop-blur-sm shadow-inner text-sm">
            <Award className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-slate-400">正解率:</span>
            <span className="font-bold text-indigo-400 text-base">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </span>
            <span className="text-slate-500">({score.correct}/{score.total})</span>
            <button 
              onClick={() => setScore({ correct: 0, total: 0 })}
              title="スコアをリセット"
              className="ml-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN TABS NAVIGATION --- */}
      <nav className="bg-slate-800/50 border-b border-slate-700/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('practice-q')}
            className={`flex-1 py-3.5 px-3 flex items-center justify-center gap-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'practice-q'
                ? 'border-indigo-500 text-indigo-400 bg-slate-700/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>【1・2回目】 質問作成</span>
          </button>
          <button
            onClick={() => setActiveTab('practice-a')}
            className={`flex-1 py-3.5 px-3 flex items-center justify-center gap-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'practice-a'
                ? 'border-indigo-500 text-indigo-400 bg-slate-700/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/10'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>【3回目】 質問に応答</span>
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex-1 py-3.5 px-3 flex items-center justify-center gap-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'grammar'
                ? 'border-indigo-500 text-indigo-400 bg-slate-700/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>文法チートシート</span>
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">

        {/* =========================================
            TAB 1: QUESTION BUILDING (1回目・2回目の練習)
            ========================================= */}
        {activeTab === 'practice-q' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                  A
                </span>
                W-Frage（補足疑問文）を作る練習
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                1枚目（テーマ）と2枚目（人称・名前）のカードに合わせて、
                正しいドイツ語の疑問文を入力しましょう。<strong>語頭は大文字、最後は「?」</strong>で終わる形にします。
              </p>
            </div>

            {/* Simulated Card Draw Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Card 1: Theme & Question Type */}
              <div className="bg-slate-800 rounded-2xl p-6 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[220px] shadow-lg transition-all hover:border-slate-500">
                <div className="absolute top-3 left-3 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-500/30">
                  1枚目のカード
                </div>
                <div className="mt-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  W-Frage (補足疑問)
                </div>
                
                {/* Visual Card Representation */}
                <div className="mt-4 p-5 bg-slate-900 border border-slate-700 rounded-xl w-44 shadow-md flex flex-col items-center justify-center aspect-[1/1]">
                  {themeCard.id === 'Herkunft' && <Compass className="w-8 h-8 text-yellow-500 mb-2" />}
                  {themeCard.id === 'Wohnort' && <MapPin className="w-8 h-8 text-emerald-500 mb-2" />}
                  {themeCard.id === 'Name' && <User className="w-8 h-8 text-cyan-500 mb-2" />}
                  
                  <span className="text-lg font-black text-rose-500 tracking-tight">W-Frage</span>
                  <span className="text-sm font-semibold text-slate-300 mt-1">{themeCard.id}</span>
                </div>
                
                <p className="mt-4 text-xs text-slate-400">{themeCard.jpLabel}</p>
              </div>

              {/* Card 2: Subject/Pronoun */}
              <div className="bg-slate-800 rounded-2xl p-6 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[220px] shadow-lg transition-all hover:border-slate-500">
                <div className="absolute top-3 left-3 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-500/30">
                  2枚目のカード
                </div>
                <div className="mt-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  主語人称 / 名前
                </div>
                
                {/* Visual Card Representation */}
                <div className="mt-4 p-5 bg-slate-900 border border-slate-700 rounded-xl w-44 shadow-md flex flex-col items-center justify-center aspect-[1/1]">
                  <span className="text-3xl font-extrabold text-rose-500">{subjectCard.pronoun}</span>
                  <span className="text-xs font-medium text-slate-400 mt-2">({subjectCard.label.split(' ')[1] || ''})</span>
                </div>
                
                <p className="mt-4 text-xs text-slate-400">主語となる人物：{subjectCard.label}</p>
              </div>

            </div>

            {/* Action Bar */}
            <div className="flex justify-center">
              <button
                onClick={drawQuestionCards}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>カードを配り直す</span>
              </button>
            </div>

            {/* Input & Assessment Area */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl space-y-4">
              <label className="block text-sm font-semibold text-slate-300">
                上の2枚から作られる疑問文を入力してください：
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="例: Woher kommst du?"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userQuestion.trim() && !qFeedback) {
                      checkQuestionAnswer();
                    }
                  }}
                  disabled={!!qFeedback}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-75"
                />
                
                {!qFeedback ? (
                  <button
                    onClick={checkQuestionAnswer}
                    disabled={!userQuestion.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md"
                  >
                    判定する
                  </button>
                ) : (
                  <button
                    onClick={drawQuestionCards}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                  >
                    次の問題へ
                  </button>
                )}
              </div>

              {/* Quick helper suggestion buttons */}
              {!qFeedback && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs text-slate-500 flex items-center">疑問詞ヒント:</span>
                  <button 
                    onClick={() => setUserQuestion(themeCard.qWord + " ")}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                  >
                    {themeCard.qWord}
                  </button>
                  <span className="text-xs text-slate-500 flex items-center">| 動詞原形:</span>
                  <span className="px-2.5 py-1 text-xs font-bold bg-slate-900 border border-slate-700 text-slate-400 rounded">
                    {themeCard.verb}
                  </span>
                </div>
              )}

              {/* Feedback Display */}
              {qFeedback && (
                <div className={`mt-6 p-5 rounded-xl border ${
                  qFeedback.isCorrect 
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                    : 'bg-rose-950/40 border-rose-800 text-rose-200'
                } transition-all`}>
                  
                  <div className="flex items-start gap-3">
                    {qFeedback.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    
                    <div className="space-y-2 w-full">
                      <h4 className="font-bold text-lg">
                        {qFeedback.isCorrect ? '正解です！ Sehr gut!' : 'ちょっと惜しいです！'}
                      </h4>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-xs text-slate-500 block">正解：</span>
                          <span className="font-mono text-xl font-bold tracking-wide text-indigo-300">
                            {qFeedback.correctAnswer}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => speakGerman(qFeedback.correctAnswer)}
                          className="sm:ml-auto p-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/35 rounded-lg border border-indigo-500/30 flex items-center gap-1 text-xs font-semibold transition-all"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>音声を再生</span>
                        </button>
                      </div>

                      <p className="text-sm text-slate-300 pt-1 leading-relaxed">
                        <span className="font-bold">解説: </span>
                        {qFeedback.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: ANSWERING MODE (3回目の練習)
            ========================================= */}
        {activeTab === 'practice-a' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                  B
                </span>
                【3回目】 質問に正しく答える練習
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                先生がカードをもとにドイツ語で質問します。
                主語の人称変化、さらに <strong>wohnen + in</strong> / <strong>kommen + aus</strong> の組み合わせと前置詞を忘れないように答えましょう！
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Question card drawn by the teacher */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg min-h-[220px]">
                <div className="absolute top-3 left-3 bg-rose-500/20 text-rose-300 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-500/30">
                  先生が引いたカード
                </div>
                
                <div className="mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  お題となる都市 / 地域
                </div>
                
                {/* Visual Card representation */}
                <div className="mt-4 p-5 bg-slate-900 border border-slate-700 rounded-xl w-40 aspect-video flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-slate-200 tracking-tight">{q3City.name}</span>
                  <span className="text-xs text-slate-500 font-semibold">{q3City.country}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1 text-[11px] justify-center">
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 rounded-full border border-indigo-900/50">
                    質問対象: {q3Subject.label}
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-950 text-yellow-400 rounded-full border border-yellow-900/50">
                    テーマ: {q3Theme.id}
                  </span>
                </div>
              </div>

              {/* Simulated Teacher Dialogue Box */}
              <div className="md:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col justify-between h-full min-h-[220px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    <span className="text-xs font-bold tracking-wider text-rose-400 uppercase">Lehrer (先生からの質問):</span>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-mono font-bold tracking-wide text-slate-100">
                        {getTeacherQuestionText()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        訳：{q3Subject.pronoun === 'du' ? 'きみは' : q3Subject.pronoun === 'Sie' ? 'あなたは' : q3Subject.label}
                        {q3Theme.id === 'Herkunft' ? 'どこの出身ですか？' : 'どこに住んでいますか？'}
                      </p>
                    </div>

                    <button 
                      onClick={() => speakGerman(getTeacherQuestionText())}
                      className="p-3 bg-rose-600/20 text-rose-300 hover:bg-rose-600/35 border border-rose-500/30 rounded-xl transition-all"
                      title="質問のドイツ語音声を聴く"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>ヒント：主語に対応する人称代名詞で答えましょう。前置詞（in または aus）を正しく変化させてください。</span>
                </div>
              </div>

            </div>

            {/* Answer Input Area */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl space-y-4">
              <label className="block text-sm font-semibold text-slate-300">
                あなたの解答（フルセンテンスで答えましょう。最後は「.」を付けます）：
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="例: Ich wohne in Bonn."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userAnswer.trim() && !aFeedback) {
                      checkAnswerMode();
                    }
                  }}
                  disabled={!!aFeedback}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all disabled:opacity-75"
                />

                {!aFeedback ? (
                  <button
                    onClick={checkAnswerMode}
                    disabled={!userAnswer.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md"
                  >
                    解答する
                  </button>
                ) : (
                  <button
                    onClick={drawAnswerQuestion}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                  >
                    次の質問へ
                  </button>
                )}
              </div>

              {/* Word suggestions to help beginners build answer */}
              {!aFeedback && (
                <div className="flex flex-wrap gap-2 pt-1 items-center">
                  <span className="text-xs text-slate-500">お助けワード:</span>
                  
                  {/* Subject hint */}
                  <button 
                    onClick={() => setUserAnswer((prev) => prev + (q3Subject.id === 'du' || q3Subject.id === 'Sie' ? 'Ich ' : q3Subject.id === 'ihr' ? 'Wir ' : q3Subject.pronoun + ' '))}
                    className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                  >
                    {q3Subject.id === 'du' || q3Subject.id === 'Sie' ? 'Ich' : q3Subject.id === 'ihr' ? 'Wir' : q3Subject.pronoun}
                  </button>

                  {/* Verb hint */}
                  <button 
                    onClick={() => {
                      const ansSubject = q3Subject.id === 'du' || q3Subject.id === 'Sie' ? 'ich' : q3Subject.id === 'ihr' ? 'wir' : q3Subject.id;
                      setUserAnswer((prev) => prev + conjugate(q3Theme.verb, ansSubject) + ' ');
                    }}
                    className="px-2.5 py-1 text-xs bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded"
                  >
                    動詞 (人称変化)
                  </button>

                  {/* Preposition hint */}
                  <button 
                    onClick={() => setUserAnswer((prev) => prev + q3Theme.preposition + ' ')}
                    className="px-2.5 py-1 text-xs bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded font-mono"
                  >
                    {q3Theme.preposition}
                  </button>

                  {/* City hint */}
                  <button 
                    onClick={() => setUserAnswer((prev) => prev + q3City.name + '.')}
                    className="px-2.5 py-1 text-xs bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded"
                  >
                    {q3City.name}.
                  </button>
                </div>
              )}

              {/* Assessment Feedback */}
              {aFeedback && (
                <div className={`mt-6 p-5 rounded-xl border ${
                  aFeedback.isCorrect 
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                    : 'bg-rose-950/40 border-rose-800 text-rose-200'
                } transition-all`}>
                  
                  <div className="flex items-start gap-3">
                    {aFeedback.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-2 w-full">
                      <h4 className="font-bold text-lg">
                        {aFeedback.isCorrect ? '素晴らしい！ Richtig!' : 'おっと！もう一度確認しましょう'}
                      </h4>

                      <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/80 space-y-2">
                        <div>
                          <span className="text-xs text-slate-500 block">模範解答（いずれかもOK）：</span>
                          <div className="flex flex-col gap-1 mt-1">
                            {aFeedback.correctAnswers.map((ans, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span className="font-mono text-lg font-bold tracking-wide text-indigo-300">{ans}</span>
                                <button 
                                  onClick={() => speakGerman(ans)}
                                  className="p-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 rounded text-[10px] text-indigo-400 flex items-center gap-0.5 ml-2 transition-all"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>再生</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 pt-1 leading-relaxed">
                        <span className="font-bold">文法のアドバイス:</span> {aFeedback.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* =========================================
            TAB 3: GRAMMAR GUIDE (文法チートシート)
            ========================================= */}
        {activeTab === 'grammar' && (
          <div className="space-y-6">
            
            {/* Essential Rule Intro */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-950 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce" />
                <span>口頭試験の最重要ルール</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h3 className="font-bold text-indigo-400 mb-2">① 動詞の人称変化を絶対間違えない！</h3>
                  <p className="leading-relaxed text-xs">
                    ドイツ語は主語によって動詞の末尾（語尾）が変化します。<br />
                    例：<strong>ich</strong> wohn<span className="text-red-400 font-bold">-e</span>, <strong>du</strong> wohn<span className="text-red-400 font-bold">-st</span>, <strong>er/sie</strong> wohn<span className="text-red-400 font-bold">-t</span>
                  </p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h3 className="font-bold text-amber-400 mb-2">② 前置詞の組み合わせを暗記する！</h3>
                  <p className="leading-relaxed text-xs">
                    どこに住んでいるか (Wohnort) は <strong>wohnen + in</strong><br />
                    どこ出身か (Herkunft) は <strong>kommen + aus</strong><br />
                    「in」「aus」を絶対に忘れないこと！
                  </p>
                </div>
              </div>
            </div>

            {/* Verb Conjugation Tables */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700">
                <span>動詞の人称変化表</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">主語 (人称)</th>
                      <th className="py-3 px-4 font-semibold">wohnen (住む)</th>
                      <th className="py-3 px-4 font-semibold">kommen (来る/出身)</th>
                      <th className="py-3 px-4 font-semibold">heißen (〜という名である)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50 text-sm">
                    <tr className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-300">ich <span className="text-xs font-normal text-slate-500">(私)</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">wohn<span className="text-rose-400 underline">e</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">komm<span className="text-rose-400 underline">e</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">heiß<span className="text-rose-400 underline">e</span></td>
                    </tr>
                    <tr className="hover:bg-slate-700/20 transition-colors bg-slate-900/10">
                      <td className="py-3.5 px-4 font-bold text-slate-300">du <span className="text-xs font-normal text-slate-500">(きみ)</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">wohn<span className="text-rose-400 underline">st</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">komm<span className="text-rose-400 underline">st</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">heiß<span className="text-rose-400 underline">t</span> <span className="text-[10px] text-yellow-500 font-sans block">(※ßのため t のみ)</span></td>
                    </tr>
                    <tr className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-300">er / sie / Maria <span className="text-xs font-normal text-slate-500">(彼/彼女/3人称)</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">wohn<span className="text-rose-400 underline">t</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">komm<span className="text-rose-400 underline">t</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">heiß<span className="text-rose-400 underline">t</span></td>
                    </tr>
                    <tr className="hover:bg-slate-700/20 transition-colors bg-slate-900/10">
                      <td className="py-3.5 px-4 font-bold text-slate-300">wir <span className="text-xs font-normal text-slate-500">(私たち)</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">wohn<span className="text-rose-400 underline">en</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">komm<span className="text-rose-400 underline">en</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">heiß<span className="text-rose-400 underline">en</span></td>
                    </tr>
                    <tr className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-300">ihr <span className="text-xs font-normal text-slate-500">(きみたち)</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">wohn<span className="text-rose-400 underline">t</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">komm<span className="text-rose-400 underline">t</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">heiß<span className="text-rose-400 underline">t</span></td>
                    </tr>
                    <tr className="hover:bg-slate-700/20 transition-colors bg-slate-900/10">
                      <td className="py-3.5 px-4 font-bold text-slate-300">Sie / sie (Pl.) <span className="text-xs font-normal text-slate-500">(あなた/彼ら)</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">wohn<span className="text-rose-400 underline">en</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">komm<span className="text-rose-400 underline">en</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">heiß<span className="text-rose-400 underline">en</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Examples from Sheet */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700">
                <span>プリント掲載の対話パターン例</span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                    <span>a) 3人称（Maria）の例</span>
                  </div>
                  <p className="font-mono text-slate-300"><strong className="text-indigo-400">Q:</strong> Wo wohnt Maria?</p>
                  <p className="font-mono text-slate-300"><strong className="text-rose-400">A:</strong> Sie/Maria <span className="text-rose-400 font-semibold">wohnt in</span> Bonn.</p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                    <span>b) 2人称単数（du）の例</span>
                  </div>
                  <p className="font-mono text-slate-300"><strong className="text-indigo-400">Q:</strong> Wo wohnst du?</p>
                  <p className="font-mono text-slate-300"><strong className="text-rose-400">A:</strong> Ich <span className="text-rose-400 font-semibold">wohne in</span> Bonn.</p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                    <span>c) 2人称複数（ihr）の例</span>
                  </div>
                  <p className="font-mono text-slate-300"><strong className="text-indigo-400">Q:</strong> Woher kommt ihr?</p>
                  <p className="font-mono text-slate-300"><strong className="text-rose-400">A:</strong> Wir <span className="text-rose-400 font-semibold">kommen aus</span> Bonn.</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p>2026 ドイツ語初級 1学期 口頭試験（試験範囲：Name, Herkunft, Wohnort）対策</p>
          <p className="text-[10px] text-slate-600">※お使いのブラウザが対応している場合、「音声を再生」から高品質なドイツ語（DE）音声を確認できます。</p>
        </div>
      </footer>

    </div>
  );
}
