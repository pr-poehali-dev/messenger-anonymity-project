import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────

type Character = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  mask: string;
};

type Message = {
  id: string;
  text: string;
  characterId: string;
  ts: string;
  isOwn: boolean;
};

type Chat = {
  id: string;
  name: string;
  bg: BgKey;
  participants: string[]; // character ids
  messages: Message[];
  createdAt: string;
};

type AnonLevel = "full" | "partial" | "none";
type BgKey = "void" | "fog" | "blood" | "forest" | "dusk" | "abyss";
type Tab = "chats" | "chars";
type View = "list" | "chat";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ["👤","👻","🕵️","🧛","🐺","🌙","💀","🔮","🧟","🦇","🌲","🧕","🧙","🐉","🎭","🦊","🕷","🌊"];
const PALETTE = ["#c084fc","#4ade80","#fb923c","#60a5fa","#f472b6","#34d399","#fbbf24","#a78bfa","#f87171","#38bdf8"];

const BG_OPTIONS: { id: BgKey; label: string; icon: string; cls: string }[] = [
  { id: "void",   label: "Пустота",  icon: "✦", cls: "bg-gradient-to-br from-black via-slate-950 to-black" },
  { id: "fog",    label: "Туман",    icon: "≋", cls: "bg-gradient-to-br from-slate-900 via-slate-700/80 to-slate-900" },
  { id: "blood",  label: "Кровь",    icon: "◈", cls: "bg-gradient-to-br from-red-950 via-rose-900/90 to-stone-950" },
  { id: "forest", label: "Лес",      icon: "❧", cls: "bg-gradient-to-br from-green-950 via-emerald-900/80 to-stone-950" },
  { id: "dusk",   label: "Сумерки",  icon: "◎", cls: "bg-gradient-to-br from-indigo-950 via-purple-900/70 to-black" },
  { id: "abyss",  label: "Бездна",   icon: "⊗", cls: "bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-950" },
];

const ANON_OPTIONS: { id: AnonLevel; label: string; sub: string; icon: string }[] = [
  { id: "full",    label: "Аноним",  sub: "никто не знает кто ты",        icon: "EyeOff" },
  { id: "partial", label: "Маска",   sub: "видят имя персонажа, не тебя", icon: "Glasses" },
  { id: "none",    label: "Открыто", sub: "все видят настоящее имя",      icon: "Eye" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const bgCls = (key: BgKey) => BG_OPTIONS.find(b => b.id === key)?.cls ?? BG_OPTIONS[0].cls;
const fmtTime = (d = new Date()) => d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
const lastMsg = (chat: Chat) => chat.messages[chat.messages.length - 1]?.text ?? "пока тихо...";
const lastTs  = (chat: Chat) => chat.messages[chat.messages.length - 1]?.ts ?? chat.createdAt;

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ type, onAction }: { type: "chats" | "chars"; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-12 animate-fade-in">
      <div className="text-4xl opacity-20 animate-float">{type === "chats" ? "💬" : "🎭"}</div>
      <div className="text-center">
        <div className="text-xs font-mono text-muted-foreground/50 mb-3">
          {type === "chats" ? "нет переписок" : "нет персонажей"}
        </div>
        <button onClick={onAction} className="px-4 py-2 rounded-xl border border-dashed border-border/50 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex items-center gap-2 mx-auto">
          <Icon name="Plus" size={13} />
          {type === "chats" ? "создать переписку" : "создать персонажа"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${wide ? "w-[480px]" : "w-[340px]"} max-w-[calc(100vw-2rem)] bg-popover border border-border/60 rounded-2xl p-5 animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-display text-xs font-bold text-foreground tracking-wider uppercase">{title}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="X" size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({ onClose, onCreate, chars }: {
  onClose: () => void;
  onCreate: (name: string, bg: BgKey, participants: string[]) => void;
  chars: Character[];
}) {
  const [name, setName] = useState("");
  const [bg, setBg] = useState<BgKey>("void");
  const [selected, setSelected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  return (
    <Modal title="Новая переписка" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Название</label>
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && onCreate(name.trim(), bg, selected)}
            placeholder="Ночной лес, Подвал, Чердак..."
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Атмосфера</label>
          <div className="grid grid-cols-3 gap-2">
            {BG_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setBg(opt.id)}
                className={`py-2 rounded-xl text-xs font-mono transition-all flex flex-col items-center gap-1 ${bg === opt.id ? "bg-primary/20 border border-primary/50 text-primary" : "bg-secondary/30 border border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"}`}>
                <span className="text-base">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        {chars.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Участники <span className="text-muted-foreground/40">(необязательно)</span></label>
            <div className="space-y-1.5">
              {chars.map(char => (
                <button key={char.id} onClick={() => toggle(char.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${selected.includes(char.id) ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/20"}`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: char.color + "20", border: `1px solid ${char.color}40` }}>{char.emoji}</div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-mono font-semibold">{char.name}</div>
                    <div className="text-[10px] text-muted-foreground/50">маска: {char.mask}</div>
                  </div>
                  {selected.includes(char.id) && <Icon name="Check" size={13} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => name.trim() && onCreate(name.trim(), bg, selected)}
          disabled={!name.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold tracking-wide uppercase transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Создать
        </button>
      </div>
    </Modal>
  );
}

// ─── New Char Modal ───────────────────────────────────────────────────────────

function NewCharModal({ onClose, onCreate, charCount }: { onClose: () => void; onCreate: (c: Omit<Character, "id">) => void; charCount: number }) {
  const [name, setName] = useState("");
  const [mask, setMask] = useState("");
  const [emoji, setEmoji] = useState("👤");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), mask: mask.trim() || name.trim(), emoji, color: PALETTE[charCount % PALETTE.length] });
  }

  return (
    <Modal title="Новый персонаж" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Аватар</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? "bg-primary/25 border border-primary/50" : "bg-secondary/30 hover:bg-secondary/60 border border-transparent"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Настоящее имя</label>
          <input ref={inputRef} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Имя, которое знаешь только ты"
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Имя маски <span className="text-muted-foreground/40">(для анонимности)</span></label>
          <input value={mask} onChange={e => setMask(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Тёмная Странница, Наблюдатель..."
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40" />
        </div>
        <button onClick={submit} disabled={!name.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold tracking-wide uppercase transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
          Создать
        </button>
      </div>
    </Modal>
  );
}

// ─── Chat Settings Panel (right drawer in chat view) ─────────────────────────

function ChatSettingsPanel({ chat, chars, onClose, onSave }: {
  chat: Chat;
  chars: Character[];
  onClose: () => void;
  onSave: (patch: Partial<Pick<Chat, "name" | "bg" | "participants">>) => void;
}) {
  const [name, setName] = useState(chat.name);
  const [bg, setBg] = useState<BgKey>(chat.bg);
  const [participants, setParticipants] = useState<string[]>(chat.participants);

  function toggleParticipant(id: string) {
    setParticipants(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function save() {
    onSave({ name: name.trim() || chat.name, bg, participants });
    onClose();
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-[280px] flex flex-col bg-card/80 backdrop-blur-2xl border-l border-border/40 animate-slide-in-right shadow-2xl">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
        <span className="font-display text-xs font-bold tracking-wider uppercase">Настройки</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Name */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1.5 block">Название</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Wallpaper */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-2 block">Обои</label>
          <div className="grid grid-cols-2 gap-2">
            {BG_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setBg(opt.id)}
                className={`h-16 rounded-xl ${opt.cls} flex flex-col items-center justify-center gap-1 border-2 transition-all ${bg === opt.id ? "border-primary" : "border-transparent hover:border-border/60"}`}>
                <span className="text-lg">{opt.icon}</span>
                <span className="text-[10px] font-mono text-white/70">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-2 block">
            Участники <span className="text-muted-foreground/30">({participants.length})</span>
          </label>
          {chars.length === 0 ? (
            <div className="text-xs font-mono text-muted-foreground/40 text-center py-4">нет персонажей</div>
          ) : (
            <div className="space-y-1.5">
              {chars.map(char => {
                const active = participants.includes(char.id);
                return (
                  <button key={char.id} onClick={() => toggleParticipant(char.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${active ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/20"}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: char.color + "20", border: `1px solid ${char.color}40` }}>{char.emoji}</div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-mono font-semibold truncate">{char.name}</div>
                      <div className="text-[10px] text-muted-foreground/40 truncate">маска: {char.mask}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${active ? "bg-primary border-primary" : "border-border/40"}`}>
                      {active && <Icon name="Check" size={10} className="text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-border/30">
        <button onClick={save}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold tracking-wide uppercase hover:opacity-90 transition-all">
          Сохранить
        </button>
      </div>
    </div>
  );
}

// ─── Char Panel ───────────────────────────────────────────────────────────────

function CharPanel({ chars, activeCharId, anonLevel, onClose, onSelectChar, onAnonChange, onNewChar }: {
  chars: Character[];
  activeCharId: string | null;
  anonLevel: AnonLevel;
  onClose: () => void;
  onSelectChar: (id: string) => void;
  onAnonChange: (l: AnonLevel) => void;
  onNewChar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:w-[340px] max-w-full bg-popover border border-border/60 rounded-t-2xl sm:rounded-2xl p-5 animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-xs font-bold tracking-wider uppercase">Персонаж</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={15} /></button>
        </div>
        {chars.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {chars.map(char => (
              <button key={char.id} onClick={() => onSelectChar(char.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${activeCharId === char.id ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/20"}`}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: char.color + "20", border: `1px solid ${char.color}40` }}>{char.emoji}</div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-display font-semibold truncate">{char.name}</div>
                  <div className="text-[10px] text-muted-foreground/50 font-mono">маска: {char.mask}</div>
                </div>
                {activeCharId === char.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse-glow" />}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-border/30 pt-4">
          <div className="text-[10px] font-mono text-muted-foreground/40 mb-2 uppercase tracking-widest">Как тебя видят</div>
          <div className="grid grid-cols-3 gap-1.5">
            {ANON_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => { onAnonChange(opt.id); onClose(); }}
                className={`py-2.5 px-2 rounded-xl border text-[10px] font-mono transition-all flex flex-col items-center gap-1 ${anonLevel === opt.id ? "border-primary/50 bg-primary/15 text-primary" : "border-border/25 text-muted-foreground hover:border-border/50 hover:text-foreground"}`}>
                <Icon name={opt.icon} size={13} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={onNewChar}
          className="mt-3 w-full py-2 rounded-xl border border-dashed border-border/40 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-1.5">
          <Icon name="Plus" size={12} />новый персонаж
        </button>
      </div>
    </div>
  );
}

// ─── Chat View (full screen) ──────────────────────────────────────────────────

function ChatView({ chat, chars, activeCharId, anonLevel, onBack, onUpdateChat, onSetActiveChar, onAnonChange, onNewChar, onCreateChar }: {
  chat: Chat;
  chars: Character[];
  activeCharId: string | null;
  anonLevel: AnonLevel;
  onBack: () => void;
  onUpdateChat: (id: string, patch: Partial<Chat>) => void;
  onSetActiveChar: (id: string) => void;
  onAnonChange: (l: AnonLevel) => void;
  onNewChar: () => void;
  onCreateChar: (c: Omit<Character, "id">) => void;
}) {
  const [inputText, setInputText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [showNewChar, setShowNewChar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChar = chars.find(c => c.id === activeCharId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  function send() {
    if (!inputText.trim() || !activeCharId) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      text: inputText.trim(),
      characterId: activeCharId,
      ts: fmtTime(),
      isOwn: true,
    };
    onUpdateChat(chat.id, { messages: [...chat.messages, msg] });
    setInputText("");
    inputRef.current?.focus();
  }

  function getSenderLabel(msg: Message) {
    const char = chars.find(c => c.id === msg.characterId);
    if (!char) return "???";
    if (!msg.isOwn) return char.name;
    if (anonLevel === "full") return "Аноним";
    if (anonLevel === "partial") return char.mask || char.name;
    return char.name;
  }

  const participantChars = chat.participants.length > 0
    ? chars.filter(c => chat.participants.includes(c.id))
    : chars;

  return (
    <div className="fixed inset-0 z-20 flex flex-col animate-fade-in">
      {/* Bg */}
      <div className={`absolute inset-0 ${bgCls(chat.bg)} transition-all duration-500`} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-3 sm:px-5 py-3 bg-background/50 backdrop-blur-xl border-b border-border/25">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all shrink-0">
          <Icon name="ArrowLeft" size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-bold truncate">{chat.name}</div>
          <div className="text-[10px] font-mono text-muted-foreground/45 mt-0.5">
            {participantChars.length > 0
              ? participantChars.map(c => c.emoji).join(" ") + ` · ${participantChars.length} участн.`
              : chat.messages.length === 0 ? "пока тихо" : `${chat.messages.length} сообщ.`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Char / anon toggle */}
          <button onClick={() => setShowCharPanel(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/30 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-border/60 transition-all">
            <Icon name={anonLevel === "full" ? "EyeOff" : anonLevel === "partial" ? "Glasses" : "Eye"} size={12} />
            {activeChar ? (
              <span className="hidden sm:inline max-w-[70px] truncate">
                {anonLevel === "full" ? "аноним" : anonLevel === "partial" ? activeChar.mask : activeChar.name}
              </span>
            ) : <span>персонаж</span>}
          </button>

          {/* Settings toggle */}
          <button onClick={() => setShowSettings(v => !v)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${showSettings ? "border-primary/50 bg-primary/15 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"}`}>
            <Icon name="Settings2" size={13} />
          </button>
        </div>
      </header>

      {/* No char warning */}
      {!activeChar && (
        <div className="relative z-10 mx-4 mt-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/25 flex items-center gap-3 animate-fade-in">
          <Icon name="AlertTriangle" size={13} className="text-amber-400/70 shrink-0" />
          <span className="text-[11px] font-mono text-amber-300/60 flex-1">Создай персонажа, чтобы писать</span>
          <button onClick={() => setShowNewChar(true)} className="text-[11px] font-mono text-amber-400/80 hover:text-amber-300 underline shrink-0">создать</button>
        </div>
      )}

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          {chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-20">
              <div className="text-4xl animate-float">{BG_OPTIONS.find(b => b.id === chat.bg)?.icon ?? "✦"}</div>
              <span className="text-xs font-mono text-muted-foreground">начни историю...</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-w-2xl mx-auto">
              {chat.messages.map((msg, i) => {
                const char = chars.find(c => c.id === msg.characterId);
                const label = getSenderLabel(msg);
                return (
                  <div key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} animate-message-in`}
                    style={{ animationDelay: `${Math.min(i * 0.02, 0.25)}s`, opacity: 0, animationFillMode: "forwards" }}>
                    <div className={`flex flex-col gap-0.5 max-w-[75%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 px-1">
                        {!msg.isOwn && char && <span className="text-xs">{char.emoji}</span>}
                        <span className="text-[10px] font-mono font-medium" style={{ color: char?.color ?? "hsl(var(--muted-foreground))" }}>{label}</span>
                        {msg.isOwn && char && <span className="text-xs">{char.emoji}</span>}
                      </div>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] font-mono leading-relaxed ${msg.isOwn ? "bg-primary/20 border border-primary/25 text-foreground rounded-tr-sm" : "bg-card/75 border border-border/30 backdrop-blur-sm text-foreground rounded-tl-sm"}`}>
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
          <ChatSettingsPanel
            chat={chat}
            chars={chars}
            onClose={() => setShowSettings(false)}
            onSave={patch => onUpdateChat(chat.id, patch)}
          />
        )}
      </div>

      {/* Input */}
      <div className="relative z-10 px-3 sm:px-5 py-3 bg-background/50 backdrop-blur-xl border-t border-border/25">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          {activeChar && <span className="text-lg shrink-0 opacity-60 select-none">{activeChar.emoji}</span>}
          <div className="flex-1 flex items-center bg-card/60 border border-border/35 rounded-xl px-4 py-2.5 gap-2 focus-within:border-primary/40 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              disabled={!activeChar}
              placeholder={
                !activeChar ? "сначала создай персонажа..." :
                anonLevel === "full" ? "аноним пишет..." :
                anonLevel === "partial" ? `${activeChar.mask} пишет...` :
                `${activeChar.name} пишет...`
              }
              className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/30 disabled:cursor-not-allowed"
            />
          </div>
          <button onClick={send} disabled={!inputText.trim() || !activeChar}
            className="w-9 h-9 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-20 disabled:cursor-not-allowed">
            <Icon name="Send" size={14} />
          </button>
        </div>
      </div>

      {/* Panels */}
      {showCharPanel && (
        <CharPanel
          chars={chars}
          activeCharId={activeCharId}
          anonLevel={anonLevel}
          onClose={() => setShowCharPanel(false)}
          onSelectChar={id => { onSetActiveChar(id); setShowCharPanel(false); }}
          onAnonChange={onAnonChange}
          onNewChar={() => { setShowCharPanel(false); setShowNewChar(true); }}
        />
      )}
      {showNewChar && (
        <NewCharModal
          onClose={() => setShowNewChar(false)}
          onCreate={c => { onCreateChar(c); setShowNewChar(false); }}
          charCount={chars.length}
        />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [tab, setTab] = useState<Tab>("chats");
  const [view, setView] = useState<View>("list");
  const [chats, setChats] = useState<Chat[]>([]);
  const [chars, setChars] = useState<Character[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [anonLevel, setAnonLevel] = useState<AnonLevel>("partial");
  const [modal, setModal] = useState<"newChat" | "newChar" | "charPanel" | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;
  const activeChar = chars.find(c => c.id === activeCharId) ?? null;

  function openChat(id: string) {
    setActiveChatId(id);
    setView("chat");
  }

  function createChat(name: string, bg: BgKey, participants: string[]) {
    const id = `chat-${Date.now()}`;
    setChats(prev => [...prev, { id, name, bg, participants, messages: [], createdAt: fmtTime() }]);
    openChat(id);
    setModal(null);
  }

  function createChar(data: Omit<Character, "id">) {
    const id = `char-${Date.now()}`;
    setChars(prev => [...prev, { id, ...data }]);
    if (!activeCharId) setActiveCharId(id);
    setModal(null);
  }

  function updateChat(id: string, patch: Partial<Chat>) {
    setChats(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function deleteChat(id: string) {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) { setActiveChatId(null); setView("list"); }
  }

  function deleteChar(id: string) {
    setChars(prev => prev.filter(c => c.id !== id));
    if (activeCharId === id) {
      const rem = chars.filter(c => c.id !== id);
      setActiveCharId(rem[0]?.id ?? null);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden mesh-bg">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="flex flex-col w-[252px] shrink-0 border-r border-border/40 bg-card/50 backdrop-blur-xl z-10">

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center animate-pulse-glow shrink-0">
              <span className="text-sm">👁</span>
            </div>
            <div>
              <div className="font-display text-[11px] font-bold text-primary tracking-[0.2em]">WHISPER</div>
              <div className="text-[10px] text-muted-foreground/50 font-mono leading-none mt-0.5">анонимный мессенджер</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-3 pt-3 pb-1 gap-1">
          {(["chats", "chars"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-display font-semibold transition-all ${tab === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "chats" ? "Чаты" : "Персонажи"}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 min-h-0">
          {tab === "chats" && (
            chats.length === 0
              ? <EmptyState type="chats" onAction={() => setModal("newChat")} />
              : (
                <div className="space-y-0.5 py-1">
                  {chats.map((chat, i) => (
                    <div key={chat.id}
                      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 animate-fade-in ${activeChatId === chat.id ? "bg-primary/12 border border-primary/25" : "hover:bg-secondary/50 border border-transparent"}`}
                      style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: "forwards" }}
                      onClick={() => openChat(chat.id)}>
                      <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 text-sm font-mono">
                        {BG_OPTIONS.find(b => b.id === chat.bg)?.icon ?? "✦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-display font-semibold truncate">{chat.name}</div>
                        <div className="text-[10px] text-muted-foreground/50 font-mono truncate mt-0.5">{lastMsg(chat)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] text-muted-foreground/35 font-mono">{lastTs(chat)}</span>
                        <button onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all">
                          <Icon name="Trash2" size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}

          {tab === "chars" && (
            chars.length === 0
              ? <EmptyState type="chars" onAction={() => setModal("newChar")} />
              : (
                <div className="space-y-0.5 py-1">
                  {chars.map((char, i) => (
                    <div key={char.id}
                      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 animate-fade-in ${activeCharId === char.id ? "bg-primary/12 border border-primary/25" : "hover:bg-secondary/50 border border-transparent"}`}
                      style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: "forwards" }}
                      onClick={() => setActiveCharId(char.id)}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: char.color + "20", border: `1px solid ${char.color}40` }}>{char.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-display font-semibold truncate">{char.name}</div>
                        <div className="text-[10px] text-muted-foreground/50 font-mono truncate">маска: {char.mask}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {activeCharId === char.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
                        <button onClick={e => { e.stopPropagation(); deleteChar(char.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all">
                          <Icon name="Trash2" size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}
        </div>

        {/* Add button */}
        <div className="px-3 py-3 border-t border-border/30">
          <button onClick={() => setModal(tab === "chats" ? "newChat" : "newChar")}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border/40 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
            <Icon name="Plus" size={12} />
            {tab === "chats" ? "новый чат" : "новый персонаж"}
          </button>
        </div>

        {/* Active char footer */}
        {activeChar && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/25 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setModal("charPanel")}>
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">{activeChar.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono font-semibold truncate">{activeChar.name}</div>
                <div className="text-[9px] text-muted-foreground/45 font-mono">
                  {anonLevel === "full" ? "режим: аноним" : anonLevel === "partial" ? `маска: ${activeChar.mask}` : "режим: открыто"}
                </div>
              </div>
              <Icon name="ChevronUp" size={12} className="text-muted-foreground/35 shrink-0" />
            </div>
          </div>
        )}
      </aside>

      {/* ── Welcome (desktop right panel) ─────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 animate-fade-in">
          <div className="text-center">
            <div className="font-display text-xl font-bold text-foreground/10 tracking-[0.3em] mb-3">WHISPER</div>
            <div className="text-sm font-mono text-muted-foreground/35">
              {chats.length === 0 ? "создай переписку, чтобы начать историю" : "выбери переписку слева"}
            </div>
          </div>
          {chats.length === 0 && (
            <button onClick={() => setModal("newChat")}
              className="px-5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-display font-semibold hover:bg-primary/20 transition-all">
              Создать переписку
            </button>
          )}
        </div>
      </main>

      {/* ── Full-screen chat (overlays everything) ──────── */}
      {view === "chat" && activeChat && (
        <ChatView
          chat={activeChat}
          chars={chars}
          activeCharId={activeCharId}
          anonLevel={anonLevel}
          onBack={() => setView("list")}
          onUpdateChat={updateChat}
          onSetActiveChar={setActiveCharId}
          onAnonChange={setAnonLevel}
          onNewChar={() => setModal("newChar")}
          onCreateChar={createChar}
        />
      )}

      {/* ── Global modals ────────────────────────────────── */}
      {modal === "newChat" && (
        <NewChatModal onClose={() => setModal(null)} onCreate={createChat} chars={chars} />
      )}
      {modal === "newChar" && (
        <NewCharModal onClose={() => setModal(null)} onCreate={createChar} charCount={chars.length} />
      )}
      {modal === "charPanel" && (
        <CharPanel
          chars={chars}
          activeCharId={activeCharId}
          anonLevel={anonLevel}
          onClose={() => setModal(null)}
          onSelectChar={id => { setActiveCharId(id); setModal(null); }}
          onAnonChange={setAnonLevel}
          onNewChar={() => setModal("newChar")}
        />
      )}
    </div>
  );
}
