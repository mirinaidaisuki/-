import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, Image as ImageIcon, X, Sparkles, Loader2 } from "lucide-react";

interface ProblemUploaderProps {
  onAnalyze: (text: string, imageData: string | null, imageMimeType: string | null) => Promise<void>;
  isLoading: boolean;
}

const LOADING_MESSAGES = [
  "画像をスキャンして文字を解読しています...",
  "問題のコアとなる学習単元を特定しています...",
  "最適なステップバイステップの対話質問を組み立てています...",
  "指導者（親・先生）向けの指導のコツと、たとえ話を考案しています...",
  "準備がまもなく整います。考える楽しさを一緒に体験しましょう！"
];

export default function ProblemUploader({ onAnalyze, isLoading }: ProblemUploaderProps) {
  const [text, setText] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cycling through message indexes during active loading states
  const startLoadingAnimation = () => {
    setLoadingMsgIdx(0);
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    loadingIntervalRef.current = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);
  };

  const stopLoadingAnimation = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("選択されたファイルは画像ではありません。PNGやJPEGなどの画像を指定してください。");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setImageSrc(e.target.result);
        setImageMimeType(file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Input change handler
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageSrc(null);
    setImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageSrc) {
      alert("問題の画像を選択するか、テキストを入力してください。");
      return;
    }

    startLoadingAnimation();
    let base64Data: string | null = null;
    if (imageSrc) {
      // Strips the "data:image/png;base64," prefix for the raw base64 data required by the API
      const commaIdx = imageSrc.indexOf(",");
      if (commaIdx !== -1) {
        base64Data = imageSrc.substring(commaIdx + 1);
      }
    }

    try {
      await onAnalyze(text, base64Data, imageMimeType);
    } finally {
      stopLoadingAnimation();
    }
  };

  return (
    <div id="problem-uploader-container" className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-100/50 p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-250/40">
      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
      
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-650 text-white rounded-xl shadow-md shadow-indigo-100">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">新しい質問を設計する</h2>
          <p className="text-[11px] text-slate-500 font-medium">生徒の持っている宿題の画像や疑問テキストを入力してください</p>
        </div>
      </div>

      {isLoading ? (
        <div id="uploader-loading" className="py-14 flex flex-col items-center justify-center text-center space-y-5 animate-fadeIn">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-16 w-16 rounded-full bg-indigo-100/70 animate-ping opacity-60"></span>
            <div className="bg-indigo-600 text-white p-4.5 rounded-full relative z-10 shadow-lg shadow-indigo-100 animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          </div>
          <div className="space-y-2.5 max-w-sm">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">ソクラテスAI先生が思考中...</h4>
            <p className="text-xs text-indigo-600 animate-pulse transition-all duration-300 font-bold min-h-[2rem] px-4 leading-relaxed">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File Drag and Drop Zone */}
          <div
            id="drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 transition-all text-center flex flex-col items-center justify-center cursor-pointer select-none relative group ${
              isDragging
                ? "border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-50"
                : "border-slate-250 hover:border-indigo-500 hover:bg-slate-50/50"
            }`}
            onClick={imageSrc ? undefined : handleTriggerUpload}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {imageSrc ? (
              <div className="relative w-full max-w-xs mx-auto animate-fadeIn">
                <img
                  src={imageSrc}
                  alt="宿題のプレビュー"
                  className="rounded-xl max-h-48 mx-auto object-contain shadow-lg border border-slate-100"
                />
                <button
                  type="button"
                  id="remove-image-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute -top-2.5 -right-2.5 p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-full shadow-md hover:scale-110 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:border-indigo-200 group-hover:text-indigo-500 transition-all duration-300 shadow-sm">
                  <ImageIcon className="w-5 h-5 transition-transform" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                    問題の写真をドラッグ＆ドロップ または <span className="text-indigo-600 group-hover:underline">ファイルから選択</span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                    スマートフォン撮影の写真、宿題・プリント、スクリーンショット（PNG、JPG、GIF）に完全対応
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Text Input Block */}
          <div className="space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>問題文・追加のヒント情報（任意）</span>
              </label>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold font-mono">
                {text.length} 文字
              </span>
            </div>
            <textarea
              id="uploader-problem-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="画像に写っていない条件や、生徒がどこでつまずいているかなどを補足入力すると、より的確な指導計画と問いかけが生成されます。"
              rows={4}
              className="w-full text-xs border border-slate-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 bg-slate-50/30 font-medium leading-relaxed"
            />
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            id="analyze-submit-btn"
            onClick={handleSubmit}
            disabled={!text.trim() && !imageSrc}
            className={`w-full py-3.5 px-5 rounded-xl font-extrabold flex items-center justify-center space-x-2 shadow-md transition-all border ${
              !text.trim() && !imageSrc
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-650 hover:bg-indigo-600 text-white border-indigo-700 hover:shadow-indigo-500/10 cursor-pointer active:scale-[0.98]"
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>AI分析して「気づき」の指導計画を作る</span>
          </button>
        </div>
      )}
    </div>
  );
}
