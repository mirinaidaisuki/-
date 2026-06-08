import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
} from "recharts";
import { AlertCircle, ArrowRight, Award, Compass, Zap, HelpCircle } from "lucide-react";
import { SocraticPlan } from "../types";

interface StumblingRadarCardProps {
  plan: SocraticPlan;
}

export default function StumblingRadarCard({ plan }: StumblingRadarCardProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "generalization">("analysis");

  // Determine the school subject type based on plan metadata
  const subjectStr = (plan.subject || "").toLowerCase();
  const isMath = subjectStr.includes("算数") || subjectStr.includes("数学") || subjectStr.includes("math");
  const isPhysics = subjectStr.includes("物理") || subjectStr.includes("理科") || subjectStr.includes("physics") || subjectStr.includes("science");
  const isEnglish = subjectStr.includes("英語") || subjectStr.includes("english");

  // Choose radar dimensions and high-level transfer strategies dynamically
  const getSubjectSpecificData = () => {
    if (isMath) {
      return {
        radarData: [
          { dimension: "概念抽象度", probability: 75, severity: 85, desc: "割合を単純な値と混同しやすいリスク" },
          { dimension: "問題文読解", probability: 80, severity: 90, desc: "何を残金として答えるべきかの誤読" },
          { dimension: "数式モデル化", probability: 85, severity: 95, desc: "百分率を掛け算の比に変換する壁" },
          { dimension: "手順実行・演算", probability: 45, severity: 60, desc: "小数の掛け算・割り算の小数点のズレ" },
          { dimension: "メタ認知・検証", probability: 70, severity: 75, desc: "引いた結果が妥当か確認しない傾向" },
          { dimension: "既習知識の再生", probability: 60, severity: 70, desc: "分数・比の知識をスムーズに引き出せるか" },
        ],
        strategies: [
          {
            title: "「1に当たる量」の等分モデルを標準化する",
            text: "30%や2割など「全体に対する割合」が出現する他単元（売買損益、食塩水、濃度、歩合計算）でも、公式に当てはめさせる前に必ず「全体の1に当たるのがいくらか」を等分図、もしくは視覚的な線分図で描く習慣を徹底します。",
          },
          {
            title: "ターゲット（問われているもの）へのアンダーライン",
            text: "「本の値段を求めて満足して終わる（残金を答えない）」ミスは、割合の壁だけでなく読解完了前の終了癖に起因します。類似の応用問題が出た際は『何を聞かれているか』に赤線を引き、最終行で再度照合させる確認フローを挟ませます。",
          },
          {
            title: "公式＝暗号ではなく「アメ玉の箱」への具体化",
            text: "割合の他問題でつまずきを検知した際は「これはアメ玉が100個入った箱だとするよ。10%はアメ玉何個？」などの極小スケールのモデルを提示し、割合を「全体を等分したときの個数」として直感的に再構築させます。",
          },
        ],
      };
    } else if (isPhysics) {
      return {
        radarData: [
          { dimension: "概念抽象度", probability: 90, severity: 95, desc: "仕事・運動エネルギー・速度の関係性の混同" },
          { dimension: "問題文読解", probability: 65, severity: 70, desc: "文章から物理変数(質量・力・距離)の特定" },
          { dimension: "数式モデル化", probability: 95, severity: 90, desc: "等加速度公式とエネルギー保存則の選択迷い" },
          { dimension: "手順実行・演算", probability: 55, severity: 50, desc: "平方根、1/2など分数を含む代数計算ミス" },
          { dimension: "メタ認知・検証", probability: 75, severity: 80, desc: "速度の値が物体の現実的な速さとして妥当かの検証" },
          { dimension: "既習知識の再生", probability: 80, severity: 85, desc: "力学的な力のつりあい、運動方程式との接続" },
        ],
        strategies: [
          {
            title: "力学的収支「エネルギーポイント制」の導入",
            text: "摩擦熱、ばねの弾性、電磁気力など、仕事が発生する他領域でも『状態Aでの保有Pt ＋ 入ったチャージPt ＝ 状態Bでの保有Pt』という入出金モデル（エネルギー・仕事の関係）を共通フォーマットとして展開し、公式の暗記頼みを一掃します。",
          },
          {
            title: "状況の矢印デッサン運動画の徹底",
            text: "問題を読むなり数式を探す生徒には、必ず「何がどちらに、どれだけ引っ張られているか」を描かせます。他問題でも矢印の長短と物体の行く末を映画のように頭に描かせることで、物理変数の見落としを防ぎます。",
          },
          {
            title: "単位・次元のセルフ確認（ディメンションチェック）",
            text: "同様の計算を行った際、求めている「速さ (m/s)」が一貫して「エネルギー (J)」と混同されていないか、[m/v]などの次元が成立しているかを生徒自身にチェックさせ、自浄的な数式検証力を育てます。",
          },
        ],
      };
    } else if (isEnglish) {
      return {
        radarData: [
          { dimension: "概念抽象度", probability: 80, severity: 85, desc: "なぜ主名詞（先行詞）を後ろから説明するかの理解" },
          { dimension: "問題文読解", probability: 60, severity: 65, desc: "2つの文の共通する「代名詞（himなど）」の相関理解" },
          { dimension: "数式モデル化", probability: 95, severity: 90, desc: "先行詞の直後に文節を無理やり割り込ませる入れ子構造" },
          { dimension: "手順実行・演算", probability: 50, severity: 55, desc: "関係代名詞の主格・目的格（who / whom）の選択間違い" },
          { dimension: "メタ認知・検証", probability: 70, severity: 75, desc: "合成文を音読して、文法構造自体に違和感がないかの照合" },
          { dimension: "既習知識の再生", probability: 75, severity: 80, desc: "他文法の主語（S）＋動詞（V）接続関係の正確な再生" },
        ],
        strategies: [
          {
            title: "「関係詞＝先行詞(箱)の背中に貼る、説明ふせん」の視覚化",
            text: "主格の関係代名詞、関係副詞、あるいは同格のthatでも、英語の不変ルール『説明したい言葉（箱）の直後に、修飾節（ふせん）をピタッと貼る』を全ての修飾構造の基本として汎用適用させます。隙間を開けないイメージを徹底させます。",
          },
          {
            title: "文の「二枚分解」リバースエンジニアリング",
            text: "難解な長文や類題の解釈でつまずいた際は『この複雑な一枚の文を、シンプルな関係のない二枚のプレーンな文に切り裂いてみて？』と逆方向に発問します。これにより主節と従属節の関係を構造的に見抜く眼を鍛えます。",
          },
          {
            title: "意味チャンクごとのスラッシュ音読とフロー認識",
            text: "入れ子になった文は、ピリオドまで一気に読んでも意味が入ってきません。『先行詞/【関係詞節】/動詞〜』のチャンクに縦線を引きながら感情を込めて音読させ、英語本来の「後ろから情報を足す」語順感覚を耳から定着させます。",
          },
        ],
      };
    } else {
      // General fallbacks for custom analyzed questions
      return {
        radarData: [
          { dimension: "概念抽象度", probability: 75, severity: 80, desc: "核心的な抽象概念を自分の言葉に変換できているか" },
          { dimension: "問題文読解", probability: 70, severity: 75, desc: "問いの要求や前提条件を正しくデコードできているか" },
          { dimension: "数式モデル化", probability: 85, severity: 90, desc: "文脈と理論の関係を構造的な等式やロジックにする力" },
          { dimension: "手順実行・演算", probability: 60, severity: 55, desc: "解答を導くまでの個別手順、記号、スペルなどの正確性" },
          { dimension: "メタ認知・検証", probability: 70, severity: 80, desc: "答えの導出後、それが現実的につじつまが合うか確かめる姿勢" },
          { dimension: "既習知識の再生", probability: 75, severity: 75, desc: "これまでに学んだ基礎の引き出しを直感的に引き出せるか" },
        ],
        strategies: [
          {
            title: "物事の本質を簡素な具体的モデルに「ミニスケール化」する",
            text: "どんな高度・複雑な類題でも、つまずきが見られたら一度「身の回りのお財布」「おやつの時間」「ゲームのステータス」など、直感的に1桁の数や単純な関係でイメージできるミニスモールモデルに置き換えて、原理を自発的に再発見させます。",
          },
          {
            title: "論理ステップの3相ローテーション展開法",
            text: "「問題の情報を並べる（整理）」→「相互の関係を繋ぐ（モデリング）」→「実作業で結論を出す（解決）」という一連のステップ（スモールステップ）を他分野の指導でも踏襲し、パニックでフリーズしてしまう生徒に、目の前の『今クリアすべき局所目標』だけを抽出して与えます。",
          },
          {
            title: "答えを教えず「どう思う？」「どこから出た？」に終始する指導",
            text: "類題の指導でも、つまずいた瞬間に「それは違う、こうだよ」と即時訂正することは、生徒の学習意欲とメタ認知力の芽を摘み取ります。「面白い計算だね！これってどこを参考に思いついた？」と発問し、認知の間違いを生徒主導で修復させます。",
          },
        ],
      };
    }
  };

  const { radarData, strategies } = getSubjectSpecificData();

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dimension = payload[0].payload.dimension;
      const prob = payload[0].value;
      const sever = payload[1]?.value || 0;
      const description = payload[0].payload.desc;

      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-xl text-[11px] max-w-[200px] text-slate-200">
          <p className="font-extrabold text-white mb-1.5 border-b border-white/10 pb-0.5">📊 {dimension}</p>
          <p className="flex items-center justify-between gap-2.5">
            <span className="text-rose-400 font-bold">つまずき確率:</span>
            <span className="font-mono text-xs text-rose-300 font-black">{prob}%</span>
          </p>
          <p className="flex items-center justify-between gap-2.5 mt-0.5">
            <span className="text-yellow-400 font-bold">指導重要・深刻度:</span>
            <span className="font-mono text-xs text-yellow-300 font-black">{sever}%</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed border-t border-white/5 pt-1 text-xs">
            {description}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="stumbling-analysis-radar-panel"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-xl relative overflow-hidden"
    >
      <div className="absolute left-0 bottom-0 w-32 h-32 bg-teal-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-teal-500/20 text-teal-400 rounded-lg flex items-center justify-center text-xs">
            📈
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight">つまずき予測レーダー ＆ 類題指導応用</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              学年の枠を超えて「自立学習」へ応用・転移させるロードマップ
            </p>
          </div>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 self-start sm:self-center">
          <button
            type="button"
            id="tab-btn-analysis"
            onClick={() => setActiveTab("analysis")}
            className={`px-3 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
              activeTab === "analysis"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            予測パラメータ
          </button>
          <button
            type="button"
            id="tab-btn-generalization"
            onClick={() => setActiveTab("generalization")}
            className={`px-3 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
              activeTab === "generalization"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            類題アプローチ (学習の転移)
          </button>
        </div>
      </div>

      {activeTab === "analysis" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radar Chart (left column on lg screens) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/40 p-4 rounded-2xl border border-white/5 relative min-h-[260px]">
            <span className="absolute top-2 left-3 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono text-center">
              Recharts Interactive Engine
            </span>
            <div className="w-full h-56 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#374151" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: "bold" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#6b7280", fontSize: 8 }}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Radar
                    name="つまずき発生確率"
                    dataKey="probability"
                    stroke="#f43f5e"
                    fill="#f43f5e"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="指導優先・深刻度"
                    dataKey="severity"
                    stroke="#eab308"
                    fill="#eab308"
                    fillOpacity={0.15}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    align="center"
                    wrapperStyle={{ fontSize: "9px", color: "#d1d5db" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick analysis table (right columns on lg screens) */}
          <div className="lg:col-span-5 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>予測される学習障害要因の傾向</span>
            </h4>
            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
              {radarData.map((data, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-start gap-2.5 hover:bg-white/10 transition-all pointer-events-auto group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-200 block truncate">
                        {data.dimension}
                      </span>
                      <div className="flex items-center space-x-1.5 shrink-0 font-mono text-[9px]">
                        <span className="text-rose-400 font-bold">発生: {data.probability}%</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-yellow-400 font-bold">深刻: {data.severity}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal group-hover:text-slate-300 transition-colors">
                      {data.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* GENERALIZATION TRANSFER TAB */
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-teal-950/20 border border-teal-500/20 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-300">「学習の転移」を引き起こす、教員アプローチ汎用術</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                今回の問いかけを通じて生徒は局所的な壁をクリアします。この理解を
                <strong>「同様の問題が出た時でも自立して再現できる」</strong>
                ようにするために、先生が全教科で展開すべき思考トリガーと共通手順です。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategies.map((strat, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-2 hover:border-teal-500/30 transition-all cursor-default"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-teal-500/10 text-teal-400 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <h5 className="text-[11px] font-bold text-slate-200 line-clamp-1">{strat.title}</h5>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed min-h-[4rem] text-justify group-hover:text-slate-350 transition-colors">
                    {strat.text}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-teal-400 font-bold">
                  <span>転移アプローチ手順</span>
                  <ArrowRight className="w-3 h-3 text-teal-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950/50 rounded-2xl p-4.5 border border-white/5 flex items-center gap-3.5">
            <span className="text-2xl shrink-0">🎓</span>
            <div className="text-[11px] leading-relaxed text-slate-350">
              <span className="font-bold text-white block mb-0.5">💡 指導力向上のメタメモ:</span>
              「答えの丸教え」を回避された生徒は、脳に強い「認知的葛藤」を抱えています。
              この状態で類題に直面させ「あ！これもあの時と全く同じ構造だ！」と気付かせる（アハ転移）ことが、小手先の公式丸暗記を凌駕する本物の主体性・問題解決力を開花させます。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
