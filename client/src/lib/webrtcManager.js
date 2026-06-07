import SimplePeer from "simple-peer";
import { useWorkspaceStore } from "../store/workspaceStore.js";

function getIceServers() {
  const envServers = import.meta.env.VITE_ICE_SERVERS;
  if (envServers) {
    try {
      const parsed = JSON.parse(envServers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse VITE_ICE_SERVERS env variable:", e);
    }
  }

  // Robust public STUN/TURN fallback
  return [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];
}

export class WebRTCMeshManager {
  constructor({ localPeerId, sendSignal }) {
    this.localPeerId = localPeerId;
    this.sendSignal = sendSignal;
    this.peers = new Map(); // remotePeerId -> SimplePeer instance
    this.localStream = null;
    this.participants = [];
  }

  setStream(stream) {
    if (this.localStream === stream) {
      return;
    }

    this.localStream = stream;

    // Re-negotiate all active peers with the new stream
    this.rebuildPeers();
  }

  updateParticipants(participants) {
    this.participants = participants;
    this.rebuildPeers();
  }

  rebuildPeers() {
    if (!this.localStream) {
      // If we don't have mic stream, close all peer connections
      this.destroyAll();
      return;
    }

    const currentPeerIds = new Set(
      this.participants
        .map((p) => p.peerId)
        .filter((id) => id !== this.localPeerId),
    );

    // 1. Remove peers that are no longer in the room
    for (const remotePeerId of this.peers.keys()) {
      if (!currentPeerIds.has(remotePeerId)) {
        this.destroyPeer(remotePeerId);
      }
    }

    // 2. Add new peers that joined the room
    for (const remotePeerId of currentPeerIds) {
      if (!this.peers.has(remotePeerId)) {
        this.initiatePeer(remotePeerId);
      }
    }
  }

  initiatePeer(remotePeerId) {
    const isInitiator = this.localPeerId < remotePeerId;

    try {
      const peer = new SimplePeer({
        initiator: isInitiator,
        stream: this.localStream || undefined,
        trickle: false, // Set to false for simpler one-shot SDP signaling
        config: {
          iceServers: getIceServers(),
        },
      });

      peer.on("signal", (data) => {
        this.sendSignal(remotePeerId, data);
      });

      peer.on("stream", (stream) => {
        useWorkspaceStore.getState().addRemoteStream(remotePeerId, stream);
      });

      peer.on("error", (err) => {
        console.error(`SimplePeer error with ${remotePeerId}:`, err);
        this.destroyPeer(remotePeerId);
      });

      peer.on("close", () => {
        useWorkspaceStore.getState().removeRemoteStream(remotePeerId);
      });

      this.peers.set(remotePeerId, peer);
    } catch (error) {
      console.error(`Failed to create SimplePeer for ${remotePeerId}:`, error);
    }
  }

  handleSignal(remotePeerId, signal) {
    const peer = this.peers.get(remotePeerId);
    if (peer) {
      try {
        peer.signal(signal);
      } catch (error) {
        console.error(`Failed to pass signal to peer ${remotePeerId}:`, error);
      }
    } else {
      // If we got a signal from someone we haven't created a peer connection for yet
      // (usually because of message arriving before presence update)
      if (this.localStream) {
        this.initiatePeer(remotePeerId);
        const newPeer = this.peers.get(remotePeerId);
        newPeer?.signal(signal);
      }
    }
  }

  destroyPeer(remotePeerId) {
    const peer = this.peers.get(remotePeerId);
    if (peer) {
      try {
        peer.destroy();
      } catch (e) {
        // Safe discard
      }
      this.peers.delete(remotePeerId);
    }
    useWorkspaceStore.getState().removeRemoteStream(remotePeerId);
  }

  destroyAll() {
    for (const remotePeerId of this.peers.keys()) {
      this.destroyPeer(remotePeerId);
    }
  }
}
