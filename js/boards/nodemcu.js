export default {
  id: 'nodemcu', name: 'NodeMCU (ESP8266)', short: 'NodeMCU', maker: 'NodeMCU / Amica', makerLong: 'NodeMCU / Amica', year: 2015,
  tagline: 'Wi-Fi for a few dollars', level: 'Intermediate',
  lab: { plug: 'bread', logic: 3.3, glow: '#3b8cff' },
  intro: 'The board that made cheap Wi-Fi gadgets possible. One 80 MHz core, Wi-Fi and a handful of pins on a breadboard-friendly strip that costs about three dollars. It is perfect for “internet things”: a sensor that posts readings, a switch you flip from your phone, or a robot that reports where it is. Pins are named D0–D8 on the silkscreen but are different GPIO numbers inside.',
  stats: { clock: '80 MHz', flash: '4 MB', ram: '≈80 KB', gpio: '11', logic: '3.3 V', price: '≈ $3' },
  table: { mcu: 'ESP8266EX', clock: '80 MHz', clockHz: 80e6, flash: '4 MB', flashKB: 4096, ram: '≈80 KB', ramKB: 80, gpio: '11', gpioN: 11, analog: '1', analogN: 1, wireless: 'Wi-Fi', logic: '3.3 V', price: '≈ $3', priceUSD: 3 },
  specs: [
    ['Microcontroller', 'ESP8266EX in an ESP-12E module (Tensilica L106, 32-bit)'], ['Clock speed', '80 MHz (160 MHz possible)'], ['Flash memory', '4 MB'], ['RAM', '≈80 KB available to sketches'],
    ['GPIO', '11 usable (D0–D8, RX, TX)'], ['Analog input', '1 (A0, 10-bit; 0–3.3 V on this board thanks to a divider)'], ['Logic voltage', '3.3 V'],
    ['Power', 'Micro-USB 5 V or VIN 5 V'], ['Wireless', 'Wi-Fi 802.11 b/g/n'], ['Interfaces', 'UART, I²C (software), SPI'], ['Computer link', 'CP2102 (Amica) or CH340 (LoLin)'], ['Size', '48 × 26 mm'],
  ],
  pcb: { w: 48.3, d: 25.6, r: 1.2, color: '#1c1c1e', holes: [[-21.6, -10.3, 1.2], [-21.6, 10.3, 1.2], [21.6, -10.3, 1.2], [21.6, 10.3, 1.2]] },
  silk: [{ t: 'NodeMCU V1.0', x: -7, z: -4.4, s: 1.6, b: true }, { t: 'RST', x: -19.5, z: -3, s: 1.3 }, { t: 'FLASH', x: -19.5, z: 3, s: 1.3 }],
  comps: [
    { type: 'esp12', label: 'ESP8266MOD', x: 11.6, z: 0, rot: -Math.PI / 2, part: 'module' },
    { type: 'usbMicro', x: -22, z: 0, rot: -Math.PI / 2, part: 'usb' },
    { type: 'qfn', w: 5, d: 5, label: 'CP2102', x: -10, z: 3.5, part: 'bridge' },
    { type: 'sot223', label: '1117', x: -10, z: -4.5, part: 'reg' },
    { type: 'smallButton', x: -19.5, z: -6.5, part: 'rst' },
    { type: 'smallButton', x: -19.5, z: 6.5, part: 'flash' },
    { type: 'led', color: '#3b8cff', x: 20.5, z: -6, part: 'led', ledPin: 'D4' },
    { type: 'led', color: '#ff3020', x: -3.5, z: 5.5, part: 'led', ledPin: 'D0' },
    { type: 'smd', x: -4, z: -1 }, { type: 'sot23', x: -15, z: 0 },
  ],
  headers: [
    { type: 'down', x: -17.78, z: -11.43, pins: ['VIN', 'GND', 'RST', 'EN', '3V3', 'GND', 'CLK', 'SD0', 'CMD', 'SD1', 'SD2', 'SD3', 'RSV', 'RSV', 'A0'], part: 'pinsL', labelOff: 2.3 },
    { type: 'down', x: -17.78, z: 11.43, pins: ['3V3', 'GND', 'TX', 'RX', 'D8', 'D7', 'D6', 'D5', 'GND', '3V3', 'D4', 'D3', 'D2', 'D1', 'D0'], part: 'pinsR', labelOff: -2.3 },
  ],
  pinInfo: {
    VIN: { kind: 'pwr', f: '5 V in' }, RST: { kind: 'ctl', f: 'Reset (active LOW)' }, EN: { kind: 'ctl', f: 'Chip enable' },
    CLK: { kind: 'nc', f: 'Flash SPI, do not use' }, SD0: { kind: 'nc', f: 'Flash SPI, do not use' }, CMD: { kind: 'nc', f: 'Flash SPI, do not use' }, SD1: { kind: 'nc', f: 'Flash SPI, do not use' },
    SD2: { kind: 'nc', f: 'GPIO9, tied to flash on most modules' }, SD3: { kind: 'nc', f: 'GPIO10, tied to flash on most modules' }, RSV: { kind: 'nc', f: 'Reserved' }, A0: { kind: 'ana', f: 'ADC0, the only analog input' },
    D0: { f: 'GPIO16 · wake from deep sleep · no PWM / interrupts' }, D1: { kind: 'com', f: 'GPIO5 · I²C SCL (default)' }, D2: { kind: 'com', f: 'GPIO4 · I²C SDA (default)' },
    D3: { kind: 'ctl', f: 'GPIO0 · FLASH button · must be HIGH at boot' }, D4: { kind: 'ctl', f: 'GPIO2 · blue LED · must be HIGH at boot' }, D5: { f: 'GPIO14 · SPI SCK' }, D6: { f: 'GPIO12 · SPI MISO' },
    D7: { f: 'GPIO13 · SPI MOSI' }, D8: { kind: 'ctl', f: 'GPIO15 · SPI CS · must be LOW at boot' }, RX: { kind: 'com', f: 'GPIO3 · UART RX (USB)' }, TX: { kind: 'com', f: 'GPIO1 · UART TX (USB)' },
  },
  parts: [
    { id: 'module', name: 'ESP-12E module', desc: 'The ESP8266EX chip, 4 MB flash and crystal under a shield, with a printed antenna at the end.', quiz: 'Find the Wi-Fi module.' },
    { id: 'usb', name: 'Micro-USB connector', desc: 'Power, uploads and serial.', quiz: 'Where does the USB cable go?' },
    { id: 'bridge', name: 'USB-serial chip', desc: 'CP2102 (or CH340 on LoLin boards). Also pulses RST and FLASH automatically to upload.', quiz: 'Find the USB-to-serial chip.' },
    { id: 'reg', name: '3.3 V regulator', desc: 'Makes 3.3 V from USB/VIN for the module.', quiz: 'Find the regulator.' },
    { id: 'rst', name: 'RST button', desc: 'Restarts the program.', quiz: 'Find the reset button.' },
    { id: 'flash', name: 'FLASH button', desc: 'Holds GPIO0 low for manual upload mode. You can read it as a normal button (D3) in your sketch.', quiz: 'Find the FLASH button.' },
    { id: 'led', name: 'On-board LEDs', desc: 'Blue LED on the module (D4/GPIO2) and a red one on the board (D0/GPIO16). Both are “active low”: LOW turns them on.', quiz: 'Find an LED you can blink.' },
    { id: 'pinsL', name: 'Power & flash row', desc: 'VIN, GND, RST, EN, 3V3, the flash pins (leave them alone!) and A0.', quiz: 'Find the row with the analog input A0.' },
    { id: 'pinsR', name: 'GPIO row', desc: 'D0–D8, RX and TX: the pins you actually use.', quiz: 'Find the row with D0…D8.' },
  ],
  strengths: ['Wi-Fi for the price of a sandwich', 'Breadboard-friendly, USB on board', 'Big community and lots of IoT libraries', 'Deep sleep for battery-powered sensors'],
  pitfalls: ['Only one analog input', 'Few usable pins, and D3, D4, D8 affect booting', 'D-numbers on the board are not the GPIO numbers in code (D1 = GPIO5)', '3.3 V logic only, no 5 V signals'],
  pinNotes: [
    ['Power', 'VIN takes 5 V, 3V3 is the regulated output. Several GND and 3V3 pins are all joined.'],
    ['Digital pins and PWM', 'D1–D8 do software PWM (analogWrite, 0–255 by default in newer cores). D0 can’t do PWM or interrupts.'],
    ['Analog inputs', 'A0 only, 0–1023. A divider on the board lets it read 0–3.3 V.'],
    ['Buses', 'UART on TX/RX (shared with USB). I²C usually on D1 (SCL) and D2 (SDA). SPI on D5–D8.'],
    ['Interrupts', 'All D pins except D0.'],
    ['Boot pins', 'D3 and D4 must be HIGH and D8 LOW when the chip starts, or it won’t boot your sketch.'],
  ],
  code: { title: 'First sketch: blink the module LED', lang: 'Arduino C++', src: `// The blue LED is on D4 (GPIO2) and is "active low".
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(LED_BUILTIN, LOW);   // LOW = on!
  Serial.println("on");
  delay(500);
  digitalWrite(LED_BUILTIN, HIGH);  // HIGH = off
  Serial.println("off");
  delay(500);
}` },
  ideas: ['A Wi-Fi light switch or relay box', 'A room sensor that posts temperature online', 'A robot that reports its battery to your phone', 'A tiny web server with buttons', 'A doorbell that sends a notification'],
  facts: ['The ESP8266 appeared in 2014 with a Chinese-only datasheet; hobbyists translated it themselves.', '“NodeMCU” was first a Lua firmware, and the board was designed to run it.', 'Its deep-sleep current is around 20 µA: months on a battery if it wakes rarely.'],
};
