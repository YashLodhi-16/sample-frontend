import { useStore, type IStoreContext } from "@/store/StoreProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import userInfo from "@/lib/userInfo";
import getDevices from "@/lib/getDevices";

const Peer = () => {
  const { peer, socket, user, to, remoteStream } = useStore();

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [remoteOffer, setRemoteOffer] =
    useState<RTCSessionDescriptionInit | null>(null);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);
  const [isAnyoneCalling, setIsAnyoneCalling] = useState<null | string>(null);
  const [whoseCalling, setWhoseCalling] = useState<null | NonNullable<
    IStoreContext["user"]
  >>(null);
  const [callPicked, setCallPicked] = useState<string | null>(null);

  const handleAddTrack = useCallback(() => {
    if (mediaStream && !remoteStream) {
      const senders: RTCRtpSender[] = [];
      const tracks = mediaStream.getTracks();
      for (const track of tracks) {
        senders.push(peer.addTrack(track, mediaStream));
      }
      return senders;
    } else {
      return null;
    }
  }, [mediaStream, peer, remoteStream]);

  useEffect(() => {
    const senders: null | RTCRtpSender[] = handleAddTrack();
    return () => {
      if (senders && senders.length > 0) {
        senders.forEach((sender) => {
          peer.removeTrack(sender);
        });
        console.log("Remove Tracks From Peer");
      }
    };
  }, [handleAddTrack, peer]);

  const [autoAnswer, setAutoAnswer] = useState(false);
  const handleAnswerCall = useCallback(async () => {
    if (!remoteOffer) {
      console.log("Offer is Not Available to Create an Answer");
      return;
    }
    if (!whoseCalling) {
      console.log("Sorry but We Don't, Handle Answer Call");
      return;
    }

    if (!mediaStream) {
      const stream = await getDevices({ audio: true });
      if (!stream) {
        return;
      }

      setMediaStream(stream);
    }

    await peer.setRemoteDescription(remoteOffer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("call:answer", {
      to: user!._id,
      answer,
      from: whoseCalling._id,
    });
    setIsAnyoneCalling(null);
    setCallPicked(whoseCalling.userName);
  }, [mediaStream, peer, remoteOffer, socket, user, whoseCalling]);
  useEffect(() => {
    if (remoteOffer && whoseCalling && isAnyoneCalling && autoAnswer) {
      handleAnswerCall().finally(() => {
        setAutoAnswer(false);
      });
    }
  }, [
    remoteOffer,
    whoseCalling,
    isAnyoneCalling,
    autoAnswer,
    handleAnswerCall,
  ]);

  const handleSocketCallIncoming = useCallback(
    async ({
      offer,
      from,
      negotiation,
    }: {
      offer: RTCSessionDescriptionInit;
      from: string;
      negotiation: boolean;
    }) => {
      console.log("incoming call");
      setRemoteOffer(offer);
      setIsAnyoneCalling(from);
      const user = await userInfo(from);
      if (user) {
        setWhoseCalling(user.data);
        if (negotiation) {
          setAutoAnswer(true);
        }
      } else {
        console.log("Unable to find the user");
      }
    },
    []
  );
  const handleSocketCallReject = useCallback(async ({ to }: { to: string }) => {
    const user = await userInfo(to);
    if (user) {
      const reason = `${user.data.userName} Rejected Your Call`;
      console.log(reason);
      setRejectedReason(reason);
    }
  }, []);
  const handleSocketCallPick = useCallback(
    async ({
      answer,
      to,
    }: {
      answer: RTCSessionDescriptionInit;
      to: string;
    }) => {
      console.log("call picked");
      await peer.setRemoteDescription(answer);
      const user = await userInfo(to);
      if (user) {
        console.log(`${user.data.userName} Received your Call`);
      } else {
        console.log(`${to} Received your Call`);
      }
      setCallPicked(user?.data.userName || "Random");
    },
    [peer]
  );
  const handleSocketUserOffline = useCallback(
    async ({ reason, to }: { to: string; reason: string }) => {
      const user = await userInfo(to);
      if (user) {
        console.log(`${user.data.userName} is Offline Because: ${reason}`);
      } else {
        console.log(`${to} is Currently Offline`);
      }
    },
    []
  );

  const callReject = "call:reject";
  const callInitiate = "call:initiate";

  const handlePeerNegotiationNeededInit = useCallback(async () => {
    console.log("negotiation event fire");
    if (!remoteOffer) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit(callInitiate, {
        offer,
        from: user!._id,
        to,
        negotiation: true,
      });
    }
  }, [socket, user, peer, to, remoteOffer]);

  // main
  useEffect(() => {
    const callIncoming = "call:incoming";
    const callPick = "call:pick";
    const userOffline = "user:offline";

    socket.on(callIncoming, handleSocketCallIncoming);
    socket.on(callReject, handleSocketCallReject);
    socket.on(callPick, handleSocketCallPick);
    socket.on(userOffline, handleSocketUserOffline);
    peer.addEventListener("negotiationneeded", handlePeerNegotiationNeededInit);

    return () => {
      socket.removeListener(callIncoming, handleSocketCallIncoming);
      socket.removeListener(callReject, handleSocketCallReject);
      socket.removeListener(callPick, handleSocketCallPick);
      socket.removeListener(userOffline, handleSocketUserOffline);

      peer.removeEventListener(
        "negotiationneeded",
        handlePeerNegotiationNeededInit
      );
    };
  }, [
    handleSocketCallIncoming,
    handleSocketCallReject,
    handleSocketCallPick,
    handleSocketUserOffline,
    handlePeerNegotiationNeededInit,
    peer,
    socket,
  ]);

  const handleCall = async () => {
    const stream = await getDevices({ audio: true });
    if (!stream) {
      return;
    }

    setMediaStream(stream);

    if (!to) {
      console.log("Please Select a User");
      return;
    }

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit(callInitiate, { offer, from: user!._id, to });
  };

  const handleRejectCall = () => {
    if (!whoseCalling) {
      console.log("Sorry but We Don't, Handle Reject Call");
      return;
    }
    const from = whoseCalling._id;
    const to = user!._id;
    socket.emit(callReject, { to, from });
    setIsAnyoneCalling(null);
    setWhoseCalling(null);
  };

  const audioRef = useRef<null | HTMLAudioElement>(null);

  const handleAudioMetaDataLoad = useCallback(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.play().catch(console.log);
    }
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    console.log(audioElement, remoteStream);

    if (remoteStream && audioElement) {
      audioElement.srcObject = remoteStream;

      audioElement.addEventListener("loadedmetadata", handleAudioMetaDataLoad);
    }

    return () => {
      audioElement?.removeEventListener(
        "loadedmetadata",
        handleAudioMetaDataLoad
      );
      // if (audioElement) {
      //   audioElement.srcObject = null;
      // }
    };
  }, [remoteStream, handleAudioMetaDataLoad]);
  return (
    <div className="flex flex-col gap-4 justify-center items-start">
      <Button variant="outline" onClick={handleCall}>
        Call
      </Button>

      {rejectedReason && <p>{rejectedReason}</p>}

      <audio ref={audioRef} controls autoPlay playsInline></audio>
      <Button
        variant="outline"
        onClick={() => {
          const audioElement = audioRef.current;
          if (audioElement) {
            audioElement.play();
          }
        }}
      >
        Play Audio
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          const audioElement = audioRef.current;
          if (audioElement) {
            audioElement.pause();
          }
        }}
      >
        Pause Audio
      </Button>

      {callPicked && <p>{callPicked} is on the Call with You.</p>}

      {isAnyoneCalling && (
        <>
          {whoseCalling && (
            <div>
              <p>
                <span className="font-bold text-lg">
                  {whoseCalling.userName}
                </span>{" "}
                is Calling You
              </p>
            </div>
          )}

          <div>
            <Button variant="outline" onClick={handleRejectCall}>
              Reject Call
            </Button>

            <Button variant="outline" onClick={handleAnswerCall}>
              Answer Call
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Peer;
