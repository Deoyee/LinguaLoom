import { create } from "zustand";

export const useCallStore = create((set) => ({
  activeCall: null, // { callId, isAudioOnly, callerName, callerPic }
  outgoingCall: null,
  isMinimized: false,

  startCall: (callData) =>
    set({
      activeCall: callData,
      outgoingCall: null,
      isMinimized: false,
    }),

  startOutgoingCall: (callData) =>
    set({
      outgoingCall: callData,
      isMinimized: false,
    }),

  updateCallMessageId: (callId, messageId) =>
    set((state) => {
      if (state.outgoingCall?.callId === callId) {
        return { outgoingCall: { ...state.outgoingCall, messageId } };
      }
      if (state.activeCall?.callId === callId) {
        return { activeCall: { ...state.activeCall, messageId } };
      }
      return state;
    }),

  clearOutgoingCall: (callId) =>
    set((state) =>
      !callId || state.outgoingCall?.callId === callId
        ? { outgoingCall: null }
        : state
    ),

  minimizeCall: () => set({ isMinimized: true }),
  maximizeCall: () => set({ isMinimized: false }),
  toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),

  endCall: () =>
    set({
      activeCall: null,
      outgoingCall: null,
      isMinimized: false,
    }),
}));

export default useCallStore;
