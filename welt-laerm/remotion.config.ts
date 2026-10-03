// Render-Einstellungen, gelten für "npx remotion render" und "npx remotion still".
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);

// Video: H.264, yuv420p (von allen Plattformen akzeptiert), hohe Qualität.
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// BT.709 statt JPEG-Vollbereich: sonst yuvj420p, das manche Plattformen falsch umrechnen
Config.setColorSpace('bt709');
// CRF 22 statt 18: das Filmkorn ändert sich jedes Frame und bläht die Datei sonst auf ~90 MB.
Config.setCrf(22);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);

// Ton: AAC, 44,1 kHz, Stereo.
Config.setAudioCodec('aac');
Config.setAudioBitrate('192k');
Config.setSampleRate(44100);
