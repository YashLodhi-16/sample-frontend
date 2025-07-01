export default async function getDevices(constraints: MediaStreamConstraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.log(error);
    return null;
  }
}
