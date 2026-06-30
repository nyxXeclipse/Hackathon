import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../utils/socket";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);

  // Load conversations
  useEffect(() => {
    api
      .get("/messages/conversations")
      .then((res) => setConversations(res.data.conversations))
      .catch(() => {
        setConversations([]);
      });
  }, []);

  // Load messages when userId param changes
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setActiveFriend(null);
      return;
    }
    const loadMessages = async () => {
      setLoading(true);
      try {
        const [msgsRes, userRes] = await Promise.all([
          api.get(`/messages/${userId}`),
          api.get(`/users/${userId}`).catch(() => null),
        ]);
        setMessages(msgsRes.data.messages);
        if (userRes) setActiveFriend(userRes.data.user);
      } catch {
        toast.error("Could not load messages");
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [userId]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onReceive = (msg) => {
      if (msg.sender._id === userId || msg.sender === userId) {
        setMessages((prev) => [...prev, msg]);
      }
      // Update conversation list
      setConversations((prev) => {
        const existing = prev.find(
          (c) => c.user._id === (msg.sender._id || msg.sender),
        );
        if (existing) {
          return prev.map((c) =>
            c.user._id === (msg.sender._id || msg.sender)
              ? { ...c, lastMessage: msg }
              : c,
          );
        }
        return prev;
      });
    };

    const onTypingStart = ({ userId: typingUserId }) => {
      if (typingUserId === userId) setIsTyping(true);
    };
    const onTypingStop = ({ userId: typingUserId }) => {
      if (typingUserId === userId) setIsTyping(false);
    };

    socket.on("message:receive", onReceive);
    socket.on("message:sent", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.off("message:receive", onReceive);
      socket.off("message:sent");
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [userId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !userId) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("message:send", { receiverId: userId, text: text.trim() });
    } else {
      // Fallback to REST
      try {
        const res = await api.post(`/messages/${userId}`, {
          text: text.trim(),
        });
        setMessages((prev) => [...prev, res.data.message]);
      } catch {
        toast.error("Could not send message");
      }
    }

    setText("");
    // Stop typing indicator
    if (socket) socket.emit("typing:stop", { receiverId: userId });
    clearTimeout(typingTimer.current);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    if (!socket || !userId) return;

    socket.emit("typing:start", { receiverId: userId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing:stop", { receiverId: userId });
    }, 1500);
  };

  const avatarFor = (u) =>
    u?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "U")}&background=4f7c6b&color=fff&size=40`;

  return (
    <div style={styles.layout}>
      {/* Conversation list */}
      <div style={styles.list}>
        <div style={styles.listHeader}>
          <h2 style={styles.listTitle}>Messages</h2>
        </div>
        {conversations.length === 0 ? (
          <div style={styles.noConvs}>
            <span style={{ fontSize: 36 }}>💬</span>
            <p>No conversations yet.</p>
            <Link to="/search" style={styles.findLink}>
              Find people to chat with
            </Link>
          </div>
        ) : (
          conversations.map(({ user: friend, lastMessage, unread }) => (
            <div
              key={friend._id}
              onClick={() => navigate(`/messages/${friend._id}`)}
              style={{
                ...styles.convItem,
                ...(friend._id === userId ? styles.convItemActive : {}),
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={avatarFor(friend)}
                  alt={friend.name}
                  style={styles.convAvatar}
                />
                {friend.isOnline && <span style={styles.onlineDot} />}
              </div>
              <div style={styles.convInfo}>
                <span style={styles.convName}>{friend.name}</span>
                <span style={styles.convLast}>
                  {lastMessage?.text?.substring(0, 40)}
                  {lastMessage?.text?.length > 40 ? "…" : ""}
                </span>
              </div>
              {unread > 0 && <span style={styles.badge}>{unread}</span>}
            </div>
          ))
        )}
      </div>

      {/* Chat pane */}
      <div style={styles.chat}>
        {!userId ? (
          <div style={styles.noChat}>
            <span style={{ fontSize: 56 }}>💬</span>
            <h3>Select a conversation</h3>
            <p>Choose someone from the list to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={styles.chatHeader}>
              {activeFriend && (
                <>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                      src={avatarFor(activeFriend)}
                      alt={activeFriend.name}
                      style={styles.chatAvatar}
                    />
                    {activeFriend.isOnline && <span style={styles.onlineDot} />}
                  </div>
                  <div>
                    <Link
                      to={`/profile/${activeFriend.username}`}
                      style={styles.chatName}
                    >
                      {activeFriend.name}
                    </Link>
                    <div style={styles.chatStatus}>
                      {activeFriend.isOnline ? "🟢 Online" : "Offline"}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div style={styles.messages}>
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: 40,
                  }}
                >
                  Loading...
                </div>
              ) : messages.length === 0 ? (
                <div style={styles.noMsgs}>
                  <span style={{ fontSize: 36 }}>👋</span>
                  <p>Say hello to {activeFriend?.name}!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = (msg.sender?._id || msg.sender) === user._id;
                  return (
                    <div
                      key={msg._id}
                      style={{
                        ...styles.msgRow,
                        justifyContent: isMine ? "flex-end" : "flex-start",
                      }}
                    >
                      {!isMine && (
                        <img
                          src={avatarFor(msg.sender)}
                          alt=""
                          style={styles.msgAvatar}
                        />
                      )}
                      <div
                        style={{
                          ...styles.bubble,
                          ...(isMine ? styles.myBubble : styles.theirBubble),
                        }}
                      >
                        <span>{msg.text}</span>
                        <span style={styles.msgTime}>
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
                  <div style={{ ...styles.bubble, ...styles.theirBubble }}>
                    <span style={{ fontSize: 18 }}>•••</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={styles.inputRow}>
              <input
                placeholder="Type a message..."
                value={text}
                onChange={handleTyping}
                style={styles.msgInput}
              />
              <button
                type="submit"
                disabled={!text.trim()}
                style={styles.sendBtn}
              >
                ➤
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    background: "var(--bg)",
  },
  list: {
    width: 300,
    flexShrink: 0,
    background: "#fff",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  listHeader: {
    padding: "20px 16px 12px",
    borderBottom: "1px solid var(--border-light)",
  },
  listTitle: { fontSize: 18, fontWeight: 700, color: "var(--text-primary)" },
  noConvs: {
    padding: 32,
    textAlign: "center",
    color: "var(--text-muted)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
  findLink: {
    color: "var(--primary)",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
  },
  convItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    cursor: "pointer",
    transition: "background 0.15s",
    borderBottom: "1px solid var(--border-light)",
  },
  convItemActive: { background: "var(--primary-50)" },
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    objectFit: "cover",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#4caf50",
    border: "2px solid #fff",
  },
  convInfo: { flex: 1, overflow: "hidden" },
  convName: {
    display: "block",
    fontWeight: 600,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  convLast: {
    fontSize: 12,
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  badge: {
    background: "var(--primary)",
    color: "#fff",
    borderRadius: "50%",
    width: 18,
    height: 18,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  noChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    gap: 8,
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 20px",
    background: "#fff",
    borderBottom: "1px solid var(--border)",
  },
  chatAvatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    objectFit: "cover",
  },
  chatName: {
    fontWeight: 700,
    fontSize: 16,
    color: "var(--text-primary)",
    textDecoration: "none",
  },
  chatStatus: { fontSize: 12, color: "var(--text-muted)" },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  noMsgs: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    gap: 8,
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 6 },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "65%",
    padding: "9px 14px",
    borderRadius: 18,
    fontSize: 14,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  myBubble: {
    background: "var(--primary)",
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    background: "#fff",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderBottomLeftRadius: 4,
  },
  msgTime: { fontSize: 10, opacity: 0.6, textAlign: "right" },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    background: "#fff",
    borderTop: "1px solid var(--border)",
  },
  msgInput: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 24,
    border: "1.5px solid var(--border)",
    fontSize: 14,
    background: "var(--bg)",
    color: "var(--text-primary)",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
