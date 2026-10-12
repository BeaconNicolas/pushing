// Turns any video into an H.264 + AAC MP4 (the format both iOS and Android play
// natively), sized and compressed for sending, then hands it to the phone's share
// sheet. Everything runs in the browser through WebCodecs; nothing is uploaded.
import {
  Input,
  Output,
  Conversion,
  ConversionCanceledError,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  Quality,
  canEncodeAudio,
  canEncodeVideo,
} from "./vendor/mediabunny.min.mjs";

const $ = (id) => document.getElementById(id);

const steps = {
  pick: $("pick-step"),
  settings: $("settings-step"),
  progress: $("progress-step"),
  done: $("done-step"),
};

// Audio is small next to video, so keep it at a quality nobody will notice.
const AUDIO_BITRATE = 128_000;
// Bits per pixel per frame for H.264. 0.1 gives ~6 Mbps at 1080p30, which looks clean on a phone.
const BITS_PER_PIXEL = { 1080: 0.1, 720: 0.09, original: 0.1 };
// The lowest bits per pixel we accept before dropping to a smaller resolution in "fit a file size" mode.
const MIN_BITS_PER_PIXEL = 0.045;
// Standard heights (short side) to step down through when fitting a file size.
const LADDER = [2160, 1440, 1080, 720, 540, 480, 360, 240];
// Leaves room for the MP4 container and for the encoder overshooting its target.
const SIZE_SAFETY = 0.92;

let source = null; // { file, input, info }
let conversion = null;
let result = null; // { file, url }
let sourceUrl = null;
let wakeLock = null;
let aacEncoderLoaded = false;

/* ---------- Setup ---------- */

if (!("VideoEncoder" in window) || !("VideoDecoder" in window)) {
  $("unsupported").hidden = false;
  $("drop").setAttribute("aria-disabled", "true");
  $("file").disabled = true;
}

$("file").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) loadFile(file);
});

const drop = $("drop");
["dragenter", "dragover"].forEach((type) =>
  drop.addEventListener(type, (e) => {
    e.preventDefault();
    drop.classList.add("is-over");
  })
);
["dragleave", "drop"].forEach((type) => drop.addEventListener(type, () => drop.classList.remove("is-over")));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file && !$("file").disabled) loadFile(file);
});

document.querySelectorAll('input[name="preset"]').forEach((r) => r.addEventListener("change", updateEstimate));
$("target-mb").addEventListener("input", () => {
  document.querySelector('input[name="preset"][value="size"]').checked = true;
  updateEstimate();
});
$("change-file").addEventListener("click", reset);
$("start-over").addEventListener("click", reset);
$("convert").addEventListener("click", convert);
$("cancel").addEventListener("click", () => conversion && conversion.cancel());
$("share").addEventListener("click", share);

/* ---------- Step 1: read the picked file ---------- */

async function loadFile(file) {
  hideError();
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  let codec = null;
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new Error("no-video");
    const audio = await input.getPrimaryAudioTrack();

    codec = await video.getCodec();
    const [duration, width, height, stats] = await Promise.all([
      input.computeDuration(),
      video.getDisplayWidth(),
      video.getDisplayHeight(),
      video.computePacketStats(120),
    ]);

    const info = {
      duration,
      width,
      height,
      codec,
      fps: stats.averagePacketRate || 30,
      videoBitrate: stats.averageBitrate || (file.size * 8) / duration,
      audio: audio
        ? {
            codec: await audio.getCodec(),
            channels: await audio.getNumberOfChannels(),
            bitrate: (await audio.computePacketStats(200)).averageBitrate || AUDIO_BITRATE,
          }
        : null,
      canDecode: await video.canDecode(),
    };
    if (!info.canDecode) throw new Error("undecodable");

    source = { file, input, info };
  } catch (err) {
    input.dispose();
    console.error(err);
    showError(
      err.message === "no-video"
        ? "That file doesn't contain a video."
        : err.message === "undecodable"
          ? `This browser can't read ${codecName(codec)} video. Try opening this page in Chrome or Safari.`
          : "Couldn't read that file. Try a different video (MP4, MOV, WebM and MKV work)."
    );
    $("file").value = "";
    return;
  }

  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = URL.createObjectURL(file);
  $("source-preview").src = sourceUrl;
  $("source-name").textContent = file.name;
  renderMeta($("source-meta"), [
    ["Size", formatBytes(file.size)],
    ["Length", formatDuration(source.info.duration)],
    ["Picture", `${source.info.width}×${source.info.height}, ${Math.round(source.info.fps)} fps`],
    ["Format", codecName(source.info.codec)],
  ]);
  updateEstimate();
  show("settings");
}

/* ---------- Step 2: work out the output settings ---------- */

function selectedPreset() {
  return document.querySelector('input[name="preset"]:checked').value;
}

// Returns { width, height, fps, videoBitrate, audioBitrate, transcode, copyAudio, estimate } or { error }.
function plan(info, preset) {
  const short = Math.min(info.width, info.height);
  const scaleTo = (targetShort) => {
    // H.264 on phones tops out around 4K, so cap the long side at 3840 too.
    const scale = Math.min(1, targetShort / short, 3840 / Math.max(info.width, info.height));
    return { width: even(info.width * scale), height: even(info.height * scale) };
  };
  const bitrateFor = (d, fps, bitsPerPixel) => {
    // High frame rates need more bits, but not twice as many: neighbouring frames are very similar.
    const fpsWeight = 30 * Math.pow(fps / 30, 0.6);
    return Math.round(d.width * d.height * fpsWeight * bitsPerPixel);
  };

  // Stereo AAC already plays everywhere, so keep it as is unless we're squeezing to a file size.
  const aacOk = info.audio && info.audio.codec === "aac" && info.audio.channels <= 2;
  const copyAudio = !!aacOk && (preset !== "size" || info.audio.bitrate <= AUDIO_BITRATE * 1.25);
  const audioBitrate = !info.audio ? 0 : copyAudio ? info.audio.bitrate : AUDIO_BITRATE;

  let dims, fps, videoBitrate;

  if (preset === "size") {
    const mb = Number($("target-mb").value);
    if (!(mb > 0)) return { error: "Enter a size in MB." };
    fps = Math.min(info.fps, 30);
    const totalBits = mb * 1_000_000 * 8 * SIZE_SAFETY;
    videoBitrate = Math.floor(totalBits / info.duration - audioBitrate);

    // Use the biggest resolution that still gets enough bits per pixel.
    const rungs = LADDER.filter((h) => h <= short);
    if (!rungs.length || rungs[0] !== short) rungs.unshift(short);
    const fits = (h) => {
      const d = scaleTo(h);
      return videoBitrate >= d.width * d.height * fps * MIN_BITS_PER_PIXEL;
    };
    dims = scaleTo(rungs.find(fits) ?? rungs[rungs.length - 1]);
    // If the limit is generous, don't spend more than the "Keep the original" option would.
    videoBitrate = Math.min(videoBitrate, bitrateFor(dims, fps, BITS_PER_PIXEL.original));

    const floor = 150_000;
    if (videoBitrate < floor) {
      const minMb = Math.ceil(((floor + audioBitrate) * info.duration) / 8 / 1_000_000 / SIZE_SAFETY);
      return { error: `That's too small for a ${formatDuration(info.duration)} video. Try at least ${minMb} MB.` };
    }
  } else {
    const targetShort = preset === "original" ? short : Number(preset);
    dims = scaleTo(targetShort);
    fps = Math.min(info.fps, preset === "720" ? 30 : 60);
    videoBitrate = bitrateFor(dims, fps, BITS_PER_PIXEL[preset]);
  }

  // Never spend more bits than the original had; that only makes the file bigger.
  videoBitrate = Math.min(videoBitrate, Math.round(info.videoBitrate));

  const sameShape = dims.width === info.width && dims.height === info.height && fps >= info.fps - 0.5;
  const alreadySmall = videoBitrate >= info.videoBitrate * 0.95;
  // An H.264 file that's already the right size and bitrate is copied untouched (fast and lossless).
  const transcode = !(info.codec === "avc" && sameShape && alreadySmall);
  if (!transcode) videoBitrate = Math.round(info.videoBitrate);

  return {
    ...dims,
    fps,
    videoBitrate,
    audioBitrate,
    transcode,
    copyAudio,
    estimate: ((videoBitrate + audioBitrate) * info.duration) / 8,
  };
}

function updateEstimate() {
  if (!source) return;
  const p = plan(source.info, selectedPreset());
  const out = $("estimate");
  if (p.error) {
    out.textContent = p.error;
    $("convert").disabled = true;
    return;
  }
  $("convert").disabled = false;
  const shrink = 1 - p.estimate / source.file.size;
  out.textContent =
    `About ${formatBytes(p.estimate)} at ${p.width}×${p.height}` +
    (shrink > 0.05 ? `, roughly ${Math.round(shrink * 100)}% smaller.` : ".");
}

/* ---------- Step 3: convert ---------- */

async function convert() {
  hideError();
  const preset = selectedPreset();
  const p = plan(source.info, preset);
  if (p.error) return showError(p.error);

  show("progress");
  setProgress(0, "Getting ready…");

  try {
    if (p.transcode) {
      const ok = await canEncodeVideo("avc", {
        width: p.width,
        height: p.height,
        quality: new Quality({ bitrate: p.videoBitrate }),
      });
      if (!ok) {
        throw new FriendlyError(
          "This browser can't create H.264 video at this size. Try a lower quality, or open this page in Chrome or Safari."
        );
      }
    }
    if (source.info.audio && !p.copyAudio && !aacEncoderLoaded && !(await canEncodeAudio("aac"))) {
      // Some browsers (e.g. Firefox, Chrome on Linux) can't encode AAC natively, so load a small WASM encoder.
      setProgress(0, "Loading audio encoder…");
      const { registerAacEncoder } = await import("./vendor/mediabunny-aac-encoder.min.mjs");
      registerAacEncoder();
      aacEncoderLoaded = true;
    }

    const output = new Output({
      // "in-memory" puts the index at the front of the file so it starts playing while still downloading.
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget(),
    });

    conversion = await Conversion.init({
      input: source.input,
      output,
      tracks: "primary",
      video: p.transcode
        ? {
            codec: "avc",
            width: p.width,
            height: p.height,
            fit: "contain",
            frameRate: p.fps < source.info.fps - 0.5 ? p.fps : undefined,
            quality: new Quality({ bitrate: p.videoBitrate, bitrateMode: preset === "size" ? "constant" : "variable" }),
            keyFrameInterval: 2,
            // Bake rotation into the pixels, since a few Android apps ignore rotation metadata.
            allowTransformationMetadata: false,
            forceTranscode: true,
          }
        : // Already a phone-friendly H.264 stream at the right size: copy it untouched.
          { codec: "avc" },
      audio: p.copyAudio
        ? { codec: "aac" }
        : {
            codec: "aac",
            numberOfChannels: Math.min(2, source.info.audio?.channels || 2),
            quality: new Quality({ bitrate: AUDIO_BITRATE }),
            forceTranscode: true,
          },
    });

    if (!conversion.isValid) {
      const reasons = conversion.discardedTracks.map((d) => `${d.track.type}: ${d.reason}`).join(", ");
      console.error("Conversion invalid:", reasons);
      throw new FriendlyError("This video can't be converted in this browser. Try opening the page in Chrome or Safari.");
    }
    const lostAudio = conversion.discardedTracks.some((d) => d.track.type === "audio");
    if (lostAudio) console.warn("Audio dropped:", conversion.discardedTracks.map((d) => d.reason).join(", "));

    conversion.onProgress = (progress) => setProgress(progress, p.transcode ? "Converting…" : "Preparing…");
    await keepAwake();
    await conversion.execute();

    const name = source.file.name.replace(/\.[^.]+$/, "") + (preset === "original" ? "" : `-${Math.min(p.width, p.height)}p`) + ".mp4";
    const file = new File([output.target.buffer], name, { type: "video/mp4" });
    showResult(file, preset, lostAudio);
  } catch (err) {
    if (err instanceof ConversionCanceledError) {
      show("settings");
    } else {
      console.error(err);
      show("settings");
      showError(
        err instanceof FriendlyError
          ? err.message
          : "Something went wrong while converting. If the video is very long, try the 720p option, or try on a computer."
      );
    }
  } finally {
    conversion = null;
    releaseWake();
  }
}

function setProgress(fraction, label) {
  const pct = Math.round(fraction * 100);
  $("progress-text").textContent = label;
  $("progress-pct").textContent = `${pct}%`;
  $("bar-fill").style.width = `${pct}%`;
  $("bar").setAttribute("aria-valuenow", String(pct));
}

/* ---------- Step 4: send ---------- */

function showResult(file, preset, lostAudio) {
  clearResult();
  result = { file, url: URL.createObjectURL(file) };

  $("result-preview").src = result.url;
  $("download").href = result.url;
  $("download").download = file.name;

  const saved = 1 - file.size / source.file.size;
  $("saving").textContent =
    saved > 0.05 ? `${formatBytes(file.size)}, ${Math.round(saved * 100)}% smaller` : `${formatBytes(file.size)}, ready to send`;
  renderMeta($("result-meta"), [
    ["Was", formatBytes(source.file.size)],
    ["Format", "MP4 (H.264 + AAC), plays on iPhone and Android"],
  ]);

  const notes = [];
  if (preset === "size") {
    const limit = Number($("target-mb").value) * 1_000_000;
    if (file.size > limit) notes.push(`It came out a little over ${$("target-mb").value} MB. Try a slightly smaller number.`);
  }
  if (lostAudio) notes.push("The sound couldn't be converted in this browser, so this copy is silent.");

  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  $("share").hidden = !canShare;
  notes.push(
    canShare
      ? "Send opens your phone's share sheet: WhatsApp, Messages, Telegram, email, AirDrop and more."
      : "Save it, then attach it in any app. On a phone, this page can send it directly."
  );
  $("share-hint").textContent = notes.join(" ");
  show("done");
}

async function share() {
  if (!result) return;
  try {
    await navigator.share({ files: [result.file], title: result.file.name });
  } catch (err) {
    // AbortError just means the person closed the share sheet.
    if (err.name !== "AbortError") showError("Couldn't open the share sheet. Use Save to device, then send it from your app.");
  }
}

/* ---------- Helpers ---------- */

class FriendlyError extends Error {}

function show(step) {
  for (const [key, el] of Object.entries(steps)) el.hidden = key !== step;
  steps[step].scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function reset() {
  hideError();
  clearResult();
  if (source) source.input.dispose();
  source = null;
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = null;
  $("source-preview").removeAttribute("src");
  $("file").value = "";
  show("pick");
}

function clearResult() {
  if (!result) return;
  $("result-preview").removeAttribute("src");
  URL.revokeObjectURL(result.url);
  result = null;
}

function showError(message) {
  $("error").textContent = message;
  $("error").hidden = false;
}

function hideError() {
  $("error").hidden = true;
}

function renderMeta(dl, rows) {
  dl.replaceChildren(
    ...rows.flatMap(([k, v]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = k;
      dd.textContent = v;
      return [dt, dd];
    })
  );
}

// Phones keep converting only while the screen is on and the page is visible.
async function keepAwake() {
  try {
    wakeLock = await navigator.wakeLock?.request("screen");
  } catch {
    wakeLock = null;
  }
}

function releaseWake() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

function even(n) {
  return Math.max(2, Math.round(n / 2) * 2);
}

function formatBytes(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(bytes >= 1e8 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function formatDuration(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const pad = (x) => String(x).padStart(2, "0");
  return h ? `${h}:${pad(m % 60)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

function codecName(codec) {
  return (
    { avc: "H.264", hevc: "HEVC (H.265)", vp8: "VP8", vp9: "VP9", av1: "AV1", prores: "ProRes" }[codec] ||
    (codec ? codec.toUpperCase() : "unknown")
  );
}
