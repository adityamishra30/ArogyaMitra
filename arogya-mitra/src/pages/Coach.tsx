import React, { useState, useRef, useEffect } from "react";
import { 
  useGetChatHistory, 
  useChatWithCoach,
  useAdjustPlan,
  type PlanAdjustRequestSituation
} from "@workspace/api-client-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { motion } from "framer-motion";
import { Send, Sparkles, Plane, Activity, Clock, BatteryLow } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Coach() {
  const { data: history, isLoading } = useGetChatHistory();
  const chatMutation = useChatWithCoach();
  const adjustMutation = useAdjustPlan();
  const queryClient = useQueryClient();
  
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optimistic UI state for messages to make chat feel instant
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  useEffect(() => {
    if (history) {
      setLocalMessages(history);
      scrollToBottom();
    }
  }, [history]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg = input.trim();
    setInput("");
    
    // Optimistic user message
    setLocalMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await chatMutation.mutateAsync({ data: { message: userMsg } });
      // The backend adds both to history, we'll re-fetch silently
      queryClient.invalidateQueries({ queryKey: ['/api/coach/history'] });
      // Optimistic assistant message until query invalidation completes
      setLocalMessages(prev => [...prev, { role: "assistant", content: res.message }]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      // Revert on error handled via re-fetch
    }
  };

  const handleQuickAction = async (situation: PlanAdjustRequestSituation, label: string) => {
    setLocalMessages(prev => [...prev, { role: "user", content: `I need to adjust my plan: ${label}` }]);
    try {
      const res = await adjustMutation.mutateAsync({ data: { situation } });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach/history'] });
      
      setLocalMessages(prev => [...prev, { role: "assistant", content: res.message }]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {}
  };

  if (isLoading) return <LoadingState message="Waking up AROMI..." />;

  const quickActions = [
    { id: "traveling", icon: Plane, label: "I'm Traveling" },
    { id: "injured", icon: Activity, label: "I have an Injury" },
    { id: "time_constrained", icon: Clock, label: "Short on Time" },
    { id: "low_energy", icon: BatteryLow, label: "Low Energy Today" },
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col">
      <header className="mb-6 flex items-center gap-4">
        <div className="relative">
          <img src={`${import.meta.env.BASE_URL}images/aromi-avatar.png`} alt="AROMI" className="w-14 h-14 rounded-full border-2 border-primary object-cover" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-extrabold flex items-center gap-2">
            AROMI Coach <Sparkles className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Your personal AI wellness expert</p>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={() => handleQuickAction(action.id as any, action.label)}
            disabled={adjustMutation.isPending || chatMutation.isPending}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-primary hover:bg-primary/5 rounded-full text-sm font-bold text-foreground transition-all disabled:opacity-50"
          >
            <action.icon className="w-4 h-4 text-primary" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-card border border-border shadow-sm rounded-3xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {localMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-50">
              <Sparkles className="w-12 h-12 mb-4" />
              <p className="text-lg font-bold">Start a conversation with AROMI</p>
              <p className="text-sm max-w-sm mt-2">Ask for fitness advice, nutrition tips, or request plan adjustments based on how you feel today.</p>
            </div>
          )}
          
          {localMessages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                  : 'bg-muted/60 border border-border/50 rounded-tl-sm text-foreground prose prose-sm max-w-none'
              }`}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetContent={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                ) : (
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          
          {(chatMutation.isPending || adjustMutation.isPending) && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 flex gap-2 items-center">
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask AROMI anything..."
              className="w-full pl-6 pr-14 py-4 bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background rounded-full outline-none transition-all font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="absolute right-2 p-2.5 bg-primary text-white rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
