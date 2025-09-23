"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
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
  { id: "marketer", name: "マーケター", role: "Marketer", color: "bg-pink-100", emoji: "🎯" },
  { id: "senior_engineer", name: "シニアエンジニア", role: "Senior Engineer", color: "bg-sky-100", emoji: "🛠️" },
  { id: "hr", name: "人事/採用担当", role: "HR", color: "bg-emerald-100", emoji: "🧑‍💼" },
  { id: "designer", name: "デザイナー", role: "Designer", color: "bg-indigo-100", emoji: "🎨" },
  { id: "sales", name: "法人営業", role: "Sales", color: "bg-violet-100", emoji: "🤝" },
  { id: "housewife", name: "専業主婦", role: "Housewife", color: "bg-rose-100", emoji: "🏠" },
  { id: "retiree", name: "退職者", role: "Retiree", color: "bg-lime-100", emoji: "🌅" },
  { id: "student", name: "大学生", role: "Student", color: "bg-cyan-100", emoji: "🎒" },
  { id: "teen", name: "高校生", role: "Teenager", color: "bg-purple-100", emoji: "📚" },
];

export const getPersonaRoleById = (id: string) => {
  return personas.find((p) => p.id === id)?.role;
}

const groups = [
  { id: "group1", name: "PM・マーケ・エンジニア", role: "Group1", emoji: "🚀" },
  { id: "group2", name: "人事・営業・デザイナー", role: "Group2", emoji: "💼" },
  { id: "group3", name: "学生・主婦・退職者", role: "Group3", emoji: "🌟" },
];

const suggestions = [
  "新しいアプリを毎日使いたくなる工夫って？",
  "上司に提案を通すとき、どこで苦労する？",
  "初めて触ったときに迷いそうなところは？",
  "値上げしたらどんな反応になりそう？",
  "SNSでシェアしたくなるのはどんな瞬間？",
  "チーム導入するときに一番ネックになるのは？",
  "友達にすすめたくなる理由って何だろう？",
];

export default function Page() {
  const [query, setQuery] = useState("");
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
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
            PM・デザイナー・営業・人事など、目的に合ったペルソナを即座に呼び出して<br />仮説検証を高速化します。
          </p>
        </div>

        <Composer query={query} setQuery={setQuery} buttonRef={buttonRef} suggestions={suggestions} role={activePersona || activeGroup || "all"} />
      </section>

      {/* Groups */}
      <section id="groups" className="mx-auto max-w-6xl px-4 mt-10 md:mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">グループを選ぶ</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
          <Card
            key={g.id}
            className={`rounded-2xl transition hover:shadow ${activeGroup === g.id ? "ring-2 ring-slate-900" : ""}`}
            onClick={() => {setActiveGroup(g.id); setActivePersona(null)}}
            role="button"
          >
            <CardHeader className="flex flex-row items-center gap-3">
              <Avatar>
                <AvatarFallback>{g.emoji}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{g.name}</CardTitle>
                <CardDescription className="text-xs">{g.role}・複数ペルソナでの会話に</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-600">
              例: 「{g.name} で相談して、オンボーディングのボトルネックを3つ挙げて」
            </CardContent>
          </Card>
          ))}
        </div>
        {activeGroup && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <Badge className="rounded-full" variant="secondary">選択中</Badge>
            <span>{groups.find((g) => g.id === activeGroup)?.name}</span>
            <ChevronRight className="size-4"/>
            <Button size="sm" className="rounded-2xl">このグループで会話を開始</Button>
          </div>
        )}
      </section>

      {/* Personas */}
      <section id="personas" className="mx-auto max-w-6xl px-4 mt-10 md:mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">ペルソナを選ぶ</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.filter((p) => p.id !== "housewife" && p.id !== "retiree" && p.id !== "student" && p.id !== "teen").map((p) => (
            <Card
              key={p.id}
              className={`rounded-2xl transition hover:shadow ${activePersona === p.id ? "ring-2 ring-slate-900" : ""}`}
              onClick={() => {setActivePersona(p.id); setActiveGroup(null)}}
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
              <CardTitle className="text-base">短時間で深い洞察</CardTitle>
              <CardDescription>1人ずつのヒアリングに比べ、まとめて複数ペルソナから回答を得られるため、インサイト収集のスピードと密度が高まります。</CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">アイデアの磨き込みに最適</CardTitle>
              <CardDescription>初期のアイデア段階でも仮説検証ができ、チーム内合意形成や次のアクションを後押しします。</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 md:mt-24 border-t">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Persona Interview</div>
          <div className="flex items-center gap-4">
            {/* <a href="#" className="hover:text-slate-900">利用規約</a>
            <a href="#" className="hover:text-slate-900">プライバシー</a>
            <a href="#" className="hover:text-slate-900">お問い合わせ</a> */}
          </div>
        </div>
      </footer>
    </div>
    </SessionProvider>
  );
}
