export default class PeerService {
  public peer: RTCPeerConnection;
  constructor() {
    const config = [
      {
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun.l.google.com:5349",
            ],
          },
        ],
      },
    ] as RTCConfiguration;
    this.peer = new RTCPeerConnection(config);
  }

  async newOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }

  async newAnswer(offer: RTCSessionDescriptionInit) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  async setRemoteDescription(answer: RTCSessionDescription) {
    await this.peer.setRemoteDescription(answer);
  }
}
