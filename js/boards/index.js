// The eight boards, in the order they appear on the site. Each module follows the same data contract
// (see README.md): metadata, lesson content, a procedural layout (pcb / comps / headers) and lab settings.
import uno from './uno.js';
import nano from './nano.js';
import mega from './mega.js';
import esp32 from './esp32.js';
import nodemcu from './nodemcu.js';
import pico from './pico.js';
import bluepill from './bluepill.js';
import rpi4 from './rpi4.js';

export const BOARDS = [uno, nano, mega, esp32, nodemcu, pico, bluepill, rpi4];
export const byId = (id) => BOARDS.find((b) => b.id === id);
