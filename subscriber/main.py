import network
import time
from umqtt.simple import MQTTClient
from machine import Pin

WIFI_SSID = 'Wokwi-GUEST'
WIFI_PASSWORD = ''
ADAFRUIT_IO_SERVER = ''
ADAFRUIT_IO_PORT = 1883
ADAFRUIT_IO_USER = ''
ADAFRUIT_IO_KEY = ''

TEMP_FEED_NAME = 'temperature'
HUMIDITY_FEED_NAME = 'humidity'
HEATER_FEED_NAME = 'heater_status'

RELAY_PIN = 5
relay = Pin(RELAY_PIN, Pin.OUT)

TARGET_TEMP = 50
TARGET_HUMIDITY = 60

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    while not wlan.isconnected():
        print('Jungiasi prie WiFi...')
        time.sleep(1)
    print('Prisijungta prie WiFi')

def connect_mqtt():
    client = MQTTClient(ADAFRUIT_IO_USER, ADAFRUIT_IO_SERVER, port=ADAFRUIT_IO_PORT, user=ADAFRUIT_IO_USER, password=ADAFRUIT_IO_KEY)
    client.set_callback(message_callback)
    client.connect()
    print('Prisijungta prie MQTT brokerio')
    return client

def subscribe(client):
    client.subscribe(f'{ADAFRUIT_IO_USER}/feeds/{TEMP_FEED_NAME}')
    client.subscribe(f'{ADAFRUIT_IO_USER}/feeds/{HUMIDITY_FEED_NAME}')
    print(f'Prisijungta prie {TEMP_FEED_NAME} ir {HUMIDITY_FEED_NAME} kanalų')

def message_callback(topic, msg):
    print('Gauta žinutė iš:', topic)
    try:
        if TEMP_FEED_NAME in topic.decode():
            temp_value = float(msg)
            print(f'Temperatūra: {temp_value}°C')
            adjust_temperature(temp_value)
        elif HUMIDITY_FEED_NAME in topic.decode():
            humidity_value = float(msg)
            print(f'Drėgmė: {humidity_value}%')
            adjust_humidity(humidity_value)
    except ValueError:
        print('Netinkamas žinutės formatas')

def adjust_temperature(current_temp):
    if current_temp < TARGET_TEMP:
        relay.on()
        heater_status = "ON"
        print(f'Krosnis ĮJUNGTA - Temperatūra per žema ({current_temp}°C)')
    else:
        relay.off()
        heater_status = "OFF"
        print(f'Krosnis IŠJUNGTA - Temperatūra pakankama ({current_temp}°C)')
    
    mqtt_client.publish(f'{ADAFRUIT_IO_USER}/feeds/{HEATER_FEED_NAME}', heater_status)

def adjust_humidity(current_humidity):
    if current_humidity < TARGET_HUMIDITY:
        print(f'Drėgmė per žema ({current_humidity}%), užpilkite vandens ant akmenų')
    else:
        print(f'Drėgmė tinkama ({current_humidity}%).')

def main():
    connect_wifi()
    global mqtt_client
    mqtt_client = connect_mqtt()
    
    subscribe(mqtt_client)
    
    try:
        while True:
            mqtt_client.check_msg()
            time.sleep(1)
    finally:
        mqtt_client.disconnect()

if __name__ == '__main__':
    main()
