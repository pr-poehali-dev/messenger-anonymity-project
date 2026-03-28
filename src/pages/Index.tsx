import { useState } from "react";
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
  lastMsg: string;
  ts: string;
  unread: number;
  bg: string;
  isGroup: boolean;
  messages: Message[];
};

type AnonLevel = "full" | "partial" | "none";

// ─── Data ────────────────────────────────────────────────────────────────────

const BACKGROUNDS = [
  { id: "default", label: "🌑 Тьма" },
  { id: "fog", label: "🌫 Туман" },
  { id: "blood", label: "🩸 Кровь" },
  { id: "forest", label: "🌲 Лес" },
  { id: "void", label: "✨ Пустота" },
];

const INIT_CHARACTERS: Character[] = [
  { id: "c1", name: "Мария Климова", emoji: "🧕", color: "#c084fc", mask: "Незнакомка" },
  { id: "c2", name: "Дух леса", emoji: "🌲", color: "#4ade80", mask: "Природа" },
  { id: "c3", name: "Детектив Орлов", emoji: "🕵️", color: "#fb923c", mask: "Следователь" },
];

const INIT_CHATS: Chat[] = [
  {
    id: "ch1", name: "Ночной лес", lastMsg: "Ты слышишь шёпот деревьев?",
    ts: "23:47", unread: 3, bg: "default", isGroup: true,
    messages: [
      { id: "m1", text: "Ты слышишь шёпот деревьев?", characterId: "c2", ts: "23:47", isOwn: false },
      { id: "m2", text: "Я чувствую что-то... необычное", characterId: "c1", ts: "23:48", isOwn: true },
      { id: "m3", text: "Это я. Я здесь уже давно.", characterId: "c2", ts: "23:49", isOwn: false },
    ]
  },
  {
    id: "ch2", name: "Таинственный незнакомец", lastMsg: "Не открывай дверь",
    ts: "01:13", unread: 1, bg: "blood", isGroup: false,
    messages: [
      { id: "m4", text: "Не открывай дверь", characterId: "c3", ts: "01:13", isOwn: false },
      { id: "m5", text: "Почему? Кто там?", characterId: "c1", ts: "01:14", isOwn: true },
    ]
  },
  {
    id: "ch3", name: "Группа выживших", lastMsg: "Нас осталось трое",
    ts: "вчера", unread: 0, bg: "fog", isGroup: true,
    messages: [
      { id: "m6", text: "Нас осталось трое", characterId: "c3", ts: "вчера", isOwn: false },
    ]
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BG_CLASSES: Record<string, string> = {
  default: "mesh-bg",
  fog: "bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900",
  blood: "bg-gradient-to-br from-red-950 via-rose-900 to-stone-950",
  forest: "bg-gradient-to-br from-green-950 via-emerald-900 to-stone-950",
  void: "bg-gradient-to-br from-black via-indigo-950 to-black",
};

const ANON_LABELS: Record<AnonLevel, string> = {
  full: "Полная анонимность",
  partial: "Маска персонажа",
  none: "Открытый профиль",
};
const ANON_DESC: Record<AnonLevel, string> = {
  full: "Никто не видит кто ты — только текст",
  partial: "Видят имя маски, но не твоё",
  none: "Все видят твоё настоящее имя",
};
const ANON_COLORS: Record<AnonLevel, string> = {
  full: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  partial: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  none: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpookyDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-8 right-8 text-4xl opacity-10 animate-float" style={{ animationDelay: "0s" }}>👁</div>
      <div className="absolute top-1/3 left-4 text-2xl opacity-5 animate-float" style={{ animationDelay: "1s" }}>🕸</div>
      <div className="absolute bottom-16 right-12 text-3xl opacity-5 animate-float" style={{ animationDelay: "2s" }}>🦇</div>
      <div className="absolute top-1/2 right-6 text-xl opacity-5 animate-float" style={{ animationDelay: "0.5s" }}>☽</div>
    </div>
  );
}

function AnonBadge({ level }: { level: AnonLevel }) {
  const icons: Record<AnonLevel, string> = { full: "EyeOff", partial: "Glasses", none: "Eye" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono ${ANON_COLORS[level]}`}>
      <Icon name={icons[level]} size={10} />
      {ANON_LABELS[level]}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [tab, setTab] = useState<"chats" | "chars">("chats");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>(INIT_CHATS);
  const [characters, setCharacters] = useState<Character[]>(INIT_CHARACTERS);
  const [activeCharId, setActiveCharId] = useState("c1");
  const [inputText, setInputText] = useState("");
  const [chatBg, setChatBg] = useState("default");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showAnonPanel, setShowAnonPanel] = useState(false);
  const [anonLevel, setAnonLevel] = useState<AnonLevel>("partial");
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [showNewChar, setShowNewChar] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [newCharEmoji, setNewCharEmoji] = useState("👤");
  const [newCharMask, setNewCharMask] = useState("");

  const activeChar = characters.find(c => c.id === activeCharId) ?? characters[0];

  function openChat(chat: Chat) {
    setActiveChat(chat);
    setChatBg(chat.bg);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
    setShowBgPicker(false);
    setShowAnonPanel(false);
    setShowCharPanel(false);
  }

  function sendMessage() {
    if (!inputText.trim() || !activeChat) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      text: inputText.trim(),
      characterId: activeCharId,
      ts: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
    };
    const updated = chats.map(c =>
      c.id === activeChat.id
        ? { ...c, messages: [...c.messages, msg], lastMsg: msg.text, ts: msg.ts }
        : c
    );
    setChats(updated);
    setActiveChat(updated.find(c => c.id === activeChat.id) ?? null);
    setInputText("");
  }

  function addCharacter() {
    if (!newCharName.trim()) return;
    const palette = ["#c084fc", "#4ade80", "#fb923c", "#60a5fa", "#f472b6", "#34d399"];
    const nc: Character = {
      id: `c${Date.now()}`,
      name: newCharName.trim(),
      emoji: newCharEmoji,
      color: palette[characters.length % palette.length],
      mask: newCharMask.trim() || "Неизвестный",
    };
    setCharacters(prev => [...prev, nc]);
    setNewCharName(""); setNewCharEmoji("👤"); setNewCharMask("");
    setShowNewChar(false);
  }

  function getSenderLabel(msg: Message) {
    const char = characters.find(c => c.id === msg.characterId);
    if (!char) return "???";
    if (!msg.isOwn) return char.name;
    if (anonLevel === "full") return "Аноним";
    if (anonLevel === "partial") return char.mask;
    return char.name;
  }

  const bgClass = BG_CLASSES[chatBg] ?? BG_CLASSES.default;
  const closeDropdowns = () => { setShowBgPicker(false); setShowAnonPanel(false); setShowCharPanel(false); };

  return (
    <div className="flex h-screen w-screen overflow-hidden mesh-bg relative">
      <SpookyDecor />

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="relative z-10 flex flex-col w-72 shrink-0 border-r border-border/50 bg-card/60 backdrop-blur-xl">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-pulse-glow">
              <span className="text-lg">👁</span>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-primary tracking-widest">WHISPER</div>
              <div className="text-xs text-muted-foreground font-mono">страшные переписки</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mt-3 bg-secondary/40 rounded-xl p-1 gap-1">
          {(["chats", "chars"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200 ${
                tab === t
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "chats" ? "💬 Чаты" : "🎭 Персонажи"}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto mt-2 px-2">
          {tab === "chats" && (
            <div className="space-y-1 py-1">
              {chats.map((chat, i) => (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 animate-fade-in ${
                    activeChat?.id === chat.id
                      ? "bg-primary/15 border border-primary/30"
                      : "hover:bg-secondary/60 border border-transparent"
                  }`}
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center text-lg shrink-0">
                      {chat.isGroup ? "👥" : "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs font-semibold truncate">{chat.name}</span>
                        <span className="text-xs text-muted-foreground ml-1 shrink-0">{chat.ts}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{chat.lastMsg}</span>
                        {chat.unread > 0 && (
                          <span className="ml-1 shrink-0 w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === "chars" && (
            <div className="space-y-2 px-1 py-1">
              {characters.map((char, i) => (
                <div
                  key={char.id}
                  onClick={() => setActiveCharId(char.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 animate-fade-in ${
                    activeCharId === char.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/30 hover:border-border/60 bg-secondary/20"
                  }`}
                  style={{ animationDelay: `${i * 0.06}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: char.color + "25", border: `1px solid ${char.color}50` }}
                    >
                      {char.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-xs font-semibold truncate">{char.name}</div>
                      <div className="text-xs text-muted-foreground">маска: <span className="text-foreground/70">{char.mask}</span></div>
                    </div>
                    {activeCharId === char.id && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow shrink-0" />
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowNewChar(true)}
                className="w-full py-3 rounded-xl border border-dashed border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 font-mono flex items-center justify-center gap-2"
              >
                <Icon name="Plus" size={14} />
                новый персонаж
              </button>
            </div>
          )}
        </div>

        {/* Active char */}
        <div className="px-4 py-3 border-t border-border/40">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40">
            <span className="text-base shrink-0">{activeChar.emoji}</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-xs font-display font-semibold truncate">{activeChar.name}</div>
              <AnonBadge level={anonLevel} />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Chat Area ───────────────────────────────────── */}
      <main className="relative flex-1 flex flex-col overflow-hidden">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="text-7xl mb-5 animate-float">🌑</div>
              <div className="font-display text-2xl text-primary mb-2 text-glow">Выбери переписку</div>
              <div className="text-sm text-muted-foreground font-mono">или создай новую историю</div>
              <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground/40">
                <span className="text-2xl animate-float" style={{ animationDelay: "0.2s" }}>👻</span>
                <span className="text-2xl animate-float" style={{ animationDelay: "0.8s" }}>🕯</span>
                <span className="text-2xl animate-float" style={{ animationDelay: "1.4s" }}>🌙</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat bg layer */}
            <div className={`absolute inset-0 ${bgClass} transition-all duration-700`} />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-5 py-3 bg-background/50 backdrop-blur-xl border-b border-border/30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="ArrowLeft" size={18} />
                </button>
                <div>
                  <div className="font-display text-sm font-bold">{activeChat.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {activeChat.isGroup ? "группа · " : "личный · "}
                    {activeChat.messages.length} сообщений
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowAnonPanel(v => !v); setShowCharPanel(false); setShowBgPicker(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                    showAnonPanel ? "bg-primary/20 border-primary/50 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon name="EyeOff" size={13} />
                  Анонимность
                </button>

                <button
                  onClick={() => { setShowCharPanel(v => !v); setShowAnonPanel(false); setShowBgPicker(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                    showCharPanel ? "bg-accent/20 border-accent/50 text-accent-foreground" : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{activeChar.emoji}</span>
                  {activeChar.name}
                </button>

                <button
                  onClick={() => { setShowBgPicker(v => !v); setShowAnonPanel(false); setShowCharPanel(false); }}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                    showBgPicker ? "border-primary/50 text-primary bg-primary/10" : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon name="Palette" size={15} />
                </button>
              </div>
            </header>

            {/* Anon Panel */}
            {showAnonPanel && (
              <div className="absolute top-[61px] right-40 z-30 w-72 bg-popover border border-border/60 rounded-2xl shadow-2xl p-4 animate-scale-in backdrop-blur-xl">
                <div className="font-display text-xs font-bold mb-3 text-primary">Уровень анонимности</div>
                <div className="space-y-2">
                  {(["full", "partial", "none"] as AnonLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => { setAnonLevel(lvl); setShowAnonPanel(false); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        anonLevel === lvl ? ANON_COLORS[lvl] : "border-border/30 hover:border-border/60"
                      }`}
                    >
                      <div className="text-xs font-display font-semibold mb-0.5">{ANON_LABELS[lvl]}</div>
                      <div className="text-xs text-muted-foreground">{ANON_DESC[lvl]}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Char switcher Panel */}
            {showCharPanel && (
              <div className="absolute top-[61px] right-20 z-30 w-64 bg-popover border border-border/60 rounded-2xl shadow-2xl p-4 animate-scale-in backdrop-blur-xl">
                <div className="font-display text-xs font-bold mb-3 text-foreground">Писать от лица</div>
                <div className="space-y-2">
                  {characters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => { setActiveCharId(char.id); setShowCharPanel(false); }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                        activeCharId === char.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/30 hover:border-border/60"
                      }`}
                    >
                      <span className="text-xl">{char.emoji}</span>
                      <div>
                        <div className="text-xs font-display font-semibold">{char.name}</div>
                        <div className="text-xs text-muted-foreground">маска: {char.mask}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bg Picker */}
            {showBgPicker && (
              <div className="absolute top-[61px] right-4 z-30 bg-popover border border-border/60 rounded-2xl shadow-2xl p-3 animate-scale-in backdrop-blur-xl">
                <div className="font-display text-xs font-bold mb-2 text-muted-foreground">Атмосфера</div>
                <div className="flex flex-col gap-1">
                  {BACKGROUNDS.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        setChatBg(bg.id);
                        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, bg: bg.id } : c));
                        setActiveChat(prev => prev ? { ...prev, bg: bg.id } : prev);
                        setShowBgPicker(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-mono text-left transition-all ${
                        chatBg === bg.id
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "hover:bg-secondary/60 text-muted-foreground border border-transparent"
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3"
              onClick={closeDropdowns}
            >
              {activeChat.messages.map((msg, i) => {
                const char = characters.find(c => c.id === msg.characterId);
                const label = getSenderLabel(msg);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} animate-message-in`}
                    style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: "forwards" }}
                  >
                    <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${msg.isOwn ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 px-1">
                        {!msg.isOwn && <span className="text-sm">{char?.emoji}</span>}
                        <span
                          className="text-xs font-display font-semibold"
                          style={{ color: msg.isOwn ? "hsl(var(--primary))" : (char?.color ?? "hsl(var(--muted-foreground))") }}
                        >
                          {label}
                        </span>
                        {msg.isOwn && <span className="text-sm">{char?.emoji}</span>}
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm font-mono leading-relaxed ${
                          msg.isOwn
                            ? "bg-primary/20 border border-primary/30 text-foreground rounded-tr-sm"
                            : "bg-card/80 border border-border/40 backdrop-blur-sm text-foreground rounded-tl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-xs text-muted-foreground/60 px-1">{msg.ts}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="relative z-10 px-4 py-3 bg-background/50 backdrop-blur-xl border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-card/60 border border-border/40 rounded-2xl px-4 py-2.5 focus-within:border-primary/50 transition-colors">
                  <span className="text-base shrink-0">{activeChar.emoji}</span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={`Пишет ${anonLevel === "full" ? "Аноним" : anonLevel === "partial" ? activeChar.mask : activeChar.name}...`}
                    className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="Send" size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── New Character Modal ──────────────────────────── */}
      {showNewChar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowNewChar(false)}
        >
          <div className="w-80 bg-popover border border-border/60 rounded-2xl p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display text-sm font-bold text-primary">Новый персонаж</div>
              <button onClick={() => setShowNewChar(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-mono mb-1 block">Выбери эмодзи</label>
                <div className="flex gap-2 flex-wrap">
                  {["👤", "👻", "🕵️", "🧛", "🐺", "🌙", "💀", "🔮", "🧟", "🦇", "🌲", "🧕"].map(e => (
                    <button
                      key={e}
                      onClick={() => setNewCharEmoji(e)}
                      className={`w-9 h-9 rounded-xl text-xl transition-all ${
                        newCharEmoji === e ? "bg-primary/20 border border-primary/50" : "bg-secondary/40 hover:bg-secondary/70"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-mono mb-1 block">Настоящее имя</label>
                <input
                  type="text"
                  value={newCharName}
                  onChange={e => setNewCharName(e.target.value)}
                  placeholder="Анастасия Климова"
                  className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-mono mb-1 block">Имя маски (анонимное)</label>
                <input
                  type="text"
                  value={newCharMask}
                  onChange={e => setNewCharMask(e.target.value)}
                  placeholder="Тёмная Странница"
                  className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <button
                onClick={addCharacter}
                disabled={!newCharName.trim()}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-display text-sm font-semibold transition-all hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Создать персонажа
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
