import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, Send, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { saveStartChat } from "@/features/chats/utils/chats";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import SignIn from "@/features/auth/components/SignIn";

export const Composer: React.FC<{
  query: string;
  setQuery: (q: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  suggestions: string[];
}> = ({ query, setQuery, buttonRef, suggestions }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    saveStartChat(query);
    router.push('/chats');
  };


  return (
    <>
      {/* Composer */}
      <Card className="mt-8 rounded-2xl shadow-sm">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-start gap-3">
            <Avatar className="mt-1 size-9">
              <AvatarImage alt="persona" />
              <AvatarFallback className="bg-slate-100">AI</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Tabs defaultValue="prompt" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="prompt">プロンプト</TabsTrigger>
                    <TabsTrigger value="brief">調査ブリーフ</TabsTrigger>
                  </TabsList>
                  <TabsContent value="prompt" className="mt-3">
                    <div className="relative">
                      <Textarea
                        placeholder="ここに質問や課題を書いて、会話を始めましょう…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="min-h-24 resize-none rounded-2xl pr-24"
                      />
                      <div className="absolute right-2 bottom-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-2xl"
                          onClick={handleSubmit}
                          disabled={!query.trim()}
                          ref={buttonRef}
                        >
                          <Send className="mr-1 size-4" /> 開始
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="brief" className="mt-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="目的（例：継続率改善の仮説検証）" />
                      <Input placeholder="対象（例：Z世代／ライトユーザー）" />
                      <Input placeholder="シナリオ（例：初回オンボーディング）" />
                      <Input placeholder="KPI（例：Day7継続率 +5%）" />
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button className="rounded-2xl"><Sparkles className="mr-1 size-4"/> ブリーフから面接設計</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Quick suggestions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <Button key={i} variant="secondary" size="sm" className="rounded-full">
                    <Search className="mr-1 size-4" />{s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ログインが必要です</DialogTitle>
            <DialogDescription>
              チャットを開始するには Google アカウントでログインしてください。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <SignIn />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
