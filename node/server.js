const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

// MQTT parametrai
const AIO_SERVER = '';
const AIO_USERNAME = '';
const AIO_KEY = '';
const TEMP_FEED_NAME = 'temperature';
const HUMIDITY_FEED_NAME = 'humidity';
const HEATER_FEED_NAME = 'heater_status';
const HUMIDITY_STATUS_FEED_NAME = 'humidity_status';

// Express naudojimas JSON duomenims apdoroti
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sesijų valdymas
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// MQTT klientas
const client = mqtt.connect(`mqtt://io.adafruit.com`, {
  username: AIO_USERNAME,
  password: AIO_KEY
});

// Saugojimo kintamieji temperatūrai, drėgmei, krosnies ir drėgmės būsenoms
let currentTemperature = null;
let currentHumidity = null;
let currentHeaterStatus = null;
let currentHumidityStatus = null;

// Prisijungimo prie MQTT ir užsiprenumeravimas
client.on('connect', () => {
  console.log('Prisijungta prie MQTT brokerio');
  
  // Užsiprenumeruojame temperatūros, drėgmės, krosnies ir drėgmės būsenos kanalus
  client.subscribe(`${AIO_USERNAME}/feeds/${TEMP_FEED_NAME}`, (err) => {
    if (err) {
      console.error('Nepavyko užsiprenumeruoti temperatūros kanalo');
    }
  });
  
  client.subscribe(`${AIO_USERNAME}/feeds/${HUMIDITY_FEED_NAME}`, (err) => {
    if (err) {
      console.error('Nepavyko užsiprenumeruoti drėgmės kanalo');
    }
  });

  client.subscribe(`${AIO_USERNAME}/feeds/${HEATER_FEED_NAME}`, (err) => {
    if (err) {
      console.error('Nepavyko užsiprenumeruoti krosnies būsenos kanalo');
    }
  });
});


// Pridedame vėlavimo mechanizmą, kad išsaugotume tik tada, kai visi duomenys yra gauti
let dataReceivedTimestamp = null;
let isTemperatureReceived = false;
let isHumidityReceived = false;

// MQTT message handling
client.on('message', (topic, message) => {
  try {
    const msg = message.toString();
    const currentTime = Date.now();

    // Patikriname, kuria žinutė atėjo (temperatūra, drėgmė, krosnies būsena)
    if (topic.includes(TEMP_FEED_NAME)) {
      const temperature = parseFloat(msg);
      if (temperature > -50 && temperature < 150) {  // Patikriname, ar temperatūra yra reali
        currentTemperature = temperature;
        isTemperatureReceived = true;
        console.log(`Gauta temperatūra: ${currentTemperature}°C`);
      } else {
        console.log(`Neteisinga temperatūra: ${msg}`);
      }
    }

    if (topic.includes(HUMIDITY_FEED_NAME)) {
      const humidity = parseFloat(msg);
      if (humidity >= 0 && humidity <= 100) {  // Patikriname, ar drėgmė yra reali
        currentHumidity = humidity;
        isHumidityReceived = true;
        console.log(`Gauta drėgmė: ${currentHumidity}%`);
      } else {
        console.log(`Neteisinga drėgmė: ${msg}`);
      }
    }

    if (topic.includes(HEATER_FEED_NAME)) {
      currentHeaterStatus = msg;
      console.log(`Gauta krosnies būsena: ${currentHeaterStatus}`);
    }

    // Patikriname, ar visi duomenys yra gauti
    if (isTemperatureReceived && isHumidityReceived) {
      // Nustatome laiką, kada buvo gauti visi duomenys
      if (dataReceivedTimestamp === null || (currentTime - dataReceivedTimestamp > 2000)) {
        dataReceivedTimestamp = currentTime;
        console.log('Visi duomenys gauti, išsaugoma į DB...');
        saveDataToDatabase(currentTemperature, currentHumidity, currentHeaterStatus);

        // Atstatome vėlesniam duomenų gavimui
        isTemperatureReceived = false;
        isHumidityReceived = false;
      }
    }

  } catch (error) {
    console.error('Klaida apdorojant žinutę:', error);
  }
});

// Funkcija išsaugoti duomenis į duomenų bazę
function saveDataToDatabase(temperature, humidity, heaterStatus) {
  const db = new sqlite3.Database('./pirtele.db');
  
  if (heaterStatus === null) {
    heaterStatus = "Nežinoma";
  }

  db.run(
    "INSERT INTO bathData (temperature, humidity, heaterStatus, timestamp) VALUES (?, ?, ?, ?)",
    [temperature, humidity, heaterStatus, new Date().toISOString()],
    function (err) {
      if (err) {
        console.error("Klaida įrašant duomenis į DB: ", err);
      } else {
        console.log(`DB insert: Temperatūra=${temperature}°C, Drėgmė=${humidity}%, Krosnies būsena=${heaterStatus}`);
      }
    }
  );
  db.close();
}

// Patikrinkite, ar vartotojas yra prisijungęs
function checkLogin(req, res, next) {
  if (req.session.loggedIn) {
    next(); // Jei prisijungęs, tęsti
  } else {
    res.redirect('/'); // Jei neprisijungęs, nukreipti į login puslapį
  }
}

// Pagrindinis puslapis (login.html) - jei vartotojas nėra prisijungęs, rodyti login puslapį
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/dashboard'); // Jei vartotojas jau prisijungęs, pereiti į dashboard
  } else {
    res.sendFile(__dirname + '/index.html'); // Rodyti login puslapį
  }
});

// Prisijungimas - POST užklausa
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const db = new sqlite3.Database('./pirtele.db');
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      console.error('Klaida vykdant užklausą:', err);
      return res.send('Klaida prisijungiant');
    }

    if (row) {
      req.session.loggedIn = true;
      res.redirect('/dashboard');  // Jei prisijungta, nukreipti į dashboard
    } else {
      res.send('Neteisingas vartotojo vardas arba slaptažodis');
    }
  });
});

// Dashboard puslapis, rodo temperatūrą ir drėgmę
app.get('/dashboard', checkLogin, (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

// API gauti temperatūrą
app.get('/temperature', checkLogin, (req, res) => {
  if (currentTemperature !== null) {
    res.json({ temperature: currentTemperature });
  } else {
    res.status(404).json({ error: 'Temperatūros duomenys dar nėra gauti' });
  }
});

// API gauti drėgmę
app.get('/humidity', checkLogin, (req, res) => {
  if (currentHumidity !== null) {
    res.json({ humidity: currentHumidity });
  } else {
    res.status(404).json({ error: 'Drėgmės duomenys dar nėra gauti' });
  }
});

// API gauti krosnies būseną
app.get('/heater_status', checkLogin, (req, res) => {
  if (currentHeaterStatus !== null) {
    res.json({ heater_status: currentHeaterStatus });
  } else {
    res.status(404).json({ error: 'Krosnies būsena dar nėra gauta' });
  }
});

// Siuntimas temp & hum manually
app.post('/publishManualData', checkLogin, (req, res) => {
  const { temperature, humidity } = req.body;

  if (temperature && humidity) {
    client.publish(`${AIO_USERNAME}/feeds/temperature`, temperature.toString(), (err) => {
      if (err) {
        console.error('Klaida siunčiant temperatūrą į Adafruit:', err);
        return res.status(500).json({ error: 'Nepavyko išsiųsti temperatūros duomenų' });
      }
    });

    client.publish(`${AIO_USERNAME}/feeds/humidity`, humidity.toString(), (err) => {
      if (err) {
        console.error('Klaida siunčiant drėgmę į Adafruit:', err);
        return res.status(500).json({ error: 'Nepavyko išsiųsti drėgmės duomenų' });
      }
    });

    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Neužpildyti visi laukai' });
  }
});

app.post('/setBath', (req, res) => {
  const { bathType, temperature, humidity } = req.body;

  if (bathType && temperature && humidity) {
    currentTemperature = temperature;
    currentHumidity = humidity;

    client.publish(`${AIO_USERNAME}/feeds/${TEMP_FEED_NAME}`, temperature.toString());
    client.publish(`${AIO_USERNAME}/feeds/${HUMIDITY_FEED_NAME}`, humidity.toString());

    console.log(`${bathType} - Temperatūra: ${temperature}°C, Drėgmė: ${humidity}%`);

    res.status(200).send('Duomenys išsiųsti į Adafruit!');
  } else {
    res.status(400).send('Nepakankamai duomenų');
  }
});

// Paskutinių duomenų gavimo funkcija
app.get('/getLastData', (req, res) => {
  const db = new sqlite3.Database('./pirtele.db');
  db.get("SELECT * FROM bathData ORDER BY timestamp DESC LIMIT 1", (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Klaida, bandant nuskaityti duomenis' });
    }
    res.json({
      temperature: row.temperature,
      humidity: row.humidity,
      ovenStatus: row.oven_status
    });
  });
});

// Paleidžiame serverį
app.listen(port, () => {
  console.log(`Serveris veikia adresu http://localhost:${port}`);
});
