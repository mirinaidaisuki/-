import React from "react";

interface MathRendererProps {
  text: string;
  className?: string;
}

// Unicodeの上付き文字・下付き文字マッピング（プレーンテキスト内でも使いやすくするため）
const SUPERSCRIPTS: { [key: string]: string } = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ', 'i': 'ⁱ', 'r': 'ʳ',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ'
};

const SUBSCRIPTS: { [key: string]: string } = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  't': 'ₜ', 'x': 'ₓ', 'y': 'ₓ', 'n': 'ₙ', 'i': 'ᵢ',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'r': 'ᵣ', 'u': 'ᵤ', 'v': 'ᵥ'
};

// キャレットやアンダースコアをUnicode上付き・下付きに事前置換するヘルパー
function convertToUnicodeMath(str: string): string {
  let result = str;
  // 1. 上付き文字の置換: base^{exp} or base^exp
  result = result.replace(/([a-zA-Z0-9\)]+)\^\{?([0-9nxyi\+\-\=\(\)abced]+)\}?/g, (match, base, exp) => {
    let replacedExp = "";
    for (const char of exp) {
      replacedExp += SUPERSCRIPTS[char] || `^${char}`;
    }
    return base + replacedExp;
  });

  // 単体のハット+数字/英字を上付きにする (例: ^2 -> ²)
  result = result.replace(/\^([0-9nxyi\+\-\=\(\)abced])/g, (match, char) => {
    return SUPERSCRIPTS[char] || `^${char}`;
  });

  // 2. 下付き文字の置換: base_{sub} or base_sub
  result = result.replace(/([a-zA-Z0-9\)]+)_\{?([0-9txy\+\-\=\(\)aeoruv]+)\}?/g, (match, base, sub) => {
    let replacedSub = "";
    for (const char of sub) {
      replacedSub += SUBSCRIPTS[char] || `_${char}`;
    }
    return base + replacedSub;
  });

  // 単体のアンダースコア+数字/英字を下付きにする (例: _0 -> ₀)
  result = result.replace(/_([0-9txy\+\-\=\(\)aeoruv])/g, (match, char) => {
    return SUBSCRIPTS[char] || `_${char}`;
  });

  return result;
}

/**
 * 簡易的な数式・文字式・マークダウン風レンダラー
 * 数学の文字式（x, y, v, a, tなど）、ルート記号（√ や \sqrt{}）、上付き文字（^2など）、下付き文字（v_0など）を検出して、
 * 美しいイタリックフォントや数式風のバッジ、上付き・下付きタグを用いてHTML/CSSでレンダリングします。
 */
export default function MathRenderer({ text, className = "" }: MathRendererProps) {
  if (!text) return null;

  // 改行で分割して、各行をパラグラフとしてレンダリングする
  const lines = text.split("\n");

  const formatLine = (line: string): React.ReactNode => {
    // 箇条書き or 特殊なインデントの検出
    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
    const lineContent = isBullet ? line.trim().substring(2) : line;

    const parsedNodes: React.ReactNode[] = [];
    let keyIdx = 0;

    // LaTeXデリミタ（$$, $, \[, \], \(, \)）で分割する
    const delimiterRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
    const sections = lineContent.split(delimiterRegex);

    sections.forEach((section, secIdx) => {
      if (!section) return;

      const isMathSection = 
        (section.startsWith("$$") && section.endsWith("$$")) ||
        (section.startsWith("$") && section.endsWith("$")) ||
        (section.startsWith("\\[") && section.endsWith("\\]")) ||
        (section.startsWith("\\(") && section.endsWith("\\)"));

      if (isMathSection) {
        // デリミタを除去する
        let mathContent = section;
        if (section.startsWith("$$") && section.endsWith("$$")) {
          mathContent = section.slice(2, -2);
        } else if (section.startsWith("$") && section.endsWith("$")) {
          mathContent = section.slice(1, -1);
        } else if (section.startsWith("\\[") && section.endsWith("\\]")) {
          mathContent = section.slice(2, -2);
        } else if (section.startsWith("\\(") && section.endsWith("\\)")) {
          mathContent = section.slice(2, -2);
        }

        // LaTeXの一般的な特殊コマンド置換
        mathContent = mathContent
          .replace(/\\times/g, " × ")
          .replace(/\\div/g, " ÷ ")
          .replace(/\\pm/g, " ± ")
          .replace(/\\mp/g, " ∓ ")
          .replace(/\\leq/g, " ≦ ")
          .replace(/\\geq/g, " ≧ ")
          .replace(/\\neq/g, " ≠ ")
          .replace(/\\approx/g, " ≒ ")
          .replace(/\\propto/g, " ∝ ")
          .replace(/\\infty/g, " ∞ ")
          .replace(/\\pi/g, "π")
          .replace(/\\theta/g, "θ")
          .replace(/\\alpha/g, "α")
          .replace(/\\beta/g, "β")
          .replace(/\\gamma/g, "γ")
          .replace(/\\delta/g, "δ")
          .replace(/\\Delta/g, "Δ")
          .replace(/\\cdot/g, "・")
          .replace(/\*/g, " × ")
          .replace(/ \/ /g, " ÷ ");

        // Unicodeの上付き・下付きに変換
        mathContent = convertToUnicodeMath(mathContent);

        // ルート表現の処理
        mathContent = mathContent.replace(/\\sqrt\{([^\}]+)\}/g, "√($1)");
        mathContent = mathContent.replace(/√\{([^\}]+)\}/g, "√($1)");
        
        // その他の LaTeX 特有の装飾コマンドなどを削除 (例: \mathrm, \mathbf)
        mathContent = mathContent.replace(/\\mathrm\{([^\}]+)\}/g, "$1");
        mathContent = mathContent.replace(/\\mathbf\{([^\}]+)\}/g, "$1");
        mathContent = mathContent.replace(/\\text\{([^\}]+)\}/g, "$1");

        parsedNodes.push(
          <span 
            key={`math-sec-${secIdx}`} 
            className="inline-block font-serif italic text-indigo-700 bg-indigo-50/70 border border-indigo-100/50 px-1.5 py-0.5 rounded mx-1 text-sm font-semibold tracking-wide"
          >
            {mathContent}
          </span>
        );
      } else {
        // 通常のテキスト
        let normalText = section;
        
        // Unicode上付き・下付き変換を通常テキストにもかける
        normalText = convertToUnicodeMath(normalText);
        
        // 簡易置換
        normalText = normalText
          .replace(/\\\(/g, "")
          .replace(/\\\)/g, "")
          .replace(/\\times/g, "×")
          .replace(/\\div/g, "÷")
          .replace(/\*/g, "×");

        parsedNodes.push(<span key={`text-sec-${secIdx}`}>{normalText}</span>);
      }
    });

    if (isBullet) {
      return (
        <li className="list-disc ml-5 pl-1 text-[11px] text-slate-700 leading-relaxed py-0.5 select-text" key={`bullet-${keyIdx++}`}>
          {parsedNodes}
        </li>
      );
    } else {
      return (
        <p className="min-h-[1rem] leading-relaxed text-[11px] text-slate-800 py-0.5 select-text" key={`p-${keyIdx++}`}>
          {parsedNodes}
        </p>
      );
    }
  };

  return (
    <div className={`space-y-1 font-sans ${className}`} id="math-rendered-container">
      {lines.map((line, i) => {
        const renderedLine = formatLine(line);
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return <ul key={i} className="list-none m-0 p-0">{renderedLine}</ul>;
        }
        return <div key={i}>{renderedLine}</div>;
      })}
    </div>
  );
}
