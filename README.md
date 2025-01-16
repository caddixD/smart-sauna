# Smart Sauna System

This repository contains the code for a **Smart Sauna System**, which uses ESP32 microcontrollers to monitor and control sauna conditions such as temperature and humidity. The system features MQTT communication for data exchange and includes a sender and subscriber setup for seamless operation.

---

## Features

### Core Functionality
1. **Temperature and Humidity Monitoring**: Continuously measures the sauna's temperature and humidity using sensors connected to an ESP32.
2. **MQTT Communication**:
   - Sender ESP32: Publishes sensor data to an MQTT broker.
   - Subscriber ESP32: Receives data from the MQTT broker to control the sauna's electric heater.
3. **Manual Control**:
   - Provides a manual mode where users can set desired temperature and humidity via a pop-up interface.
   - Sends manual settings to the subscriber ESP32 for action.
4. **Electric Heater Control**:
   - Automatically adjusts based on received data or manual input.
   - Displays the heater's status.

---

## Project Structure

### Directories
1. **node**: Contains MQTT broker setup and configuration.
2. **sender**: Code for the ESP32 that acts as the data sender, publishing sensor readings to the MQTT broker.
3. **subscriber**: Code for the ESP32 that acts as the data receiver, controlling the electric heater based on received data.

---

## Requirements

### Hardware
1. **ESP32 Development Boards** (2 units)
2. **Temperature and Humidity Sensor** (e.g., DHT11/DHT22)
3. **Electric Heater** (or a simulated load for testing)
4. **Power Supply**
5. **MQTT Broker** (e.g., Adafruit MQTT Broker)

### Software
1. **Arduino IDE**
2. Required Arduino Libraries:
   - `WiFi.h`
   - `PubSubClient.h` (for MQTT)
3. **Wokwi Simulator** (for testing and prototyping)

---

## Setup Instructions

### 1. Sender ESP32
1. Connect the temperature and humidity sensor to the sender ESP32.
2. Upload the code from the **sender** directory.
3. Update the following placeholders in the code:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* mqttServer = "YOUR_MQTT_BROKER_ADDRESS";
   ```

### 2. Subscriber ESP32
1. Connect the electric heater (or a test load) to the subscriber ESP32.
2. Upload the code from the **subscriber** directory.
3. Update the MQTT and Wi-Fi credentials in the code.

### 3. MQTT Broker
1. Use Adafruit MQTT Broker for the setup.
2. Ensure the broker is accessible by both the sender and subscriber ESP32 devices.

---

## Usage

### Automatic Mode
1. Power on both ESP32 boards.
2. The sender ESP32 starts publishing temperature and humidity data to the MQTT broker.
3. The subscriber ESP32 receives the data and adjusts the heater accordingly.

### Manual Mode
1. Use the user interface to activate manual mode.
2. Set the desired temperature and humidity values.
3. These values are sent to the subscriber ESP32, which adjusts the heater based on the new settings.

---

## Testing and Real-World Implementation

- This system was developed and tested using the **Wokwi Simulator** for prototyping and validation.
- It can be used in real-world scenarios by deploying the ESP32 boards, sensors, and MQTT broker in a physical sauna environment.

---

## Troubleshooting

1. **ESP32 Not Connecting to Wi-Fi**:
   - Double-check the Wi-Fi credentials.
   - Ensure the router is within range.

2. **MQTT Communication Issues**:
   - Verify the broker's IP address and port.
   - Ensure the broker is running and accessible.

3. **Heater Not Responding**:
   - Check the subscriber ESP32 connections.
   - Ensure the correct GPIO pin is configured for the heater.

---

## Contributions
Contributions are welcome! If you'd like to improve the project or add new features, please submit a pull request.

---

## License
This project is open-source and available under the MIT License.

---

## Author
This project is maintained by [caddixD](https://github.com/caddixD). Feel free to reach out with any questions or feedback.
