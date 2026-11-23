export default {
  id: 'bluepill', name: 'STM32 Blue Pill', short: 'Blue Pill', maker: 'Generic (STM32F103C8T6 board)', makerLong: 'Generic (STM32F103C8T6 board)', year: 2015,
  tagline: '32-bit power for pocket money', level: 'Advanced',
  lab: { plug: 'bread', logic: 3.3, glow: '#30e060' },
  intro: 'A no-name board built around ST’s STM32F103, a 72 MHz, 32-bit Arm Cortex-M3 that sits at the heart of countless drones, 3D printers and industrial gadgets. It costs about the same as a Nano but is several times faster, with more timers, more pins and a real USB peripheral. The catch: it needs a little more know-how to program, usually with an ST-Link adapter.',
  stats: { clock: '72 MHz', flash: '64 KB', ram: '20 KB', gpio: '32', logic: '3.3 V', price: '≈ $2–3' },
  table: { mcu: 'STM32F103C8T6', clock: '72 MHz', clockHz: 72e6, flash: '64 KB', flashKB: 64, ram: '20 KB', ramKB: 20, gpio: '32', gpioN: 32, analog: '10 (12-bit)', analogN: 10, wireless: 'None', logic: '3.3 V', price: '≈ $2–3', priceUSD: 2.5 },
  specs: [
    ['Microcontroller', 'STM32F103C8T6 (Arm Cortex-M3, 32-bit)'], ['Clock speed', '72 MHz from an 8 MHz crystal'], ['Flash memory', '64 KB (many chips actually have 128 KB)'], ['RAM', '20 KB'],
    ['GPIO', '32, many of them 5 V tolerant (marked FT)'], ['Analog inputs', '10 × 12-bit ADC'], ['Logic voltage', '3.3 V'], ['Power', 'Micro-USB 5 V, or 5 V / 3.3 V pins'],
    ['Interfaces', '3 × UART, 2 × I²C, 2 × SPI, CAN, USB 2.0 full speed'], ['Computer link', 'SWD with an ST-Link, serial bootloader, or USB with a custom bootloader'], ['Size', '53 × 22.5 mm'], ['Timers', '4 timers incl. an advanced motor-control timer'],
  ],
  pcb: { w: 53, d: 22.5, r: .8, color: '#1b4fa0', holes: [] },
  silk: [{ t: 'STM32', x: -1, z: -5.4, s: 1.4, b: true }, { t: 'BOOT0', x: -8, z: -6.4, s: 1 }, { t: 'BOOT1', x: -8, z: 6.4, s: 1 }, { t: 'PC13', x: 13, z: -6.5, s: 1 }],
  comps: [
    { type: 'qfp', w: 7, d: 7, label: 'STM32F103', x: 3, z: 0, rot: Math.PI / 4, part: 'mcu' },
    { type: 'usbMicro', x: 23.3, z: 0, rot: Math.PI / 2, part: 'usb' },
    { type: 'bootJumper', x: -8, z: 0, rot: Math.PI / 2, part: 'jumpers' },
    { type: 'smallButton', x: 15.5, z: 3.5, part: 'reset', color: '#ecebe4' },
    { type: 'led', color: '#36d058', x: 13, z: -4.5, part: 'leds', ledPin: 'C13' },
    { type: 'led', color: '#ff3020', x: 17, z: -4.5, part: 'leds', always: true },
    { type: 'crystal', w: 6, d: 3, h: 2.6, x: -15, z: 0, rot: Math.PI / 2, part: 'xtal' },
    { type: 'sot223', label: '662K', x: 13, z: 0, rot: Math.PI / 2, part: 'reg', fw: 3.5, fd: 6.5 },
    { type: 'smd', x: -2, z: 5.6 }, { type: 'smd', x: 8, z: 5.6, part: 'r10', color: '#1d1d1f' },
  ],
  headers: [
    { type: 'down', x: -24.13, z: -8.89, pins: ['B12', 'B13', 'B14', 'B15', 'A8', 'A9', 'A10', 'A11', 'A12', 'A15', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', '5V', 'GND', '3V3'], part: 'pinsT', labelOff: 2.1 },
    { type: 'down', x: -24.13, z: 8.89, pins: ['VB', 'C13', 'C14', 'C15', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B0', 'B1', 'B10', 'B11', 'R', '3V3', 'GND', 'GND'], part: 'pinsB', labelOff: -2.1 },
    { type: 'male', dir: 'z', x: -25.2, z: -3.81, pins: ['3V3', 'SWIO', 'SWCLK', 'GND'], part: 'swd', noLabels: true },
  ],
  pinInfo: {
    VB: { kind: 'pwr', f: 'VBAT: backup battery for the real-time clock' }, R: { kind: 'ctl', f: 'NRST: pull LOW to reset' }, C13: { f: 'PC13 · on-board LED (LOW = on) · weak pin' },
    C14: { f: 'PC14 · 32 kHz crystal pin' }, C15: { f: 'PC15 · 32 kHz crystal pin' }, A9: { kind: 'com', f: 'PA9 · USART1 TX · 5 V tolerant' }, A10: { kind: 'com', f: 'PA10 · USART1 RX · 5 V tolerant' },
    A11: { f: 'PA11 · USB D−' }, A12: { f: 'PA12 · USB D+' }, B6: { kind: 'com', f: 'PB6 · I²C1 SCL · 5 V tolerant' }, B7: { kind: 'com', f: 'PB7 · I²C1 SDA · 5 V tolerant' },
    A2: { kind: 'com', f: 'PA2 · USART2 TX · ADC2' }, A3: { kind: 'com', f: 'PA3 · USART2 RX · ADC3' }, A5: { kind: 'com', f: 'PA5 · SPI1 SCK · ADC5' }, A6: { kind: 'com', f: 'PA6 · SPI1 MISO · ADC6' }, A7: { kind: 'com', f: 'PA7 · SPI1 MOSI · ADC7' },
    B0: { kind: 'ana', f: 'PB0 · ADC8' }, B1: { kind: 'ana', f: 'PB1 · ADC9' }, B10: { kind: 'com', f: 'PB10 · USART3 TX · I²C2 SCL' }, B11: { kind: 'com', f: 'PB11 · USART3 RX · I²C2 SDA' },
    SWIO: { kind: 'ctl', f: 'SWD data (ST-Link)' }, SWCLK: { kind: 'ctl', f: 'SWD clock (ST-Link)' },
  },
  parts: [
    { id: 'mcu', name: 'STM32F103C8T6', desc: 'A 32-bit Arm Cortex-M3 at 72 MHz with hardware timers built for motor control. It is the same family found in many drone and printer controllers.', quiz: 'Find the STM32 microcontroller.' },
    { id: 'usb', name: 'Micro-USB connector', desc: 'Goes straight to the STM32’s own USB pins. With the stock firmware it only gives power until you install a USB bootloader.', quiz: 'Where does the USB cable go?' },
    { id: 'jumpers', name: 'BOOT0 / BOOT1 jumpers', desc: 'Yellow jumpers that choose where the chip starts: normal flash (BOOT0 = 0) or the built-in serial bootloader (BOOT0 = 1).', quiz: 'Find the boot-mode jumpers.' },
    { id: 'reset', name: 'RESET button', desc: 'Restarts the chip.', quiz: 'Find the reset button.' },
    { id: 'leds', name: 'Power LED and PC13 LED', desc: 'Red shows power. The green one is on PC13 and is wired “upside down”: writing LOW lights it.', quiz: 'Find the LED on PC13.' },
    { id: 'xtal', name: '8 MHz crystal', desc: 'Multiplied by 9 inside the chip to reach 72 MHz.', quiz: 'Find the main crystal.' },
    { id: 'reg', name: '3.3 V regulator', desc: 'Turns 5 V from USB or the 5V pin into 3.3 V.', quiz: 'Find the regulator.' },
    { id: 'r10', name: 'R10, the famous resistor', desc: 'The USB pull-up resistor. Many boards fit 10 kΩ instead of the correct 1.5 kΩ, which makes some computers refuse to recognise the board.', quiz: 'Find resistor R10, the USB pull-up.' },
    { id: 'pinsT', name: 'Top pin row', desc: 'B12–B15, A8–A15, B3–B9, 5V, GND, 3V3.', quiz: 'Find the row ending in 5V, GND, 3V3.' },
    { id: 'pinsB', name: 'Bottom pin row', desc: 'VBAT, C13–C15, the ADC-capable A0–A7 and B0/B1, B10/B11, reset and power.', quiz: 'Find the row with A0…A7.' },
    { id: 'swd', name: 'SWD header', desc: 'Four pins for an ST-Link programmer/debugger: 3V3, SWDIO, SWCLK, GND.', quiz: 'Where do you plug in an ST-Link?' },
  ],
  strengths: ['32-bit, 72 MHz Arm core for the price of a Nano clone', 'Advanced timers made for motors and encoders', 'Several 5 V-tolerant pins', 'Real hardware debugging over SWD'],
  pitfalls: ['Usually needs an ST-Link (or USB-serial adapter) for the first upload', 'Wrong R10 resistor and some counterfeit chips cause USB trouble', 'PC13–PC15 can sink only 3 mA', 'Not every pin is 5 V tolerant, so check before connecting 5 V signals'],
  pinNotes: [
    ['Power', '5V feeds the regulator, 3V3 is its output, VB keeps the clock alive from a coin cell.'],
    ['Digital pins and PWM', 'Pins are named by port and number (PA0, PB12…). PWM comes from the timers on about 15 pins.'],
    ['Analog inputs', 'PA0–PA7, PB0, PB1: 12-bit, 0–4095 for 0–3.3 V.'],
    ['Buses', 'USART1 on A9/A10, USART2 on A2/A3, USART3 on B10/B11. I²C1 on B6/B7, SPI1 on A5–A7. CAN and USB on A11/A12.'],
    ['Interrupts', 'Any pin through EXTI, but only one pin per number (e.g. PA3 or PB3, not both).'],
  ],
  code: { title: 'First sketch: blink PC13 (STM32duino)', lang: 'Arduino C++', src: `// Board package: STM32 MCU based boards
// Board: Generic STM32F1 · Upload: STM32CubeProgrammer (SWD)
void setup() {
  pinMode(PC13, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(PC13, LOW);    // LOW = LED on
  Serial.println("on");
  delay(250);
  digitalWrite(PC13, HIGH);
  Serial.println("off");
  delay(250);
}` },
  ideas: ['A brushless motor or gimbal controller', 'A balancing robot with fast PID loops', 'A USB HID device (with a USB bootloader)', 'Reading quadrature wheel encoders with hardware timers', 'A CAN-bus node for a larger robot'],
  facts: ['“Blue Pill” comes from its colour and pill-like shape; a black version is called the “Black Pill”.', 'Many C8 chips secretly have 128 KB of flash, the same die as the CB model.', 'STM32 chips are among the most widely used microcontrollers in industry.'],
};
