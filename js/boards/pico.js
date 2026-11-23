export default {
  id: 'pico', name: 'Raspberry Pi Pico', short: 'Pico', maker: 'Raspberry Pi', makerLong: 'Raspberry Pi', year: 2021,
  tagline: 'Two cores for four dollars', level: 'Beginner',
  lab: { plug: 'bread', logic: 3.3, glow: '#30e060', strips: true },
  intro: 'Raspberry Pi’s own microcontroller chip, the RP2040, on a tiny board for about four dollars. Two 133 MHz cores, 264 KB of RAM and a clever extra called PIO that can invent new hardware protocols. Programming is drag-and-drop: hold BOOTSEL, plug it in and it appears as a USB drive. MicroPython makes it a favourite in schools.',
  stats: { clock: '133 MHz', flash: '2 MB', ram: '264 KB', gpio: '26', logic: '3.3 V', price: '≈ $4' },
  table: { mcu: 'RP2040', clock: '133 MHz', clockHz: 133e6, flash: '2 MB', flashKB: 2048, ram: '264 KB', ramKB: 264, gpio: '26', gpioN: 26, analog: '3 (12-bit)', analogN: 3, wireless: 'None', logic: '3.3 V', price: '≈ $4', priceUSD: 4 },
  specs: [
    ['Microcontroller', 'RP2040 (2 × Arm Cortex-M0+)'], ['Clock speed', '133 MHz (often overclocked to 250 MHz)'], ['Flash memory', '2 MB QSPI'], ['RAM', '264 KB SRAM'],
    ['GPIO', '26 multifunction pins'], ['Analog inputs', '3 × 12-bit (GP26–GP28) + internal temperature sensor'], ['Logic voltage', '3.3 V'],
    ['Power', 'Micro-USB 5 V, or 1.8–5.5 V on VSYS'], ['Interfaces', '2 × UART, 2 × I²C, 2 × SPI, 16 PWM channels, 8 PIO state machines'],
    ['Computer link', 'Native USB (no bridge chip). It mounts as a drive for UF2 files'], ['Size', '51 × 21 mm, castellated edges'], ['Wireless', 'None (the Pico W adds Wi-Fi and Bluetooth)'],
  ],
  pcb: { w: 51, d: 21, r: 1, color: '#1f7a3f', holes: [[-23.5, -5.7, 1], [-23.5, 5.7, 1], [23.5, -5.7, 1], [23.5, 5.7, 1]] },
  silk: [{ t: 'Raspberry Pi Pico ©2020', x: 4, z: -5.6, s: 1.3 }, { t: 'BOOTSEL', x: -13, z: 1, s: 1.1 }, { t: 'LED', x: -19, z: -2.5, s: 1.1 }],
  comps: [
    { type: 'qfn', w: 7, d: 7, label: 'RP2-B2', x: 3, z: 0, part: 'mcu' },
    { type: 'usbMicro', x: -22.6, z: 0, rot: -Math.PI / 2, part: 'usb' },
    { type: 'soic', w: 5.2, d: 5.2, pins: 8, label: 'W25Q16', x: -7, z: 0, part: 'flash' },
    { type: 'smdCrystal', w: 3.2, d: 2.5, x: 11, z: -3.5, part: 'xtal' },
    { type: 'smallButton', x: -13, z: 4, part: 'bootsel', color: '#ecebe4' },
    { type: 'led', color: '#30e060', x: -19, z: -5, part: 'led', ledPin: 'GP25' },
    { type: 'inductor', s: 3.6, x: 13, z: 4, part: 'smps' }, { type: 'sot23', x: 17, z: 4, part: 'smps' },
    { type: 'smd', x: 9, z: 4 }, { type: 'smd', x: -2, z: 5.5 }, { type: 'smd', x: -2, z: -5.5 },
  ],
  headers: [
    { type: 'down', x: -24.13, z: 8.89, pins: ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7', 'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'], part: 'pinsA', labelOff: -2.1 },
    { type: 'down', x: -24.13, z: -8.89, pins: ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3(OUT)', 'ADC_VREF', 'GP28', 'AGND', 'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'], part: 'pinsB', labelOff: 2.1 },
    { type: 'pad', dir: 'z', x: 23.6, z: -2.54, pins: ['SWCLK', 'GND', 'SWDIO'], part: 'swd', noLabels: true },
  ],
  pinInfo: {
    GP0: { kind: 'com', f: 'UART0 TX · I²C0 SDA · SPI0 RX' }, GP1: { kind: 'com', f: 'UART0 RX · I²C0 SCL · SPI0 CSn' }, GP4: { kind: 'com', f: 'I²C0 SDA · UART1 TX' }, GP5: { kind: 'com', f: 'I²C0 SCL · UART1 RX' },
    GP26: { kind: 'ana', f: 'ADC0 · I²C1 SDA' }, GP27: { kind: 'ana', f: 'ADC1 · I²C1 SCL' }, GP28: { kind: 'ana', f: 'ADC2' }, ADC_VREF: { kind: 'pwr', f: 'ADC reference voltage' }, AGND: { kind: 'gnd', f: 'Analog ground' },
    VBUS: { f: '5 V from USB (when plugged in)' }, VSYS: { f: 'Main supply in, 1.8–5.5 V' }, '3V3(OUT)': { kind: 'pwr', f: '3.3 V out, up to ~300 mA' }, '3V3_EN': { kind: 'ctl', f: 'Pull LOW to switch the 3.3 V supply off' },
    RUN: { kind: 'ctl', f: 'Pull LOW to reset the RP2040' }, SWCLK: { kind: 'ctl', f: 'Debug clock' }, SWDIO: { kind: 'ctl', f: 'Debug data' },
  },
  parts: [
    { id: 'mcu', name: 'RP2040 microcontroller', desc: 'Raspberry Pi’s own chip: two Cortex-M0+ cores, 264 KB of RAM and eight PIO state machines that can bit-bang almost any protocol (even VGA video).', quiz: 'Find the RP2040, the brain.' },
    { id: 'flash', name: '2 MB flash chip', desc: 'The RP2040 has no flash inside; your program lives in this separate chip and runs from it.', quiz: 'Where is your program stored?' },
    { id: 'usb', name: 'Micro-USB connector', desc: 'Wired straight to the RP2040’s own USB, so no bridge chip is needed.', quiz: 'Where does the USB cable go?' },
    { id: 'bootsel', name: 'BOOTSEL button', desc: 'Hold it while plugging in: the Pico appears as a drive named RPI-RP2. Drop a .uf2 file on it to install firmware.', quiz: 'Which button turns the Pico into a USB drive?' },
    { id: 'led', name: 'LED on GP25', desc: 'A green user LED (on the Pico W it moved to the Wi-Fi chip and is called "LED").', quiz: 'Find the LED you can program.' },
    { id: 'xtal', name: '12 MHz crystal', desc: 'The reference clock; the chip multiplies it up to 133 MHz.', quiz: 'Find the crystal.' },
    { id: 'smps', name: 'Buck-boost converter', desc: 'An efficient switching supply that makes 3.3 V from anything between 1.8 and 5.5 V, so two AA batteries work fine.', quiz: 'Find the power converter.' },
    { id: 'pinsA', name: 'GP0–GP15 edge', desc: 'GPIO 0–15 with a GND every few pins. The castellated half-holes can be soldered flat onto another PCB.', quiz: 'Find the edge with GP0.' },
    { id: 'pinsB', name: 'Power & GP16–GP28 edge', desc: 'VBUS, VSYS, 3V3, the three ADC pins, RUN and GP16–28.', quiz: 'Find the edge with VSYS and VBUS.' },
    { id: 'swd', name: 'SWD debug pads', desc: 'Three pads for a hardware debugger, so you can step through code line by line.', quiz: 'Find the debug pads.' },
  ],
  strengths: ['Four dollars for two fast cores and plenty of RAM', 'Drag-and-drop programming, superb MicroPython support', 'PIO lets you build custom interfaces (WS2812 LEDs, extra UARTs, VGA)', 'Excellent official documentation'],
  pitfalls: ['3.3 V only, not 5 V tolerant', 'Only three analog inputs', 'No wireless on the plain Pico; choose the Pico W for Wi-Fi', 'Pins come unsoldered on many kits'],
  pinNotes: [
    ['Power', 'VBUS is USB 5 V, VSYS is the main input (1.8–5.5 V), 3V3(OUT) supplies sensors. Eight GND pins sit at every fifth position.'],
    ['Digital pins and PWM', 'All 26 GPIO can do PWM (16 slices). Use machine.PWM in MicroPython.'],
    ['Analog inputs', 'GP26, GP27, GP28 → ADC0–2: read_u16() returns 0–65535 for 0–3.3 V.'],
    ['Buses', 'Two each of UART, I²C and SPI, and each can sit on several pin choices. PIO adds more.'],
    ['Interrupts', 'Every GPIO can trigger an interrupt (Pin.irq).'],
  ],
  code: { title: 'First program: blink in MicroPython', lang: 'MicroPython', src: `from machine import Pin
import time

led = Pin(25, Pin.OUT)      # on-board LED ("LED" on a Pico W)

while True:
    led.toggle()
    print("blink", led.value())
    time.sleep(0.5)` },
  ideas: ['A school robot programmed in MicroPython', 'A NeoPixel light show driven by PIO', 'A game controller or macro keypad (native USB)', 'A data logger reading the internal temperature sensor', 'A balancing robot using both cores'],
  facts: ['The RP2040 name decodes as: Raspberry Pi, 2 cores, type 0 (M0+), 4 → 264 KB RAM, 0 KB flash.', 'Its PIO blocks are fast enough to generate DVI video output.', 'Over a million Picos were sold within months of launch.'],
};
