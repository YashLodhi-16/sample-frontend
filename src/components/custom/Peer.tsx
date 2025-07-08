import { useStore, type IStoreContext } from "@/store/StoreProvider";
import { Button } from "../ui/button";
import getDevices from "@/lib/getDevices";
import { useCallback, useEffect, useRef, useState } from "react";
import userInfo from "@/lib/userInfo";

const Peer = () => {
  // store vars
  const { to, peer, socket, user } = useStore();

  // event names
  const callInitiate = "call:initiate";
  const callIncoming = "call:incoming";
  const userOffline = "user:offline";
  const callReject = "call:reject";
  const callAnswer = "call:answer";
  const callPick = "call:pick";
  const callNegotiationInitiate = "call:negotiation:initiate";
  const callNegotiationComplete = "call:negotiation:complete";

  // references
  const localAudioRef = useRef<null | HTMLAudioElement>(null);
  const remoteAudioRef = useRef<null | HTMLAudioElement>(null);

  // local States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callPicked, setCallPicked] = useState<string | null>(null);
  const [whoseCalling, setWhoseCalling] = useState<NonNullable<
    IStoreContext["user"]
  > | null>(null);
  const [remoteOffer, setRemoteOffer] =
    useState<null | RTCSessionDescriptionInit>(null);
  const [callRejectedReason, setCallRejectedReason] = useState<string | null>(
    null
  );

  // ui handlers
  // add tracks to peer
  const handleAddTrack = useCallback(
    (stream: MediaStream) => {
      const tracks = stream.getTracks();
      for (const track of tracks) {
        peer.peer.addTrack(track, stream);
      }
    },
    [peer]
  );

  // initiate a new call
  const handleCall = useCallback(async () => {
    if (!to) {
      console.log("Please Select a User");
      return;
    }

    const stream = await getDevices({ audio: true });
    if (!stream) {
      console.log("handle call stream is not available");
      return;
    }

    setLocalStream(stream);

    const offer = await peer.newOffer();

    socket.emit(callInitiate, { offer, caller: user!._id, callee: to });
  }, [peer, socket, to, user]);

  // reject call
  const handleRejectCall = useCallback(() => {
    if (!whoseCalling) {
      console.log("handle reject call whose calling is null");
      return;
    }
    const from = whoseCalling._id;
    const to = user!._id;
    socket.emit(callReject, { callee: to, caller: from });
    setWhoseCalling(null);
  }, [socket, user, whoseCalling]);

  // answer a call
  const handleAnswerCall = useCallback(async () => {
    if (!remoteOffer) {
      console.log("Offer is Not Available to Create an Answer");
      return;
    }
    if (!whoseCalling) {
      console.log("Sorry but We Don't, Handle Answer Call");
      return;
    }

    if (!localStream) {
      const stream = await getDevices({ audio: true });
      if (!stream) {
        console.log("handle answer call stream is not available");
        return;
      }
      setLocalStream(stream);
      handleAddTrack(stream);
    }

    const answer = await peer.newAnswer(remoteOffer);

    socket.emit(callAnswer, {
      callee: user!._id,
      answer,
      caller: whoseCalling._id,
    });
    setCallPicked(whoseCalling.userName);
    setWhoseCalling(null);
  }, [
    handleAddTrack,
    localStream,
    peer,
    remoteOffer,
    socket,
    user,
    whoseCalling,
  ]);

  // peer functions
  // handle logic for negotiation event
  const handlePeerNegotiationNeededInit = useCallback(async () => {
    console.log("negotiation event fire");
    if (!remoteOffer) {
      const offer = await peer.newOffer();
      socket.emit(callNegotiationInitiate, {
        offer,
        caller: user!._id,
        callee: to,
      });
    }
  }, [peer, remoteOffer, socket, to, user]);

  // handle logic for track event
  const handlePeerTrack = useCallback((ev: RTCTrackEvent) => {
    const newRemoteStream = ev.streams[0];
    setRemoteStream(newRemoteStream);
  }, []);

  // handle peer related logic
  useEffect(() => {
    peer.peer.addEventListener(
      "negotiationneeded",
      handlePeerNegotiationNeededInit
    );
    peer.peer.addEventListener("track", handlePeerTrack);
    return () => {
      console.log("remove peer event");
      // remove listener
      peer.peer.removeEventListener(
        "negotiationneeded",
        handlePeerNegotiationNeededInit
      );
      // peer.peer.removeEventListener("track", handlePeerTrack);
    };
  }, [peer, handlePeerNegotiationNeededInit, handlePeerTrack]);

  //socket functions
  // handle logic for incoming calls
  const handleSocketCallIncoming = useCallback(
    async ({
      offer,
      caller,
    }: {
      offer: RTCSessionDescriptionInit;
      caller: string;
    }) => {
      console.log("incoming call");
      setRemoteOffer(offer);
      const user = await userInfo(caller);

      if (user) {
        setWhoseCalling(user.data);
      } else {
        console.log("Unable to find the user");
      }
    },
    []
  );

  // handle logic for rejected calls
  const handleSocketCallReject = useCallback(
    async ({ callee }: { callee: string }) => {
      const user = await userInfo(callee);
      if (user) {
        const reason = `${user.data.userName} Rejected Your Call`;
        console.log(reason);
        setCallRejectedReason(reason);
      }
    },
    []
  );

  // handle logic for call picked
  const handleSocketCallPick = useCallback(
    async ({
      answer,
      callee,
    }: {
      answer: RTCSessionDescription;
      callee: string;
    }) => {
      console.log("call picked");
      await peer.setRemoteDescription(answer);
      const user = await userInfo(callee);
      if (user) {
        console.log(`${user.data.userName} Received your Call`);
      } else {
        console.log(`${callee} Received your Call`);
      }
      setCallPicked(user?.data.userName || "Random");
      setWhoseCalling(null);
      handleAddTrack(localStream!);
    },
    [handleAddTrack, localStream, peer]
  );

  // handle logic for negotiation intiatialization
  const handleSocketNegotiationInit = useCallback(
    async ({
      offer,
      caller,
    }: {
      offer: RTCSessionDescriptionInit;
      caller: string;
    }) => {
      const answer = await peer.newAnswer(offer);
      socket.emit(callNegotiationComplete, {
        answer,
        caller,
        callee: user!._id,
      });
      console.log("negotiation with caller complete,", caller);
    },
    [peer, socket, user]
  );

  // handle logic for negotiation complete
  const handleSocketNegotiationComplete = useCallback(
    async ({
      answer,
      callee,
    }: {
      answer: RTCSessionDescription;
      callee: string;
    }) => {
      await peer.setRemoteDescription(answer);
      console.log("negotiation with callee complete,", callee);
    },
    [peer]
  );

  type Reason = { reason: string };
  type CallerOffline = { caller: string } & Reason;
  type CalleeOffline = { callee: string } & Reason;
  const handleSocketUserOffline = useCallback(
    async (obj: CalleeOffline | CallerOffline) => {
      const to = (obj as CallerOffline).caller
        ? (obj as CallerOffline).caller
        : (obj as CalleeOffline).callee;

      const user = await userInfo(to);
      if (user) {
        console.log(`${user.data.userName} is Offline Because: ${obj.reason}`);
      } else {
        console.log(`${to} is Currently Offline`);
      }
    },
    []
  );

  // handle socket related logic
  useEffect(() => {
    // add listener
    socket.on(callIncoming, handleSocketCallIncoming);
    socket.on(callReject, handleSocketCallReject);
    socket.on(callPick, handleSocketCallPick);
    socket.on(callNegotiationInitiate, handleSocketNegotiationInit);
    socket.on(callNegotiationComplete, handleSocketNegotiationComplete);
    socket.on(userOffline, handleSocketUserOffline);

    return () => {
      console.log("remove socket event");
      // remove listener
      socket.off(callIncoming, handleSocketCallIncoming);
      socket.off(callReject, handleSocketCallReject);
      socket.off(callPick, handleSocketCallPick);
      socket.off(callNegotiationInitiate, handleSocketNegotiationInit);
      socket.off(callNegotiationComplete, handleSocketNegotiationComplete);
      socket.off(userOffline, handleSocketUserOffline);
    };
  }, [
    socket,
    handleSocketCallIncoming,
    handleSocketCallReject,
    handleSocketCallPick,
    handleSocketNegotiationInit,
    handleSocketNegotiationComplete,
    handleSocketUserOffline,
  ]);

  // basic audio useEffects

  useEffect(() => {
    const audioElement = localAudioRef.current;
    if (localStream && audioElement) {
      audioElement.srcObject = localStream;
    }
    return () => {
      if (audioElement && localStream) {
        // audioElement.srcObject = null;
        // setLocalStream(null);
        console.log("remove local stream and audio element src");
      }
    };
  }, [localStream]);

  useEffect(() => {
    const audioElement = remoteAudioRef.current;
    if (remoteStream && audioElement) {
      audioElement.srcObject = remoteStream;
      console.log("remote stream", remoteStream);
    }

    return () => {
      if (audioElement && remoteStream) {
        // setRemoteStream(null);
        // audioElement.srcObject = null;
      }
    };
  }, [remoteStream]);
  return (
    <div className="flex flex-col gap-4 justify-center items-start">
      {/* call button */}
      <Button variant="outline" onClick={handleCall}>
        Call
      </Button>

      {/* show this when someone picks your call */}
      {callPicked && <p>{callPicked} is on the Call with You.</p>}

      {/* audio tags to play */}
      <audio ref={localAudioRef} controls autoPlay playsInline muted></audio>
      <audio ref={remoteAudioRef} controls autoPlay playsInline></audio>

      {remoteStream && (
        <Button
          onClick={() => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play();
            }
          }}
        >
          Play remote Audio
        </Button>
      )}

      {localStream && (
        <Button
          onClick={() => {
            handleAddTrack(localStream);
          }}
        >
          Send Stream
        </Button>
      )}

      {callRejectedReason && (
        <p className="font-bold text-base capitalize">{callRejectedReason}</p>
      )}

      {/* shows when someone calls you */}
      {whoseCalling && (
        <div>
          <div>
            {/* show who is calling */}
            <p>
              <span className="font-bold text-lg">{whoseCalling.userName}</span>{" "}
              is Calling You
            </p>
          </div>

          {/* handle call */}
          <div>
            <Button variant="outline" onClick={handleRejectCall}>
              Reject Call
            </Button>

            <Button variant="outline" onClick={handleAnswerCall}>
              Answer Call
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Peer;
