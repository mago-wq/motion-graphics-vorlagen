// Render-Einstellungen, gelten für "npx remotion render" und "npx remotion still".
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);

// Komposition 1080×1920 = Ausgabe (TikTok/Reels). 4K nur auf Wunsch: bash scripts/render.sh --4k
Config.setScale(1);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// BT.709 statt JPEG-Vollbereich (sonst yuvj420p, das manche Plattformen falsch umrechnen)
Config.setColorSpace('bt709');
Config.setCrf(16);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// Clips (OffthreadVideo) und große Bilder: nicht zu viele Tabs parallel, sonst läuft der Speicher voll
Config.setConcurrency(3);
Config.setChromiumOpenGlRenderer('swangle');

Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
Config.setSampleRate(44100);
