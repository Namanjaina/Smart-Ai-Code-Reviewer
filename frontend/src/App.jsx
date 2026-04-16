import React, { useState, useEffect } from 'react';

function Header({ user, onLogout, onDashboardClick, theme, setTheme }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between shadow-sm rounded-b-3xl mb-8 transition-colors">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onDashboardClick}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-slate-900 dark:text-white">Smart AI<span className="text-emerald-500">Reviewer</span></h1>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button onClick={onDashboardClick} className={`hover:text-emerald-500 transition`}>Dashboard</button>
        
        <div className="relative">
          <button onClick={() => setShowSettings(!showSettings)} className={`hover:text-emerald-500 transition`}>Settings ▾</button>
          
          {showSettings && (
             <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden py-2 border z-50 transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Theme</div>
                <button onClick={() => { setTheme('light'); setShowSettings(false); }} className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                   ☀️ Light Mode
                </button>
                <button onClick={() => { setTheme('dark'); setShowSettings(false); }} className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                   🌙 Dark Mode
                </button>
             </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-300 dark:border-slate-700">
            <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full border-2 border-emerald-500" />
            <span className="font-bold text-slate-800 dark:text-white">{user.login}</span>
            <button onClick={onLogout} className="text-xs px-3 py-1.5 rounded-full transition bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 py-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 relative z-10">
      <p>© {new Date().getFullYear()} Smart AI Code Reviewer. <strong>Powered by Naman</strong>.</p>
      <div className="flex justify-center gap-4 mt-4">
        <a href="#" className="hover:text-slate-800 transition">Privacy</a>
        <a href="#" className="hover:text-slate-800 transition">Terms</a>
        <a href="#" className="hover:text-slate-800 transition">Documentation</a>
      </div>
    </footer>
  );
}


function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  if (hidden) return null;

  return (
    <>
      <div 
        className="fixed pointer-events-none z-[100] w-24 h-24 -ml-12 -mt-12 rounded-full bg-gradient-to-tr from-cyan-400 via-emerald-400 to-fuchsia-500 opacity-40 blur-xl transition-all duration-75 ease-out dark:mix-blend-screen"
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      />
      <div 
        className="fixed pointer-events-none z-[100] w-6 h-6 -ml-3 -mt-3 rounded-full border border-white shadow-[0_0_15px_rgba(0,255,255,0.8)] backdrop-blur-sm transition-transform duration-75 ease-out"
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      />
    </>
  );
}

function App() {
    const isViteDev = window.location.port === '5173';
  const apiBaseUrl = isViteDev ? "http://localhost:8000" : window.location.origin;
  
  const [form, setForm] = useState({
    code: "",
    githubUrl: "",
    instructions: "",
    activeTab: "code", // "code" or "github"
  });
  
  const [status, setStatus] = useState("Idle"); // "Idle", "Analyzing", "Complete", "Error"
  const [errorMsg, setErrorMsg] = useState("");
  const [review, setReview] = useState(null);
  const [agentProgress, setAgentProgress] = useState(null);

  // Auth State
  const [githubUser, setGithubUser] = useState(null);
  const [githubToken, setGithubToken] = useState(localStorage.getItem("gh_pat") || "");
  const [loginStep, setLoginStep] = useState(0); // 0: Start, 1: Enter Token, 2: Loading
  const [loginError, setLoginError] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
       document.documentElement.classList.add("dark");
       document.body.style.backgroundColor = "#0f172a"; // slate-900
    } else {
       document.documentElement.classList.remove("dark");
       document.body.style.backgroundColor = "#f8fafc"; // slate-50
    }

    if (window.particlesJS && document.getElementById("particles-js")) {
      const darkConfig = {
        particles: {
          number: { value: 60, density: { enable: true, value_area: 800 } },
          color: { value: "#00f5ff" },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: false },
          size: { value: 2, random: true },
          line_linked: { enable: true, distance: 150, color: "#00f5ff", opacity: 0.3, width: 1 },
          move: { enable: true, speed: 1.5, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
        },
        interactivity: {
          detect_on: "canvas",
          events: { onhover: { enable: true, mode: ["grab", "bubble"] }, onclick: { enable: true, mode: "push" }, resize: true },
          modes: { 
            grab: { distance: 140, line_linked: { opacity: 1 } }, 
            bubble: { distance: 200, size: 6, duration: 2, opacity: 1, speed: 3 },
            push: { particles_nb: 4 } 
          }
        },
        retina_detect: true
      };

      const lightConfig = {
        particles: {
          number: { value: 120, density: { enable: true, value_area: 800 } },
          color: { value: ["#ff2a5f", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"] }, // Vibrant colors
          shape: { type: "circle" },
          opacity: { value: 0.7, random: true },
          size: { value: 5, random: true },
          line_linked: { enable: false }, // Floating confetti balls vibe
          move: { enable: true, speed: 2, direction: "top", random: true, straight: false, out_mode: "out", bounce: false }
        },
        interactivity: {
          detect_on: "canvas",
          events: { onhover: { enable: true, mode: ["bubble", "repulse"] }, onclick: { enable: true, mode: "push" }, resize: true },
          modes: { 
            bubble: { distance: 150, size: 12, duration: 2, opacity: 1, speed: 3 }, 
            repulse: { distance: 100, duration: 0.4 },
            push: { particles_nb: 4 }
          }
        },
        retina_detect: true
      };

      window.particlesJS("particles-js", theme === 'dark' ? darkConfig : lightConfig);
    }
  }, [theme, githubUser]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleLogin = async (e) => {
     e.preventDefault();
     setLoginStep(2);
     setLoginError("");
     try {
         const res = await fetch("https://api.github.com/user", {
             headers: { "Authorization": `token ${githubToken}` }
         });
         if (!res.ok) throw new Error("Invalid GitHub Token. Please try again.");
         const data = await res.json();
         localStorage.setItem("gh_pat", githubToken);
         setGithubUser(data);
         setStatus("Idle");
     } catch (err) {
         setLoginError(err.message);
         setLoginStep(1);
     }
  };

  const simulateAgent = async (typeToSend) => {
      setAgentProgress("Initializing multi-agent graph...");
      setStatus("Agenting");
      
      const steps = [
          "Allocating CodeReviewer & Developer Agents...",
          "Cloning target repository asynchronously...",
          "Analyzing AST and detecting critical vulnerabilities...",
          "Branching locally: feature/ai-auto-fix...",
          "Generating robust fixes via LLM...",
          "Committing changes to GitHub...",
          "Opening Pull Request..."
      ];
      
      let currentStep = 0;
      const interval = setInterval(() => {
          if (currentStep < steps.length) setAgentProgress(steps[currentStep++]);
      }, 1500);

      try {
          const response = await fetch(`${apiBaseUrl}/api/v1/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: form.githubUrl,
                provider: "llm",
                type: typeToSend,
                instructions: form.instructions,
                github_token: localStorage.getItem("gh_pat") || githubToken
            }),
          });
          
          const data = await response.json();
          clearInterval(interval);
          if (!response.ok) throw new Error(data.error || "Failed to create PR.");
          
          data._reqType = typeToSend;
          setReview(data);
          setAgentProgress("Success");
      } catch (err) {
          clearInterval(interval);
          setStatus("Error");
          setErrorMsg(err.message);
      }
  };

  const submitReview = async (actionType = "code") => {
    
    if (form.activeTab === "code" && !form.code.trim()) {
      setErrorMsg("Please enter some code to analyze.");
      setStatus("Error");
      return;
    }
    if (form.activeTab === "github" && !form.githubUrl.trim()) {
      setErrorMsg("Please enter a valid GitHub Repository URL.");
      setStatus("Error");
      return;
    }

    let typeToSend = actionType;
    if (form.activeTab === "github") {
       typeToSend = "github";
       if (actionType === "pr") {
           simulateAgent("pr");
           return;
       }
    }

    setStatus("Analyzing");
    setErrorMsg("");
    setReview(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            code: form.activeTab === "code" ? form.code : form.githubUrl,
            provider: "llm",
            type: typeToSend
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze. The server returned an error.");
      }

      data._reqType = typeToSend; // Keep track of what we rendered for the view
      setReview(data);
      setStatus("Complete");
    } catch (err) {
      setStatus("Error");
      setErrorMsg(err.message || "Network error. Make sure the backend is running.");
    }
  };

  if (!githubUser) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
           <CustomCursor />
           <div className="absolute top-0 w-full h-[300px] bg-gradient-to-b from-emerald-100 to-transparent z-0"></div>
           <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-3xl shadow-xl dark:shadow-none p-8 border border-slate-100 dark:border-slate-700 animate-fade-in-up z-10">
              <div className="flex justify-center mb-6">
                 <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
                    <svg className="w-10 h-10 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                 </div>
              </div>
              <h2 className="text-3xl font-display font-black text-center text-slate-900 dark:text-white mb-2">Login with GitHub</h2>
              <p className="text-center text-slate-500 text-sm mb-8">Authenticate with your repository token to automatically create Pull Requests and run Agentic scans.</p>
              
              {loginStep === 0 && (
                <button onClick={() => setLoginStep(1)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20">
                   Continue with GitHub PAT
                </button>
              )}
              {loginStep >= 1 && (
                <form onSubmit={handleLogin} className="space-y-5">
                   {loginError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-semibold">{loginError}</div>}
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Personal Access Token</label>
                     <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} disabled={loginStep === 2} required className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-500/20 transition font-mono text-sm" placeholder="ghp_xxxxxxxxxxxx" />
                     <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">Generate a classic PAT with <span className="font-bold">repo</span> permissions from <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">GitHub Token Settings</a>.</p>
                   </div>
                   <button type="submit" disabled={loginStep === 2} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-75 shadow-lg shadow-emerald-500/30">
                      {loginStep === 2 ? 'Authenticating...' : 'Secure Sign In →'}
                   </button>
                </form>
              )}
           </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-body relative overflow-x-hidden flex flex-col transition-colors">
      <CustomCursor />
      <div id="particles-js" className="fixed inset-0 z-0 pointer-events-none opacity-50"></div>
      {/* Dynamic Background */}
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-slate-200 to-transparent z-[-1] opacity-20"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col">
        <Header 
          user={githubUser} 
          theme={theme}
          setTheme={setTheme}
          onDashboardClick={() => {
            setForm({code: "", githubUrl: "", instructions: "", activeTab: "code"});
            setStatus("Idle");
            setReview(null);
          }}
          onLogout={() => { setGithubUser(null); setGithubToken(""); setLoginStep(0); localStorage.removeItem("gh_pat"); }} 
        />

        <main className="flex-1">
          {/* Main Hero & Input */}
          {(status === 'Idle' || status === 'Error' || status === 'Analyzing' || status === 'Agenting') && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
              <div className="text-center space-y-4 relative z-10">
                <h2 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Supercharge Code with GenAI & DevOps
                </h2>
                <p className="text-lg text-slate-600">
                  Paste your code for instant AI-driven reviews, Unit Test Generation, Auto-Documentation, or connect a GitHub repository for a complete DevOps infrastructure & Agentic scanning.
                </p>
              </div>

              {status === 'Agenting' ? (
                 <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-700 min-h-[300px] flex flex-col font-mono text-emerald-400">
                    <div className="flex space-x-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                       <p className="text-slate-500">$ agentic-pr-bot start</p>
                       <p className="animate-pulse font-bold text-sky-400">{agentProgress}</p>
                       {agentProgress === "Success" && review && review.pr_url && (
                          <div className="mt-8 text-center bg-emerald-900/50 p-6 border border-emerald-500 rounded-lg animate-fade-in-up">
                             <p className="text-emerald-400 text-xl font-bold mb-4">✅ Actual Pull Request Generated!</p>
                             <a href={review.pr_url} target="_blank" rel="noreferrer" className="block text-white text-lg font-mono underline hover:text-sky-300 break-all bg-black/30 p-4 rounded-xl shadow-inner mb-6">
                               {review.pr_url}
                             </a>
                             <button onClick={() => setStatus("Idle")} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 transition">← Back to Dashboard</button>
                          </div>
                       )}
                    </div>
                 </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-2 overflow-hidden">
                  <form onSubmit={(e) => { e.preventDefault(); submitReview("code"); }} className="relative">
                  
                  {/* Tabs */}
                  <div className="flex px-4 py-3 gap-2 border-b border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setForm(c => ({...c, activeTab: 'code'}))}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${form.activeTab === 'code' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                    >
                      Code Operations
                    </button>
                    <button 
                      type="button"
                      onClick={() => setForm(c => ({...c, activeTab: 'github'}))}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${form.activeTab === 'github' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                      DevOps Pipeline & Repos
                    </button>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden relative m-2">
                    <div className="flex space-x-2 mb-4 absolute top-4 left-4">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    
                    {form.activeTab === 'code' ? (
                      <textarea
                        value={form.code}
                        onChange={updateField("code")}
                        placeholder="Paste your source code here..."
                        className="w-full h-80 bg-transparent text-emerald-400 font-mono text-sm leading-relaxed p-4 pt-10 outline-none resize-none"
                        disabled={status === "Analyzing"}
                      />
                    ) : (
                      <div className="w-full h-80 flex flex-col items-center justify-center space-y-6 pt-10 px-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                           <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl mt-4">
                           <input
                             type="url"
                             value={form.githubUrl}
                             onChange={updateField("githubUrl")}
                             placeholder="https://github.com/your-username/repo"
                             className="flex-1 bg-slate-800 text-white border-2 border-slate-700/50 focus:border-emerald-500 rounded-xl py-3 px-4 outline-none font-mono text-sm transition-colors shadow-inner"
                             disabled={status === "Analyzing"}
                           />
                           <input
                             type="text"
                             value={form.instructions}
                             onChange={updateField("instructions")}
                             placeholder="E.g., 'Add a login feature to app.js'"
                             className="flex-1 bg-slate-800/80 text-emerald-400 border border-slate-700 focus:border-sky-500 rounded-xl py-3 px-4 outline-none font-mono text-sm transition-colors shadow-inner"
                             disabled={status === "Analyzing"}
                           />
                        </div>
                        <p className="text-slate-400 text-xs font-mono text-center max-w-md">Our multi-agent system will scan your codebase and create an autonomous Pull Request writing the requested feature.</p>
                      </div>
                    )}
                  </div>

                  {status === "Error" && (
                    <div className="mt-4 p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {errorMsg}
                      </div>
                      <button onClick={() => submitReview(form.activeTab === 'code' ? 'code' : 'github')} type="button" className="font-semibold underline hover:text-rose-800">Retry</button>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3 justify-end px-2 pb-2">
                    
                    {form.activeTab === 'code' ? (
                       <>
                        <button
                          type="button"
                          onClick={() => submitReview("docs")}
                          disabled={status === "Analyzing"}
                          className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm
                            ${status === "Analyzing" ? 'bg-slate-100 text-slate-400' : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'}
                          `}
                        >
                          GenAI: Auto-Docs
                        </button>
                        <button
                          type="button"
                          onClick={() => submitReview("tests")}
                          disabled={status === "Analyzing"}
                          className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm
                            ${status === "Analyzing" ? 'bg-slate-100 text-slate-400' : 'bg-white border border-sky-200 text-sky-700 hover:bg-sky-50'}
                          `}
                        >
                          GenAI: Unit Tests
                        </button>
                        <button
                          type="button"
                          onClick={() => submitReview("code")}
                          disabled={status === "Analyzing"}
                          className={`px-8 py-3 rounded-xl font-semibold text-white shadow-lg overflow-hidden transition-all
                            ${status === "Analyzing" ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-500'}
                          `}
                        >
                          Analyze Bugs
                        </button>
                       </>
                    ) : (
                       <>
                        <button
                          type="button"
                          onClick={() => submitReview("pr")}
                          disabled={status === "Analyzing"}
                          className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2
                            ${status === "Analyzing" ? 'bg-slate-100 text-slate-400' : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'}
                          `}
                        >
                          Auto-Fix PR Bot
                        </button>
                        <button
                          type="button"
                          onClick={() => submitReview("github")}
                          disabled={status === "Analyzing"}
                          className={`px-8 py-3 rounded-xl font-semibold text-white shadow-lg overflow-hidden transition-all
                            ${status === "Analyzing" ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-500'}
                          `}
                        >
                           {status === "Analyzing" ? "Scanning Pipeline..." : "Full DevOps Audit"}
                        </button>
                       </>
                    )}
                  </div>
                </form>
              </div>
              )}
            </div>
          )}

          {/* Regular Code Review View */}
          {status === "Complete" && review && review._reqType === 'code' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold">Analysis Report</h2>
                <button 
                  onClick={() => { setStatus("Idle"); setReview(null); }}
                  className="px-6 py-2 rounded-full border border-slate-300 hover:bg-slate-100 transition font-medium text-slate-700 text-sm"
                >
                  ← Analyze Another
                </button>
              </div>

              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-1">Language Detected</p>
                    <p className="text-2xl font-bold text-slate-900">{review.language_detected || "Unknown"}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-1">Code Rating</p>
                    <div className="flex items-baseline gap-2">
                       <p className="text-4xl font-black text-slate-900">{review.code_rating}</p>
                       <p className="text-lg font-bold text-slate-400">/ 10</p>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl
                    ${review.code_rating >= 8 ? 'bg-emerald-50 text-emerald-500' : review.code_rating >= 5 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}
                  `}>
                    {review.code_rating >= 8 ? 'A' : review.code_rating >= 5 ? 'B' : 'C'}
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Bugs & Suggestions */}
                <div className="space-y-6">
                  {/* Bugs/Errors */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      Bugs and Errors ({review.bugs_errors?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {review.bugs_errors?.length > 0 ? (
                        review.bugs_errors.map((bug, i) => (
                          <div key={i} className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-rose-900">{bug.title}</h4>
                              <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider
                                ${bug.severity?.toLowerCase() === 'high' || bug.severity?.toLowerCase() === 'critical' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}
                              `}>
                                {bug.severity}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{bug.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center gap-3 text-emerald-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <p className="font-medium">No major bugs found! Great job.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optimizations */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"></path></svg>
                      Optimization Suggestions
                    </h3>
                    <ul className="space-y-2">
                      {review.optimization_suggestions?.length > 0 ? (
                        review.optimization_suggestions.map((sug, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">
                            <span className="text-amber-500 font-bold shrink-0">•</span>
                            <span>{sug}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No optimizations required.</p>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Right Column: Corrected Code */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                  <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                      Corrected Code
                    </h3>
                    <button 
                      className="text-xs text-slate-400 hover:text-white transition"
                      onClick={() => navigator.clipboard.writeText(review.corrected_code)}
                    >
                      Copy Code
                    </button>
                  </div>
                  <div className="p-6 bg-slate-950 flex-1 overflow-auto max-h-[600px]">
                    <pre className="font-mono text-sm leading-relaxed text-blue-300 whitespace-pre-wrap word-break">
                      <code>{review.corrected_code || "No code available."}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GenAI Tests View */}
          {status === "Complete" && review && review._reqType === 'tests' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold">Generated Unit Tests</h2>
                <button onClick={() => setStatus("Idle")} className="text-sm font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 px-4 py-2 rounded-full">← Back</button>
              </div>
              
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold mb-4">Framework Suggested: <span className="text-sky-600">{review.test_framework_suggested}</span></h3>
                
                <h4 className="font-semibold text-slate-700 mb-2 mt-4">Edge Cases Covered:</h4>
                <ul className="list-disc pl-5 space-y-1 mb-6 text-slate-600">
                  {review.edge_cases_covered?.map((c, i) => <li key={i}>{c}</li>)}
                </ul>

                <h4 className="font-semibold text-slate-700 mb-2">Test Code:</h4>
                <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto relative">
                   <pre className="text-sky-400 font-mono text-sm leading-relaxed"><code>{review.generated_tests}</code></pre>
                </div>
              </div>
            </div>
          )}

          {/* GenAI Docs View */}
          {status === "Complete" && review && review._reqType === 'docs' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold">Auto-Documentation</h2>
                <button onClick={() => setStatus("Idle")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full">← Back</button>
              </div>
              
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                   <h3 className="text-2xl font-bold">{review.title}</h3>
                   <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase tracking-widest">{review.complexity} Complexity</span>
                </div>
                <p className="text-slate-600 text-lg mb-8">{review.summary}</p>
                
                <h4 className="font-semibold text-slate-700 mb-2">Generated Markdown / JSDoc:</h4>
                <div className="bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl p-6 overflow-x-auto border-dashed">
                   <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{review.documentation}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Github / DevOps Pipeline View */}
          {status === "Complete" && review && review._reqType === 'github' && (
             <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold">DevOps & Infrastructure Analysis</h2>
                <button 
                  onClick={() => { setStatus("Idle"); setReview(null); }}
                  className="px-6 py-2 rounded-full border border-slate-300 hover:bg-slate-100 transition font-medium text-slate-700 text-sm"
                >
                  ← Scan Another Repo
                </button>
              </div>

              {/* Repo Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
                  <p className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-3">Project Rating</p>
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl
                      ${review.project_rating >= 8 ? 'bg-emerald-50 text-emerald-500' : review.project_rating >= 5 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}
                    `}>
                      {review.project_rating}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">{review.project_rating >= 8 ? 'Excellent architecture' : review.project_rating >= 5 ? 'Needs improvement' : 'Critical refactoring required'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
                  <p className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-3">Languages Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {review.languages_used?.length > 0 ? review.languages_used.map(l => (
                       <span key={l} className="px-3 py-1 bg-blue-50 text-blue-600 font-semibold text-xs rounded-lg border border-blue-100 tracking-wide">{l}</span>
                    )) : <span className="text-sm text-slate-500">Unknown</span>}
                  </div>
                </div>
              </div>

              {/* File Explorer Details */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    File Inspection
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                   {review.files?.length > 0 ? review.files.map((file, i) => (
                      <details key={i} className="group" open={file.status === 'error'}>
                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                           <div className="flex items-center gap-3">
                              {file.status === 'error' ? (
                                <svg className="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                              ) : (
                                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                              )}
                              <span className="font-mono text-sm font-semibold text-slate-800">{file.filename}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${file.status === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                               {file.status === 'error' ? 'Issues Found' : 'Correct'}
                             </span>
                             <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                           </div>
                        </summary>
                        
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                           {file.status === 'error' ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Error Detailed</h4>
                                  <div className="bg-white p-4 rounded-xl border border-rose-100 text-sm text-slate-700 shadow-sm">
                                    {file.error_description || "No specific details provided."}
                                  </div>
                                </div>
                                <div className="h-full flex flex-col">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Suggested Correction</h4>
                                  <div className="bg-slate-900 rounded-xl p-4 flex-1 border border-slate-800 overflow-x-auto">
                                    <pre className="font-mono text-xs leading-relaxed text-emerald-400">
                                      <code>{file.corrected_code || "N/A"}</code>
                                    </pre>
                                  </div>
                                </div>
                              </div>
                           ) : (
                              <p className="text-sm text-slate-500 px-2 font-medium">This file follows best practices perfectly. No changes recommended.</p>
                           )}
                        </div>
                      </details>
                   )) : (
                     <div className="p-10 text-center text-slate-500">No significant file details processed.</div>
                   )}
                </div>
              </div>
             </div>
          )}
        </main>

        <Footer />
      </div>
      
      {/* Styles for animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}



export default App;
