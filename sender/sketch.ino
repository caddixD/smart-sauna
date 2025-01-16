#include <WiFi.h>
#include <Adafruit_MQTT.h>
#include <Adafruit_MQTT_Client.h>
#include <DHT.h>

#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD ""
#define AIO_SERVER ""
#define AIO_SERVERPORT 1883
#define AIO_USERNAME ""
#define AIO_KEY ""

#define DHTPIN 4  // DHT jutiklio PIN
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

WiFiClient client;
Adafruit_MQTT_Client mqtt(&client, AIO_SERVER, AIO_SERVERPORT, AIO_USERNAME, AIO_KEY);
Adafruit_MQTT_Publish temperatureFeed = Adafruit_MQTT_Publish(&mqtt, AIO_USERNAME "/feeds/temperature");
Adafruit_MQTT_Publish humidityFeed = Adafruit_MQTT_Publish(&mqtt, AIO_USERNAME "/feeds/humidity");

float lastTemperature = NAN;
float lastHumidity = NAN;

void connectToWiFi() {
  Serial.print("Jungiama prie WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Prisijungta!");
}

void connectToMQTT() {
  while (mqtt.connected() == false) {
    Serial.print("Jungiama prie MQTT...");
    if (mqtt.connect()) {
      Serial.println("Prisijungta!");
    } else {
      Serial.println("Nepavyko. Bandoma iš naujo.");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  connectToWiFi();
  dht.begin();
}

void loop() {
  connectToMQTT();

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Patikriname, ar temperatūra pasikeitė
  if (!isnan(temperature) && (temperature != lastTemperature)) {
    temperatureFeed.publish(temperature);
    Serial.print("Išsiųsta temperatūra: ");
    Serial.println(temperature);
    lastTemperature = temperature;  // Atnaujiname paskutinę temperatūrą
  }

  // Patikriname, ar drėgmė pasikeitė
  if (!isnan(humidity) && (humidity != lastHumidity)) {
    humidityFeed.publish(humidity);
    Serial.print("Išsiųsta drėgmė: ");
    Serial.println(humidity);
    lastHumidity = humidity;  // Atnaujiname paskutinę drėgmę
  }

  delay(5000);  // Vėl tikriname kas 5 sekundes
}
