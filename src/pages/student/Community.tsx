import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mic, Search, Send, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/hooks/useStore";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { User } from "@/types";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const relativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const formatSeconds = (seconds: number | null | undefined) => {
  const totalSeconds = seconds ?? 0;
  const mins = Math.floor(totalSeconds / 60);
  const rem = totalSeconds % 60;
  return `${mins}:${String(rem).padStart(2, "0")}`;
};

const MAX_VOICE_NOTE_SECONDS = 90;
const MAX_VOICE_NOTE_BYTES = 900 * 1024;
const MAX_VOICE_DATA_URL_LENGTH = 1_200_000;

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read audio blob"));
    reader.readAsDataURL(blob);
  });

export default function CommunityPage() {
  const currentUser = useAppStore((state) => state.session.currentUser);
  const users = useAppStore((state) => state.users);
  const posts = useAppStore((state) => state.posts);
  const chatThreads = useAppStore((state) => state.system.chatThreads);
  const createOrGetChatThread = useAppStore((state) => state.createOrGetChatThread);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);
  const markChatThreadRead = useAppStore((state) => state.markChatThreadRead);

  const [query, setQuery] = useState("");
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedReelId, setSelectedReelId] = useState<string>("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isPreparingVoice, setIsPreparingVoice] = useState(false);
  const [voiceDraftSeconds, setVoiceDraftSeconds] = useState(0);
  const [voiceDraftAudioUrl, setVoiceDraftAudioUrl] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const role = currentUser?.role;
  const isStudent = role === "student";
  const isTrainer = role === "trainer";

  const trainerContact = useMemo(() => {
    if (!isStudent || !currentUser || currentUser.role !== "student") return null;
    const studentUser = currentUser as import("@/types").Student;
    if (!studentUser.trainerId) return null;
    const trainer = users[studentUser.trainerId];
    if (!trainer || trainer.role !== "trainer") return null;
    return trainer;
  }, [currentUser, isStudent, users]);

  const contacts = useMemo(() => {
    if (!currentUser) return [] as User[];

    const allUsers = Object.values(users);
    let base: User[] = [];

    if (isStudent) {
      const peers = allUsers.filter(
        (user) => user.role === "student" && user.id !== currentUser.id
      );
      base = [trainerContact, ...peers].filter(Boolean) as User[];
    } else if (isTrainer) {
      base = allUsers.filter(
        (user) => user.role === "student" && (user as import("@/types").Student).trainerId === currentUser.id
      );
    }

    return base.filter((user) =>
      query.trim()
        ? user.name.toLowerCase().includes(query.trim().toLowerCase())
        : true
    );
  }, [currentUser, isStudent, isTrainer, query, trainerContact, users]);

  const myThreads = useMemo(() => {
    if (!currentUser) return [];
    return chatThreads
      .filter((thread) => thread.participantIds.includes(currentUser.id))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [chatThreads, currentUser]);

  const activeThread = useMemo(() => {
    if (!currentUser || !activeContactId) return null;
    return (
      myThreads.find(
        (thread) =>
          thread.participantIds.includes(currentUser.id) &&
          thread.participantIds.includes(activeContactId)
      ) ?? null
    );
  }, [activeContactId, currentUser, myThreads]);

  const activeThreadNeedsReadSync = useMemo(() => {
    if (!activeThread || !currentUser) return false;
    return (
      activeThread.unreadBy.includes(currentUser.id) ||
      activeThread.messages.some((message) => !message.seenBy.includes(currentUser.id))
    );
  }, [activeThread, currentUser]);

  const activeThreadId = activeThread?.id;

  const reelPosts = useMemo(
    () =>
      Object.values(posts)
        .filter((post) => post.type === "reel" && post.status === "visible")
        .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)),
    [posts]
  );

  useEffect(() => {
    if (!contacts.length) {
      setActiveContactId(null);
      return;
    }
    setActiveContactId((prev) =>
      prev && contacts.some((contact) => contact.id === prev) ? prev : contacts[0].id
    );
  }, [contacts]);

  useEffect(() => {
    if (!activeContactId || !currentUser) return;
    createOrGetChatThread(activeContactId);
  }, [activeContactId, createOrGetChatThread, currentUser]);

  useEffect(() => {
    if (!activeThreadId || !activeThreadNeedsReadSync) return;
    markChatThreadRead(activeThreadId);
  }, [activeThreadId, activeThreadNeedsReadSync, markChatThreadRead]);

  useEffect(() => {
    if (!isRecordingVoice) return;
    const timer = window.setInterval(() => {
      setVoiceDraftSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRecordingVoice]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!currentUser || (!isStudent && !isTrainer)) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <p className="text-white/50">Community chat is available for student and trainer accounts.</p>
      </div>
    );
  }

  const activeContact = activeContactId ? users[activeContactId] : null;

  const startVoiceRecording = async () => {
    if (!activeContact) {
      toast.error("Select a chat first.");
      return;
    }

    if (typeof window === "undefined" || !window.navigator.mediaDevices?.getUserMedia) {
      toast.error("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingStartRef.current = Date.now();
      setVoiceDraftSeconds(0);
      setVoiceDraftAudioUrl("");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          const duration = Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000));

          if (duration > MAX_VOICE_NOTE_SECONDS) {
            toast.error(`Voice note limit is ${MAX_VOICE_NOTE_SECONDS} seconds.`);
            setVoiceDraftSeconds(0);
            setVoiceDraftAudioUrl("");
            return;
          }

          if (blob.size > MAX_VOICE_NOTE_BYTES) {
            toast.error("Voice note file is too large. Keep it under 900 KB.");
            setVoiceDraftSeconds(0);
            setVoiceDraftAudioUrl("");
            return;
          }

          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl.length > MAX_VOICE_DATA_URL_LENGTH) {
            toast.error("Voice note is too large to store. Please record a shorter note.");
            setVoiceDraftSeconds(0);
            setVoiceDraftAudioUrl("");
            return;
          }

          setVoiceDraftSeconds(duration);
          setVoiceDraftAudioUrl(dataUrl);
        } catch {
          toast.error("Could not process voice note.");
          setVoiceDraftSeconds(0);
          setVoiceDraftAudioUrl("");
        } finally {
          setIsPreparingVoice(false);
          if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach((track) => track.stop());
            recordingStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
    } catch {
      toast.error("Microphone permission denied. Please allow microphone access.");
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setIsRecordingVoice(false);
    setIsPreparingVoice(true);
    recorder.stop();
  };

  const clearVoiceDraft = () => {
    setVoiceDraftSeconds(0);
    setVoiceDraftAudioUrl("");
  };

  const sendMessage = () => {
    if (!activeContact) return;
    if (!messageText.trim() && !selectedReelId && !voiceDraftAudioUrl) return;

    if (voiceDraftAudioUrl && voiceDraftAudioUrl.length > MAX_VOICE_DATA_URL_LENGTH) {
      toast.error("Voice note exceeds safe storage limit. Please re-record shorter audio.");
      return;
    }

    sendChatMessage({
      recipientId: activeContact.id,
      text: messageText,
      reelPostId: selectedReelId || undefined,
      voiceSeconds: voiceDraftAudioUrl ? voiceDraftSeconds : undefined,
      voiceAudioUrl: voiceDraftAudioUrl || undefined,
    });

    setMessageText("");
    setSelectedReelId("");
    clearVoiceDraft();
  };

  const activePeerRoleLabel =
    activeContact?.role === "trainer" ? "trainer" : activeContact?.role === "student" ? "student" : "user";

  const roleHeader = isTrainer ? "Trainer Inbox" : "Community DM";
  const roleSubheader = isTrainer
    ? "Reply to student check-ins and keep 1:1 coaching conversations live."
    : "Trainer notes, 1:1 student chats, and reel sharing in one place.";

  return (
    <div className="mx-auto max-w-6xl p-3 sm:p-6 lg:p-8 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-[#121212] p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-[#4DD2FF]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[#C9F85A]/8 blur-3xl pointer-events-none" />

        <div className="relative mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9F85A]/25 bg-[#C9F85A]/10 px-3 py-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-[#C9F85A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9F85A]">{roleHeader}</span>
            </div>
            <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">Messages</h1>
            <p className="mt-1 text-xs sm:text-sm text-white/45 line-clamp-2">{roleSubheader}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] px-3 py-2.5 sm:px-4 sm:py-3 text-right flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Threads</p>
            <p className="text-lg sm:text-xl font-semibold text-white">{myThreads.length}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0E0E0E] p-3 sm:p-4">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search trainer or student"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#161616] pl-10 pr-3 text-sm text-white placeholder:text-white/35 focus:border-[#C9F85A]/40 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[40vh] lg:max-h-[480px] overflow-y-auto pr-1">
              {contacts.map((contact) => {
                const thread = myThreads.find((item) => item.participantIds.includes(contact.id));
                const lastMessage = thread?.messages[thread.messages.length - 1];
                const isUnread = Boolean(thread?.unreadBy.includes(currentUser.id));

                return (
                  <button
                    key={contact.id}
                    onClick={() => setActiveContactId(contact.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-all ${
                      activeContactId === contact.id
                        ? "border-[#C9F85A]/45 bg-[#1E2214]"
                        : "border-white/8 bg-[#151515] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#1F1F1F] border border-white/10 text-xs font-bold text-white flex items-center justify-center">
                        {initials(contact.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{contact.name}</p>
                        <p className="truncate text-xs text-white/40">
                          {lastMessage ? lastMessage.text : contact.role === "trainer" ? "Start your coach check-in" : "Start a chat"}
                        </p>
                      </div>
                      <div className="text-right">
                        {lastMessage && <p className="text-[10px] text-white/30">{relativeTime(lastMessage.createdAt)}</p>}
                        {isUnread && <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#C9F85A]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0F0F0F] flex flex-col min-h-[400px] lg:min-h-[580px]">
            <div className="border-b border-white/8 p-4 sm:p-5 flex items-center gap-3">
              {activeContact ? (
                <>
                  <div className="h-11 w-11 rounded-xl bg-[#1B1B1B] border border-white/10 text-sm font-bold text-white flex items-center justify-center">
                    {initials(activeContact.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{activeContact.name}</p>
                    <p className="text-xs text-white/40 capitalize">
                      {activeContact.role === "trainer" ? "Gym Trainer" : "Student"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/40">Select a conversation to start chatting.</p>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              {activeThread?.messages.length ? (
                activeThread.messages.map((message) => {
                  const isMe = message.senderId === currentUser.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl border px-3.5 py-2.5 ${
                          isMe
                            ? "bg-[#C9F85A] text-black border-[#C9F85A]"
                            : "bg-[#1A1A1A] text-white border-white/10"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        {message.type === "voice-note" && (
                          <div className="mt-2 space-y-2 rounded-xl border border-black/10 bg-black/15 px-2.5 py-2">
                            <div className="flex items-center gap-2 text-[11px]">
                              <Mic className="h-4 w-4" />
                              <span className="font-semibold">Voice note • {formatSeconds(Math.max(1, message.voiceSeconds ?? 0))}</span>
                            </div>
                            {message.voiceAudioUrl ? (
                              <audio controls preload="metadata" className="w-full" src={message.voiceAudioUrl} />
                            ) : (
                              <p className="text-[11px] opacity-70">Audio unavailable.</p>
                            )}
                          </div>
                        )}
                        {message.type === "reel-share" && message.reelPreviewUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-black/10 bg-black/15">
                            <img
                              src={message.reelPreviewUrl}
                              alt="Shared reel"
                              className="h-36 w-full object-cover"
                            />
                            <p className={`px-2.5 py-2 text-xs ${isMe ? "text-black/80" : "text-white/60"}`}>
                              <Video className="mr-1.5 inline h-3.5 w-3.5" />
                              {message.reelCaption || "Shared reel"}
                            </p>
                          </div>
                        )}
                        <p className={`mt-1 text-[10px] ${isMe ? "text-black/60" : "text-white/35"}`}>
                          {relativeTime(message.createdAt)}
                        </p>
                        {isMe && (
                          <p className={`mt-0.5 text-[10px] ${isMe ? "text-black/65" : "text-white/35"}`}>
                            {message.seenBy.includes(activeContact?.id ?? "")
                              ? `Seen by ${activePeerRoleLabel}`
                              : "Sent"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <Sparkles className="mx-auto h-6 w-6 text-[#C9F85A]/70" />
                    <p className="mt-2 text-sm text-white/45">No messages yet. Start the conversation.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/8 p-4 sm:p-5 space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_170px]">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={activeContact ? `Message ${activeContact.name}` : "Select a chat first"}
                  disabled={!activeContact}
                  className="h-11 rounded-xl border border-white/10 bg-[#171717] px-3 text-sm text-white placeholder:text-white/35 focus:border-[#C9F85A]/45 focus:outline-none disabled:opacity-50"
                />
                <select
                  value={selectedReelId}
                  onChange={(event) => setSelectedReelId(event.target.value)}
                  disabled={!activeContact}
                  className="h-11 rounded-xl border border-white/10 bg-[#171717] px-3 text-sm text-white focus:border-[#4DD2FF]/45 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Share a reel (optional)</option>
                  {reelPosts.map((reel) => (
                    <option key={reel.id} value={reel.id}>
                      {reel.userName}: {reel.caption.slice(0, 26)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] px-3 py-2.5">
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <Mic className={`h-4 w-4 ${isRecordingVoice ? "text-red-400" : "text-[#C9F85A]"}`} />
                  {isRecordingVoice
                    ? `Recording voice note... ${voiceDraftSeconds}s`
                    : isPreparingVoice
                      ? "Processing voice note..."
                      : voiceDraftAudioUrl
                        ? `Voice note ready (${formatSeconds(voiceDraftSeconds)})`
                      : "Tap record to attach a voice note"}
                </div>
                <div className="flex items-center gap-2">
                  {isRecordingVoice ? (
                    <button
                      onClick={stopVoiceRecording}
                      className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={startVoiceRecording}
                      disabled={!activeContact || isPreparingVoice}
                      className="rounded-lg border border-[#C9F85A]/30 bg-[#C9F85A]/10 px-3 py-1.5 text-xs font-semibold text-[#C9F85A] disabled:opacity-50"
                    >
                      Record
                    </button>
                  )}
                  {voiceDraftAudioUrl && !isRecordingVoice && (
                    <button
                      onClick={clearVoiceDraft}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {voiceDraftAudioUrl && (
                <div className="rounded-xl border border-white/10 bg-[#151515] p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Voice Note Preview</p>
                  <audio controls preload="metadata" className="w-full" src={voiceDraftAudioUrl} />
                </div>
              )}

              <button
                onClick={() => {
                  if (!activeContact) {
                    toast.error("Select a conversation first.");
                    return;
                  }
                  sendMessage();
                }}
                className="h-11 w-full rounded-xl bg-[#C9F85A] text-sm font-semibold text-black hover:bg-[#d4ff60] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={!activeContact || (!messageText.trim() && !selectedReelId && !voiceDraftAudioUrl)}
              >
                <Send className="h-4 w-4" /> Send message
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
