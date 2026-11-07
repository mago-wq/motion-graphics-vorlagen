// Render-Einstellungen, gelten für "npx remotion render" und "npx remotion still".
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);

// 4K hochkant: Komposition 1080×1920, Ausgabe mit Faktor 2 → 2160×3840.
Config.setScale(2);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// BT.709 statt JPEG-Vollbereich (sonst yuvj420p, das manche Plattformen falsch umrechnen)
Config.setColorSpace('bt709');
Config.setCrf(16);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// 4K-Frames sind groß: nicht zu viele Tabs parallel, sonst läuft der Speicher voll
Config.setConcurrency(3);
Config.setChromiumOpenGlRenderer('swangle');

Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
Config.setSampleRate(44100);
