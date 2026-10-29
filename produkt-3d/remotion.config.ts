// Render-Einstellungen, gelten für "npx remotion render" und "npx remotion still".
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);

// Video: H.264, yuv420p (von allen Plattformen akzeptiert), BT.709 statt JPEG-Vollbereich.
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setCrf(18);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);

// three.js braucht WebGL. 'swangle' (ANGLE auf SwiftShader) läuft ohne Grafikkarte,
// 'angle' scheitert im Cloud-Container mit „Error creating WebGL context“.
Config.setChromiumOpenGlRenderer('swangle');
