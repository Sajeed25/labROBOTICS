export default {
  id: 'esp32', name: 'ESP32 DevKit V1', short: 'ESP32', maker: 'DOIT · Espressif chip', makerLong: 'DOIT · Espressif chip', year: 2016,
  tagline: 'Wi-Fi and Bluetooth for pocket money', level: 'Intermediate',
  lab: { plug: 'bread', logic: 3.3, glow: '#3b8cff' },
  intro: 'Two 240 MHz cores, Wi-Fi, Bluetooth and a fistful of peripherals for about five dollars. The ESP32 can host a web page that drives your robot from a phone, stream sensor data to the cloud, or talk to a game controller over Bluetooth. It runs Arduino code, MicroPython or Espressif’s own ESP-IDF. Just remember that its pins work at 3.3 V.',
  stats: { clock: '240 MHz', flash: '4 MB', ram: '520 KB', gpio: '25', logic: '3.3 V', price: '≈ $5' },
  table: { mcu: 'ESP32 (2 × LX6 cores)', clock: '240 MHz', clockHz: 240e6, flash: '4 MB', flashKB: 4096, ram: '520 KB', ramKB: 520, gpio: '25', gpioN: 25, analog: '15 (12-bit) + 2 DAC', analogN: 15, wireless: 'Wi-Fi + Bluetooth', logic: '3.3 V', price: '≈ $5', priceUSD: 5 },
  specs: [
    ['Microcontroller', 'ESP32-D0WD in an ESP-WROOM-32 module (2 × Xtensa LX6)'], ['Clock speed', 'up to 240 MHz'], ['Flash memory', '4 MB (external SPI flash in the module)'],
    ['RAM', '520 KB SRAM'], ['GPIO', '25 usable on the 30-pin board; GPIO34–39 are inputs only'], ['Analog', '15 × 12-bit ADC inputs, 2 × 8-bit DAC outputs'],
    ['Logic voltage', '3.3 V (not 5 V tolerant)'], ['Power', 'Micro-USB 5 V, or 5 V on VIN'], ['Wireless', 'Wi-Fi 802.11 b/g/n, Bluetooth 4.2 + BLE'],
    ['Interfaces', '3 × UART, 2 × I²C, 3 × SPI, I²S, CAN, touch pins, hall sensor'], ['Computer link', 'Micro-USB through a CP2102 (or CH340)'], ['Size', '51.5 × 28 mm'],
  ],
  pcb: { w: 51.5, d: 28, r: 1.2, color: '#1d2733', holes: [[-23.5, -11.5, 1], [-23.5, 11.5, 1]] },
  silk: [{ t: 'ESP32 DEVKIT V1', x: -6, z: -4.2, s: 1.6, b: true }, { t: 'EN', x: -21, z: -3, s: 1.3 }, { t: 'BOOT', x: -21, z: 3.2, s: 1.3 }],
  comps: [
    { type: 'module', w: 18, d: 25.5, can: 16, label: 'ESP-WROOM-32', x: 13.5, z: 0, rot: -Math.PI / 2, part: 'module' },
    { type: 'usbMicro', x: -23.3, z: 0, rot: -Math.PI / 2, part: 'usb' },
    { type: 'qfn', w: 5, d: 5, label: 'CP2102', x: -11, z: 4, part: 'bridge' },
    { type: 'sot223', label: 'AMS1117', x: -11, z: -4.5, part: 'reg' },
    { type: 'smallButton', x: -20.5, z: -6.5, part: 'en', color: '#1d1d1f' },
    { type: 'smallButton', x: -20.5, z: 6.5, part: 'boot', color: '#1d1d1f' },
    { type: 'led', color: '#ff3020', x: -4, z: -6, part: 'pwr', always: true },
    { type: 'led', color: '#3b8cff', x: -4, z: 6, part: 'led', ledPin: 'D2' },
    { type: 'smd', x: -2, z: 0 }, { type: 'smd', x: -16, z: 0 }, { type: 'sot23', x: -6, z: 1.5 },
  ],
  headers: [
    { type: 'down', x: -17.78, z: -11.43, pins: ['VIN', 'GND', 'D13', 'D12', 'D14', 'D27', 'D26', 'D25', 'D33', 'D32', 'D35', 'D34', 'VN', 'VP', 'EN'], part: 'pinsL', labelOff: 2.4 },
    { type: 'down', x: -17.78, z: 11.43, pins: ['3V3', 'GND', 'D15', 'D2', 'D4', 'RX2', 'TX2', 'D5', 'D18', 'D19', 'D21', 'RX0', 'TX0', 'D22', 'D23'], part: 'pinsR', labelOff: -2.4 },
  ],
  pinInfo: {
    VIN: { kind: 'pwr', f: '5 V in (from USB or an external 5 V supply)' }, '3V3': { f: '3.3 V out from the regulator' }, EN: { kind: 'ctl', f: 'Enable / reset: LOW restarts the chip' },
    VP: { kind: 'ana', f: 'GPIO36 · ADC1 · input only' }, VN: { kind: 'ana', f: 'GPIO39 · ADC1 · input only' }, D34: { kind: 'ana', f: 'GPIO34 · ADC1 · input only' }, D35: { kind: 'ana', f: 'GPIO35 · ADC1 · input only' },
    D32: { kind: 'ana', f: 'GPIO32 · ADC1 · touch' }, D33: { kind: 'ana', f: 'GPIO33 · ADC1 · touch' }, D25: { kind: 'ana', f: 'GPIO25 · DAC1 · ADC2' }, D26: { kind: 'ana', f: 'GPIO26 · DAC2 · ADC2' },
    D27: { f: 'GPIO27 · ADC2 · touch' }, D14: { f: 'GPIO14 · ADC2 · outputs PWM at boot' }, D12: { kind: 'ctl', f: 'GPIO12 · strapping pin, keep LOW at boot' }, D13: { f: 'GPIO13 · ADC2 · touch' },
    D15: { kind: 'ctl', f: 'GPIO15 · strapping pin' }, D2: { f: 'GPIO2 · blue on-board LED · strapping' }, D4: { f: 'GPIO4 · ADC2 · touch' }, RX2: { kind: 'com', f: 'GPIO16 · UART2 RX' }, TX2: { kind: 'com', f: 'GPIO17 · UART2 TX' },
    D5: { f: 'GPIO5 · SPI CS (VSPI)' }, D18: { f: 'GPIO18 · SPI SCK' }, D19: { f: 'GPIO19 · SPI MISO' }, D21: { kind: 'com', f: 'GPIO21 · I²C SDA' }, RX0: { kind: 'com', f: 'GPIO3 · UART0 RX (USB)' },
    TX0: { kind: 'com', f: 'GPIO1 · UART0 TX (USB)' }, D22: { kind: 'com', f: 'GPIO22 · I²C SCL' }, D23: { f: 'GPIO23 · SPI MOSI' },
  },
  parts: [
    { id: 'module', name: 'ESP-WROOM-32 module', desc: 'Under the metal shield sit the dual-core ESP32 chip, 4 MB of flash and a 40 MHz crystal. The zig-zag copper beyond the shield is the Wi-Fi/Bluetooth antenna. Keep metal and wires away from it.', quiz: 'Find the module with the ESP32 inside.' },
    { id: 'usb', name: 'Micro-USB connector', desc: 'Power and programming. Use a data cable, because many cheap cables only charge.', quiz: 'Where does the USB cable plug in?' },
    { id: 'bridge', name: 'CP2102 USB-serial chip', desc: 'Turns USB into serial for uploads and the Serial Monitor. It also toggles EN and BOOT automatically while uploading.', quiz: 'Find the USB-to-serial chip.' },
    { id: 'reg', name: '3.3 V regulator (AMS1117)', desc: 'Makes 3.3 V from USB/VIN. The ESP32 can pull 250 mA spikes when Wi-Fi transmits, and a weak supply causes “brownout” resets.', quiz: 'Find the 3.3 V regulator.' },
    { id: 'en', name: 'EN button', desc: 'Short for “enable”: press it to reset the ESP32.', quiz: 'Which button resets the board?' },
    { id: 'boot', name: 'BOOT button', desc: 'Holds GPIO0 low. If an upload hangs on “Connecting…”, hold BOOT until it starts.', quiz: 'Which button forces upload mode?' },
    { id: 'pwr', name: 'Power LED', desc: 'Red LED: 3.3 V is present.', quiz: 'Find the red power LED.' },
    { id: 'led', name: 'Blue LED on GPIO2', desc: 'A user LED you can blink from code (pin 2).', quiz: 'Find the LED you can program.' },
    { id: 'pinsL', name: 'Left pin row', desc: 'VIN, GND and many ADC-capable pins. VP, VN, D34 and D35 are inputs only.', quiz: 'Find the row with VIN and the input-only pins.' },
    { id: 'pinsR', name: 'Right pin row', desc: '3V3, GND, the I²C pins (21/22), SPI pins and two UARTs.', quiz: 'Find the row with 3V3 and the I²C pins.' },
  ],
  strengths: ['Wi-Fi and Bluetooth built in, so you can control a robot from a phone', 'Two fast cores and lots of RAM for real-time tasks', 'Huge feature set: touch pins, DAC, CAN, I²S audio', 'Programs in Arduino, MicroPython or ESP-IDF'],
  pitfalls: ['3.3 V logic: 5 V signals into a pin can kill it, so use a level shifter', 'ADC2 pins stop working while Wi-Fi is on, so use ADC1 (32–39) for sensors', 'Strapping pins (0, 2, 12, 15) must be at the right level during boot', 'Wi-Fi current spikes need a solid supply and a capacitor near the board'],
  pinNotes: [
    ['Power', 'VIN takes 5 V. 3V3 is the regulated output (also an input if you power from 3.3 V directly). Never feed 5 V into 3V3.'],
    ['Digital pins and PWM', 'Almost any output pin can do PWM through the LEDC peripheral (16 channels). GPIO34–39 are inputs only and have no pull-ups.'],
    ['Analog inputs', '12-bit: analogRead() returns 0–4095 for roughly 0–3.3 V. Use ADC1 pins when Wi-Fi is on. GPIO25/26 are true analog outputs (DAC).'],
    ['Buses', 'UART0 on TX0/RX0 (USB), UART2 on RX2/TX2. I²C defaults to 21 (SDA) and 22 (SCL). SPI (VSPI) on 18, 19, 23 and 5. Pins can be remapped.'],
    ['Interrupts', 'Every GPIO can trigger an interrupt.'],
    ['Strapping pins', 'GPIO0, 2, 5, 12 and 15 are read at power-up to choose the boot mode. Don’t pull them the wrong way with sensors.'],
  ],
  code: { title: 'First sketch: blink and say hello over Wi-Fi', lang: 'Arduino C++', src: `#include <WiFi.h>
const int LED = 2;                    // blue on-board LED

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
  WiFi.softAP("robot-lab", "12345678"); // make its own network
  Serial.print("Join Wi-Fi robot-lab, IP: ");
  Serial.println(WiFi.softAPIP());
}

void loop() {
  digitalWrite(LED, !digitalRead(LED)); // toggle
  delay(500);
}` },
  ideas: ['A phone-controlled rover with a web page UI', 'A Bluetooth gamepad robot', 'A Wi-Fi weather station that uploads data', 'A camera robot (with the ESP32-CAM variant)', 'A robot that shares sensor data with other ESP32s over ESP-NOW'],
  facts: ['Espressif is based in Shanghai; the ESP32 followed the hugely popular ESP8266 in 2016.', 'Its Wi-Fi radio can also run ESP-NOW, a router-free protocol for board-to-board messages.', 'It has a built-in hall-effect sensor that can feel a magnet held near the chip.'],
};
