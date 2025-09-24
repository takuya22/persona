import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { saveStartChat } from "@/features/chats/utils/chats";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import SignIn from "@/features/auth/components/SignIn";
import { Badge } from "@/components/ui/badge";
import { getPersonaNameById } from "@/features/persona/utils/persona";

export const Composer: React.FC<{
  query: string;
  setQuery: (q: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  suggestions: string[];
  role?: string;
  onClearRole: () => void;
}> = ({ query, setQuery, buttonRef, suggestions, role, onClearRole }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    saveStartChat(query, role || "All");
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
                <div className="relative w-full">
                  <Textarea
                    placeholder="ここに質問や課題を書いて、会話を始めましょう…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-24 resize-none rounded-2xl pr-24"
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    {(!role || role === "all") ? (
                      <Badge
                        variant="outline"
                        className="rounded-full px-2 py-0.5 text-xs font-medium max-w-[140px] truncate"
                        title="全員に一斉インタビュー"
                      >
                        全員に一斉インタビュー
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-full pl-2 pr-1 py-0.5 text-xs font-medium flex items-center gap-1 max-w-[160px]"
                        title={`選択中: ${getPersonaNameById(role)}`}
                      >
                        <span className="">{getPersonaNameById(role)}</span>
                        {onClearRole && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearRole();
                            }}
                            aria-label="選択を解除"
                            className="inline-flex items-center justify-center rounded-full hover:bg-muted/70 transition p-0.5"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="rounded-2xl cursor-pointer"
                      onClick={handleSubmit}
                      disabled={!query.trim()}
                      ref={buttonRef}
                    >
                      <Send className="mr-1 size-4" /> 開始
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <Button key={i} variant="secondary" size="sm" className="rounded-full cursor-pointer" onClick={() => setQuery(s)}>
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
