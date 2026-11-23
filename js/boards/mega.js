const evens = [], odds = [];
for (let i = 22; i <= 52; i += 2) { evens.push('D' + i); odds.push('D' + (i + 1)); }
export default {
  id: 'mega', name: 'Arduino Mega 2560 R3', short: 'Mega', maker: 'Arduino', makerLong: 'Arduino', year: 2010,
  tagline: 'When the Uno runs out of pins', level: 'Intermediate',
  lab: { plug: 'socket', logic: 5, glow: '#ffb020' },
  intro: 'A stretched Uno with the much bigger ATmega2560: 54 digital pins, 16 analog inputs, four hardware serial ports and eight times the memory. It is the board of choice for 3D printers, robot arms with many servos, and any build that keeps needing “just one more pin”. Most Uno shields still fit on the left half.',
  stats: { clock: '16 MHz', flash: '256 KB', ram: '8 KB', gpio: '54', logic: '5 V', price: '≈ $45' },
  table: { mcu: 'ATmega2560', clock: '16 MHz', clockHz: 16e6, flash: '256 KB', flashKB: 256, ram: '8 KB', ramKB: 8, gpio: '54', gpioN: 54, analog: '16', analogN: 16, wireless: 'None', logic: '5 V', price: '≈ $45', priceUSD: 45 },
  specs: [
    ['Microcontroller', 'ATmega2560 (8-bit AVR)'], ['Clock speed', '16 MHz'], ['Flash memory', '256 KB (8 KB bootloader)'], ['RAM / EEPROM', '8 KB / 4 KB'],
    ['Digital pins', '54, of which 15 with PWM'], ['Analog inputs', '16 (10-bit ADC)'], ['Logic voltage', '5 V'], ['Power', 'USB 5 V or 7–12 V via jack / Vin'],
    ['Current per pin', '20 mA recommended'], ['Interfaces', '4 × UART, I²C, SPI'], ['Computer link', 'USB-B through an ATmega16U2'], ['Size', '101.6 × 53.3 mm, about 37 g'],
  ],
  pcb: { w: 101.6, d: 53.3, r: 2.5, color: '#0f6f86', holes: [[-44, -23, 1.6], [-37, 24, 1.6], [15, -14, 1.6], [38, -14, 1.6]] },
  silk: [{ t: 'MEGA 2560', x: 8, z: -11, s: 4.5, b: true }, { t: 'ARDUINO', x: 26, z: 4, s: 2.6 }, { t: 'COMMUNICATION', x: 29, z: -18.5, s: 1.6 }, { t: 'PWM', x: -15, z: -18.5, s: 1.6 }, { t: 'ANALOG IN', x: 9, z: 19.5, s: 1.8 }, { t: 'POWER', x: -15, z: 19.5, s: 1.8 }],
  comps: [
    { type: 'qfp', w: 14, d: 14, label: 'ATMEGA2560', x: 4, z: 7, rot: Math.PI / 4, part: 'mcu' },
    { type: 'usbB', x: -48.8, z: -12.5, rot: -Math.PI / 2, part: 'usb' },
    { type: 'qfn', w: 5, d: 5, label: '16U2', x: -32, z: -12.5, rot: Math.PI / 4, part: 'u2' },
    { type: 'jack', x: -46.1, z: 17, rot: -Math.PI / 2, part: 'jack' },
    { type: 'sot223', label: '1117', x: -33, z: 19, part: 'reg' },
    { type: 'cap', x: -36, z: 8, part: 'caps' }, { type: 'cap', x: -29, z: 8, part: 'caps' },
    { type: 'led', color: '#ffb020', x: -20, z: -12, part: 'ledL', ledPin: 'D13' },
    { type: 'led', color: '#ffb020', x: -20, z: -8.5, part: 'txrx', ledPin: 'TX' }, { type: 'led', color: '#ffb020', x: -20, z: -6.5, part: 'txrx', ledPin: 'RX' },
    { type: 'led', color: '#36d058', x: 30, z: -11, part: 'on', always: true },
    { type: 'button', s: 6, x: -37, z: -21.5, part: 'reset', color: '#7a2a24' },
    { type: 'crystal', w: 11, d: 4.6, h: 3.6, x: -23, z: 2, rot: Math.PI / 2, part: 'xtal' },
    { type: 'smdCrystal', x: -9, z: 10, part: 'xtal' },
    { type: 'smd', x: -12, z: 0 }, { type: 'smd', x: -14, z: 4 }, { type: 'smd', x: 18, z: 12 },
  ],
  headers: [
    { type: 'female', x: -32, z: -24.2, pins: ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'], part: 'digital', labelOff: 2.6 },
    { type: 'female', x: -5.1, z: -24.2, pins: ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'], part: 'digital', labelOff: 2.6 },
    { type: 'female', x: 17.7, z: -24.2, pins: ['D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21'], part: 'comm', labelOff: 2.6 },
    { type: 'female', x: -27.3, z: 24.2, pins: ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND', 'GND', 'VIN'], part: 'power', labelOff: -2.6 },
    { type: 'female', x: -4.5, z: 24.2, pins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'], part: 'analog', labelOff: -2.6 },
    { type: 'female', x: 18.3, z: 24.2, pins: ['A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15'], part: 'analog', labelOff: -2.6 },
    { type: 'female', dir: 'z', rows: 2, x: 45.2, z: -20.3, pins: ['5V', ...evens, 'GND'], pins2: ['5V', ...odds, 'GND'], part: 'double', labelOff: -2.8 },
    { type: 'male', dir: 'z', rows: 2, x: 33, z: 4.5, pins: ['MISO', 'SCK', 'RESET'], pins2: ['5V', 'MOSI', 'GND'], part: 'icsp', noLabels: true },
  ],
  pinInfo: {
    D0: { kind: 'com', f: 'Serial RX0, shared with USB' }, D1: { kind: 'com', f: 'Serial TX0, shared with USB' },
    D14: { kind: 'com', f: 'Serial3 TX' }, D15: { kind: 'com', f: 'Serial3 RX' }, D16: { kind: 'com', f: 'Serial2 TX' }, D17: { kind: 'com', f: 'Serial2 RX' },
    D18: { kind: 'com', f: 'Serial1 TX · INT3' }, D19: { kind: 'com', f: 'Serial1 RX · INT2' }, D20: { kind: 'com', f: 'I²C SDA · INT1' }, D21: { kind: 'com', f: 'I²C SCL · INT0' },
    D2: { f: 'PWM ~ · INT4' }, D3: { f: 'PWM ~ · INT5' }, D13: { f: 'PWM ~ · LED “L”' }, D50: { kind: 'com', f: 'SPI MISO' }, D51: { kind: 'com', f: 'SPI MOSI' }, D52: { kind: 'com', f: 'SPI SCK' }, D53: { kind: 'com', f: 'SPI SS' },
    AREF: { kind: 'pwr', f: 'Analog reference' }, VIN: { f: '7–12 V in' }, '3V3': { f: '3.3 V out, max 50 mA' },
  },
  parts: [
    { id: 'mcu', name: 'ATmega2560 microcontroller', desc: 'A 100-pin square chip with 8 KB of RAM and 256 KB of flash, with room for big sketches and many libraries.', quiz: 'Find the big square microcontroller.' },
    { id: 'usb', name: 'USB-B connector', desc: 'Power, uploads and Serial Monitor, exactly like the Uno.', quiz: 'Where does the USB cable plug in?' },
    { id: 'u2', name: 'ATmega16U2 USB bridge', desc: 'Converts USB to the first serial port (Serial).', quiz: 'Find the USB-to-serial chip.' },
    { id: 'jack', name: 'Power jack, 7–12 V', desc: 'Barrel socket for an adapter or battery pack, centre positive.', quiz: 'Where would a battery pack plug in?' },
    { id: 'reg', name: '5 V regulator', desc: 'Makes 5 V from the jack voltage. Gets warm; not for motors.', quiz: 'Find the regulator.' },
    { id: 'caps', name: 'Electrolytic capacitors', desc: 'Smooth the supply around the regulator.', quiz: 'Find the smoothing capacitors.' },
    { id: 'digital', name: 'Digital & PWM pins 0–13', desc: 'Same layout as an Uno so shields line up; pins 2–13 all do PWM on the Mega.', quiz: 'Find pins 0–13.' },
    { id: 'comm', name: 'Communication pins 14–21', desc: 'Three extra hardware serial ports (TX1/RX1, TX2/RX2, TX3/RX3) plus I²C on 20/21. Perfect for talking to GPS, Bluetooth and another board at once.', quiz: 'Find the extra serial ports.' },
    { id: 'power', name: 'POWER header', desc: '5V, 3.3V, GND, Vin and RESET, same order as the Uno.', quiz: 'Where do modules get power?' },
    { id: 'analog', name: 'Analog inputs A0–A15', desc: 'Sixteen 10-bit analog inputs in two rows of eight.', quiz: 'Find the 16 analog inputs.' },
    { id: 'double', name: 'Double header D22–D53', desc: 'Thirty-two extra digital pins in a 2-row block, with 5V at one end and GND at the other. SPI lives on 50–53.', quiz: 'Find the double row of extra pins.' },
    { id: 'ledL', name: 'LED “L” (pin 13)', desc: 'Built-in LED for blink tests.', quiz: 'Find the pin-13 LED.' },
    { id: 'txrx', name: 'TX / RX LEDs', desc: 'Show USB serial traffic.', quiz: 'Which LEDs flash during uploads?' },
    { id: 'on', name: 'ON LED', desc: 'Power indicator.', quiz: 'Find the power LED.' },
    { id: 'reset', name: 'RESET button', desc: 'Restarts the sketch.', quiz: 'Find the reset button.' },
    { id: 'xtal', name: '16 MHz crystals', desc: 'Clock sources for the bridge and the main chip.', quiz: 'Find a clock crystal.' },
    { id: 'icsp', name: 'ICSP header', desc: 'Direct programming header and SPI.', quiz: 'Find the ICSP header.' },
  ],
  strengths: ['54 digital pins and 16 analog inputs, enough for big robot arms and printers', 'Four hardware serial ports: no SoftwareSerial juggling', '8 KB RAM handles displays and large arrays', 'Uno shields mostly fit, same 5 V forgiving logic'],
  pitfalls: ['Same 20 mA per-pin limit, so dozens of LEDs still need drivers', 'SPI is on 50–53, not 11–13 like the Uno: some old shields need rewiring', 'Bigger and pricier, so overkill for small robots', 'Total current from all pins together is limited (about 200 mA)'],
  pinNotes: [
    ['Power', 'Identical POWER header to the Uno, plus 5V and GND at the ends of the double header.'],
    ['Digital pins and PWM', '54 pins switch 0/5 V. PWM on 2–13 and 44–46.'],
    ['Analog inputs', 'A0–A15, 0–5 V → 0–1023.'],
    ['Buses', 'Serial (0/1), Serial1 (19/18), Serial2 (17/16), Serial3 (15/14). I²C on 20/21. SPI on 50–53 and ICSP.'],
    ['Interrupts', 'Pins 2, 3, 18, 19, 20 and 21 support attachInterrupt().'],
  ],
  code: { title: 'First sketch: echo between two serial ports', lang: 'Arduino C++', src: `// Anything typed in the Serial Monitor goes out
// on Serial1 (pins 18/19), and back again.
void setup() {
  Serial.begin(9600);    // USB
  Serial1.begin(9600);   // TX1 = 18, RX1 = 19
}

void loop() {
  if (Serial.available())  Serial1.write(Serial.read());
  if (Serial1.available()) Serial.write(Serial1.read());
}` },
  ideas: ['A 6-servo robot arm with a joystick', 'A 3D printer or CNC controller (RAMPS shield)', 'A rover that talks to GPS, Bluetooth and a Pi at once', 'An LED matrix or big button panel', 'A hexapod with 18 servos (with a servo driver)'],
  facts: ['Most hobby 3D printers of the 2010s ran on a Mega with a RAMPS shield.', 'The 2560 in the name is short for its 256 KB of flash.', 'Its extra serial ports make it a favourite “muscle” board under a Raspberry Pi “brain”.'],
};
