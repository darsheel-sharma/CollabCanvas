import SimplePeer from "simple-peer";
import { useWorkspaceStore } from "../store/workspaceStore.js";

/**
 * Resolves the active ICE (STUN/TURN) servers for WebRTC negotiation.
 * Checks for a `VITE_ICE_SERVERS` environment variable override first,
 * falling back to a robust default list of public STUN/TURN servers.
 */
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
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    }
  ];
}

/**
 * Manages a decentralized P2P WebRTC mesh network for the workspace.
 * Responsible for establishing `simple-peer` connections with every other
 * participant in the room to broadcast local media streams.
 */
export class WebRTCMeshManager {
  constructor({ localPeerId, sendSignal }) {
    this.localPeerId = localPeerId;
    this.sendSignal = sendSignal;
    this.peers = new Map(); // remotePeerId -> SimplePeer instance
    this.localStream = null;
    this.participants = [];
  }

  /**
   * Sets the local audio/video media stream and automatically propagates
   * it to all active peer connections.
   */
  setStream(stream) {
    if (this.localStream === stream) {
      return;
    }

    const oldStream = this.localStream;
    this.localStream = stream;

    // Dynamically update existing peer connections without destroying them
    for (const peer of this.peers.values()) {
      if (oldStream) {
        try { peer.removeStream(oldStream); } catch (e) { /* Safe discard */ }
      }
      if (stream) {
        try { peer.addStream(stream); } catch (e) { /* Safe discard */ }
      }
    }
  }

  /**
   * Called when the active participant list changes. It rebuilds the peer
   * connections (adds new peers, drops disconnected ones).
   */
  updateParticipants(participants) {
    this.participants = participants;
    this.rebuildPeers();
  }

  rebuildPeers() {
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

  /**
   * Initiates a new P2P connection with a remote peer.
   * Resolves connection glare by making the peer with the lexicographically
   * smaller ID act as the connection initiator.
   */
  initiatePeer(remotePeerId) {
    const isInitiator = this.localPeerId < remotePeerId;

    try {
      const peer = new SimplePeer({
        initiator: isInitiator,
        stream: this.localStream || undefined,
        trickle: true, // Enable trickle ICE for fast, continuous connection negotiation
        offerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
        answerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
        config: {
          iceServers: getIceServers(),
        },
      });

      peer.on("signal", (data) => {
        this.sendSignal(remotePeerId, data);
      });

      peer.on("stream", (stream) => {
        const clonedStream = new MediaStream(stream.getTracks());
        useWorkspaceStore.getState().addRemoteStream(remotePeerId, clonedStream);
      });

      peer.on("track", (track, stream) => {
        const clonedStream = new MediaStream(stream.getTracks());
        useWorkspaceStore.getState().addRemoteStream(remotePeerId, clonedStream);
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

  /**
   * Processes an incoming SDP offer/answer or ICE candidate from the signaling server
   * and routes it to the corresponding peer connection.
   */
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
      this.initiatePeer(remotePeerId);
      const newPeer = this.peers.get(remotePeerId);
      newPeer?.signal(signal);
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
