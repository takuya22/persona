"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, PlayCircle, ChevronRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/features/top/components/Header";
import { Composer } from "@/features/top/components/Composer";

/**
 * Persona Interview – Simple TOP
 * - Clean, centered input like Claude/ChatGPT
 * - Hero search/compose box with suggestions
 * - Persona quick-picks (AI agents as personas)
 * - Social proof + feature highlights
 * - Minimal header/footer
 *
 * Tailwind required. shadcn/ui imports assumed available in the app environment.
 */

const personas = [
  { id: "pm", name: "プロダクトマネージャー", role: "PM", color: "bg-amber-100", emoji: "📊" },
  { id: "mark", name: "マーケター", role: "Marketing", color: "bg-pink-100", emoji: "🎯" },
  { id: "engineer", name: "シニアエンジニア", role: "Engineer", color: "bg-sky-100", emoji: "🛠️" },
  { id: "hr", name: "人事/採用担当", role: "HR", color: "bg-emerald-100", emoji: "🧑‍💼" },
  { id: "designer", name: "デザイナー", role: "Design", color: "bg-indigo-100", emoji: "🎨" },
  { id: "sales", name: "法人営業", role: "Sales", color: "bg-violet-100", emoji: "🤝" },
];

const suggestions = [
  "Z世代ユーザーの継続率改善アイデアを聞く",
  "B2B導入時の決裁プロセスの壁は?",
  "オンボーディングでつまづくポイントを洗い出して",
  "価格改定の反応を3タイプの顧客にヒアリング",
];

export default function Page() {
  const [query, setQuery] = useState("");
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ctrl+Enter で開始ボタンを押す
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        // textareaがフォーカスされている時のみ
        const active = document.activeElement;
        if (active && active.tagName === "TEXTAREA") {
          e.preventDefault();
          if (buttonRef.current && !buttonRef.current.disabled) {
            buttonRef.current.click();
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <SessionProvider>
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-14 md:pt-24">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-semibold tracking-tight"
          >
            たくさんの <span className="bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">AIペルソナ</span> に
            <br className="hidden sm:block" /> ユーザーインタビューができる場所
          </motion.h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            PM・デザイナー・営業・人事など、目的に合ったペルソナを即座に呼び出して仮説検証を高速化します。
          </p>
        </div>

        <Composer query={query} setQuery={setQuery} buttonRef={buttonRef} suggestions={suggestions} />
      </section>

      {/* Personas */}
      <section id="personas" className="mx-auto max-w-6xl px-4 mt-10 md:mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">ペルソナを選ぶ</h2>
          <Button variant="ghost" className="rounded-2xl">
            <Plus className="mr-1 size-4"/> カスタム作成
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((p) => (
            <Card
              key={p.id}
              className={`rounded-2xl transition hover:shadow ${activePersona === p.id ? "ring-2 ring-slate-900" : ""}`}
              onClick={() => setActivePersona(p.id)}
              role="button"
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <Avatar>
                  <AvatarFallback className={`${p.color}`}>{p.emoji}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription className="text-xs">{p.role}・仮説検証/課題発見に強い</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-slate-600">
                例: 「{p.name} の視点で、オンボーディングのボトルネックを3つ挙げて」
              </CardContent>
            </Card>
          ))}
        </div>
        {activePersona && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <Badge className="rounded-full" variant="secondary">選択中</Badge>
            <span>{personas.find((p) => p.id === activePersona)?.name}</span>
            <ChevronRight className="size-4"/>
            <Button size="sm" className="rounded-2xl">このペルソナで会話を開始</Button>
          </div>
        )}
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 mt-14 md:mt-20">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">複数視点での即時検証</CardTitle>
              <CardDescription>PM/Design/Marketing/HR など多角的に質問し、バイアスを減らします。</CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">面接設計テンプレート</CardTitle>
              <CardDescription>課題→仮説→質問票→深掘りの流れを自動生成。議事録も同時に作成。</CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">実サービス連携</CardTitle>
              <CardDescription>自社ログ・NPS・CS問い合わせと接続し、具体的な改善案へ。</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 mt-14 md:mt-20">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <ol className="grid md:grid-cols-3 gap-6 list-decimal list-inside">
              <li>
                <h3 className="font-semibold">質問を書く</h3>
                <p className="text-sm text-slate-600">中央の入力欄に悩みや仮説を書きます。テンプレートやサジェストからもOK。</p>
              </li>
              <li>
                <h3 className="font-semibold">ペルソナを選ぶ</h3>
                <p className="text-sm text-slate-600">PM/デザイナー等の視点で回答。複数同時で比較も可能。</p>
              </li>
              <li>
                <h3 className="font-semibold">会話で深掘る</h3>
                <p className="text-sm text-slate-600">さらに「なぜ？」を繰り返し、行動可能な示唆まで落とし込みます。</p>
              </li>
            </ol>
            <div className="mt-6 flex justify-center">
              <Button className="rounded-2xl"><PlayCircle className="mr-1 size-4"/> 1分で見るデモ</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-16 md:mt-24 border-t">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Persona Interview</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-900">利用規約</a>
            <a href="#" className="hover:text-slate-900">プライバシー</a>
            <a href="#" className="hover:text-slate-900">お問い合わせ</a>
          </div>
        </div>
      </footer>
    </div>
    </SessionProvider>
  );
}
