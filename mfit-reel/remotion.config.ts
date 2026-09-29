// Render-Einstellungen für "npx remotion render" und "npx remotion still".
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);

// H.264, yuv420p, BT.709 (TV-Range): so rechnet Instagram die Farben richtig um.
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setCrf(16);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
