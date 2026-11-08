# fan-pdm — предиктивна поддръжка на USB вентилатор

Учебен, изцяло отворен проект: акселерометър MPU6050 на ESP32 следи вибрациите на
USB вентилатор, изчислява признаци (features) на всяка секунда и ги праща по MQTT.
Backend съхранява и визуализира данните, а Python модел (Isolation Forest),
обучен **само на нормална работа**, вдига аларма, когато вибрациите се отклонят
от научения „здрав“ профил.

> **Статус:** етап „план“. Кодът още не е написан — виж [PLAN.md](PLAN.md).
> Командите по-долу описват целевото поведение.

## Архитектура

```
┌──────────────┐  I²C   ┌──────────────────────────┐   MQTT (JSON, 1 msg/s)
│ MPU6050      │───────▶│ ESP32 (firmware/)        │──────────────┐
│ ±2 g, 1 kHz  │        │ прозорец 1 s → RMS, пик, │              │
└──────────────┘        │ crest, FFT ленти         │              ▼
   залепен за           └──────────────────────────┘     ┌─────────────────┐
   вентилатора                                           │ Mosquitto       │
                                                         └───┬─────────┬───┘
                        backend/ (docker compose)            │         │
                ┌────────────────────────────────────────────┘         │
                ▼                                                      ▼
        ┌──────────────┐     ┌──────────────┐               ┌──────────────────┐
        │ Telegraf     │────▶│ InfluxDB     │◀──────────────│ ml/ (Python)     │
        │ MQTT → Influx│     │ (времеви ред)│  резултати,   │ record / train / │
        └──────────────┘     └──────┬───────┘  аларми       │ detect           │
                                    ▼                       └────────┬─────────┘
                             ┌──────────────┐                        │ MQTT
                             │ Grafana      │                        ▼
                             │ табла+аларми │              pdm/<id>/alarm
                             └──────────────┘
```

## Структура

| Папка | Съдържание | Технологии |
|---|---|---|
| [`firmware/`](firmware/) | Фърмуер за ESP32: четене от FIFO на MPU6050, прозорци от 1 s, признаци, MQTT | PlatformIO, Arduino-ESP32, ArduinoJson, PubSubClient, arduinoFFT |
| [`backend/`](backend/) | Инфраструктура с една команда | Docker Compose, Mosquitto, Telegraf, InfluxDB, Grafana OSS |
| [`ml/`](ml/) | Запис на данни, обучение, детекция и аларми | Python 3.11+, scikit-learn, pandas, paho-mqtt |

## Бърз старт (целево)

```bash
# 1. Backend
cd backend && cp .env.example .env && docker compose up -d
#    Grafana: http://localhost:3000   InfluxDB: http://localhost:8086

# 2. Firmware
cd firmware && cp include/secrets.example.h include/secrets.h   # Wi-Fi + MQTT
pio run -t upload && pio device monitor

# 3. ML
cd ml && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
python -m fanpdm record --label normal --minutes 30       # само нормална работа
python -m fanpdm train  --data data/normal_*.parquet
python -m fanpdm detect                                   # аларми по MQTT + InfluxDB
```

## Пример за съобщение (`pdm/fan01/features`)

```json
{
  "device": "fan01", "ts": 1762588800123, "seq": 4211,
  "fs": 1000, "n": 1000,
  "rms":   {"x": 0.041, "y": 0.037, "z": 0.012},
  "peak":  {"x": 0.128, "y": 0.119, "z": 0.044},
  "crest": {"x": 3.12,  "y": 3.22,  "z": 3.67},
  "f_dom": 41.0,
  "bands": {"b0_10": 0.002, "b10_30": 0.004, "b30_60": 0.031,
            "b60_120": 0.011, "b120_250": 0.006, "b250_500": 0.003}
}
```

Ускоренията са в g без гравитационната (DC) компонента; лентите са RMS енергия в
съответния честотен диапазон в Hz.

## Лицензи

Целият проект ще бъде под **MIT**. Използват се само компоненти с отворен код:

| Компонент | Лиценз |
|---|---|
| Arduino-ESP32, PlatformIO Core | LGPL-2.1 / Apache-2.0 |
| ArduinoJson, PubSubClient | MIT |
| arduinoFFT | GPL-3.0 (само във фърмуера; виж PLAN.md) |
| Eclipse Mosquitto | EPL-2.0 / EDL-1.0 |
| InfluxDB OSS 2.x, Telegraf | MIT |
| Grafana OSS | AGPL-3.0 |
| scikit-learn, NumPy, pandas | BSD-3-Clause |
| paho-mqtt | EPL-2.0 / EDL-1.0 |
