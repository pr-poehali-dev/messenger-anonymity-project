import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

type Character = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  mask: string;
};

// Real person added to a chat group
type Member = {
  id: string;
  name: string;   // real name
  role: string;   // role / alias shown in chat
  emoji: string;
  color: string;
};

type Message = {
  id: string;
  text: string;
  senderId: string;       // characterId or memberId
  senderKind: "char" | "member";
  displayName: string;    // resolved at send-time
  emoji: string;
  color: string;
  ts: string;
};

type BgKey = "void" | "fog" | "blood" | "forest" | "dusk" | "abyss" | "custom";

type Chat = {
  id: string;
  name: string;
  cover: string;          // gradient class or "" for solid
  bg: BgKey;
  wallpaper: string;      // extra overlay / custom image url
  participants: string[]; // character ids
  members: Member[];      // real people
  messages: Message[];
  createdAt: string;
};

type AnonLevel = "full" | "partial" | "none";
type Tab = "chats" | "chars";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_LIST = ["👤","👻","🕵️","🧛","🐺","🌙","💀","🔮","🧟","🦇","🌲","🧕","🧙","🐉","🎭","🦊","🕷","🌊","🌹","⚔️","🗡","🧿","🔥","🌑","☁️","🩸"];
const PALETTE   = ["#c084fc","#4ade80","#fb923c","#60a5fa","#f472b6","#34d399","#fbbf24","#a78bfa","#f87171","#38bdf8","#e879f9","#86efac"];

const BG_OPTIONS: { id: BgKey; label: string; icon: string; cls: string }[] = [
  { id: "void",   label: "Пустота",  icon: "✦", cls: "bg-gradient-to-br from-black via-slate-950 to-black" },
  { id: "fog",    label: "Туман",    icon: "≋", cls: "bg-gradient-to-br from-slate-800 via-slate-600/60 to-slate-900" },
  { id: "blood",  label: "Кровь",    icon: "◈", cls: "bg-gradient-to-br from-red-950 via-rose-900/90 to-stone-950" },
  { id: "forest", label: "Лес",      icon: "❧", cls: "bg-gradient-to-br from-green-950 via-emerald-900/80 to-stone-950" },
  { id: "dusk",   label: "Сумерки",  icon: "◎", cls: "bg-gradient-to-br from-indigo-950 via-purple-900/70 to-black" },
  { id: "abyss",  label: "Бездна",   icon: "⊗", cls: "bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-950" },
];

const COVER_OPTIONS = [
  { id: "none",    label: "Нет",      cls: "" },
  { id: "purple",  label: "Фиолет",   cls: "bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900" },
  { id: "crimson", label: "Багровый", cls: "bg-gradient-to-r from-rose-950 via-red-800 to-rose-950" },
  { id: "emerald", label: "Изумруд",  cls: "bg-gradient-to-r from-emerald-950 via-teal-800 to-emerald-950" },
  { id: "ocean",   label: "Океан",    cls: "bg-gradient-to-r from-blue-950 via-cyan-800 to-blue-950" },
  { id: "night",   label: "Ночь",     cls: "bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900" },
  { id: "gold",    label: "Золото",   cls: "bg-gradient-to-r from-yellow-950 via-amber-700 to-yellow-950" },
];

const ANON_OPTIONS: { id: AnonLevel; label: string; sub: string; icon: string }[] = [
  { id: "full",    label: "Аноним",  sub: "никто не знает кто ты",        icon: "EyeOff" },
  { id: "partial", label: "Маска",   sub: "видят имя персонажа, не тебя", icon: "Glasses" },
  { id: "none",    label: "Открыто", sub: "все видят настоящее имя",      icon: "Eye" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const bgCls  = (key: BgKey) => BG_OPTIONS.find(b => b.id === key)?.cls ?? BG_OPTIONS[0].cls;
const fmtTime = (d = new Date()) => d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
const lastMsg = (c: Chat) => c.messages[c.messages.length - 1]?.text ?? "пока тихо...";
const lastTs  = (c: Chat) => c.messages[c.messages.length - 1]?.ts  ?? c.createdAt;
const uid     = () => Math.random().toString(36).slice(2);

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
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

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EMOJI_LIST.map(e => (
        <button key={e} onClick={() => onChange(e)}
          className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${value === e ? "bg-primary/25 border border-primary/50" : "bg-secondary/30 hover:bg-secondary/60 border border-transparent"}`}>
          {e}
        </button>
      ))}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, onEnter, autoFocus }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; onEnter?: () => void; autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <div>
      {label && <label className="text-xs text-muted-foreground font-mono mb-1.5 block">{label}</label>}
      <input ref={autoFocus ? ref : undefined} value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className="w-full bg-secondary/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40" />
    </div>
  );
}

function EmptyState({ type, onAction }: { type: "chats" | "chars"; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-12 animate-fade-in">
      <div className="text-4xl opacity-20 animate-float">{type === "chats" ? "💬" : "🎭"}</div>
      <div className="text-center">
        <div className="text-xs font-mono text-muted-foreground/50 mb-3">
          {type === "chats" ? "нет переписок" : "нет персонажей"}
        </div>
        <button onClick={onAction}
          className="px-4 py-2 rounded-xl border border-dashed border-border/50 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex items-center gap-2 mx-auto">
          <Icon name="Plus" size={13} />
          {type === "chats" ? "создать переписку" : "создать персонажа"}
        </button>
      </div>
    </div>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({ onClose, onCreate, chars }: {
  onClose: () => void;
  onCreate: (name: string, charIds: string[]) => void;
  chars: Character[];
}) {
  const [name, setName] = useState("");
  const [sel, setSel] = useState<string[]>([]);

  function toggle(id: string) { setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }

  return (
    <Modal title="Новая переписка" onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Название" value={name} onChange={setName} placeholder="Ночной лес, Клуб, Заброшка..." autoFocus onEnter={() => name.trim() && onCreate(name.trim(), sel)} />
        {chars.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Персонажи-участники <span className="text-muted-foreground/40">(необязательно)</span></label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {chars.map(c => (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${sel.includes(c.id) ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/20"}`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: c.color + "20", border: `1px solid ${c.color}40` }}>{c.emoji}</div>
                  <div className="flex-1 text-left"><div className="text-xs font-mono font-semibold">{c.name}</div></div>
                  {sel.includes(c.id) && <Icon name="Check" size={13} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => name.trim() && onCreate(name.trim(), sel)} disabled={!name.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold tracking-wide uppercase transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
          Создать
        </button>
      </div>
    </Modal>
  );
}

// ─── New Char Modal ───────────────────────────────────────────────────────────

function NewCharModal({ onClose, onCreate, count }: { onClose: () => void; onCreate: (c: Omit<Character, "id">) => void; count: number }) {
  const [name, setName] = useState("");
  const [mask, setMask] = useState("");
  const [emoji, setEmoji] = useState("👤");

  function submit() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), mask: mask.trim() || name.trim(), emoji, color: PALETTE[count % PALETTE.length] });
  }

  return (
    <Modal title="Новый персонаж" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="text-xs text-muted-foreground font-mono mb-1.5 block">Аватар</label><EmojiPicker value={emoji} onChange={setEmoji} /></div>
        <TextInput label="Настоящее имя" value={name} onChange={setName} placeholder="Имя, которое знаешь только ты" autoFocus onEnter={submit} />
        <TextInput label="Имя маски (для анонимности)" value={mask} onChange={setMask} placeholder="Тёмная Странница, Наблюдатель..." onEnter={submit} />
        <button onClick={submit} disabled={!name.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold tracking-wide uppercase transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
          Создать
        </button>
      </div>
    </Modal>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({ onClose, onAdd, existing }: { onClose: () => void; onAdd: (m: Omit<Member, "id">) => void; existing: Member[]; }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [emoji, setEmoji] = useState("👤");
  const count = existing.length;

  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), role: role.trim() || name.trim(), emoji, color: PALETTE[(count + 5) % PALETTE.length] });
  }

  return (
    <Modal title="Добавить участника" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="text-xs text-muted-foreground font-mono mb-1.5 block">Аватар</label><EmojiPicker value={emoji} onChange={setEmoji} /></div>
        <TextInput label="Реальное имя" value={name} onChange={setName} placeholder="Имя человека" autoFocus onEnter={submit} />
        <TextInput label="Роль / псевдоним в чате" value={role} onChange={setRole} placeholder="Хранитель, Наблюдатель..." onEnter={submit} />
        <button onClick={submit} disabled={!name.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold tracking-wide uppercase transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
          Добавить
        </button>
      </div>
    </Modal>
  );
}

// ─── Chat Settings Drawer ─────────────────────────────────────────────────────

function ChatSettingsDrawer({ chat, chars, onClose, onUpdate, onAddMember, onRemoveMember }: {
  chat: Chat;
  chars: Character[];
  onClose: () => void;
  onUpdate: (patch: Partial<Chat>) => void;
  onAddMember: () => void;
  onRemoveMember: (id: string) => void;
}) {
  const [tab, setTab] = useState<"wallpaper" | "members">("wallpaper");

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-[280px] flex flex-col bg-card/90 backdrop-blur-2xl border-l border-border/40 animate-slide-in-right shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
        <div className="flex gap-1">
          {(["wallpaper", "members"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-display font-semibold transition-all ${tab === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "wallpaper" ? "Обои" : "Участники"}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "wallpaper" && (
          <div className="px-4 py-4 space-y-5">
            {/* Cover / заставка */}
            <div>
              <div className="text-[10px] font-mono text-muted-foreground/45 uppercase tracking-widest mb-2">Заставка чата</div>
              <div className="space-y-1.5">
                {COVER_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => onUpdate({ cover: opt.cls })}
                    className={`w-full h-10 rounded-xl ${opt.cls || "bg-secondary/40"} flex items-center justify-center border-2 transition-all ${chat.cover === opt.cls ? "border-primary" : "border-transparent hover:border-border/60"}`}>
                    <span className="text-[11px] font-mono text-white/60">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper / обои */}
            <div>
              <div className="text-[10px] font-mono text-muted-foreground/45 uppercase tracking-widest mb-2">Обои чата</div>
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
        )}

        {tab === "members" && (
          <div className="px-4 py-4 space-y-4">
            {/* Chars */}
            {chars.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-muted-foreground/45 uppercase tracking-widest mb-2">Персонажи</div>
                <div className="space-y-1.5">
                  {chars.map(c => {
                    const active = chat.participants.includes(c.id);
                    return (
                      <button key={c.id}
                        onClick={() => onUpdate({ participants: active ? chat.participants.filter(x => x !== c.id) : [...chat.participants, c.id] })}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${active ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/15"}`}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: c.color + "20", border: `1px solid ${c.color}40` }}>{c.emoji}</div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-xs font-mono font-semibold truncate">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground/40">маска: {c.mask}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${active ? "bg-primary border-primary" : "border-border/40"}`}>
                          {active && <Icon name="Check" size={9} className="text-primary-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-mono text-muted-foreground/45 uppercase tracking-widest">Реальные люди</div>
                <button onClick={onAddMember} className="text-[10px] font-mono text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  <Icon name="Plus" size={11} /> добавить
                </button>
              </div>
              {chat.members.length === 0 ? (
                <div className="text-xs font-mono text-muted-foreground/30 text-center py-4">никого нет</div>
              ) : (
                <div className="space-y-1.5">
                  {chat.members.map(m => (
                    <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-secondary/20 border border-border/25">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: m.color + "20", border: `1px solid ${m.color}40` }}>{m.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-semibold truncate">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground/40">роль: {m.role}</div>
                      </div>
                      <button onClick={() => onRemoveMember(m.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors shrink-0">
                        <Icon name="Trash2" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Char Panel (bottom sheet) ────────────────────────────────────────────────

function CharPanel({ chars, members, activeId, activeKind, anonLevel, onClose, onSelectChar, onSelectMember, onAnonChange, onNewChar }: {
  chars: Character[];
  members: Member[];
  activeId: string | null;
  activeKind: "char" | "member";
  anonLevel: AnonLevel;
  onClose: () => void;
  onSelectChar: (id: string) => void;
  onSelectMember: (id: string) => void;
  onAnonChange: (l: AnonLevel) => void;
  onNewChar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:w-[360px] max-w-full bg-popover border border-border/60 rounded-t-2xl sm:rounded-2xl p-5 animate-scale-in shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-xs font-bold tracking-wider uppercase">От чьего имени писать</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={15} /></button>
        </div>

        {chars.length > 0 && (
          <>
            <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-1.5">Персонажи</div>
            <div className="space-y-1.5 mb-3">
              {chars.map(c => (
                <button key={c.id} onClick={() => onSelectChar(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${activeId === c.id && activeKind === "char" ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/20"}`}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: c.color + "20", border: `1px solid ${c.color}40` }}>{c.emoji}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-display font-semibold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground/50 font-mono">маска: {c.mask}</div>
                  </div>
                  {activeId === c.id && activeKind === "char" && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse-glow" />}
                </button>
              ))}
            </div>
          </>
        )}

        {members.length > 0 && (
          <>
            <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-1.5">Реальные участники</div>
            <div className="space-y-1.5 mb-3">
              {members.map(m => (
                <button key={m.id} onClick={() => onSelectMember(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${activeId === m.id && activeKind === "member" ? "border-primary/40 bg-primary/10" : "border-border/25 hover:border-border/50 bg-secondary/20"}`}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: m.color + "20", border: `1px solid ${m.color}40` }}>{m.emoji}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-display font-semibold truncate">{m.role}</div>
                    <div className="text-[10px] text-muted-foreground/50 font-mono">{m.name}</div>
                  </div>
                  {activeId === m.id && activeKind === "member" && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse-glow" />}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="border-t border-border/30 pt-4 mb-3">
          <div className="text-[10px] font-mono text-muted-foreground/40 mb-2 uppercase tracking-widest">Анонимность</div>
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
          className="w-full py-2 rounded-xl border border-dashed border-border/40 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-1.5">
          <Icon name="Plus" size={12} /> новый персонаж
        </button>
      </div>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({ chat, chars, globalActiveId, globalActiveKind, anonLevel, onBack, onUpdate, onSetActive, onAnonChange, onCreateChar }: {
  chat: Chat;
  chars: Character[];
  globalActiveId: string | null;
  globalActiveKind: "char" | "member";
  anonLevel: AnonLevel;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Chat>) => void;
  onSetActive: (id: string, kind: "char" | "member") => void;
  onAnonChange: (l: AnonLevel) => void;
  onCreateChar: (c: Omit<Character, "id">) => void;
}) {
  const [inputText, setInputText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [showNewChar, setShowNewChar] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve active sender from chat members or global chars
  const activeChar   = globalActiveKind === "char"   ? chars.find(c => c.id === globalActiveId) ?? null : null;
  const activeMember = globalActiveKind === "member" ? chat.members.find(m => m.id === globalActiveId) ?? null : null;
  const hasSender    = !!(activeChar || activeMember);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.messages.length]);

  function send() {
    if (!inputText.trim() || !hasSender) return;
    const isChar = !!activeChar;
    const sender = isChar ? activeChar! : activeMember!;
    let displayName = sender.name;
    if (isChar) {
      if (anonLevel === "full") displayName = "Аноним";
      else if (anonLevel === "partial") displayName = (sender as Character).mask || sender.name;
    } else {
      displayName = (sender as Member).role;
    }

    const msg: Message = {
      id: uid(),
      text: inputText.trim(),
      senderId: sender.id,
      senderKind: isChar ? "char" : "member",
      displayName,
      emoji: sender.emoji,
      color: sender.color,
      ts: fmtTime(),
    };
    onUpdate(chat.id, { messages: [...chat.messages, msg] });
    setInputText("");
    inputRef.current?.focus();
  }

  const senderLabel = activeChar
    ? anonLevel === "full" ? "аноним" : anonLevel === "partial" ? activeChar.mask : activeChar.name
    : activeMember ? activeMember.role : null;

  const senderEmoji = activeChar?.emoji ?? activeMember?.emoji ?? null;

  // Participants display in header
  const allParticipants = [
    ...chars.filter(c => chat.participants.includes(c.id)).map(c => c.emoji),
    ...chat.members.map(m => m.emoji),
  ];

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      {/* Bg wallpaper */}
      <div className={`absolute inset-0 ${bgCls(chat.bg)} transition-all duration-500`} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-3 sm:px-4 py-3 bg-background/50 backdrop-blur-xl border-b border-border/25 shrink-0">
        <button onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all shrink-0">
          <Icon name="ArrowLeft" size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-bold truncate">{chat.name}</div>
          <div className="text-[10px] font-mono text-muted-foreground/45 mt-0.5">
            {allParticipants.length > 0
              ? allParticipants.join(" ") + ` · ${allParticipants.length} участн.`
              : chat.messages.length === 0 ? "пока тихо" : `${chat.messages.length} сообщ.`}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setShowCharPanel(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/30 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-border/60 transition-all max-w-[120px]">
            <Icon name={anonLevel === "full" ? "EyeOff" : anonLevel === "partial" ? "Glasses" : "Eye"} size={12} />
            <span className="truncate">{senderLabel ?? "выбрать"}</span>
          </button>
          <button onClick={() => setShowSettings(v => !v)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${showSettings ? "border-primary/50 bg-primary/15 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"}`}>
            <Icon name="Settings2" size={13} />
          </button>
        </div>
      </header>

      {/* No sender warning */}
      {!hasSender && (
        <div className="relative z-10 mx-4 mt-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/25 flex items-center gap-3 animate-fade-in shrink-0">
          <Icon name="AlertTriangle" size={13} className="text-amber-400/70 shrink-0" />
          <span className="text-[11px] font-mono text-amber-300/60 flex-1">Выбери персонажа или участника, чтобы писать</span>
          <button onClick={() => setShowCharPanel(true)} className="text-[11px] font-mono text-amber-400/80 hover:text-amber-300 underline shrink-0">выбрать</button>
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
            <div className="space-y-2.5 max-w-2xl mx-auto pb-2">
              {chat.messages.map((msg, i) => (
                <div key={msg.id}
                  className={`flex ${msg.senderKind === "char" ? "justify-end" : "justify-start"} animate-message-in`}
                  style={{ animationDelay: `${Math.min(i * 0.02, 0.25)}s`, opacity: 0, animationFillMode: "forwards" }}>
                  <div className={`flex flex-col gap-0.5 max-w-[75%] ${msg.senderKind === "char" ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 px-1">
                      {msg.senderKind === "member" && <span className="text-xs">{msg.emoji}</span>}
                      <span className="text-[10px] font-mono font-medium" style={{ color: msg.color }}>{msg.displayName}</span>
                      {msg.senderKind === "char" && <span className="text-xs">{msg.emoji}</span>}
                    </div>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] font-mono leading-relaxed ${msg.senderKind === "char" ? "bg-primary/20 border border-primary/25 text-foreground rounded-tr-sm" : "bg-card/75 border border-border/30 backdrop-blur-sm text-foreground rounded-tl-sm"}`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-muted-foreground/30 px-1">{msg.ts}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Settings drawer */}
        {showSettings && (
          <ChatSettingsDrawer
            chat={chat}
            chars={chars}
            onClose={() => setShowSettings(false)}
            onUpdate={patch => onUpdate(chat.id, patch)}
            onAddMember={() => { setShowAddMember(true); setShowSettings(false); }}
            onRemoveMember={id => onUpdate(chat.id, { members: chat.members.filter(m => m.id !== id) })}
          />
        )}
      </div>

      {/* Input */}
      <div className="relative z-10 px-3 sm:px-5 py-3 bg-background/50 backdrop-blur-xl border-t border-border/25 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          {senderEmoji && <span className="text-lg shrink-0 opacity-60 select-none">{senderEmoji}</span>}
          <div className="flex-1 flex items-center bg-card/60 border border-border/35 rounded-xl px-4 py-2.5 focus-within:border-primary/40 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              disabled={!hasSender}
              placeholder={!hasSender ? "выбери персонажа или участника..." : senderLabel + " пишет..."}
              className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/30 disabled:cursor-not-allowed"
            />
          </div>
          <button onClick={send} disabled={!inputText.trim() || !hasSender}
            className="w-9 h-9 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-20 disabled:cursor-not-allowed">
            <Icon name="Send" size={14} />
          </button>
        </div>
      </div>

      {/* Overlays */}
      {showCharPanel && (
        <CharPanel
          chars={chars}
          members={chat.members}
          activeId={globalActiveId}
          activeKind={globalActiveKind}
          anonLevel={anonLevel}
          onClose={() => setShowCharPanel(false)}
          onSelectChar={id => { onSetActive(id, "char"); setShowCharPanel(false); }}
          onSelectMember={id => { onSetActive(id, "member"); setShowCharPanel(false); }}
          onAnonChange={onAnonChange}
          onNewChar={() => { setShowCharPanel(false); setShowNewChar(true); }}
        />
      )}
      {showNewChar && (
        <NewCharModal onClose={() => setShowNewChar(false)} onCreate={c => { onCreateChar(c); setShowNewChar(false); }} count={chars.length} />
      )}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          existing={chat.members}
          onAdd={m => {
            onUpdate(chat.id, { members: [...chat.members, { id: uid(), ...m }] });
            setShowAddMember(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Index() {
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [chars, setChars] = useState<Character[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeKind, setActiveKind] = useState<"char" | "member">("char");
  const [anonLevel, setAnonLevel] = useState<AnonLevel>("partial");
  const [modal, setModal] = useState<"newChat" | "newChar" | "charPanel" | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;
  const activeChar = chars.find(c => c.id === activeId && activeKind === "char") ?? null;

  function createChat(name: string, charIds: string[]) {
    const id = uid();
    setChats(prev => [...prev, { id, name, cover: "", bg: "void", wallpaper: "", participants: charIds, members: [], messages: [], createdAt: fmtTime() }]);
    setActiveChatId(id);
    setModal(null);
  }

  function createChar(data: Omit<Character, "id">) {
    const id = uid();
    setChars(prev => [...prev, { id, ...data }]);
    if (!activeId || activeKind !== "char") { setActiveId(id); setActiveKind("char"); }
    setModal(null);
  }

  function updateChat(id: string, patch: Partial<Chat>) {
    setChats(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function deleteChat(id: string) {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }

  function deleteChar(id: string) {
    setChars(prev => prev.filter(c => c.id !== id));
    if (activeId === id && activeKind === "char") {
      const rem = chars.filter(c => c.id !== id);
      setActiveId(rem[0]?.id ?? null);
    }
  }

  function setActiveSender(id: string, kind: "char" | "member") {
    setActiveId(id);
    setActiveKind(kind);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden mesh-bg">

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className={`flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl z-10 transition-all duration-300 ${activeChatId ? "w-0 overflow-hidden border-r-0" : "w-full"} sm:w-[252px] sm:overflow-visible sm:border-r`}>
        <div className="w-[252px] flex flex-col h-full">
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
                        onClick={() => setActiveChatId(chat.id)}>
                        <div className={`w-8 h-8 rounded-xl ${chat.cover || "bg-muted/40"} flex items-center justify-center shrink-0`}>
                          <span className="text-sm font-mono text-white/70">{BG_OPTIONS.find(b => b.id === chat.bg)?.icon ?? "✦"}</span>
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
                        className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 animate-fade-in ${activeId === char.id && activeKind === "char" ? "bg-primary/12 border border-primary/25" : "hover:bg-secondary/50 border border-transparent"}`}
                        style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: "forwards" }}
                        onClick={() => { setActiveId(char.id); setActiveKind("char"); }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: char.color + "20", border: `1px solid ${char.color}40` }}>{char.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-display font-semibold truncate">{char.name}</div>
                          <div className="text-[10px] text-muted-foreground/50 font-mono truncate">маска: {char.mask}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {activeId === char.id && activeKind === "char" && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
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

          {/* Active sender footer */}
          {(activeChar || (activeKind === "member")) && (
            <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/25 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setModal("charPanel")}>
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">{activeChar?.emoji ?? "👤"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-semibold truncate">{activeChar?.name ?? "—"}</div>
                  <div className="text-[9px] text-muted-foreground/45 font-mono">
                    {anonLevel === "full" ? "режим: аноним" : anonLevel === "partial" && activeChar ? `маска: ${activeChar.mask}` : "режим: открыто"}
                  </div>
                </div>
                <Icon name="ChevronUp" size={12} className="text-muted-foreground/35 shrink-0" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Chat (full-screen overlay) ────────────────────── */}
      {activeChatId && activeChat && (
        <ChatView
          chat={activeChat}
          chars={chars}
          globalActiveId={activeId}
          globalActiveKind={activeKind}
          anonLevel={anonLevel}
          onBack={() => setActiveChatId(null)}
          onUpdate={updateChat}
          onSetActive={setActiveSender}
          onAnonChange={setAnonLevel}
          onCreateChar={createChar}
        />
      )}

      {/* ── Global modals ─────────────────────────────────── */}
      {modal === "newChat"  && <NewChatModal  onClose={() => setModal(null)} onCreate={createChat}  chars={chars} />}
      {modal === "newChar"  && <NewCharModal  onClose={() => setModal(null)} onCreate={createChar}  count={chars.length} />}
      {modal === "charPanel" && (
        <CharPanel
          chars={chars}
          members={activeChat?.members ?? []}
          activeId={activeId}
          activeKind={activeKind}
          anonLevel={anonLevel}
          onClose={() => setModal(null)}
          onSelectChar={id => { setActiveSender(id, "char"); setModal(null); }}
          onSelectMember={id => { setActiveSender(id, "member"); setModal(null); }}
          onAnonChange={setAnonLevel}
          onNewChar={() => setModal("newChar")}
        />
      )}
    </div>
  );
}