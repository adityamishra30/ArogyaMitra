import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password });
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 order-2 lg:order-1">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-extrabold text-foreground mb-2">Join ArogyaMitra</h2>
            <p className="text-muted-foreground">Start your personalized wellness journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Full Name</label>
              <input 
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-secondary focus:bg-background outline-none transition-all font-medium"
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Email Address</label>
              <input 
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-secondary focus:bg-background outline-none transition-all font-medium"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Password</label>
              <input 
                type="password" required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-secondary focus:bg-background outline-none transition-all font-medium"
                placeholder="•••••••• (Min 6 chars)"
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-secondary text-white rounded-xl font-bold text-lg shadow-xl shadow-secondary/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:transform-none transition-all mt-4"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-muted-foreground font-medium">
            Already have an account? <Link href="/login" className="text-secondary hover:underline font-bold">Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-black order-1 lg:order-2">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract background" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen hue-rotate-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="relative z-10 self-end text-right">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 ml-auto">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-5xl font-display font-extrabold tracking-tight">ArogyaMitra</h1>
        </div>

        <div className="relative z-10 max-w-md self-end text-right">
          <h2 className="text-3xl text-white font-bold mb-4">Adaptable AI</h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Traveling? Injured? Low energy? AROMI dynamically adjusts your workouts and meals so you never lose momentum.
          </p>
        </div>
      </div>
    </div>
  );
}
