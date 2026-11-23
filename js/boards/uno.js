const d = (n) => Array.from({ length: n });
export default {
  id: 'uno', name: 'Arduino Uno R3', short: 'Uno', maker: 'Arduino', makerLong: 'Arduino', year: 2010,
  tagline: 'Where almost everyone starts', level: 'Beginner',
  lab: { plug: 'socket', logic: 5, glow: '#ffb020' },
  intro: 'The classic learning board. Its 8-bit ATmega328P is simple and hard to kill, the 5 V pins forgive a lot, and the female headers take jumper wires with no soldering at all. More tutorials have been written for the Uno than for any other board, and add-on boards called “shields” plug straight on top.',
  stats: { clock: '16 MHz', flash: '32 KB', ram: '2 KB', gpio: '14 + 6', logic: '5 V', price: '≈ $25' },
  table: { mcu: 'ATmega328P', clock: '16 MHz', clockHz: 16e6, flash: '32 KB', flashKB: 32, ram: '2 KB', ramKB: 2, gpio: '14 + 6', gpioN: 20, analog: '6 × 10-bit', analogN: 6, wireless: '—', logic: '5 V', price: '≈ $25', priceUSD: 25 },
  specs: [
    ['Microcontroller', 'ATmega328P (8-bit AVR)'], ['Clock speed', '16 MHz'], ['Flash memory', '32 KB (0.5 KB taken by the bootloader)'],
    ['RAM / EEPROM', '2 KB / 1 KB'], ['Digital pins', '14, six of them with PWM'], ['Analog inputs', '6 (10-bit ADC)'], ['Logic voltage', '5 V'],
    ['Power', 'USB 5 V, or 7–12 V through the barrel jack / Vin'], ['Current per pin', '20 mA recommended (40 mA absolute maximum)'],
    ['Interfaces', 'UART, I²C, SPI'], ['Computer link', 'USB-B through an ATmega16U2 bridge chip'], ['Size', '68.6 × 53.4 mm, about 25 g'],
  ],
  pcb: { w: 68.6, d: 53.4, r: 2.5, color: '#0f6f86', holes: [[-27.5, -23, 1.6], [-20.5, 24, 1.6], [32, 19.5, 1.6], [32, -12, 1.6]] },
  silk: [{ t: 'UNO', x: 14, z: -4, s: 6, b: true }, { t: 'ARDUINO', x: 14, z: 3, s: 2.6 }, { t: 'DIGITAL (PWM~)', x: 2, z: -18.5, s: 1.8 }, { t: 'POWER', x: -1.5, z: 19.5, s: 1.8 }, { t: 'ANALOG IN', x: 21, z: 19.5, s: 1.8 }],
  comps: [
    { type: 'dip', pins: 28, label: 'ATMEGA328P', x: 12, z: 13.5, part: 'mcu' },
    { type: 'usbB', x: -32.3, z: -12.5, rot: -Math.PI / 2, part: 'usb' },
    { type: 'qfn', w: 5, d: 5, label: '16U2', x: -16, z: -12.5, rot: Math.PI / 4, part: 'u2' },
    { type: 'jack', x: -29.6, z: 17, rot: -Math.PI / 2, part: 'jack' },
    { type: 'sot223', label: '1117', x: -17.5, z: 19, part: 'reg' },
    { type: 'cap', x: -20, z: 8, part: 'caps' }, { type: 'cap', x: -13, z: 8, part: 'caps' },
    { type: 'led', color: '#ffb020', x: -5, z: -12, part: 'ledL', ledPin: 'D13' },
    { type: 'led', color: '#ffb020', x: -5, z: -8.5, part: 'txrx', ledPin: 'TX' }, { type: 'led', color: '#ffb020', x: -5, z: -6.5, part: 'txrx', ledPin: 'RX' },
    { type: 'led', color: '#36d058', x: 22, z: -13, part: 'on', always: true },
    { type: 'button', s: 6, x: -21, z: -21.5, part: 'reset', color: '#7a2a24' },
    { type: 'crystal', w: 11, d: 4.6, h: 3.6, x: -9, z: 1, rot: Math.PI / 2, part: 'xtal' },
    { type: 'resonator', x: 4, z: 3, part: 'xtal' },
    { type: 'smd', x: 2, z: -3 }, { type: 'smd', x: 6, z: -3 }, { type: 'sot23', x: -2, z: 10 }, { type: 'smd', x: -26, z: 3 },
  ],
  headers: [
    { type: 'female', x: -15.5, z: -24.2, pins: ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'], part: 'digital', labelOff: 2.6 },
    { type: 'female', x: 11.6, z: -24.2, pins: ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'], part: 'digital', labelOff: 2.6 },
    { type: 'female', x: -10.8, z: 24.2, pins: ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND', 'GND', 'VIN'], part: 'power', labelOff: -2.6 },
    { type: 'female', x: 12.6, z: 24.2, pins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'], part: 'analog', labelOff: -2.6 },
    { type: 'male', dir: 'z', rows: 2, x: 29.4, z: 9.5, pins: ['MISO', 'SCK', 'RESET'], pins2: ['5V', 'MOSI', 'GND'], part: 'icsp', noLabels: true },
  ],
  pinInfo: {
    D0: { kind: 'com', f: 'UART RX — shared with the USB link' }, D1: { kind: 'com', f: 'UART TX — shared with the USB link' },
    D2: { f: 'Digital · interrupt INT0' }, D3: { f: 'PWM ~ · interrupt INT1' }, D4: { f: 'Digital' }, D5: { f: 'PWM ~' }, D6: { f: 'PWM ~' },
    D7: { f: 'Digital' }, D8: { f: 'Digital' }, D9: { f: 'PWM ~' }, D10: { f: 'PWM ~ · SPI SS' }, D11: { f: 'PWM ~ · SPI MOSI' },
    D12: { f: 'SPI MISO' }, D13: { f: 'SPI SCK · built-in LED “L”' }, A4: { f: 'Analog in · also I²C SDA' }, A5: { f: 'Analog in · also I²C SCL' },
    SDA: { f: 'I²C data (same line as A4)' }, SCL: { f: 'I²C clock (same line as A5)' }, AREF: { kind: 'pwr', f: 'Reference voltage for analogRead()' },
    '5V': { f: '5 V out for sensors and modules' }, '3V3': { f: '3.3 V out, max 50 mA' }, VIN: { f: '7–12 V in (joined to the barrel jack)' },
    IOREF: { f: 'Tells shields the logic level (5 V)' }, RESET: { f: 'Pull LOW to restart the sketch' }, NC: { f: 'Not connected' }, GND: { f: 'Ground — the common 0 V' },
  },
  parts: [
    { id: 'mcu', name: 'ATmega328P microcontroller', desc: 'The brain: a whole tiny computer in one chip. It stores your sketch, runs it 16 million clock ticks a second and drives every pin. It sits in a socket, so a damaged chip can be pulled out and swapped.', quiz: 'Find the microcontroller — the brain of the board.' },
    { id: 'usb', name: 'USB-B connector', desc: 'The square “printer” USB socket. The cable from your computer brings 5 V power, carries new sketches in and lets the board talk back.', quiz: 'Where does the USB cable from the computer plug in?' },
    { id: 'u2', name: 'ATmega16U2 USB bridge', desc: 'A second, smaller microcontroller that translates USB into a plain serial port (UART). Uploads and the Serial Monitor both pass through it.', quiz: 'Find the chip that turns USB into serial.' },
    { id: 'jack', name: 'Power jack, 7–12 V', desc: 'A 5.5 × 2.1 mm barrel socket, centre positive, for a wall adapter or battery pack — handy once the robot drives away from the USB cable. Stay at or below 12 V.', quiz: 'Where would you plug in a 9 V battery pack?' },
    { id: 'reg', name: '5 V regulator', desc: 'Drops the 7–12 V from the jack down to a steady 5 V. The surplus becomes heat, so it gets warm — and it is far too small to feed motors.', quiz: 'Find the part that turns 9 V into 5 V.' },
    { id: 'caps', name: 'Electrolytic capacitors', desc: 'Little energy buckets around the regulator. They smooth out dips so the board does not reset when something suddenly draws current.', quiz: 'Find the two capacitors that smooth the power.' },
    { id: 'digital', name: 'Digital pins 0–13', desc: 'Each pin is an input (buttons, sensors) or an output (LEDs, driver signals). The “~” pins 3, 5, 6, 9, 10, 11 can do PWM for dimming and motor speed. SCL, SDA, AREF and a GND sit at the end of the row.', quiz: 'Find the row of digital pins.' },
    { id: 'power', name: 'POWER header', desc: 'Where modules get their supply: 5V, 3.3V and GND. Vin is the raw jack voltage, RESET restarts the board from an external button.', quiz: 'Where do sensors get 5 V and GND?' },
    { id: 'analog', name: 'Analog inputs A0–A5', desc: 'They measure 0–5 V and turn it into a number from 0 to 1023 — perfect for knobs, light sensors and joysticks. A4 and A5 double as I²C.', quiz: 'Find the analog inputs.' },
    { id: 'ledL', name: 'LED “L” (pin 13)', desc: 'A built-in LED tied to pin 13 — the very first sketch most people ever run blinks it.', quiz: 'Find the LED wired to pin 13.' },
    { id: 'txrx', name: 'TX and RX LEDs', desc: 'Flicker when data goes out (TX) or comes in (RX) over USB. Fast flicker during upload means the link is alive.', quiz: 'Which LEDs flash while data travels over USB?' },
    { id: 'on', name: 'ON LED', desc: 'Lit green whenever the board has power. Dark? Check the cable, the batteries and whether 5V is shorted to GND.', quiz: 'Find the power indicator LED.' },
    { id: 'reset', name: 'RESET button', desc: 'Restarts your sketch from the top, like rebooting. The program itself stays in memory.', quiz: 'Find the button that restarts the sketch.' },
    { id: 'xtal', name: '16 MHz crystal & resonator', desc: 'The metal can is a precise clock for the USB bridge; the little ceramic resonator next to the socket clocks the main chip. delay(), millis() and serial speeds all depend on them.', quiz: 'Find the board’s 16 MHz clock.' },
    { id: 'icsp', name: 'ICSP header', desc: 'Six pins for programming the chip directly with an external programmer (for example to burn a bootloader). It also exposes the SPI bus that some shields use.', quiz: 'Find the 6-pin programming header.' },
  ],
  strengths: ['Forgiving: 5 V logic and sturdy pins survive many beginner mistakes', 'Enormous community — almost every question already has an answer and an example', 'Hundreds of shields stack on top: motor drivers, relays, displays', 'Socketed chip — a burnt microcontroller is a cheap swap'],
  pitfalls: ['Max 20 mA per pin: LEDs need a resistor, motors and relays need a driver or transistor', 'Never power servos or motors from the 5V pin — give them their own supply and join the grounds', '3.3 V modules can be damaged by 5 V signals — use a level shifter', 'Pins 0 and 1 share the USB link: wires on them can block uploads'],
  pinNotes: [
    ['Power', '5V and 3.3V are outputs for modules; GND is the common ground everything must share. Vin takes 7–12 V. The 3.3V pin gives at most 50 mA.'],
    ['Digital pins and PWM', 'Pins 0–13 switch between 0 V and 5 V. The “~” on 3, 5, 6, 9, 10 and 11 marks PWM: analogWrite() sets brightness or speed smoothly.'],
    ['Analog inputs', 'A0–A5 read 0–5 V with analogRead() and return 0–1023. Out of digital pins? They also work as D14–D19.'],
    ['Buses', 'UART on pins 0 (RX) and 1 (TX), shared with USB. I²C on SDA/SCL (same lines as A4/A5). SPI on pins 10–13 and the ICSP header.'],
    ['Interrupts', 'Pins 2 and 3 can react instantly with attachInterrupt(), even while the sketch is busy — great for wheel encoders.'],
  ],
  code: { title: 'First sketch: blink the built-in LED', lang: 'Arduino C++', src: `// LED "L" is on the board and wired to pin 13.
// LED_BUILTIN is the ready-made name for that pin.
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);     // pin 13 is an output
  Serial.begin(9600);               // open the USB link
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // 5 V on the pin — LED on
  Serial.println("on");             // shows in the Serial Monitor
  delay(500);                       // wait half a second
  digitalWrite(LED_BUILTIN, LOW);   // 0 V — LED off
  Serial.println("off");
  delay(500);
}` },
  ideas: ['A first two-motor robot with a motor-driver shield', 'An obstacle-avoiding robot with an ultrasonic sensor', 'A line-following robot', 'A small robot arm on hobby servos', 'A weather station with a display'],
  facts: ['“Uno” means “one” in Italian — it marked the release of Arduino software 1.0.', 'Arduino began in Ivrea, Italy, and is named after a bar the founders met in, itself named after a medieval king, Arduin of Ivrea.', 'The design files are open hardware, which is why so many compatible clones exist.'],
};
