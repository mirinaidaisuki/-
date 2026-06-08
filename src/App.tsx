/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import {
  Sparkles,
  BookOpen,
  Compass,
  Lightbulb,
  MessageSquare,
  ChevronRight,
  Send,
  HelpCircle,
  Eye,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  RotateCcw,
  BookOpenCheck,
  User,
  Award,
  Clipboard,
  Printer,
  Smartphone,
  Play,
  Pause,
  SkipForward,
  Tv,
  XCircle,
  BookOpen as BookOpenIcon,
  HelpCircle as QuestionIcon
} from "lucide-react";
import { SocraticPlan, SocraticStep, ChatMessage } from "./types";
import ProblemUploader from "./components/ProblemUploader";
import SampleSelector from "./components/SampleSelector";
import StumblingRadarCard from "./components/StumblingRadarCard";
import MathRenderer from "./components/MathRenderer";
import { DEMO_SCENARIOS } from "./data/demoScenarios";
import { SAMPLE_MATH_PLAN, SAMPLE_PHYSICS_PLAN, SAMPLE_ENGLISH_PLAN } from "./data/samples";

export default function App() {
  const [currentPlan, setCurrentPlan] = useState<SocraticPlan | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [revealExplanation, setRevealExplanation] = useState<boolean>(false);
  const [stepHelpMessage, setStepHelpMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Get the mobile-accessible URL for QR code (converting dev URL to public preview URL)
  const getMobileAccessUrl = (): string => {
    if (typeof window === "undefined") {
      return "https://ais-pre-x3fqt2jmms5a5d45ttxbjd-137910744687.asia-east1.run.app";
    }
    let url = window.location.href;
    if (url.includes("localhost") || url.includes("127.0.0.1") || url.includes("://localhost")) {
      return "https://ais-pre-x3fqt2jmms5a5d45ttxbjd-137910744687.asia-east1.run.app";
    }
    // Replace dev environment URL prefix (ais-dev-) with public preview prefix (ais-pre-)
    if (url.includes("ais-dev-")) {
      url = url.replace("ais-dev-", "ais-pre-");
    }
    return url;
  };

  // Auto-scroll chat to the bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Set up notifications
  const triggerNotification = (type: "success" | "error" | "info", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Demo Mode States
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoSubjectKey, setDemoSubjectKey] = useState<"math" | "physics" | "english" | null>(null);
  const [demoCurrentLineIdx, setDemoCurrentLineIdx] = useState<number>(0);
  const [isDemoAutoplay, setIsDemoAutoplay] = useState<boolean>(false);

  // Execute Next Demo Step
  const handleNextDemoStep = () => {
    if (!isDemoActive || !demoSubjectKey) return;
    const scenario = DEMO_SCENARIOS[demoSubjectKey];
    if (demoCurrentLineIdx >= scenario.lines.length) {
      triggerNotification("success", "実演デモがすべて完了しました！お疲れ様でした。");
      setIsDemoAutoplay(false);
      return;
    }

    const currentLine = scenario.lines[demoCurrentLineIdx];
    
    const newMessage: ChatMessage = {
      id: `demo-line-${demoCurrentLineIdx}-${Date.now()}`,
      role: currentLine.role,
      text: currentLine.role === "user" 
        ? `【生徒: ${scenario.studentName}】\n${currentLine.text}`
        : `【ソクラテスAI先生】\n${currentLine.text}\n\n💡 ［指導意図・狙い］\n${currentLine.explanation}`,
      timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
    };

    setActiveStepIdx(currentLine.activeStep);
    
    setChatMessages((prev) => [...prev, newMessage]);
    setDemoCurrentLineIdx((prev) => prev + 1);

    setIsChatLoading(true);
    setTimeout(() => {
      setIsChatLoading(false);
    }, 450);
  };

  // Autoplay handler
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isDemoActive && isDemoAutoplay && demoSubjectKey) {
      const scenario = DEMO_SCENARIOS[demoSubjectKey];
      if (demoCurrentLineIdx < scenario.lines.length) {
        timer = setTimeout(() => {
          handleNextDemoStep();
        }, 3400); // 3.4 seconds to read comfortably
      } else {
        setIsDemoAutoplay(false);
        triggerNotification("success", "デモ対話劇が最後まで完了しました！");
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isDemoActive, isDemoAutoplay, demoSubjectKey, demoCurrentLineIdx]);

  // Start Socratic simulation demo
  const handleStartDemo = (subjectKey: "math" | "physics" | "english") => {
    const scenario = DEMO_SCENARIOS[subjectKey];
    let templatePlan = SAMPLE_MATH_PLAN;
    if (subjectKey === "physics") templatePlan = SAMPLE_PHYSICS_PLAN;
    if (subjectKey === "english") templatePlan = SAMPLE_ENGLISH_PLAN;

    setCurrentPlan(templatePlan);
    setActiveStepIdx(0);
    setRevealExplanation(false);
    setStepHelpMessage(null);

    setIsDemoActive(true);
    setDemoSubjectKey(subjectKey);
    setDemoCurrentLineIdx(1); // Set next line to 1
    setIsDemoAutoplay(false);

    const firstLine = scenario.lines[0];
    const initialGreetingMessage: ChatMessage = {
      id: "demo-greeting-intro",
      role: "model",
      text: `🎬 【実演デモ：${scenario.title} 開始】 🎬\n\n対象単元: **${templatePlan.subject} - ${templatePlan.difficultyLevel}**\n生徒役: **${scenario.studentName}**\n\n${scenario.description}\n\n-----------------------------\n\n【初回の生徒からの相談つまずき】👇`,
      timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
    };

    const firstStudentMessage: ChatMessage = {
      id: "demo-student-msg-0",
      role: "user",
      text: `【生徒: ${scenario.studentName}】\n${firstLine.text}`,
      timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages([initialGreetingMessage, firstStudentMessage]);
    triggerNotification("info", `「${scenario.title}」のデモが起動しました。`);
  };

  const handleStopDemo = () => {
    setIsDemoActive(false);
    setDemoSubjectKey(null);
    setDemoCurrentLineIdx(0);
    setIsDemoAutoplay(false);
    if (currentPlan) {
      handlePlanLoaded(currentPlan);
    } else {
      triggerNotification("info", "実演デモを終了しました。");
    }
  };

  // Process the analyzed plan and initialize dialogue state
  const handlePlanLoaded = (plan: SocraticPlan) => {
    setCurrentPlan(plan);
    setActiveStepIdx(0);
    setRevealExplanation(false);
    setStepHelpMessage(null);

    // Initial greeting from Socrates AI based on Step 1
    const firstStep = plan.socraticSteps[0];
    const initialMessage: ChatMessage = {
      id: "initial-msg",
      role: "model",
      text: `【授業指導シミュレーター起動】\n\n先生、ステップ 1 **「${firstStep.title}」** の問いかけからシミュレーションを行います。🎓\n\n📖 指導の流れ：\n${firstStep.guidanceText}\n\n❓ 【生徒への問いかけ例】\n「${firstStep.probingQuestion}」\n\n💡 生徒役として「わからない」「30%は0.3？」などと発言を入力し、AIがどう導くか対話をテストしてみましょう。`,
      timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages([initialMessage]);
    triggerNotification("success", "新しい授業指導案・問いかけプランを組み立てました！");
  };

  // API Call: Analyze text and/or images
  const handleAnalyzeQuestion = async (
    text: string,
    imageData: string | null,
    imageMimeType: string | null
  ) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          image: imageData,
          mimeType: imageMimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "問題の分析に失敗しました。");
      }

      const plan: SocraticPlan = await response.json();
      handlePlanLoaded(plan);
    } catch (err: any) {
      console.error(err);
      triggerNotification("error", err.message || "通信エラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // API Call: Interactive Chat
  const handleSendChatMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!userChatInput.trim() || !currentPlan) return;

    const userMsgText = userChatInput.trim();
    setUserChatInput("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const currentStep = currentPlan.socraticSteps[activeStepIdx];
      
      // Map frontend history format to the server-side expected array
      const apiHistory = chatMessages.map((msg) => ({
        role: msg.role,
        text: msg.text,
      }));

      const response = await fetch("/api/chat-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemContext: currentPlan,
          currentStep,
          history: apiHistory,
          userMessage: userMsgText,
        }),
      });

      if (!response.ok) {
        throw new Error("対話応答の取得に失敗しました。");
      }

      const data = await response.json();

      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error(err);
      triggerNotification("error", "お返事の送信中にエラーが発生しました。");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Change active step of the problem
  const handleSelectStep = (index: number) => {
    if (!currentPlan) return;
    setActiveStepIdx(index);
    setStepHelpMessage(null);

    const step = currentPlan.socraticSteps[index];
    const systemPromptMessage: ChatMessage = {
      id: `step-switch-${index}-${Date.now()}`,
      role: "model",
      text: `【ステップ ${index + 1} のシミュレーションに切り替えました】\n\nテーマ：**「${step.title}」**\n\n📖 指導の流れ：\n${step.guidanceText}\n\n❓ 【生徒への問いかけ例】\n「${step.probingQuestion}」`,
      timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, systemPromptMessage]);
    triggerNotification("info", `ステップ ${index + 1} の思考ステップに変更しました。`);
  };

  // Reset current workspace to analyze a new objective
  const handleResetWorkspace = () => {
    setCurrentPlan(null);
    setChatMessages([]);
    setRevealExplanation(false);
    setStepHelpMessage(null);
  };

  // Generate plain-text Markdown formatted Lesson plan
  const generateMarkdownReport = (): string => {
    if (!currentPlan) return "";
    let report = `## 【ソクラテス式指導計画案】\n`;
    report += `### 💡 対象問題の概要\n${currentPlan.problemSummary}\n\n`;
    report += `- **教科/科目:** ${currentPlan.subject}\n`;
    report += `- **学習段階レベル:** ${currentPlan.difficultyLevel}\n\n`;
    report += `---\n\n`;
    
    report += `### 🎯 指導カルテ（先生向け）\n`;
    report += `- **気づきの重要ポイント (Breakthrough Point):**\n  ${currentPlan.coachingTips.keyInventionPoint}\n\n`;
    report += `- **効果的な日常生活のたとえ話 (Analogy):**\n  ${currentPlan.coachingTips.recommendedAnalogy}\n\n`;
    report += `- **つまずきやすい「落とし穴」:**\n`;
    currentPlan.coachingTips.commonMistakes.forEach((m) => {
      report += `  - ${m}\n`;
    });
    report += `\n- **問いかけ＆共感のガイドライン:**\n  ${currentPlan.coachingTips.howToGuide}\n\n`;
    report += `---\n\n`;

    report += `### 🗺️ スモールステップ指導ルート\n`;
    currentPlan.socraticSteps.forEach((step, idx) => {
      report += `#### 【ステップ ${step.stepNumber}】 ${step.title}\n`;
      report += `- **指導アプローチ説明:** ${step.guidanceText}\n`;
      report += `- **想定する具体的問いかけ:** 「${step.probingQuestion}」\n`;
      report += `- **つまずき時の補助ヒント:** 「${step.hintText}」\n\n`;
    });
    report += `---\n\n`;

    report += `### ✏️ 模範解答＆解説（最終確認用）\n`;
    report += `- **主要概念・公式:** ${currentPlan.fullExplanation.coreFormulaOrConcept}\n`;
    report += `- **ステップ別導出:**\n`;
    currentPlan.fullExplanation.stepByStepResolution.forEach((sol, idx) => {
      report += `  ${idx + 1}. ${sol}\n`;
    });
    report += `\n- **最終的な解答:** ${currentPlan.fullExplanation.finalAnswer}\n`;

    return report;
  };

  const handleCopyToClipboard = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    triggerNotification("success", "指導案（Markdown形式）をクリップボードにコピーしました！");
  };

  return (
    <div className="min-h-screen bg-slate-55 flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-y-0 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notification.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-indigo-50 border-indigo-200 text-indigo-800"
          }`}
        >
          {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
          {notification.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
          {notification.type === "info" && <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />}
          <span className="font-medium">{notification.text}</span>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && currentPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  授業指導用プリント・Markdown export
                </h3>
                <p className="text-xs text-slate-500 mt-1">このまま印刷や、授業支援ソフト（LoiLoNote, Teams等）や指導用ノートへコピーしてご活用ください。</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-2 rounded-full hover:bg-gray-150 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Clipboard className="w-4 h-4" />
                  テキストをコピー
                </button>
              </div>
              
              <pre className="bg-slate-900 text-slate-100 p-6 rounded-2xl text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto max-h-[50vh] border border-slate-800 shadow-inner select-all">
                {generateMarkdownReport()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Smartphone Integration Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">スマホ・タブレット連携ガイド</h3>
              </div>
              <button
                onClick={() => setShowMobileModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1.5 rounded-full hover:bg-gray-150 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6 text-center">
              {/* QR Code Container */}
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center mx-auto border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    getMobileAccessUrl()
                  )}`}
                  alt="スマホ用QRコード"
                  className="w-44 h-44 mx-auto"
                />
                <span className="text-[10px] text-indigo-600 font-mono block mt-2 break-all max-w-[240px]">
                  {getMobileAccessUrl()}
                </span>
                <div className="mt-3 p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-left">
                  <p className="text-[10.5px] text-indigo-800 leading-normal">
                    💡 <b>アクセス権エラー対策：</b><br />
                    開発編集画面のアドレス（ais-dev-）はGoogleアカウント保護がかかっているため、スマホでスキャンするとエラーになります。このQRコードは、保護のかからない一般公開用の<b>プレビュー用アドレス（ais-pre-）</b>に自動的に変換して生成しています。これにより、お手持ちのスマホやiPadなど、ログインなしでどのデバイスからでも直接アクセスいただけます！
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="text-left space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">QRコードをスマホでスキャン</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      お手持ちのスマートフォンやiPadのカメラアプリを起動し、このQRコードをスキャンするだけで即座に開きます。ログイン等は一切不要です。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">プリント・教科書をパシャッと撮影</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      スマホから使うと「カメラ」と直接連携します！「ファイルをアップロード」をタップしてカメラを選択するだけで、目の前にある問題集をそのままスキャンできます。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">ホーム画面に追加してアプリ化（推奨）</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      <b>Safari (iOS)</b>: 画面下の「共有ボタン (□に↑)」 ＞ 「ホーム画面に追加」<br />
                      <b>Chrome (Android)</b>: 右上の「︋︋「︙」 ＞ 「ホーム画面に追加」<br />
                      これで次回から普通のアプリのように1タップでフルスクリーン起動できます！
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowMobileModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Navigation Header - Branded for Teachers */}
      <header id="app-header" className="h-16 px-6 lg:px-12 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-200">
            T
          </div>
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-none flex items-center">
              「生徒に気づかせる」ソクラテス式質問解答サポート
              <span className="ml-2 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-[10px] text-indigo-700 font-bold rounded">教員専用</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-medium">主体的なアハ体験を引き出す指導用準備システム</span>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 animate-fadeIn">
          {/* Smartphone guide button: Always visible for cross-device convenience! */}
          <button
            onClick={() => setShowMobileModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm hover:border-indigo-200"
          >
            <Smartphone className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden md:inline">スマホ・タブレット連携</span>
            <span className="md:hidden">スマホ</span>
          </button>

          {currentPlan && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">指導メモ書き出し</span>
                <span className="sm:hidden">書き出し</span>
              </button>
              <button
                id="reset-workspace-btn"
                onClick={handleResetWorkspace}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">リセット</span>
                <span className="sm:hidden">新規</span>
              </button>
            </div>
          )}
          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm">
            TCR
          </div>
        </div>
      </header>

      {/* Main Container - Adjusted to be a beautiful Socratic Platform Dashboard */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Welcome Section & Banner (If no plan active) */}
        {!currentPlan && (
          <div id="welcome-hero" className="bg-gradient-to-br from-indigo-950 via-slate-950 to-zinc-950 rounded-3xl p-6 lg:p-12 text-white shadow-2xl space-y-8 relative overflow-hidden border border-white/10">
            {/* Ambient Background Graphic elements */}
            <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/4 -top-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute right-1/3 bottom-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            
            <div className="max-w-4xl space-y-4 relative z-10 animate-fadeIn">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-extrabold text-indigo-200 tracking-wider uppercase backdrop-blur-md border border-white/10">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                <span>授業・指導設計サポートツール（教員向）</span>
              </div>
              <h2 className="text-3xl lg:text-4.5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-indigo-100 to-teal-100 bg-clip-text text-transparent">
                「生徒に気づかせる」<br className="sm:hidden" />ソクラテス式質問解答サポート
              </h2>
              <p className="text-xs lg:text-sm text-indigo-150 leading-relaxed max-w-3xl">
                学校や塾などの教材・ワークシートやテスト問題、手書き数学、計算などの【問題画像】をスキャンするか【問題文】を入力してください。<br />
                直接答えを「教え込む」のではなく、**生徒が自分で正解の閃きに到達するための発問ステップ、効果的な比喩、予想されるつまずき対策**を含む指導設計書を作成します。
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 relative z-10">
              <SampleSelector onSelect={handlePlanLoaded} onStartDemo={handleStartDemo} />
            </div>
          </div>
        )}

        {/* Dynamic Bento Grid Layout container */}
        <div id="bento-grid-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT BENTO GRIDS (Column Span 5 on large screens) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Grid Item 1: Problem Input Area (uploader hidden if plan running, or displayed optionally) */}
            {!currentPlan ? (
              <div id="grid-item-input" className="transition-all duration-300">
                <ProblemUploader onAnalyze={handleAnalyzeQuestion} isLoading={isAnalyzing} />
              </div>
            ) : (
              /* Grid Item 1b: Active Problem context Details */
              <div id="grid-item-active-context" className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl shadow-slate-100/50 space-y-4 transition-all duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wide">
                      {currentPlan.subject}
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-850 text-[10px] font-bold rounded-lg border border-amber-200 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{currentPlan.difficultyLevel}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">AI設計図 生成完了</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <BookOpenCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>分析対象の問題要約</span>
                    </h3>
                    <span className="text-[9px] text-indigo-600 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-lg font-bold">
                      数式＆文字式自動表示対応
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs font-medium leading-relaxed max-h-60 overflow-y-auto">
                    <MathRenderer text={currentPlan.problemSummary} className="text-slate-700 font-medium" />
                  </div>
                </div>

                {/* Socratic Step Timeline Navigation inside Left Rail */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-650" />
                      <span>授業展開：発問（問いかけ）ルート</span>
                    </h3>
                    <span className="text-xs font-bold text-indigo-650 leading-none bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-150">
                      第 {activeStepIdx + 1} 移動 / {currentPlan.socraticSteps.length}
                    </span>
                  </div>
                  
                  <div id="step-timeline-list" className="space-y-2">
                    {currentPlan.socraticSteps.map((step, idx) => {
                      const isActive = idx === activeStepIdx;
                      const isCompleted = idx < activeStepIdx;

                      return (
                        <button
                          key={idx}
                          id={`step-nav-btn-${idx}`}
                          onClick={() => handleSelectStep(idx)}
                          className={`w-full flex items-start text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? "border-indigo-400 bg-indigo-50/70 shadow-sm"
                              : "border-slate-100 hover:bg-slate-50 bg-white"
                          }`}
                        >
                          <div className="mr-3 flex-shrink-0 mt-0.5">
                            {isCompleted ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                ✓
                              </div>
                            ) : isActive ? (
                              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                                {idx + 1}
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {idx + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-black leading-snug ${isActive ? "text-indigo-900" : "text-slate-800"}`}>
                              S{step.stepNumber}: {step.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-1 font-medium">
                              {step.probingQuestion}
                            </p>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 self-center ml-2 flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-300"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Grid Item 2: Socratic Philosophy Insight / Parents Guide (Always accessible/nice summary) */}
            <div id="grid-item-about-faq" className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-slate-100">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="w-1.5 h-3.5 bg-gradient-to-b from-teal-400 to-emerald-400 rounded-full"></span>
                「教えないアプローチ」指導のコツ
              </h2>
              <div className="text-[11px] text-slate-300 space-y-3 leading-relaxed">
                <p>
                  このソクラテス指導プランは、問答法に基づき、<b>生徒から概念を発見（生み出させる）する「助産術」</b>を体現したものです。
                </p>
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-3.5 text-teal-300 font-bold leading-normal">
                  生徒の間違った発言を否定せず、「その発想はどうやって導き出されたの？」と聞き返し、生徒自身に「アハ体験」を重ねさせます。
                </div>
                <ul className="space-y-2 list-none m-0 p-0 text-slate-400">
                  <li className="flex items-start gap-1.5">
                    <span className="text-teal-400 font-bold mt-0.5">•</span>
                    <span>生徒から「答えを教えて！」と言われたら、「一緒に解いた方が絶対にアハ体験できるから！」と共感し、もっと噛み砕いた発問を投げてください。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-teal-400 font-bold mt-0.5">•</span>
                    <span>部分的にできた計算や考え方に気づいた瞬間を「大正解！完璧！」と絶賛するのが、モチベーションを最大化させる秘訣です。</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* RIGHT BENTO GRIDS (Column Span 7 on large screens) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* If no plan is active, show instructions geared to pedagogic study */}
            {!currentPlan ? (
              <div id="grid-item-placeholder" className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 border border-slate-200 rounded-3xl p-10 shadow-xl text-center space-y-6 py-20 flex flex-col items-center justify-center relative overflow-hidden animate-fadeIn">
                <div className="absolute -right-16 -top-16 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -left-16 -bottom-16 w-40 h-40 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-100 text-white rounded-2xl flex items-center justify-center transform hover:scale-115 transition-transform duration-300">
                  <Compass className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-3.5 max-w-lg">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">授業計画書・指導案を自動で組み立てます</h3>
                  <p className="text-xs sm:text-slate-600 text-slate-500 leading-relaxed font-medium">
                    上のサンプルから指導シナリオを選ぶか、お子様・生徒様のテスト問題などの写真をスキャンしてください。
                    「つまずきの予測」「直感的な例え話」「ソクラテス式の誘導発問」をAIにより多角的に生成し、右側に即座に授業想定の<b>対話シミュレーター</b>を用意します。
                  </p>
                </div>
              </div>
            ) : (
              /* ACTIVE SESSION WORKSPACE FOR TEACHERS */
              <>
                {/* 1. Coaching Hub Card (Focus on Teaching strategy) */}
                <div id="coaching-tips-panel" className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-5 relative overflow-hidden animate-fadeIn">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-xs shadow-inner">👨‍🏫</div>
                      <h2 className="text-xs sm:text-sm font-black tracking-wide text-slate-150 uppercase tracking-wider">
                        教員授業指導用カルテ＆アプローチ
                      </h2>
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase">TEACHER SHEET</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* keyInventionPoint */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 hover:border-white/15 transition-all">
                      <h4 className="text-[10px] font-black text-indigo-300 tracking-wider uppercase flex items-center space-x-1.5 border-b border-white/5 pb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                        <span>理解へのブレイクスルー(勘所)</span>
                      </h4>
                      <MathRenderer text={currentPlan.coachingTips.keyInventionPoint} className="text-[11px] text-slate-200" />
                    </div>

                    {/* recommendedAnalogy */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 hover:border-white/15 transition-all">
                      <h4 className="text-[10px] font-black text-teal-350 tracking-wider uppercase flex items-center space-x-1.5 border-b border-white/5 pb-1.5">
                        <BookOpenIcon className="w-3.5 h-3.5 text-teal-350" />
                        <span>直感理解に繋ぐ「現実のたとえ」</span>
                      </h4>
                      <MathRenderer text={currentPlan.coachingTips.recommendedAnalogy} className="text-[11px] text-slate-200 italic" />
                    </div>

                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span>生徒が陥りやすい「誤答のパターン・つまずき」</span>
                      </h4>
                      <ul className="text-xs space-y-2 text-slate-400 list-none pl-0 leading-relaxed m-0">
                        {currentPlan.coachingTips.commonMistakes.map((mistake, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-400 font-bold mt-0.5">•</span>
                            <MathRenderer text={mistake} className="text-slate-300 inline" />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <h4 className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1.5 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>授業中の対話テクニック・共感ワード</span>
                      </h4>
                      <MathRenderer text={currentPlan.coachingTips.howToGuide} className="text-slate-300 leading-relaxed font-medium" />
                    </div>
                  </div>
                </div>

                {/* Stumbling analysis & learning generalization radar chart */}
                <StumblingRadarCard plan={currentPlan} />

                {/* 2. Socratic Interactive Chat Terminal (Rebranded as a Teacher-Simulator Practice Sandbox) */}
                <div id="socratic-chat-terminal" className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl shadow-slate-100/50 flex flex-col space-y-4 animate-fadeIn">
                  
                  {/* Chat Header inside bento */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                      </span>
                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">授業前問答テスト環境</h3>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                          模擬生徒との対話シミュレーター
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        id="view-hint-btn"
                        onClick={() => setStepHelpMessage(
                          stepHelpMessage ? null : currentPlan.socraticSteps[activeStepIdx].hintText
                        )}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-800 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>AI先生の解説補助ヒント</span>
                      </button>
                    </div>
                  </div>

                  {/* Explain what this simulator does */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed flex items-start space-x-2">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="font-bold text-slate-800">授業前シミュレーションのやり方：</p>
                      <p className="mt-0.5 text-slate-500">
                        下のチャットで、学生になりきって回答(誤答も歓迎)を入力してください。
                        生徒の間違った発言度合いに応じて、<b>AIが「正解を教えずに、次のステップへ導くソクラテス式問い・誘導」</b>を自然にシミュレートして提示します。
                      </p>
                    </div>
                  </div>

                  {/* Active Step prompt callout (Always visible so student knows their immediate anchor goal) */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center space-x-1.5 text-indigo-900 font-extrabold">
                      <span className="bg-indigo-600 text-white w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-black mr-0.5 animate-pulse">
                        {activeStepIdx + 1}
                      </span>
                      <span>フォーカス中ステップ: {currentPlan.socraticSteps[activeStepIdx].title}</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <p className="font-semibold text-indigo-950 text-[10px] uppercase tracking-wider mb-1">【教官より生徒への問いかけ例文】</p>
                      <MathRenderer text={currentPlan.socraticSteps[activeStepIdx].probingQuestion} className="italic text-indigo-900 font-medium" />
                    </div>
                  </div>

                  {/* Gentle help bubble wrapper if hint is clicked */}
                  {stepHelpMessage && (
                    <div id="hint-alert-box" className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3.5 text-xs text-amber-900 space-y-1 animate-fadeIn">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>もし生徒が詰まったときのために準備された補助ヒント:</span>
                      </div>
                      <div className="pl-5">
                        <MathRenderer text={stepHelpMessage} className="text-amber-950 font-medium leading-relaxed" />
                      </div>
                    </div>
                  )}

                  {/* Scrollable messages log */}
                  <div className="h-[250px] overflow-y-auto border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                    {chatMessages.map((msg) => {
                      const isUser = msg.role === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex items-start space-x-2.5 max-w-[85%] ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
                            
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black ${
                              isUser 
                                ? "bg-slate-200 border-slate-300 text-slate-800 border shadow-sm animate-fadeIn" 
                                : "bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-100 animate-fadeIn"
                            }`}>
                              {isUser ? "👤" : "🎓"}
                            </div>

                            {/* Message Bubble */}
                            <div className="space-y-1 animate-fadeIn">
                              <span className="text-[9px] text-slate-400 block px-1 font-bold">
                                {isUser ? "模擬生徒の返答 (テスト検証)" : "AI先生 の推奨する発問・誘導"}
                              </span>
                              <div
                                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-md ${
                                  isUser
                                    ? "bg-slate-850 text-slate-100 rounded-tr-none font-medium border border-slate-700"
                                    : "bg-indigo-50/40 border border-indigo-100 text-slate-900 rounded-tl-none font-medium"
                                }`}
                              >
                                <MathRenderer 
                                  text={msg.text} 
                                  className={isUser ? "text-slate-100" : "text-slate-900 font-medium"} 
                                />
                                {!isUser && (
                                  <div className="flex items-center space-x-1 mt-2.5 text-[9px] text-teal-600/90 font-black bg-teal-500/5 px-2 py-0.5 rounded-md inline-flex border border-teal-500/10">
                                    <Sparkles className="w-2.5 h-2.5 text-teal-500 animate-pulse" />
                                    <span>数式・文字式・√のTeXレンダリング出力適用済み</span>
                                  </div>
                                )}
                              </div>
                              <p className={`text-[9px] text-slate-400 ${isUser ? "text-right" : "text-left"}`}>
                                {msg.timestamp}
                              </p>
                            </div>

                          </div>
                        </div>
                      );
                    })}

                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                            <span className="text-[10px] font-black text-indigo-700">案</span>
                          </div>
                          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Submission and prompt response buttons */}
                  {isDemoActive && demoSubjectKey ? (
                    <div id="demo-controls-panel" className="bg-slate-900 text-white rounded-2xl p-4 md:p-5 border border-slate-700 space-y-4 shadow-xl animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg animate-pulse">
                            <Tv className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">実演ガイド対話デモ再生中</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              生徒役（{DEMO_SCENARIOS[demoSubjectKey].studentName}）とAI先生の模範問答劇
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-start sm:self-center">
                          <span className="text-[10px] bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full font-mono text-emerald-400">
                            セリフ: {demoCurrentLineIdx} / {DEMO_SCENARIOS[demoSubjectKey].lines.length}
                          </span>
                          <button
                            type="button"
                            onClick={handleStopDemo}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-900/40 hover:border-red-700 text-red-200 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm ml-2"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>デモを終了</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>デモ進行状況</span>
                          <span>{Math.round((demoCurrentLineIdx / DEMO_SCENARIOS[demoSubjectKey].lines.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-805 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${(demoCurrentLineIdx / DEMO_SCENARIOS[demoSubjectKey].lines.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Playback Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsDemoAutoplay(!isDemoAutoplay)}
                          className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm ${
                            isDemoAutoplay
                              ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01]"
                          }`}
                        >
                          {isDemoAutoplay ? (
                            <>
                              <Pause className="w-4 h-4 fill-white shrink-0" />
                              <span>オート再生を一時停止</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-white shrink-0" />
                              <span>自動で再生（オートプレイ）</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleNextDemoStep}
                          disabled={demoCurrentLineIdx >= DEMO_SCENARIOS[demoSubjectKey].lines.length}
                          className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border ${
                            demoCurrentLineIdx >= DEMO_SCENARIOS[demoSubjectKey].lines.length
                              ? "bg-slate-800 border-slate-750 text-slate-550 cursor-not-allowed"
                              : "bg-slate-80 border-slate-700 text-slate-200 hover:bg-slate-750 hover:scale-[1.01]"
                          }`}
                        >
                          <SkipForward className="w-4 h-4 shrink-0" />
                          <span>次のセリフを進める (▶︎)</span>
                        </button>
                      </div>

                      {/* Commentary text display of current step */}
                      {demoCurrentLineIdx > 0 && (
                        <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl text-[11px] text-slate-300 leading-relaxed border-l-4 border-l-emerald-500">
                          <span className="font-bold text-emerald-400 block mb-1">💡 ソクラテス指導の狙い・教育的解説:</span>
                          <p className="font-medium text-slate-200">
                            {DEMO_SCENARIOS[demoSubjectKey].lines[Math.max(0, demoCurrentLineIdx - 1)]?.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <form onSubmit={handleSendChatMessage} className="flex gap-2">
                        <input
                          type="text"
                          id="chat-input-field"
                          value={userChatInput}
                          onChange={(e) => setUserChatInput(e.target.value)}
                          placeholder="生徒になりきって発言（例：「よくわかりません」「答えは400円ですか？」等）"
                          disabled={isChatLoading}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-xs outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                        />
                        <button
                          type="submit"
                          id="chat-send-btn"
                          disabled={isChatLoading || !userChatInput.trim()}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all ${
                            isChatLoading || !userChatInput.trim()
                              ? "bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200"
                              : "bg-indigo-650 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 cursor-pointer text-white"
                          }`}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                      {/* Math equations notation check badge */}
                      <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400 px-1 font-medium">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          <span>文字式（x, y）, 分数（½）, 冪乗（x²）および平方根（√）の自動数式変換に対応しています</span>
                        </span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-black font-mono">
                          TeX Decoded
                        </span>
                      </div>

                      {/* Interactive response chips helper for simulated responses */}
                      <div className="flex flex-wrap gap-1.5 items-center mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">生徒の反応をシミュレート：</span>
                        <button
                          type="button"
                          onClick={() => setUserChatInput("「全くわかりません、ヒントをください」")}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-full text-[10px] font-medium transition-all cursor-pointer"
                        >
                          😭 完全につまずいた
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserChatInput("およその考え方はわかるけど、計算式や単語の並べ忘れがありそう。")}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-850 rounded-full text-[10px] font-medium transition-all cursor-pointer"
                        >
                          ⚠️ 部分的な誤り
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserChatInput("「わかった！計算できそう、公式に当てはめて解いていい？」")}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-850 rounded-full text-[10px] font-medium transition-all cursor-pointer"
                        >
                          💡 アハ体験（気づいた）
                        </button>
                        <button
                          type="button"
                          disabled={activeStepIdx === currentPlan.socraticSteps.length - 1}
                          onClick={() => {
                            if (activeStepIdx < currentPlan.socraticSteps.length - 1) {
                              handleSelectStep(activeStepIdx + 1);
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200 rounded-full text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          <span>次のステップへ進む</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* 3. Collapse Section for Ultimate Solution Reveal (Discouraged by default, Socrates mode) */}
                <div id="solution-reveal-block" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-4 bg-indigo-650 rounded-full"></div>
                      <h3 className="text-sm font-bold text-slate-800">
                        完全模範解説＆ステップ導出（授業解答チェック用）
                      </h3>
                    </div>
                    
                    <button
                      type="button"
                      id="toggle-reveal-answer-btn"
                      onClick={() => setRevealExplanation(!revealExplanation)}
                      className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 bg-slate-55 hover:bg-slate-100 rounded-full text-[11px] font-extrabold text-indigo-650 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{revealExplanation ? "解説を閉じる" : "詳細な解答手順を表示"}</span>
                    </button>
                  </div>

                  {revealExplanation ? (
                    <div id="revealed-explanation-content" className="border-t border-slate-100 pt-4 space-y-4 animate-fadeIn">
                      
                      {/* Formula or Core Concept banner */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-950 space-y-1">
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-800 block">使われている重要な概念・公式の講義定義</span>
                        <p className="font-semibold">{currentPlan.fullExplanation.coreFormulaOrConcept}</p>
                      </div>

                      {/* Step by step derivation */}
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">ステップごとの途中計算・論理展開</span>
                        <div className="space-y-2 text-xs">
                          {currentPlan.fullExplanation.stepByStepResolution.map((stepRes, idx) => (
                            <div key={idx} className="flex space-x-3 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                              <span className="text-indigo-600 font-extrabold flex-shrink-0 mt-0.5">授業解説 {idx + 1}.</span>
                              <p className="leading-relaxed font-semibold text-slate-705">{stepRes}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Output final box */}
                      <div className="bg-slate-900 p-4 rounded-xl text-white flex items-center justify-between shadow-inner">
                        <div>
                          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">生徒に最終的に教えて良い 模範答え</p>
                          <p className="text-sm font-extrabold font-serif mt-1">{currentPlan.fullExplanation.finalAnswer}</p>
                        </div>
                        <span className="text-xl">🏆</span>
                      </div>

                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-450 italic">
                      ※ 先生が授業前の予習、または生徒が解ききった後の正誤確認・テストの解答作成時にご活用ください。
                    </p>
                  )}
                </div>
              </>
            )}

          </div>

        </div>

        {/* Guideline Philosophy Area */}
        <section id="about-philosophy" className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-10 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">このアプリにおける「ソクラテス流対話指導法」とは</h2>
              <p className="text-xs text-slate-500 font-medium">主体的な発見を引き出す効果的な支援アプローチ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-2xl text-amber-500">🧱</span>
              <h3 className="text-sm font-bold text-slate-800">1. スモールステップへの分解</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                複雑な問題を1つにまとめず、概念の土台、演算、結論の3段フェーズに分割します。1つの小目標に答えやすくなることで、小さな前進を実感させ学習意欲を高めます。
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-2xl text-emerald-500">🎭</span>
              <h3 className="text-sm font-bold text-slate-800">2. 例え話(アナロジー)による具体化</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                数学記号や公式がただの数字の羅列に見えてしまう生徒には、水槽の水、アメの取り出し、キャラクターのHPなど身近な事象に置き換え、状況が頭の中に映画のように描けるよう支援します。
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-2xl text-indigo-500">⚖️</span>
              <h3 className="text-sm font-bold text-slate-800">3. 絶対に答えを言わない伴走</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                たとえ生徒が「答えを教えて！」と求めても、ヒューマスティック（人間的）なAIは答えを代行しません。間違えた数字を提示しても「その発想おもしろいね！どこからその数字が出た？」と振り返りを促します。
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Global Footer Credits Container */}
      <footer id="app-footer" className="h-14 px-6 lg:px-12 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-200 mt-12 gap-2 py-4">
        <div className="flex gap-4">
          <span>指導案・分析コア: <b>Gemini Core AI socrates-v3</b></span>
          <span>対話シミュレーター: <b>Socrates 3.5 Learning Model</b></span>
        </div>
        <div>© 2026 Socratic式 AI先生教育工学開発. (All persistences locally stored)</div>
      </footer>

    </div>
  );
}
