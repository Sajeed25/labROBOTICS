export default {
  id: 'nano', name: 'Arduino Nano', short: 'Nano', maker: 'Arduino', makerLong: 'Arduino', year: 2008,
  tagline: 'An Uno the size of a thumb', level: 'Beginner',
  lab: { plug: 'bread', logic: 5, glow: '#ffb020' },
  intro: 'The same ATmega328P brain as the Uno, squeezed onto a strip that plugs straight into a breadboard. Code written for the Uno runs unchanged, it has two extra analog inputs, and clones cost only a few dollars. That makes it the default pick for small robots where space matters.',
  stats: { clock: '16 MHz', flash: '32 KB', ram: '2 KB', gpio: '22', logic: '5 V', price: '≈ $4–25' },
  table: { mcu: 'ATmega328P', clock: '16 MHz', clockHz: 16e6, flash: '32 KB', flashKB: 32, ram: '2 KB', ramKB: 2, gpio: '22', gpioN: 22, analog: '8', analogN: 8, wireless: 'None', logic: '5 V', price: '≈ $4–25', priceUSD: 4 },
  specs: [
    ['Microcontroller', 'ATmega328P (8-bit AVR)'], ['Clock speed', '16 MHz'], ['Flash memory', '32 KB (2 KB bootloader on the original)'], ['RAM / EEPROM', '2 KB / 1 KB'],
    ['Digital pins', '14 (6 with PWM)'], ['Analog inputs', '8 (A6 and A7 are analog-only)'], ['Logic voltage', '5 V'],
    ['Power', 'USB 5 V, or 7–12 V on VIN'], ['Current per pin', '20 mA recommended'], ['Interfaces', 'UART, I²C, SPI'],
    ['Computer link', 'Mini-USB (FT232 on originals, CH340 on most clones)'], ['Size', '18 × 45 mm, about 7 g'],
  ],
  pcb: { w: 43.2, d: 18.5, r: 1, color: '#0f5f94', holes: [[-20, -7.6, .9], [-20, 7.6, .9], [20, -7.6, .9], [20, 7.6, .9]] },
  silk: [{ t: 'NANO', x: 13, z: 0, s: 2.2, b: true, r: -Math.PI / 2 }],
  backText: 'Arduino NANO',
  comps: [
    { type: 'qfp', w: 7, d: 7, label: '328P', x: 5, z: 0, rot: Math.PI / 4, part: 'mcu' },
    { type: 'usbMini', x: -19.5, z: 0, rot: -Math.PI / 2, part: 'usb' },
    { type: 'soic', w: 9.5, d: 4, pins: 16, label: 'CH340G', x: -6, z: 0, side: 'b', part: 'bridge' },
    { type: 'sot223', label: '1117', x: 8, z: 0, side: 'b', part: 'reg' },
    { type: 'smallButton', x: -6, z: 0, part: 'reset', color: '#ecebe4' },
    { type: 'led', color: '#ffb020', x: -12, z: -3.5, part: 'ledL', ledPin: 'D13' },
    { type: 'led', color: '#ffb020', x: -12, z: -1.2, part: 'txrx', ledPin: 'TX' }, { type: 'led', color: '#ffb020', x: -12, z: 1.2, part: 'txrx', ledPin: 'RX' },
    { type: 'led', color: '#36d058', x: -12, z: 3.5, part: 'on', always: true },
    { type: 'resonator', x: 12, z: -3, rot: Math.PI / 2, part: 'xtal' },
    { type: 'smd', x: 1, z: 4.5 }, { type: 'smd', x: 1, z: -4.5 }, { type: 'smd', x: -2, z: 4 },
  ],
  headers: [
    { type: 'down', x: -17.78, z: -7.62, pins: ['D13', '3V3', 'AREF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RESET', 'GND', 'VIN'], part: 'pinsA', labelOff: 2.2 },
    { type: 'down', x: -17.78, z: 7.62, pins: ['D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND', 'RESET', 'D0', 'D1'], part: 'pinsD', labelOff: -2.2 },
    { type: 'male', rows: 2, x: 15.3, z: -2.54, pins: ['MISO', 'SCK', 'RESET'], pins2: ['5V', 'MOSI', 'GND'], part: 'icsp', noLabels: true },
  ],
  pinInfo: {
    D0: { kind: 'com', f: 'UART RX, shared with USB' }, D1: { kind: 'com', f: 'UART TX, shared with USB' }, D2: { f: 'Interrupt INT0' }, D3: { f: 'PWM ~ · INT1' },
    D5: { f: 'PWM ~' }, D6: { f: 'PWM ~' }, D9: { f: 'PWM ~' }, D10: { f: 'PWM ~ · SPI SS' }, D11: { f: 'PWM ~ · SPI MOSI' }, D12: { f: 'SPI MISO' }, D13: { f: 'SPI SCK · LED “L”' },
    A4: { f: 'Analog · I²C SDA' }, A5: { f: 'Analog · I²C SCL' }, A6: { f: 'Analog input only' }, A7: { f: 'Analog input only' },
    AREF: { kind: 'pwr', f: 'Analog reference' }, VIN: { f: '7–12 V in' }, '5V': { f: '5 V in/out' }, '3V3': { f: '3.3 V out (small current)' },
  },
  parts: [
    { id: 'mcu', name: 'ATmega328P (TQFP)', desc: 'The same chip as the Uno in a flat surface-mount package, soldered at 45°. Not removable this time, so treat its pins with care.', quiz: 'Find the microcontroller.' },
    { id: 'usb', name: 'Mini-USB connector', desc: 'Power, uploads and serial all come through this small connector. Many newer clones use USB-C or micro-USB instead.', quiz: 'Where does the USB cable go?' },
    { id: 'bridge', name: 'USB-serial chip (underside)', desc: 'Flip the board: the CH340 (or FT232) turns USB into serial. Clones with CH340 may need a driver on older computers.', quiz: 'Find the USB-to-serial chip. It is on the bottom.', bottom: true },
    { id: 'reg', name: '5 V regulator (underside)', desc: 'Turns VIN (7–12 V) into 5 V. It is tiny, so keep the load light.', quiz: 'Find the voltage regulator under the board.', bottom: true },
    { id: 'reset', name: 'RESET button', desc: 'Restarts the sketch. Right in the middle so you can reach it on a breadboard.', quiz: 'Find the reset button.' },
    { id: 'ledL', name: 'LED “L” on D13', desc: 'The built-in LED for your first blink.', quiz: 'Find the LED on pin 13.' },
    { id: 'txrx', name: 'TX / RX LEDs', desc: 'Blink as serial data moves over USB.', quiz: 'Which LEDs show USB traffic?' },
    { id: 'on', name: 'Power LED', desc: 'Shows that 5 V is present.', quiz: 'Find the power LED.' },
    { id: 'xtal', name: '16 MHz resonator', desc: 'The clock that paces the microcontroller.', quiz: 'Find the 16 MHz clock part.' },
    { id: 'pinsA', name: 'Analog & power row', desc: 'D13, 3V3, AREF, A0–A7, 5V, RESET, GND, VIN. Power and sensors live on this side.', quiz: 'Find the row with the analog inputs.' },
    { id: 'pinsD', name: 'Digital row', desc: 'D0–D12 plus GND and RESET. The pins point down so the board sits across the breadboard gap.', quiz: 'Find the row with D2…D12.' },
    { id: 'icsp', name: 'ICSP header', desc: 'Programming header for burning a bootloader, also the SPI bus.', quiz: 'Find the 6-pin programming header.' },
  ],
  strengths: ['Fits a breadboard, so no loose jumper wires dangling from headers', 'Same code and libraries as the Uno', 'Two extra analog inputs (A6, A7)', 'Clones cost about the price of a coffee'],
  pitfalls: ['Clones with a CH340 chip may need a USB driver, and some need “ATmega328P (Old Bootloader)” selected', 'A6 and A7 are analog only; digitalRead() will not work on them', 'The small regulator overheats easily from VIN above 9 V', 'Mini-USB sockets break off if the cable is yanked, so add strain relief on robots'],
  pinNotes: [
    ['Power', '5V can be an input (from USB or a regulated supply) or an output. VIN takes 7–12 V. GND appears twice and both are the same ground.'],
    ['Digital pins and PWM', 'D0–D13 just like the Uno; PWM on 3, 5, 6, 9, 10, 11.'],
    ['Analog inputs', 'A0–A7 read 0–5 V as 0–1023. A0–A5 can also be digital pins; A6 and A7 cannot.'],
    ['Buses', 'UART on D0/D1, I²C on A4/A5, SPI on D10–D13 and the ICSP header.'],
    ['Interrupts', 'D2 and D3 support attachInterrupt().'],
  ],
  code: { title: 'First sketch: read a knob on A0', lang: 'Arduino C++', src: `// A potentiometer: ends to 5V and GND, wiper to A0.
void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);          // 0 … 1023
  float volts = raw * 5.0 / 1023.0;  // back to volts
  Serial.print(raw);
  Serial.print("  ");
  Serial.print(volts, 2);
  Serial.println(" V");
  delay(200);
}` },
  ideas: ['A tiny line-follower on a single breadboard', 'A wearable or badge project', 'A sumo or mini-sumo robot', 'A USB MIDI controller with knobs', 'A sensor node for a bigger robot'],
  facts: ['The Nano came out in 2008, two years before the Uno R3.', 'Its 0.6-inch pin spacing leaves exactly one free row each side on a standard breadboard.', 'Newer “Nano Every”, “Nano 33” and “Nano ESP32” boards keep the same footprint with very different chips.'],
};
