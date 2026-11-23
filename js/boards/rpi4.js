const edge = ['5V', '5V', 'GND', 'GPIO14', 'GPIO15', 'GPIO18', 'GND', 'GPIO23', 'GPIO24', 'GND', 'GPIO25', 'GPIO8', 'GPIO7', 'ID_SC', 'GND', 'GPIO12', 'GND', 'GPIO16', 'GPIO20', 'GPIO21'];
const inner = ['3V3', 'GPIO2', 'GPIO3', 'GPIO4', 'GND', 'GPIO17', 'GPIO27', 'GPIO22', '3V3', 'GPIO10', 'GPIO9', 'GPIO11', 'GND', 'ID_SD', 'GPIO5', 'GPIO6', 'GPIO13', 'GPIO19', 'GPIO26', 'GND'];
export default {
  id: 'rpi4', name: 'Raspberry Pi 4 Model B', short: 'Pi 4', maker: 'Raspberry Pi', makerLong: 'Raspberry Pi', year: 2019,
  tagline: 'A real computer, credit-card sized', level: 'Advanced',
  lab: { plug: 'post', logic: 3.3, glow: '#30e060' },
  intro: 'Not a microcontroller at all: a full Linux computer with a quad-core 1.5 GHz processor, up to 8 GB of RAM, two 4K screen outputs, USB 3, Gigabit Ethernet, Wi-Fi and Bluetooth. In robots it is the “brain” that runs cameras, computer vision, maps and Python, while a microcontroller handles the fast, precise “muscle” work through its 40-pin GPIO header.',
  stats: { clock: '1.5 GHz', flash: 'microSD', ram: '1–8 GB', gpio: '26', logic: '3.3 V', price: '≈ $35–75' },
  table: { mcu: 'BCM2711, 4 × Cortex-A72', clock: '1.5 GHz', clockHz: 1.5e9, flash: 'microSD', flashKB: 1e9, ram: '1–8 GB', ramKB: 1e6, gpio: '26', gpioN: 26, analog: 'none', analogN: 0, wireless: 'Wi-Fi 5 + BT 5.0', logic: '3.3 V', price: '≈ $35–75', priceUSD: 35, linux: true },
  specs: [
    ['Processor', 'Broadcom BCM2711, 4 × Cortex-A72 (64-bit)'], ['Clock speed', '1.5 GHz (1.8 GHz on later boards)'], ['Storage', 'microSD card (or USB SSD boot)'], ['RAM', '1, 2, 4 or 8 GB LPDDR4'],
    ['GPIO', '40-pin header, 26 GPIO'], ['Analog inputs', 'None — add an ADC chip such as the ADS1115'], ['Logic voltage', '3.3 V (not 5 V tolerant)'],
    ['Power', '5 V 3 A through USB-C'], ['Wireless', 'Wi-Fi 5 (802.11ac), Bluetooth 5.0'], ['Ports', '2 × USB 3, 2 × USB 2, Gigabit Ethernet, 2 × micro-HDMI, CSI camera, DSI display, audio'],
    ['Interfaces', 'UART, I²C, SPI, PWM, I²S on the header'], ['Size', '85 × 56 mm, about 46 g'],
  ],
  pcb: { w: 85, d: 56, r: 3, color: '#2f7d3b', holes: [[-39, -24.5, 1.4], [19, -24.5, 1.4], [-39, 24.5, 1.4], [19, 24.5, 1.4]] },
  silk: [{ t: 'Raspberry Pi 4 Model B', x: -18, z: 9.5, s: 2.1 }, { t: '© Raspberry Pi 2018', x: -18, z: 12.5, s: 1.3 }],
  comps: [
    { type: 'heatsinkChip', label: 'BCM2711', x: -17, z: -4, part: 'soc' },
    { type: 'ram', label: 'LPDDR4', x: 3, z: -4, part: 'ram' },
    { type: 'smdCrystal', w: 10, d: 8, x: -33, z: -11, part: 'wifi' },
    { type: 'usbA2black', x: 34.5, z: -18.5, rot: Math.PI / 2, part: 'usb2' },
    { type: 'usbA2', x: 34.5, z: -0.5, rot: Math.PI / 2, part: 'usb3' },
    { type: 'rj45', x: 33, z: 18.5, rot: Math.PI / 2, part: 'eth' },
    { type: 'qfn', w: 6, d: 6, label: 'VL805', x: 17, z: -2, part: 'usbchip' },
    { type: 'usbC', x: -31.3, z: 25.5, part: 'power' },
    { type: 'microHdmi', x: -18, z: 25.2, part: 'hdmi' }, { type: 'microHdmi', x: -4.6, z: 25.2, part: 'hdmi' },
    { type: 'audio', x: 11, z: 22.5, part: 'audio' },
    { type: 'shroud', x: 3, z: 15, part: 'csi', fw: 22, fd: 3 },
    { type: 'shroud', x: -39.5, z: 0, part: 'dsi', fw: 3, fd: 22 },
    { type: 'sd', x: -34, z: 0, side: 'b', part: 'sd' },
    { type: 'led', color: '#ff3020', x: -40, z: 18.5, part: 'leds', always: true },
    { type: 'led', color: '#30e060', x: -40, z: 21, part: 'leds', ledPin: 'ACT' },
    { type: 'qfn', w: 5, d: 5, label: 'PMIC', x: -30, z: 14, part: 'pmic' },
    { type: 'smd', x: 8, z: 8 }, { type: 'smd', x: -5, z: 8 }, { type: 'inductor', s: 3, x: -24, z: 16 },
  ],
  headers: [
    { type: 'male', rows: 2, x: -34.13, z: -25.8, pins: edge, pins2: inner, part: 'gpio', labelOff: 4.2 },
    { type: 'male', rows: 2, x: 21.5, z: -17.5, pins: ['—', '—'], pins2: ['—', '—'], part: 'poe', noLabels: true },
  ],
  pinInfo: {
    '5V': { f: '5 V straight from the USB-C supply' }, '3V3': { f: '3.3 V out, keep under ~50 mA' }, GPIO2: { kind: 'com', f: 'I²C1 SDA (pin 3)' }, GPIO3: { kind: 'com', f: 'I²C1 SCL (pin 5)' },
    GPIO14: { kind: 'com', f: 'UART TXD (pin 8)' }, GPIO15: { kind: 'com', f: 'UART RXD (pin 10)' }, GPIO10: { kind: 'com', f: 'SPI0 MOSI (pin 19)' }, GPIO9: { kind: 'com', f: 'SPI0 MISO (pin 21)' },
    GPIO11: { kind: 'com', f: 'SPI0 SCLK (pin 23)' }, GPIO8: { kind: 'com', f: 'SPI0 CE0 (pin 24)' }, GPIO7: { kind: 'com', f: 'SPI0 CE1 (pin 26)' }, GPIO18: { f: 'PWM0 · PCM CLK (pin 12)' },
    GPIO12: { f: 'PWM0 (pin 32)' }, GPIO13: { f: 'PWM1 (pin 33)' }, GPIO19: { f: 'PWM1 (pin 35)' }, ID_SD: { kind: 'nc', f: 'HAT ID EEPROM — leave free' }, ID_SC: { kind: 'nc', f: 'HAT ID EEPROM — leave free' },
  },
  parts: [
    { id: 'soc', name: 'BCM2711 processor', desc: 'Four 64-bit Cortex-A72 cores plus the graphics unit, all under one metal lid. It gets hot — a heatsink or fan helps under load.', quiz: 'Find the main processor.' },
    { id: 'ram', name: 'LPDDR4 RAM', desc: '1 to 8 GB of working memory, enough for desktop Linux, OpenCV and ROS.', quiz: 'Find the memory chip.' },
    { id: 'wifi', name: 'Wi-Fi & Bluetooth module', desc: 'A shielded radio chip for dual-band Wi-Fi and Bluetooth 5.0.', quiz: 'Find the wireless module.' },
    { id: 'gpio', name: '40-pin GPIO header', desc: '26 general-purpose pins at 3.3 V plus 5V, 3V3 and GND. Pin 1 (3V3) is the one with the square pad, nearest the corner.', quiz: 'Find the GPIO header.' },
    { id: 'usb2', name: 'USB 2.0 ports (black)', desc: 'Keyboard, mouse, Arduino cable.', quiz: 'Find the USB 2.0 ports.' },
    { id: 'usb3', name: 'USB 3.0 ports (blue)', desc: 'Fast ports for SSDs and cameras.', quiz: 'Find the USB 3.0 ports.' },
    { id: 'eth', name: 'Gigabit Ethernet', desc: 'Wired networking, the most reliable link for a robot in a lab.', quiz: 'Find the network socket.' },
    { id: 'usbchip', name: 'VL805 USB controller', desc: 'Drives the four USB ports over a PCIe lane.', quiz: 'Find the USB controller chip.' },
    { id: 'power', name: 'USB-C power input', desc: 'Needs a good 5 V 3 A supply. A lightning-bolt icon on screen means the voltage is sagging.', quiz: 'Where does the power supply plug in?' },
    { id: 'hdmi', name: 'Two micro-HDMI ports', desc: 'Up to two 4K monitors.', quiz: 'Find the video outputs.' },
    { id: 'audio', name: 'Audio / composite jack', desc: '3.5 mm stereo audio and analog video.', quiz: 'Find the headphone jack.' },
    { id: 'csi', name: 'CSI camera connector', desc: 'Ribbon-cable socket for the Raspberry Pi camera — the robot’s eyes.', quiz: 'Where does the camera ribbon go?' },
    { id: 'dsi', name: 'DSI display connector', desc: 'Ribbon socket for the official touchscreen.', quiz: 'Find the display connector.' },
    { id: 'sd', name: 'microSD slot (underside)', desc: 'The card holds the operating system and your files. Flip the board to see it.', quiz: 'Where is the operating system stored?', bottom: true },
    { id: 'pmic', name: 'Power management chip', desc: 'Makes the many supply rails the processor and memory need.', quiz: 'Find the power-management chip.' },
    { id: 'leds', name: 'PWR and ACT LEDs', desc: 'Red = power OK, green flickers when the SD card is busy.', quiz: 'Find the status LEDs.' },
    { id: 'poe', name: 'PoE header', desc: 'Four pins for a Power-over-Ethernet HAT.', quiz: 'Find the 4-pin PoE header.' },
  ],
  strengths: ['A whole Linux computer: Python, OpenCV, ROS, web servers', 'Camera and displays plug straight in', 'Wi-Fi, Bluetooth, Ethernet and USB 3', 'Huge ecosystem of HATs and tutorials'],
  pitfalls: ['3.3 V GPIO with no protection — 5 V on a pin can destroy the SoC', 'No analog inputs and no real-time timing; pair it with a microcontroller for motors', 'Needs a proper shutdown; pulling power can corrupt the SD card', 'Draws up to 3 A and needs cooling under load'],
  pinNotes: [
    ['Power', 'Pins 2 and 4 are 5 V, pins 1 and 17 are 3.3 V, and eight GND pins are spread along the header.'],
    ['Digital pins and PWM', 'GPIO numbers (BCM) differ from physical pin numbers. Hardware PWM on GPIO12/13/18/19; others use software PWM.'],
    ['Analog inputs', 'None. Use an I²C ADC (ADS1115, MCP3008 on SPI) or let an Arduino read sensors.'],
    ['Buses', 'UART on GPIO14/15, I²C1 on GPIO2/3, SPI0 on GPIO7–11. Enable them with raspi-config.'],
    ['Interrupts', 'Edge detection on any GPIO through gpiozero or libgpiod — but Linux timing is not exact.'],
  ],
  code: { title: 'First program: blink an LED on GPIO17', lang: 'Python', src: `from gpiozero import LED, Button
from signal import pause

led = LED(17)          # physical pin 11
button = Button(2)     # physical pin 3, pull-up on

button.when_pressed = led.on
button.when_released = led.off
led.blink(on_time=0.5, off_time=0.5)
print("Blinking — press Ctrl+C to stop")
pause()` },
  ideas: ['A camera robot that follows faces or lines with OpenCV', 'A ROS robot with lidar and SLAM mapping', 'A voice-controlled assistant robot', 'The “brain” of a rover, with an Arduino as “muscle”', 'A robot web dashboard with live video'],
  facts: ['The first Raspberry Pi (2012) was meant to get kids coding; over 60 million have been sold.', 'The Pi 4 was the first Pi able to drive two 4K screens.', 'Its 40-pin header layout has stayed the same since 2014, so old HATs still fit.'],
};
