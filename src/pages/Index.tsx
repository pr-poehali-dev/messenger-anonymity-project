import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  name: string;       // display name / nickname
  avatar: string;     // emoji avatar
  color: string;
};

type Message = {
  id: string;
  text: string;
  profileId: string;
  displayName: string;
  avatar: string;
  color: string;
  ts: string;
};

type BgKey = "void" | "fog" | "blood" | "forest" | "dusk" | "abyss";

type Chat = {
  id: string;
  name: string;
  icon: string;       // emoji icon
  bg: BgKey;          // wallpaper
  messages: Message[];
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_LIST = ["👤","👻","🕵️","🧛","🐺","🌙","💀","🔮","🧟","🦇","🌲","🧕","🧙","🐉","🎭","🦊","🕷","🌊","🌹","⚔️","🔥","🌑","☁️","🌺","🦋","🐦","🌿","🍀","🌙","⭐","🌸","🎪","🏴","🎭","🗝","🔑","📖","🕯","🪄","🌀","❄️","🌊","🌋","🏔","🌃","🌌"];
const PALETTE   = ["#c084fc","#4ade80","#fb923c","#60a5fa","#f472b6","#34d399","#fbbf24","#a78bfa","#f87171","#38bdf8","#e879f9","#86efac","#fdba74","#7dd3fc","#f9a8d4"];

const BG_OPTIONS: { id: BgKey; label: string; icon: string; cls: string }[] = [
  { id: "void",   label: "Пустота",  icon: "✦", cls: "bg-gradient-to-br from-black via-slate-950 to-black" },
  { id: "fog",    label: "Туман",    icon: "≋", cls: "bg-gradient-to-br from-slate-800 via-slate-600/60 to-slate-900" },
  { id: "blood",  label: "Кровь",    icon: "◈", cls: "bg-gradient-to-br from-red-950 via-rose-900/90 to-stone-950" },
  { id: "forest", label: "Лес",      icon: "❧", cls: "bg-gradient-to-br from-green-950 via-emerald-900/80 to-stone-950" },
  { id: "dusk",   label: "Сумерки",  icon: "◎", cls: "bg-gradient-to-br from-indigo-950 via-purple-900/70 to-black" },
  { id: "abyss",  label: "Бездна",   icon: "⊗", cls: "bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-950" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const bgCls   = (key: BgKey) => BG_OPTIONS.find(b => b.id === key)?.cls ?? BG_OPTIONS[0].cls;
const fmtTime = (d = new Date()) => d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
const uid     = () => Math.random().toString(36).slice(2, 10);

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-[340px] max-w-[calc(100vw-2rem)] bg-popover border border-border/60 rounded-2xl p-5 animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <span className="font-display text-xs font-bold tracking-wider uppercase">{title}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
      {EMOJI_LIST.map(e => (
        <button key={e} type="button" onClick={() => onChange(e)}
          className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all shrink-0 ${value === e ? "bg-primary/25 border border-primary/50" : "bg-secondary/30 hover:bg-secondary/60 border border-transparent"}`}>
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Profile Setup Screen ─────────────────────────────────────────────────────

function ProfileSetup({ onDone }: { onDone: (p: Omit<Profile, "id">) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("👤");
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  function submit() {
    if (!name.trim()) return;
    onDone({ name: name.trim(), avatar, color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background mesh-bg">
      <div className="w-[360px] max-w-[calc(100vw-2rem)] p-6 animate-scale-in">
        <div className="text-center mb-8">
          <div className="font-display text-2xl font-bold text-primary tracking-[0.15em] mb-2">WHISPER</div>
          <div className="text-xs font-mono text-muted-foreground/50">создай профиль, чтобы начать</div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-muted-foreground font-mono mb-2 block">Аватар</label>
            <EmojiPicker value={avatar} onChange={setAvatar} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Никнейм</label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Как тебя называть?"
              className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
            />
          </div>
          <button onClick={submit} disabled={!name.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-xs tracking-widest uppercase hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Edit Modal ───────────────────────────────────────────────────────

function ProfileEditModal({ profile, onClose, onSave, onDelete, canDelete }: {
  profile: Profile;
  onClose: () => void;
  onSave: (p: Omit<Profile, "id">) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [color, setColor] = useState(profile.color);

  return (
    <Modal title="Редактировать профиль" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="text-xs text-muted-foreground font-mono mb-1.5 block">Аватар</label><EmojiPicker value={avatar} onChange={setAvatar} /></div>
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Никнейм</label>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && name.trim() && onSave({ name: name.trim(), avatar, color })}
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-2 block">Цвет</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => name.trim() && onSave({ name: name.trim(), avatar, color })} disabled={!name.trim()}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold uppercase hover:opacity-90 disabled:opacity-30">
            Сохранить
          </button>
          {canDelete && (
            <button onClick={onDelete}
              className="px-4 py-2.5 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
              <Icon name="Trash2" size={14} />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── New Profile Modal ────────────────────────────────────────────────────────

function NewProfileModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Omit<Profile, "id">) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🎭");
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  function submit() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), avatar, color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
  }

  return (
    <Modal title="Новый профиль" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="text-xs text-muted-foreground font-mono mb-1.5 block">Аватар</label><EmojiPicker value={avatar} onChange={setAvatar} /></div>
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Никнейм</label>
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Имя или псевдоним"
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40" />
        </div>
        <button onClick={submit} disabled={!name.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold uppercase hover:opacity-90 disabled:opacity-30">
          Создать
        </button>
      </div>
    </Modal>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, icon: string) => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💬");
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  return (
    <Modal title="Новый чат" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Иконка чата</label>
          <EmojiPicker value={icon} onChange={setIcon} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Название</label>
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && onCreate(name.trim(), icon)}
            placeholder="Ночной лес, Клуб, Заброшка..."
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40" />
        </div>
        <button onClick={() => name.trim() && onCreate(name.trim(), icon)} disabled={!name.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold uppercase hover:opacity-90 disabled:opacity-30">
          Создать
        </button>
      </div>
    </Modal>
  );
}

// ─── Chat Settings Drawer ─────────────────────────────────────────────────────

function ChatSettingsDrawer({ chat, onClose, onUpdate }: {
  chat: Chat;
  onClose: () => void;
  onUpdate: (patch: Partial<Chat>) => void;
}) {
  const [name, setName] = useState(chat.name);
  const [icon, setIcon] = useState(chat.icon);

  function save() {
    onUpdate({ name: name.trim() || chat.name, icon });
    onClose();
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-[280px] flex flex-col bg-card/95 backdrop-blur-2xl border-l border-border/40 animate-slide-in-right shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
        <span className="font-display text-xs font-bold tracking-wider uppercase">Настройки чата</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <label className="text-[10px] font-mono text-muted-foreground/45 uppercase tracking-widest mb-1.5 block">Название</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 transition-colors" />
        </div>

        <div>
          <label className="text-[10px] font-mono text-muted-foreground/45 uppercase tracking-widest mb-2 block">Иконка чата</label>
          <EmojiPicker value={icon} onChange={setIcon} />
        </div>

        <div>
          <label className="text-[10px] font-mono text-muted-foreground/45 uppercase tracking-widest mb-2 block">Обои</label>
          <div className="grid grid-cols-2 gap-2">
            {BG_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => onUpdate({ bg: opt.id })}
                className={`h-14 rounded-xl ${opt.cls} flex flex-col items-center justify-center gap-0.5 border-2 transition-all ${chat.bg === opt.id ? "border-primary" : "border-transparent hover:border-border/60"}`}>
                <span className="text-base">{opt.icon}</span>
                <span className="text-[9px] font-mono text-white/50">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-border/30">
        <button onClick={save}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold uppercase hover:opacity-90 transition-all">
          Сохранить
        </button>
      </div>
    </div>
  );
}

// ─── Profile Switcher (bottom sheet) ─────────────────────────────────────────

function ProfileSwitcher({ profiles, activeId, onClose, onSelect, onNew, onEdit }: {
  profiles: Profile[];
  activeId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:w-[360px] max-w-full bg-popover border border-border/60 rounded-t-2xl sm:rounded-2xl p-5 animate-scale-in shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-xs font-bold tracking-wider uppercase">Профили</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={15} /></button>
        </div>

        <div className="space-y-1.5 mb-3">
          {profiles.map(p => (
            <div key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${activeId === p.id ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/20"}`}
              onClick={() => onSelect(p.id)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: p.color + "20", border: `1px solid ${p.color}40` }}>{p.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-display font-semibold truncate">{p.name}</div>
                {activeId === p.id && <div className="text-[10px] font-mono text-primary/70">активный профиль</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeId === p.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
                <button onClick={e => { e.stopPropagation(); onEdit(p.id); }}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors">
                  <Icon name="Pencil" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onNew}
          className="w-full py-2 rounded-xl border border-dashed border-border/40 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-1.5">
          <Icon name="Plus" size={12} /> добавить профиль
        </button>
      </div>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({ chat, activeProfile, onBack, onUpdate }: {
  chat: Chat;
  activeProfile: Profile;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Chat>) => void;
}) {
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.messages.length]);
  useEffect(() => { inputRef.current?.focus(); }, [chat.id]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const msg: Message = {
      id: uid(),
      text,
      profileId: activeProfile.id,
      displayName: activeProfile.name,
      avatar: activeProfile.avatar,
      color: activeProfile.color,
      ts: fmtTime(),
    };
    onUpdate(chat.id, { messages: [...chat.messages, msg] });
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col">
      {/* Wallpaper */}
      <div className={`absolute inset-0 ${bgCls(chat.bg)} transition-all duration-500`} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-4 py-3 bg-background/50 backdrop-blur-xl border-b border-border/25 shrink-0">
        <button onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all shrink-0">
          <Icon name="ArrowLeft" size={16} />
        </button>
        <div className="w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center text-lg shrink-0">
          {chat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-bold truncate">{chat.name}</div>
          <div className="text-[10px] font-mono text-muted-foreground/45">
            {chat.messages.length === 0 ? "пока тихо" : `${chat.messages.length} сообщений`}
          </div>
        </div>
        <button onClick={() => setShowSettings(v => !v)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${showSettings ? "border-primary/50 bg-primary/15 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground"}`}>
          <Icon name="Settings2" size={13} />
        </button>
      </header>

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-20">
              <div className="text-5xl animate-float">{chat.icon}</div>
              <span className="text-xs font-mono text-muted-foreground">начни историю...</span>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto pb-2">
              {chat.messages.map((msg, i) => {
                const isMe = msg.profileId === activeProfile.id;
                return (
                  <div key={msg.id}
                    className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"} animate-message-in`}
                    style={{ animationDelay: `${Math.min(i * 0.015, 0.2)}s`, opacity: 0, animationFillMode: "forwards" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5"
                      style={{ background: msg.color + "20", border: `1px solid ${msg.color}40` }}>
                      {msg.avatar}
                    </div>
                    <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] font-mono px-1" style={{ color: msg.color }}>{msg.displayName}</span>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-mono leading-relaxed ${isMe ? "bg-primary/25 border border-primary/30 rounded-tr-sm" : "bg-card/80 border border-border/30 backdrop-blur-sm rounded-tl-sm"}`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-muted-foreground/30 px-1">{msg.ts}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Settings drawer */}
        {showSettings && (
          <ChatSettingsDrawer
            chat={chat}
            onClose={() => setShowSettings(false)}
            onUpdate={patch => onUpdate(chat.id, patch)}
          />
        )}
      </div>

      {/* Input */}
      <div className="relative z-10 px-4 py-3 bg-background/50 backdrop-blur-xl border-t border-border/25 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ background: activeProfile.color + "20", border: `1px solid ${activeProfile.color}40` }}>
            {activeProfile.avatar}
          </div>
          <div className="flex-1 flex items-center bg-card/70 border border-border/35 rounded-xl px-4 py-2.5 focus-within:border-primary/40 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`${activeProfile.name} пишет...`}
              className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/30"
            />
          </div>
          <button onClick={send} disabled={!input.trim()}
            className="w-9 h-9 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
            <Icon name="Send" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Index() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Modals
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [editProfileId, setEditProfileId] = useState<string | null>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null;
  const activeChat    = chats.find(c => c.id === activeChatId) ?? null;

  // ── Profile actions ──────────────────────────────────

  function onFirstProfile(data: Omit<Profile, "id">) {
    const id = uid();
    const p = { id, ...data };
    setProfiles([p]);
    setActiveProfileId(id);
  }

  function createProfile(data: Omit<Profile, "id">) {
    const id = uid();
    setProfiles(prev => [...prev, { id, ...data }]);
    setActiveProfileId(id);
    setShowNewProfile(false);
  }

  function saveProfile(id: string, data: Omit<Profile, "id">) {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    setEditProfileId(null);
  }

  function deleteProfile(id: string) {
    const remaining = profiles.filter(p => p.id !== id);
    setProfiles(remaining);
    if (activeProfileId === id) setActiveProfileId(remaining[0]?.id ?? null);
    setEditProfileId(null);
  }

  // ── Chat actions ─────────────────────────────────────

  function createChat(name: string, icon: string) {
    const id = uid();
    setChats(prev => [...prev, { id, name, icon, bg: "void", messages: [], createdAt: fmtTime() }]);
    setActiveChatId(id);
    setShowNewChat(false);
  }

  function updateChat(id: string, patch: Partial<Chat>) {
    setChats(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function deleteChat(id: string) {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }

  // ── First-run: no profiles ────────────────────────────
  if (profiles.length === 0) {
    return <ProfileSetup onDone={onFirstProfile} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden mesh-bg">

      {/* ── Chat List Screen ─────────────────────────────── */}
      {!activeChatId && (
        <div className="flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
            <div className="font-display text-xs font-bold text-primary tracking-[0.2em]">WHISPER</div>
            <button onClick={() => setShowProfileSwitcher(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/30 hover:border-primary/40 transition-all">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-base"
                style={{ background: activeProfile!.color + "20", border: `1px solid ${activeProfile!.color}40` }}>
                {activeProfile!.avatar}
              </div>
              <span className="text-[11px] font-mono font-semibold truncate max-w-[80px]">{activeProfile!.name}</span>
              <Icon name="ChevronDown" size={11} className="text-muted-foreground/50 shrink-0" />
            </button>
          </div>

          {/* Chat list — centred */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-2">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <div className="text-5xl opacity-15 animate-float">💬</div>
                <div className="text-xs font-mono text-muted-foreground/40 text-center">
                  нет переписок<br />создай первую
                </div>
                <button onClick={() => setShowNewChat(true)}
                  className="px-5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-display font-semibold hover:bg-primary/20 transition-all">
                  Создать чат
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-1.5 py-1">
                {chats.map((chat, i) => {
                  const last = chat.messages[chat.messages.length - 1];
                  return (
                    <div key={chat.id}
                      className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-card/80 cursor-pointer transition-all animate-fade-in"
                      style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: "forwards" }}
                      onClick={() => setActiveChatId(chat.id)}>
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-2xl bg-secondary/60 flex items-center justify-center text-2xl shrink-0 border border-border/20">
                        {chat.icon}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-sm font-semibold truncate">{chat.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground/50 truncate mt-0.5">
                          {last ? <><span style={{ color: last.color }}>{last.displayName}:</span> {last.text}</> : "пока тихо..."}
                        </div>
                      </div>
                      {/* Meta */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono text-muted-foreground/30">{last?.ts ?? chat.createdAt}</span>
                        <button onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all">
                          <Icon name="Trash2" size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="px-4 py-4 border-t border-border/20 flex justify-center shrink-0">
            <button onClick={() => setShowNewChat(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-display font-semibold hover:bg-primary/20 transition-all">
              <Icon name="Plus" size={14} />
              Новый чат
            </button>
          </div>
        </div>
      )}

      {/* ── Chat View (full screen) ───────────────────────── */}
      {activeChatId && activeChat && activeProfile && (
        <ChatView
          chat={activeChat}
          activeProfile={activeProfile}
          onBack={() => setActiveChatId(null)}
          onUpdate={updateChat}
        />
      )}

      {/* ── Profile Switcher ──────────────────────────────── */}
      {showProfileSwitcher && (
        <ProfileSwitcher
          profiles={profiles}
          activeId={activeProfileId!}
          onClose={() => setShowProfileSwitcher(false)}
          onSelect={id => { setActiveProfileId(id); setShowProfileSwitcher(false); }}
          onNew={() => { setShowProfileSwitcher(false); setShowNewProfile(true); }}
          onEdit={id => { setShowProfileSwitcher(false); setEditProfileId(id); }}
        />
      )}

      {/* ── New Profile ───────────────────────────────────── */}
      {showNewProfile && (
        <NewProfileModal onClose={() => setShowNewProfile(false)} onCreate={createProfile} />
      )}

      {/* ── Edit Profile ──────────────────────────────────── */}
      {editProfileId && (
        <ProfileEditModal
          profile={profiles.find(p => p.id === editProfileId)!}
          onClose={() => setEditProfileId(null)}
          onSave={data => saveProfile(editProfileId, data)}
          onDelete={() => deleteProfile(editProfileId)}
          canDelete={profiles.length > 1}
        />
      )}

      {/* ── New Chat ──────────────────────────────────────── */}
      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} onCreate={createChat} />
      )}
    </div>
  );
}
