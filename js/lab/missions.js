// Guided experiments for the Lab, ordered easy → hard. Validate with: node tools/check-missions.mjs
//
// Contract
//  · setup:  instances placed on the bench — { id, board } or { id, mod }, at: [x, z] in mm, rot (quarter turns)
//  · wires:  required connections, "instance:PIN" pairs. Any route that joins the two pins counts (same net).
//  · code:   { lang, src } or [{ title, lang, src }, …] for two-board missions
//  · run(sim): mirrors what the code does — same pins, numbers and timing — using the sim API:
//      sim.every(ms, fn) · sim.after(ms, fn) · sim.loop(fn(dt)) · sim.set(id, patch) · sim.get(id)
//      sim.input(id) → pot/light 0–1, distance cm, { temp, hum }, pressed bool · sim.serial(text, from) · sim.boardLed(id, on)
//  · check(sim) (optional): returns true once the learner has actually tried the circuit

const map = (x, a, b, c, d) => Math.trunc(((x - a) * (d - c)) / (b - a)) + c;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const MISSIONS = [
  {
    id: 'blink', title: 'Hello, LED', level: 'Beginner', minutes: 3,
    goal: 'Make an LED blink with an Arduino Uno.',
    intro: 'Blinking an LED is the “Hello, world!” of electronics. Two wires: pin 13 to the LED’s SIG, and GND to GND.',
    learn: ['What a digital output is', 'Why every circuit needs a ground', 'setup() and loop()'],
    setup: [{ id: 'uno', board: 'uno', at: [-40, -10] }, { id: 'led1', mod: 'led', at: [70, 60] }],
    wires: [['uno:D13', 'led1:SIG'], ['uno:GND', 'led1:GND']],
    code: { lang: 'Arduino C++', src: `void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(13, HIGH);  // LED on
  Serial.println("on");
  delay(500);
  digitalWrite(13, LOW);   // LED off
  Serial.println("off");
  delay(500);
}` },
    run(sim) {
      let on = false;
      sim.every(500, () => { on = !on; sim.set('led1', { b: on ? 1 : 0 }); sim.boardLed('uno', on, 'D13'); sim.serial(on ? 'on' : 'off'); });
    },
  },
  {
    id: 'button', title: 'Push to light', level: 'Beginner', minutes: 5,
    goal: 'Light the LED only while the button is held.',
    intro: 'The button joins its SIG pin to GND when pressed. With INPUT_PULLUP the pin reads HIGH normally and LOW when pressed.',
    learn: ['Digital inputs', 'Pull-up resistors', 'if / else'],
    setup: [{ id: 'uno', board: 'uno', at: [-40, -10] }, { id: 'btn1', mod: 'button', at: [40, 75] }, { id: 'led1', mod: 'led', at: [90, 75] }],
    wires: [['uno:D2', 'btn1:SIG'], ['uno:GND', 'btn1:GND'], ['uno:D8', 'led1:SIG'], ['uno:GND', 'led1:GND']],
    code: { lang: 'Arduino C++', src: `void setup() {
  pinMode(2, INPUT_PULLUP);  // HIGH until pressed
  pinMode(8, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  bool pressed = digitalRead(2) == LOW;
  digitalWrite(8, pressed ? HIGH : LOW);
  if (pressed) Serial.println("pressed");
  delay(20);
}` },
    run(sim) {
      let was = false;
      sim.loop(() => { const p = sim.input('btn1'); sim.set('led1', { b: p ? 1 : 0 }); if (p && !was) sim.serial('pressed'); was = p; });
    },
    check: (sim) => sim.flag('pressed'),
  },
  {
    id: 'dimmer', title: 'Knob dimmer', level: 'Beginner', minutes: 6,
    goal: 'Turn a knob to dim an LED smoothly.',
    intro: 'The knob gives 0–5 V on A0 (read as 0–1023). Divide by 4 and send it to a PWM pin (0–255) with analogWrite().',
    learn: ['Analog inputs and the ADC', 'PWM outputs', 'Scaling numbers'],
    setup: [{ id: 'uno', board: 'uno', at: [-40, -10] }, { id: 'pot1', mod: 'pot', at: [40, 75] }, { id: 'led1', mod: 'led', at: [95, 75] }],
    wires: [['uno:5V', 'pot1:VCC'], ['uno:GND', 'pot1:GND'], ['uno:A0', 'pot1:SIG'], ['uno:D9', 'led1:SIG'], ['uno:GND', 'led1:GND']],
    code: { lang: 'Arduino C++', src: `void setup() {
  pinMode(9, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);     // 0 … 1023
  analogWrite(9, raw / 4);      // 0 … 255
  Serial.println(raw);
  delay(100);
}` },
    run(sim) {
      sim.loop(() => sim.set('led1', { b: Math.trunc(Math.round(sim.input('pot1') * 1023) / 4) / 255 }));
      sim.every(250, () => sim.serial(String(Math.round(sim.input('pot1') * 1023))));
    },
    check: (sim) => sim.flag('moved:pot1'),
  },
  {
    id: 'servo', title: 'Servo follows the knob', level: 'Intermediate', minutes: 8,
    goal: 'Make a servo copy the knob’s position.',
    intro: 'map() turns 0–1023 into 0–180°. A single small servo may borrow the Uno’s 5V; bigger ones need their own supply.',
    learn: ['Servo pulses', 'The map() function', 'Libraries'],
    setup: [{ id: 'uno', board: 'uno', at: [-40, -10] }, { id: 'pot1', mod: 'pot', at: [35, 80] }, { id: 'servo1', mod: 'servo', at: [100, 60] }],
    wires: [['uno:5V', 'pot1:VCC'], ['uno:GND', 'pot1:GND'], ['uno:A0', 'pot1:SIG'], ['uno:D9', 'servo1:SIG'], ['uno:5V', 'servo1:VCC'], ['uno:GND', 'servo1:GND']],
    code: { lang: 'Arduino C++', src: `#include <Servo.h>
Servo arm;

void setup() {
  arm.attach(9);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  int angle = map(raw, 0, 1023, 0, 180);
  arm.write(angle);
  Serial.println(angle);
  delay(15);
}` },
    run(sim) {
      sim.loop(() => sim.set('servo1', { angle: map(Math.round(sim.input('pot1') * 1023), 0, 1023, 0, 180) }));
      sim.every(300, () => sim.serial(String(map(Math.round(sim.input('pot1') * 1023), 0, 1023, 0, 180))));
    },
    check: (sim) => sim.flag('moved:pot1'),
  },
  {
    id: 'parking', title: 'Parking sensor', level: 'Intermediate', minutes: 10,
    goal: 'Beep faster as an obstacle gets closer.',
    intro: 'TRIG sends a ping, ECHO stays HIGH for as long as the sound takes to come back. Half that time × the speed of sound = distance.',
    learn: ['pulseIn() and timing', 'The speed of sound', 'Turning data into feedback'],
    setup: [{ id: 'uno', board: 'uno', at: [-40, -10] }, { id: 'sonar1', mod: 'ultrasonic', at: [60, 80] }, { id: 'buz1', mod: 'buzzer', at: [125, 20] }],
    wires: [['uno:5V', 'sonar1:VCC'], ['uno:GND', 'sonar1:GND'], ['uno:D9', 'sonar1:TRIG'], ['uno:D10', 'sonar1:ECHO'], ['uno:D8', 'buz1:SIG'], ['uno:GND', 'buz1:GND']],
    code: { lang: 'Arduino C++', src: `void setup() {
  pinMode(9, OUTPUT);   // TRIG
  pinMode(10, INPUT);   // ECHO
  Serial.begin(9600);
}

void loop() {
  digitalWrite(9, HIGH);
  delayMicroseconds(10);
  digitalWrite(9, LOW);
  long us = pulseIn(10, HIGH);
  int cm = us / 58;
  Serial.print(cm); Serial.println(" cm");
  if (cm < 100) {
    tone(8, 2000, 60);
    delay(cm * 6 + 60);  // closer = faster
  } else delay(200);
}` },
    run(sim) {
      let next = 0;
      sim.loop(() => {
        const cm = Math.round(sim.input('sonar1'));
        if (sim.t * 1000 >= next) {
          sim.serial(`${cm} cm`);
          if (cm < 100) { sim.set('buz1', { freq: 2000 }); sim.after(60, () => sim.set('buz1', { freq: 0 })); next = sim.t * 1000 + cm * 6 + 60; } else next = sim.t * 1000 + 200;
        }
      });
    },
    check: (sim) => sim.flag('moved:sonar1'),
  },
  {
    id: 'nightlight', title: 'Night light on 3.3 V', level: 'Intermediate', minutes: 8,
    goal: 'Switch an LED on when it gets dark — on an ESP32.',
    intro: 'The ESP32 runs at 3.3 V, so the light sensor must be powered from 3V3, never 5 V. GPIO34 is input-only — perfect for a sensor. Its ADC reads 0–4095.',
    learn: ['3.3 V logic', '12-bit analog readings', 'Thresholds and hysteresis'],
    setup: [{ id: 'esp', board: 'esp32', at: [-40, -20] }, { id: 'ldr1', mod: 'ldr', at: [40, 70] }, { id: 'led1', mod: 'led', at: [95, 70] }],
    wires: [['esp:3V3', 'ldr1:VCC'], ['esp:GND', 'ldr1:GND'], ['esp:D34', 'ldr1:SIG'], ['esp:D4', 'led1:SIG'], ['esp:GND', 'led1:GND']],
    code: { lang: 'Arduino C++', src: `const int SENSOR = 34, LAMP = 4;
bool on = false;

void setup() {
  pinMode(LAMP, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  int light = analogRead(SENSOR);   // 0 … 4095
  if (light < 1200) on = true;      // dark
  if (light > 1600) on = false;     // bright
  digitalWrite(LAMP, on);
  Serial.println(light);
  delay(200);
}` },
    run(sim) {
      let on = false;
      sim.every(200, () => { const v = Math.round(sim.input('ldr1') * 4095); if (v < 1200) on = true; if (v > 1600) on = false; sim.set('led1', { b: on ? 1 : 0 }); sim.serial(String(v)); });
    },
    check: (sim) => sim.flag('moved:ldr1'),
  },
  {
    id: 'uart', title: 'Two boards talking', level: 'Intermediate', minutes: 10,
    goal: 'Press a button on the Uno to light an LED on the Nano.',
    intro: 'Serial needs crossed wires: the Uno’s TX (D1) goes to the Nano’s RX (D0). Both are 5 V boards, and they must share GND.',
    learn: ['UART: TX → RX', 'Why boards share ground', 'Sending and parsing bytes'],
    setup: [{ id: 'uno', board: 'uno', at: [-95, -25] }, { id: 'nano', board: 'nano', at: [85, -35] }, { id: 'btn1', mod: 'button', at: [-80, 85] }, { id: 'led1', mod: 'led', at: [85, 60] }],
    wires: [['uno:D1', 'nano:D0'], ['uno:GND', 'nano:GND'], ['uno:D2', 'btn1:SIG'], ['uno:GND', 'btn1:GND'], ['nano:D13', 'led1:SIG'], ['nano:GND', 'led1:GND']],
    code: [{ title: 'Uno — sender', lang: 'Arduino C++', src: `void setup() {
  pinMode(2, INPUT_PULLUP);
  Serial.begin(9600);       // TX = D1
}

void loop() {
  bool p = digitalRead(2) == LOW;
  Serial.write(p ? '1' : '0');
  delay(50);
}` }, { title: 'Nano — receiver', lang: 'Arduino C++', src: `void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);       // RX = D0
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    digitalWrite(13, c == '1');
  }
}` }],
    run(sim) {
      let last = null;
      sim.every(50, () => { const p = sim.input('btn1'); const c = p ? '1' : '0'; sim.set('led1', { b: p ? 1 : 0 }); sim.boardLed('nano', p, 'D13'); sim.boardLed('uno', true, 'TX'); sim.after(20, () => sim.boardLed('uno', false, 'TX')); if (c !== last) { sim.serial(`sent '${c}'`, 'Uno'); sim.serial(`got '${c}' → LED ${p ? 'on' : 'off'}`, 'Nano'); last = c; } });
    },
    check: (sim) => sim.flag('pressed'),
  },
  {
    id: 'levels', title: '5 V meets 3.3 V', level: 'Advanced', minutes: 12,
    goal: 'Let a 5 V Uno command a 3.3 V ESP32 safely.',
    intro: 'A 5 V signal straight into an ESP32 pin can damage it. The level shifter translates: HV side to the Uno (5 V), LV side to the ESP32 (3.3 V), one shared GND.',
    learn: ['Logic levels', 'Level shifters', 'Common ground between boards'],
    setup: [{ id: 'uno', board: 'uno', at: [-110, -25] }, { id: 'ls1', mod: 'level-shifter', at: [0, 75] }, { id: 'esp', board: 'esp32', at: [100, -30] }],
    wires: [['uno:D1', 'ls1:HV1'], ['ls1:LV1', 'esp:RX2'], ['uno:5V', 'ls1:HV'], ['esp:3V3', 'ls1:LV'], ['uno:GND', 'ls1:GND'], ['esp:GND', 'ls1:GND']],
    code: [{ title: 'Uno — commander (5 V)', lang: 'Arduino C++', src: `void setup() {
  Serial.begin(9600);        // TX = D1
}

void loop() {
  Serial.println("ON");
  delay(1000);
  Serial.println("OFF");
  delay(1000);
}` }, { title: 'ESP32 — listener (3.3 V)', lang: 'Arduino C++', src: `void setup() {
  pinMode(2, OUTPUT);        // blue LED
  Serial.begin(115200);
  Serial2.begin(9600);       // RX2 = GPIO16
}

void loop() {
  if (Serial2.available()) {
    String cmd = Serial2.readStringUntil('\\n');
    cmd.trim();
    digitalWrite(2, cmd == "ON");
    Serial.println("got " + cmd);
  }
}` }],
    run(sim) {
      let on = false;
      sim.every(1000, () => { on = !on; sim.serial(on ? 'ON' : 'OFF', 'Uno'); sim.boardLed('uno', true, 'TX'); sim.after(60, () => sim.boardLed('uno', false, 'TX')); sim.after(30, () => { sim.boardLed('esp', on, 'D2'); sim.serial(`got ${on ? 'ON' : 'OFF'}`, 'ESP32'); }); });
    },
  },
  {
    id: 'picoscreen', title: 'Pico weather screen', level: 'Advanced', minutes: 12,
    goal: 'Show temperature and humidity on an OLED with a Pico.',
    intro: 'Both modules run happily on the Pico’s 3V3(OUT). The OLED talks I²C on GP4 (SDA) and GP5 (SCL); the DHT11 uses one data wire on GP15.',
    learn: ['I²C displays', 'Single-wire sensors', 'MicroPython modules'],
    setup: [{ id: 'pico', board: 'pico', at: [-60, -25] }, { id: 'dht1', mod: 'dht11', at: [10, 80] }, { id: 'oled1', mod: 'oled', at: [80, 75] }],
    wires: [['pico:3V3(OUT)', 'dht1:VCC'], ['pico:GND', 'dht1:GND'], ['pico:GP15', 'dht1:DATA'], ['pico:3V3(OUT)', 'oled1:VCC'], ['pico:GND', 'oled1:GND'], ['pico:GP4', 'oled1:SDA'], ['pico:GP5', 'oled1:SCL']],
    code: { lang: 'MicroPython', src: `from machine import Pin, I2C
import dht, ssd1306, time

sensor = dht.DHT11(Pin(15))
i2c = I2C(0, sda=Pin(4), scl=Pin(5))
oled = ssd1306.SSD1306_I2C(128, 64, i2c)

while True:
    sensor.measure()
    t, h = sensor.temperature(), sensor.humidity()
    oled.fill(0)
    oled.text("Weather", 0, 0)
    oled.text("Temp: %d C" % t, 0, 24)
    oled.text("Hum:  %d %%" % h, 0, 40)
    oled.show()
    print(t, h)
    time.sleep(2)` },
    run(sim) {
      const draw = () => { const { temp, hum } = sim.input('dht1'); sim.set('oled1', { on: true, lines: ['Weather', '', `Temp: ${Math.round(temp)} C`, `Hum:  ${Math.round(hum)} %`] }); sim.serial(`${Math.round(temp)} ${Math.round(hum)}`); };
      draw(); sim.every(2000, draw);
    },
    check: (sim) => sim.flag('moved:dht1'),
  },
  {
    id: 'wifinode', title: 'Wi-Fi weather node', level: 'Advanced', minutes: 12,
    goal: 'Read a DHT11 on a NodeMCU and post it over Wi-Fi.',
    intro: 'D5 on the NodeMCU is GPIO14 inside. The board joins Wi-Fi and sends a reading every few seconds; the blue LED (active low) flashes on each upload.',
    learn: ['Wi-Fi connection', 'HTTP requests', 'D-numbers vs GPIO numbers'],
    setup: [{ id: 'node', board: 'nodemcu', at: [-50, -25] }, { id: 'dht1', mod: 'dht11', at: [50, 75] }],
    wires: [['node:3V3', 'dht1:VCC'], ['node:GND', 'dht1:GND'], ['node:D5', 'dht1:DATA']],
    code: { lang: 'Arduino C++', src: `#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <DHT.h>
DHT dht(D5, DHT11);

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  dht.begin();
  WiFi.begin("lab-wifi", "password");
  while (WiFi.status() != WL_CONNECTED) delay(250);
  Serial.println("Wi-Fi connected");
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  digitalWrite(LED_BUILTIN, LOW);     // on
  WiFiClient c; HTTPClient http;
  http.begin(c, "http://lab.local/api");
  http.POST("t=" + String(t) + "&h=" + String(h));
  http.end();
  digitalWrite(LED_BUILTIN, HIGH);    // off
  Serial.printf("sent %.0f C, %.0f %%\\n", t, h);
  delay(5000);
}` },
    run(sim) {
      sim.serial('connecting…'); let n = 0;
      sim.after(1200, () => { sim.serial('Wi-Fi connected, IP 192.168.4.27'); send(); sim.every(5000, send); });
      function send() { const { temp, hum } = sim.input('dht1'); sim.boardLed('node', true, 'D4'); sim.after(250, () => sim.boardLed('node', false, 'D4')); n++; sim.serial(`POST #${n}: ${Math.round(temp)} C, ${Math.round(hum)} % → 200 OK`); }
    },
  },
  {
    id: 'robot', title: 'Robot: brain and muscle', level: 'Advanced', minutes: 15,
    goal: 'A Raspberry Pi sends drive commands; an Arduino Mega runs the motor.',
    intro: 'The Pi (brain) sends text over its TX (GPIO14) to the Mega’s RX1 (D19). That direction is safe: 3.3 V counts as HIGH for a 5 V board. The Mega drives an L298N; the motor gets its own 6 V battery, and every GND is joined.',
    learn: ['Brain / muscle architecture', 'Motor drivers and separate supplies', 'Simple command protocols'],
    setup: [{ id: 'pi', board: 'rpi4', at: [-120, -40] }, { id: 'mega', board: 'mega', at: [45, -55] }, { id: 'drv', mod: 'motor-driver', at: [-10, 75] }, { id: 'bat', mod: 'battery', at: [-120, 90] }, { id: 'mot', mod: 'motor', at: [110, 75] }],
    wires: [['pi:GPIO14', 'mega:D19'], ['pi:GND', 'mega:GND'], ['mega:D5', 'drv:ENA'], ['mega:D7', 'drv:IN1'], ['mega:D8', 'drv:IN2'], ['mega:5V', 'drv:VCC'], ['mega:GND', 'drv:GND'], ['bat:BAT+', 'drv:VM'], ['bat:BAT-', 'drv:GND'], ['drv:OUT1', 'mot:M+'], ['drv:OUT2', 'mot:M-']],
    code: [{ title: 'Raspberry Pi — brain (Python)', lang: 'Python', src: `import serial, time
link = serial.Serial("/dev/serial0", 9600)

plan = [("F", 200), ("S", 0), ("B", 150), ("S", 0)]
while True:
    for cmd, speed in plan:
        link.write(f"{cmd} {speed}\\n".encode())
        print("sent", cmd, speed)
        time.sleep(2)` }, { title: 'Arduino Mega — muscle (C++)', lang: 'Arduino C++', src: `const int ENA = 5, IN1 = 7, IN2 = 8;

void setup() {
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  Serial1.begin(9600);       // RX1 = D19
  Serial.begin(9600);
}

void loop() {
  if (!Serial1.available()) return;
  char cmd = Serial1.read();
  int speed = Serial1.parseInt();
  digitalWrite(IN1, cmd == 'F');
  digitalWrite(IN2, cmd == 'B');
  analogWrite(ENA, cmd == 'S' ? 0 : speed);
  Serial.print(cmd); Serial.println(speed);
}` }],
    run(sim) {
      const plan = [['F', 200], ['S', 0], ['B', 150], ['S', 0]]; let i = 0;
      sim.set('drv', { powered: true });
      const step = () => { const [c, s] = plan[i++ % plan.length]; sim.serial(`sent ${c} ${s}`, 'Pi'); sim.after(40, () => { sim.serial(`${c}${s}`, 'Mega'); sim.set('mot', { speed: c === 'F' ? s / 255 : c === 'B' ? -s / 255 : 0 }); }); };
      step(); sim.every(2000, step);
    },
  },
];
export const missionById = (id) => MISSIONS.find((m) => m.id === id);
export { clamp };
