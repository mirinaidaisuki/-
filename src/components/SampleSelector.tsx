import { BookOpen, Compass, Type as TypeIcon, Play, MessageSquare } from "lucide-react";
import { SocraticPlan } from "../types";
import { SAMPLE_MATH_PLAN, SAMPLE_PHYSICS_PLAN, SAMPLE_ENGLISH_PLAN } from "../data/samples";

interface SampleSelectorProps {
  onSelect: (plan: SocraticPlan) => void;
  onStartDemo: (subjectKey: "math" | "physics" | "english") => void;
}

export default function SampleSelector({ onSelect, onStartDemo }: SampleSelectorProps) {
  const samples = [
    {
      title: "算数・数学（割合と残金）",
      subjectKey: "math" as const,
      description: "「30%を使って残りはいくら？」小学生がつまずきやすい割合の具体的な考え方を誘導します。",
      icon: BookOpen,
      iconColor: "text-amber-700 bg-amber-50 border-amber-200",
      plan: SAMPLE_MATH_PLAN,
    },
    {
      title: "物理（仕事と運動エネルギー）",
      subjectKey: "physics" as const,
      description: "「仕事とエネルギーの関係」を使って公式暗記に頼らず物理現象の収支を理解させます。",
      icon: Compass,
      iconColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
      plan: SAMPLE_PHYSICS_PLAN,
    },
    {
      title: "英語（目的格の関係代名詞）",
      subjectKey: "english" as const,
      description: "「関係代名詞の挿入による入れ子構造」の感覚をふせんの例えでビジュアルに理解させます。",
      icon: TypeIcon,
      iconColor: "text-teal-700 bg-teal-50 border-teal-200",
      plan: SAMPLE_ENGLISH_PLAN,
    },
  ];

  return (
    <div id="sample-selector" className="space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-xs font-black text-indigo-200 tracking-widest uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-teal-400 rounded-full animate-ping"></span>
          授業指導シナリオを選択（指導デモ体験 or 模擬授業テスト）
        </h3>
        <span className="text-[9px] bg-white/10 text-indigo-200 px-2.5 py-0.5 rounded-full font-bold tracking-wider uppercase border border-white/5">
          Preset Scenarios
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {samples.map((sample, idx) => {
          const Icon = sample.icon;
          return (
            <div
              key={idx}
              className="flex flex-col justify-between p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl hover:border-white/15 hover:bg-slate-900/60 transition-all duration-300 group shadow-xl hover:shadow-2xl hover:-translate-y-1 relative"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-xl border ${sample.iconColor} shrink-0 shadow-inner`}>
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  </div>
                  <span className="font-extrabold text-white group-hover:text-indigo-200 transition-colors text-xs tracking-tight">
                    {sample.title}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-150/90 leading-relaxed min-h-[3rem] text-justify font-medium">
                  {sample.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onSelect(sample.plan)}
                  className="flex items-center justify-center space-x-1.5 px-2 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border border-white/5 hover:border-white/10"
                  title="チャット機能で生徒役への対応を自律的にテストします"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />
                  <span>💬 模擬授業チャット</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStartDemo(sample.subjectKey)}
                  className="flex items-center justify-center space-x-1 px-2 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-md shadow-teal-950/25 active:scale-95"
                  title="生徒との具体的な対話を自動/手動の一歩一歩のストーリーで再生してみます"
                >
                  <Play className="w-3 h-3 text-white fill-white animate-pulse mr-0.5" />
                  <span>🎬 デモ劇を再生</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
