import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { Phone, Video, PhoneCall, X, Check, Volume2, Bell } from "lucide-react";
import Avatar from "./Avatar.jsx";
import CallModal from "./CallModal.jsx";
import ringtone from "../lib/ringtone.js";
import { useCallStore } from "../store/useCallStore";
import toast from "react-hot-toast";
import { connectUser } from "../lib/stream.js";

const updateCallInvitation = async (client, messageId, call, status, duration = 0) => {
  if (!messageId) return false;
  const kind = call.isAudioOnly ? "Voice" : "Video";
  const icon = call.isAudioOnly ? "📞" : "📹";
  const time = `${Math.floor(duration / 60).toString().padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`;
  const text = status === "ended"
    ? `${icon} ${kind} call ended • ${time}`
    : status === "missed"
      ? `${icon} Missed ${kind.toLowerCase()} call`
      : status === "declined"
        ? `${icon} ${kind} call declined`
        : `${icon} ${kind} call cancelled`;

  try {
    await client.partialUpdateMessage(messageId, {
      set: {
        text,
        call_status: status,
        call_duration: status === "ended" ? duration : undefined,
      },
    });
    return true;
  } catch (error) {
    console.warn("Could not update call invitation message:", error);
    return false;
  }
};

const showDesktopCallNotification = (call) => {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (window.Notification.permission !== "granted") return null;

  const notification = new window.Notification(
    `${call.caller?.name || "Someone"} is calling`,
    {
      body: `Incoming ${call.isAudioOnly ? "voice" : "video"} call`,
      icon: "/lingualoom-mark.svg",
      tag: `lingualoom-call-${call.callId}`,
      requireInteraction: true,
    }
  );
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  return notification;
};

const IncomingCallManager = () => {
  const { authUser } = useAuthUser();
  const [incomingCall, setIncomingCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const { activeCall, outgoingCall, startCall, endCall, clearOutgoingCall } = useCallStore();
  const incomingCallRef = useRef(null);
  incomingCallRef.current = incomingCall;

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Play ringtone whenever there is an incoming call, stop when dismissed/accepted
  useEffect(() => {
    if (incomingCall && !activeCall) {
      ringtone.play();
    } else {
      ringtone.stop();
    }
    return () => {
      ringtone.stop();
    };
  }, [incomingCall, activeCall]);

  useEffect(() => {
    if (!incomingCall || activeCall) return;
    const notification = showDesktopCallNotification(incomingCall);
    return () => notification?.close();
  }, [incomingCall, activeCall]);

  // When a call becomes active (started or answered), immediately dismiss incoming prompt & ringtone
  useEffect(() => {
    if (activeCall) {
      ringtone.stop();
      setIncomingCall(null);
    }
  }, [activeCall]);

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    let client = null;
    let messageListener = null;
    let updateListener = null;

    const setupListener = async () => {
      try {
        client = await connectUser(authUser, tokenData.token);
        setChatClient(client);

        // Listen for new messages across all user channels
        messageListener = client.on("message.new", async (event) => {
          const msg = event?.message;
          if (!msg) return;

          const myId = String(authUser?._id || authUser?.id || "");
          const senderId = String(msg.user?.id || "");
          const clientUserId = String(client?.userID || "");
          if (
            (myId && senderId && myId === senderId) ||
            (clientUserId && senderId && clientUserId === senderId)
          ) {
            return;
          }

          const callStore = useCallStore.getState();
          const pendingOutgoingCall = callStore.outgoingCall;

          if (msg.custom_type === "call_signal") {
            if (msg.call_status === "accepted" && pendingOutgoingCall?.callId === msg.call_id) {
              callStore.startCall({
                ...pendingOutgoingCall,
                messageId: msg.message_id || pendingOutgoingCall.messageId,
              });
            } else if (["declined", "cancelled", "missed"].includes(msg.call_status)) {
              if (pendingOutgoingCall?.callId === msg.call_id) {
                await updateCallInvitation(
                  client,
                  pendingOutgoingCall.messageId,
                  pendingOutgoingCall,
                  msg.call_status
                );
                callStore.clearOutgoingCall(msg.call_id);
              }
              if (incomingCallRef.current?.callId === msg.call_id) {
                setIncomingCall(null);
              }
            } else if (msg.call_status === "ended") {
              await updateCallInvitation(
                client,
                msg.message_id,
                { isAudioOnly: msg.call_type === "audio" },
                "ended",
                msg.call_duration
              );
            }
            return;
          }

          // If user is already on a call, ignore incoming calls
          if (callStore.activeCall) return;

          // Ignore messages already marked missed or ended
          const lowerText = (msg.text || "").toLowerCase();
          if (
            msg.call_status === "missed" ||
            msg.call_status === "ended" ||
            lowerText.includes("missed") ||
            lowerText.includes("no answer") ||
            lowerText.includes("ended")
          ) {
            return;
          }

          // Check if message is a call invitation
          const isCallMsg =
            Boolean(msg.call_id) ||
            msg.call_status === "started" ||
            msg.text?.includes("/call/") ||
            (msg.text?.startsWith("📞") && !lowerText.includes("missed") && !lowerText.includes("ended")) ||
            (msg.text?.startsWith("📹") && !lowerText.includes("missed") && !lowerText.includes("ended"));

          if (isCallMsg) {
            const createdAt = new Date(msg.created_at).getTime();
            const now = Date.now();

            // Only trigger if sent within the last 45 seconds
            if (now - createdAt < 45000) {
              let callId = msg.call_id;
              let isAudioOnly =
                msg.call_type === "audio" || lowerText.includes("voice");

              if (!callId && msg.text?.includes("/call/")) {
                const urlMatch = msg.text.match(/https?:\/\/[^\s]+/);
                if (urlMatch) {
                  try {
                    const url = new URL(urlMatch[0]);
                    callId = url.pathname.split("/call/")[1];
                    isAudioOnly = url.searchParams.get("type") === "audio";
                  } catch {
                    // ignore url parse error
                  }
                }
              }

              if (callId) {
                setIncomingCall({
                  messageId: msg.id,
                  callId,
                  isAudioOnly,
                  caller: msg.user,
                  receivedAt: now,
                  channelId: event.channel_id,
                  channelType: event.channel_type || "messaging",
                });
              }
            }
          }
        });

        // Listen for call cancellation / missed updates
        updateListener = client.on("message.updated", (event) => {
          const msg = event?.message;
          const currentCall = incomingCallRef.current;
          if (msg && currentCall) {
            if (msg.call_id === currentCall.callId || msg.id === currentCall.messageId) {
              const lowerText = (msg.text || "").toLowerCase();
              if (
                msg.call_status === "missed" ||
                msg.call_status === "declined" ||
                msg.call_status === "cancelled" ||
                msg.call_status === "ended" ||
                lowerText.includes("missed") ||
                lowerText.includes("declined") ||
                lowerText.includes("cancelled") ||
                lowerText.includes("ended")
              ) {
                ringtone.stop();
                setIncomingCall(null);
              }
            }
          }
        });
      } catch (err) {
        console.warn("Could not setup incoming call listener:", err);
      }
    };

    setupListener();

    return () => {
      ringtone.stop();
      if (messageListener && typeof messageListener.unsubscribe === "function") {
        messageListener.unsubscribe();
      }
      if (updateListener && typeof updateListener.unsubscribe === "function") {
        updateListener.unsubscribe();
      }
    };
  }, [tokenData, authUser]);

  // Auto-dismiss after 40 seconds if unresponded and mark missed call
  useEffect(() => {
    if (!incomingCall) return;

    const timer = setTimeout(() => {
      ringtone.stop();

      // NEVER send missed call message if the user is currently in a call!
      if (useCallStore.getState().activeCall) {
        setIncomingCall(null);
        return;
      }

      setIncomingCall(null);
    }, 40000);

    return () => clearTimeout(timer);
  }, [incomingCall, chatClient, authUser]);

  // Stop ringing if nobody answers, without joining the call room.
  useEffect(() => {
    if (!outgoingCall || !chatClient) return;
    const callId = outgoingCall.callId;
    const timer = setTimeout(async () => {
      const currentCall = useCallStore.getState().outgoingCall;
      if (currentCall?.callId !== callId) return;

      useCallStore.getState().clearOutgoingCall(callId);
      try {
        await updateCallInvitation(chatClient, currentCall.messageId, currentCall, "missed");
        const channel = chatClient.channel(
          currentCall.channelType || "messaging",
          currentCall.channelId
        );
        await channel.sendMessage({
          text: "Call invitation timed out",
          custom_type: "call_signal",
          silent: true,
          call_id: callId,
          call_status: "missed",
          call_type: currentCall.isAudioOnly ? "audio" : "video",
          message_id: currentCall.messageId,
        });
      } catch (error) {
        console.warn("Could not send unanswered call status:", error);
      }
    }, 40000);

    return () => clearTimeout(timer);
  }, [outgoingCall, chatClient]);

  const handleAccept = async () => {
    ringtone.stop();
    if (incomingCall) {
      try {
        const channelType = incomingCall.channelType || "messaging";
        const channel = chatClient.channel(channelType, incomingCall.channelId);
        await channel.sendMessage({
          text: "Call accepted",
          custom_type: "call_signal",
          silent: true,
          call_id: incomingCall.callId,
          call_type: incomingCall.isAudioOnly ? "audio" : "video",
          call_status: "accepted",
          message_id: incomingCall.messageId,
        });
      } catch (error) {
        console.error("Could not notify caller that the call was accepted:", error);
        toast.error("Could not connect the call. Please try again.");
        return;
      }

      startCall({
        callId: incomingCall.callId,
        isAudioOnly: incomingCall.isAudioOnly,
        channelId: incomingCall.channelId,
        channelType: incomingCall.channelType,
        callerName: incomingCall.caller?.name,
        callerPic: incomingCall.caller?.image,
        messageId: incomingCall.messageId,
        isCaller: false,
      });
      setIncomingCall(null);
    }
  };

  const handleDecline = () => {
    ringtone.stop();
    if (incomingCall && chatClient && authUser) {
      try {
        const channelType = incomingCall.channelType || "messaging";
        const channelId =
          incomingCall.channelId ||
          [authUser._id, incomingCall.caller?.id].sort().join("-");
        const channel = chatClient.channel(channelType, channelId);
        channel.sendMessage({
          text: "Call invitation declined",
          custom_type: "call_signal",
          silent: true,
          call_id: incomingCall.callId,
          call_status: "declined",
          call_type: incomingCall.isAudioOnly ? "audio" : "video",
          message_id: incomingCall.messageId,
        }).catch((error) => console.warn("Could not send call decline:", error));
      } catch (e) {
        console.warn("Could not send missed call message on decline:", e);
      }
    }
    setIncomingCall(null);
  };

  const handleCancelOutgoing = () => {
    const pendingCall = useCallStore.getState().outgoingCall;
    if (!pendingCall) return;

    clearOutgoingCall(pendingCall.callId);
    if (chatClient) {
      const channel = chatClient.channel(
        pendingCall.channelType || "messaging",
        pendingCall.channelId
      );
      updateCallInvitation(chatClient, pendingCall.messageId, pendingCall, "cancelled");
      channel.sendMessage({
        text: "Call invitation cancelled",
        custom_type: "call_signal",
        silent: true,
        call_id: pendingCall.callId,
        call_status: "cancelled",
        call_type: pendingCall.isAudioOnly ? "audio" : "video",
        message_id: pendingCall.messageId,
      }).catch((error) => console.warn("Could not send call cancellation:", error));
    }
  };

  const handleEnableDesktopAlerts = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted" && incomingCall) {
        showDesktopCallNotification(incomingCall);
      }
    } catch (error) {
      console.warn("Could not request desktop call notifications:", error);
    }
  };

  return (
    <>
      {outgoingCall && !activeCall && !incomingCall && (
        <div className="fixed top-5 left-1/2 z-[999999] w-[92vw] max-w-md -translate-x-1/2 animate-fadeIn">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-base-200/95 p-3 text-base-content shadow-xl backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                {outgoingCall.isAudioOnly ? <Phone className="size-5" /> : <Video className="size-5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">Calling {outgoingCall.callerName || "your partner"}</p>
                <p className="flex items-center gap-1.5 text-xs text-base-content/65">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Waiting for them to answer…
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelOutgoing}
              className="btn btn-sm shrink-0 gap-2 rounded-xl bg-error/15 text-error hover:bg-error hover:text-error-content"
            >
              <X className="size-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Floating Incoming Call Banner */}
      {incomingCall && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999999] w-[92vw] max-w-md animate-bounce-subtle">
          <div className="bg-[#181313]/95 backdrop-blur-xl border-2 border-emerald-500/50 shadow-[0_10px_35px_rgba(16,185,129,0.35)] rounded-3xl p-4 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative">
                <Avatar
                  src={incomingCall.caller?.image}
                  name={incomingCall.caller?.name || "Caller"}
                  size="md"
                  className="ring-2 ring-emerald-500"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white shadow-sm">
                  {incomingCall.isAudioOnly ? (
                    <Phone className="size-3 animate-pulse" />
                  ) : (
                    <Video className="size-3 animate-pulse" />
                  )}
                </span>
              </div>

              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate">
                  {incomingCall.caller?.name || "Someone"}
                </p>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Volume2 className="size-3 text-emerald-400 animate-pulse" />
                  <span>
                    Incoming {incomingCall.isAudioOnly ? "Voice" : "Video"} Call • Ringing...
                  </span>
                </p>
                {typeof window !== "undefined" &&
                  "Notification" in window &&
                  window.Notification.permission === "default" && (
                    <button
                      type="button"
                      onClick={handleEnableDesktopAlerts}
                      className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/65 hover:text-white"
                    >
                      <Bell className="size-3" /> Enable desktop alerts
                    </button>
                  )}
              </div>
            </div>

            {/* Accept / Decline Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleDecline}
                className="btn btn-circle btn-sm bg-red-600/80 hover:bg-red-600 text-white border-none shadow-md transition-transform active:scale-95"
                title="Decline"
                aria-label="Decline"
              >
                <X className="size-4" />
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="btn btn-circle btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-md transition-transform hover:scale-110 active:scale-95"
                title="Accept Call"
                aria-label="Accept Call"
              >
                <PhoneCall className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global In-App Call Modal (Fullscreen or Minimized Picture-in-Picture) */}
      {activeCall && (
        <CallModal
          isOpen={!!activeCall}
          onClose={endCall}
          callId={activeCall.callId}
          isAudioOnly={activeCall.isAudioOnly}
          authUser={authUser}
          token={tokenData?.token}
        />
      )}
    </>
  );
};

export default IncomingCallManager;
