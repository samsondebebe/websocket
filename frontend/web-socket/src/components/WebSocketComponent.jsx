import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Update this to your backend server's IP/hostname

const VideoBroadcast = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [recipientId, setRecipientId] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const peerConnections = useRef({});
  const candidateQueue = useRef({}); // Buffer for ICE candidates

  const startBroadcast = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log('Broadcast started.');
    } catch (err) {
      console.error('Failed to start broadcast:', err);
    }
  };

  const stopBroadcast = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    // Close all peer connections
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    setRemoteStreams({});
    console.log('Broadcast stopped.');
  };

  const connectToRecipient = async () => {
    if (!recipientId || !localStream) {
      alert('Enter a recipient ID and start broadcasting first.');
      return;
    }

    const pc = new RTCPeerConnection();
    peerConnections.current[recipientId] = pc;
    candidateQueue.current[recipientId] = [];

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('send-signal', { to: recipientId, signalData: { candidate: event.candidate } });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => ({ ...prev, [recipientId]: remoteStream }));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('send-signal', { to: recipientId, signalData: pc.localDescription });
  };

  useEffect(() => {
    socket.on('receive-signal', async ({ from, signalData }) => {
      if (!peerConnections.current[from]) {
        const pc = new RTCPeerConnection();
        peerConnections.current[from] = pc;
        candidateQueue.current[from] = [];

        localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('send-signal', { to: from, signalData: { candidate: event.candidate } });
          }
        };

        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          setRemoteStreams((prev) => ({ ...prev, [from]: remoteStream }));

          // Attach remote stream to video element
          if (remoteVideoRefs.current[from]) {
            remoteVideoRefs.current[from].srcObject = remoteStream;
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(signalData));

        // Process buffered candidates
        candidateQueue.current[from].forEach(async (candidate) => await pc.addIceCandidate(candidate));
        candidateQueue.current[from] = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('send-signal', { to: from, signalData: pc.localDescription });
      } else if (signalData.candidate) {
        const candidate = new RTCIceCandidate(signalData.candidate);
        const pc = peerConnections.current[from];

        if (!pc.remoteDescription) {
          candidateQueue.current[from].push(candidate);
        } else {
          try {
            await pc.addIceCandidate(candidate);
          } catch (error) {
            console.error('Failed to add ICE candidate:', error);
          }8 
        }
      }
    });

    return () => {
      socket.off('receive-signal');
    };
  }, [localStream],[remoteStreams]);

  // Update remote video elements when streams change
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([id, stream]) => {
      if (remoteVideoRefs.current[id]) {
        remoteVideoRefs.current[id].srcObject = stream;
      }
    });
  }, [remoteStreams]);

  return (
    <div>
      <h1>Video Broadcasting</h1>
      <div>
        <button onClick={startBroadcast} disabled={!!localStream}>
          Start Broadcast
        </button>
        <button onClick={stopBroadcast} disabled={!localStream}>
          Stop Broadcast
        </button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Recipient ID"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
        />
        <button onClick={connectToRecipient}>Connect to Recipient</button>
      </div>
      <div style={{ display: 'flex', marginTop: '20px' }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          style={{ width: '45%', border: '2px solid black', marginRight: '10px' }}
        ></video>
        {Object.entries(remoteStreams).map(([id]) => (
          <video
            key={id}
            ref={(ref) => (remoteVideoRefs.current[id] = ref)}
            autoPlay
            style={{ width: '45%', border: '2px solid black' }}
          ></video>
        ))}
      </div>
    </div>
  );
};

export default VideoBroadcast;
